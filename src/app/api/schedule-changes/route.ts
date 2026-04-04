import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getSchedule, 
  getScheduleChanges, 
  createScheduleChange, 
  createNotice, 
  getRoom,
  getUser,
  getSchedules
} from "@/lib/firebase-services";

// GET - Fetch all schedule changes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("teacherId");
    const effectiveDate = searchParams.get("effectiveDate");

    const filters: { teacherId?: string; effectiveDate?: string } = {};
    if (teacherId) filters.teacherId = teacherId;
    if (effectiveDate) filters.effectiveDate = effectiveDate;

    const changes = await getScheduleChanges(filters);

    return NextResponse.json({
      success: true,
      data: changes,
    });
  } catch (error) {
    console.error("Error fetching schedule changes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schedule changes" },
      { status: 500 }
    );
  }
}

// Helper to remove undefined values from an object
function removeUndefined(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

// Check for conflicts when rescheduling
async function checkRescheduleConflicts(data: {
  newDay: string;
  newStartTime: string;
  newEndTime: string;
  newRoomId?: string;
  teacherId: string;
  scheduleId: string;
}): Promise<{ hasConflict: boolean; conflicts: string[] }> {
  const conflicts: string[] = [];
  
  try {
    const allSchedules = await getSchedules();
    
    for (const schedule of allSchedules) {
      // Skip the schedule being rescheduled
      if (schedule.id === data.scheduleId) continue;
      
      // Only check same day
      if (schedule.dayOfWeek?.toLowerCase() !== data.newDay.toLowerCase()) continue;

      // Check time overlap
      const hasTimeOverlap = 
        (data.newStartTime >= schedule.startTime && data.newStartTime < schedule.endTime) ||
        (data.newEndTime > schedule.startTime && data.newEndTime <= schedule.endTime) ||
        (data.newStartTime <= schedule.startTime && data.newEndTime >= schedule.endTime);

      if (hasTimeOverlap) {
        // Check room conflict
        const roomId = data.newRoomId || schedule.roomId;
        if (schedule.roomId === roomId) {
          conflicts.push(`Room ${schedule.roomNumber} is already booked for ${schedule.courseCode} at ${schedule.startTime}-${schedule.endTime}`);
        }

        // Check teacher conflict
        if (schedule.teacherId === data.teacherId) {
          conflicts.push(`You have another class (${schedule.courseCode}) at this time`);
        }
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts };
  } catch (error) {
    console.error("Error checking conflicts:", error);
    return { hasConflict: false, conflicts: [] };
  }
}

// POST - Create a schedule change (cancel, reschedule, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scheduleId, changeType, reason, effectiveDate, newDay, newTimeSlotId, newRoomId, newStartTime, newEndTime } = body;

    // Get the original schedule
    const schedule = await getSchedule(scheduleId);

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized (admin or the teacher themselves)
    const isAuthorized = session.user.role === "admin" || schedule.teacherId === session.user.id;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to modify this schedule" },
        { status: 403 }
      );
    }

    // Get user info
    const user = await getUser(session.user.id);

    // Check for conflicts when rescheduling
    if (changeType === "rescheduled" && newDay && newStartTime && newEndTime) {
      const conflictCheck = await checkRescheduleConflicts({
        newDay,
        newStartTime,
        newEndTime,
        newRoomId,
        teacherId: schedule.teacherId,
        scheduleId,
      });

      if (conflictCheck.hasConflict) {
        return NextResponse.json({
          success: false,
          error: "Schedule conflicts detected",
          conflicts: conflictCheck.conflicts,
        }, { status: 400 });
      }
    }

    // Get new room number if room changed
    let newRoomNumber = null;
    if (newRoomId) {
      const newRoom = await getRoom(newRoomId);
      newRoomNumber = newRoom?.roomNumber;
    }

    // Build the schedule change data - only include defined values
    const changeData: Record<string, any> = {
      scheduleId,
      changeType,
      originalDay: schedule.dayOfWeek,
      originalTimeSlotId: schedule.timeSlotId,
      originalStartTime: schedule.startTime,
      originalEndTime: schedule.endTime,
      originalRoomId: schedule.roomId,
      originalRoomNumber: schedule.roomNumber,
      effectiveDate,
      reason,
      courseName: schedule.courseName,
      courseCode: schedule.courseCode,
      teacherId: schedule.teacherId,
      teacherName: schedule.teacherName,
      year: schedule.year,
      semester: schedule.semester,
      program: schedule.program || body.program || "bsc",
      changedBy: session.user.id,
      changedByName: user?.fullName || "Unknown",
      isActive: true,
    };

    // Only add new values if they are defined
    if (newDay) changeData.newDay = newDay;
    if (newTimeSlotId) changeData.newTimeSlotId = newTimeSlotId;
    if (newStartTime) changeData.newStartTime = newStartTime;
    if (newEndTime) changeData.newEndTime = newEndTime;
    if (newRoomId) changeData.newRoomId = newRoomId;
    if (newRoomNumber) changeData.newRoomNumber = newRoomNumber;

    // Create schedule change record
    const scheduleChange = await createScheduleChange(removeUndefined(changeData));

    // Create auto notification
    const notificationTitle = getNotificationTitle(changeType, schedule);
    
    await createNotice({
      title: notificationTitle,
      content: `${user?.fullName} has ${changeType === "cancelled" ? "cancelled" : "modified"} ${schedule.courseName} (${schedule.courseCode}) on ${effectiveDate}. Reason: ${reason}`,
      category: "schedule_change",
      changeType,
      scheduleChangeId: scheduleChange.id,
      affectedYear: schedule.year,
      affectedSemester: schedule.semester,
      affectedProgram: schedule.program || body.program || "bsc",
      postedBy: session.user.id,
      postedByName: user?.fullName || "Unknown",
      isPinned: false,
      isApproved: true, // Auto-approved for schedule changes
      isAutoGenerated: true,
    });

    return NextResponse.json({
      success: true,
      data: scheduleChange,
      message: "Schedule change recorded successfully",
    });
  } catch (error) {
    console.error("Error creating schedule change:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create schedule change" },
      { status: 500 }
    );
  }
}

function getNotificationTitle(changeType: string, schedule: { courseName: string; courseCode: string }): string {
  const titles: Record<string, string> = {
    cancelled: `Class Cancelled: ${schedule.courseName} (${schedule.courseCode})`,
    rescheduled: `Class Rescheduled: ${schedule.courseName} (${schedule.courseCode})`,
    room_changed: `Room Changed: ${schedule.courseName} (${schedule.courseCode})`,
    time_changed: `Time Changed: ${schedule.courseName} (${schedule.courseCode})`,
    extra_class: `Extra Class: ${schedule.courseName} (${schedule.courseCode})`,
  };
  return titles[changeType] || `Schedule Update: ${schedule.courseName}`;
}
