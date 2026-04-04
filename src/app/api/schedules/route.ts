import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchedules, getScheduleChanges, createSchedule } from "@/lib/firebase-services";
import { doc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Check for schedule conflicts
async function checkScheduleConflicts(data: {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: string;
  teacherId: string;
  program: string;
  semester: number;
  excludeId?: string;
}): Promise<{ hasConflict: boolean; conflicts: string[] }> {
  const conflicts: string[] = [];
  
  try {
    // Validate required fields
    if (!data.dayOfWeek || !data.startTime || !data.endTime || !data.roomId || !data.teacherId) {
      return { hasConflict: false, conflicts: [] };
    }
    
    // Get all active schedules for the same day
    const schedulesQuery = query(
      collection(db, "schedules"),
      where("isActive", "==", true),
      where("dayOfWeek", "==", data.dayOfWeek.toLowerCase())
    );
    const snapshot = await getDocs(schedulesQuery);
    const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const schedule of schedules) {
      // Skip the schedule being edited
      if (data.excludeId && schedule.id === data.excludeId) continue;

      const existingStart = schedule.startTime as string;
      const existingEnd = schedule.endTime as string;
      
      // Skip if existing schedule doesn't have valid times
      if (!existingStart || !existingEnd) continue;
      
      // Check time overlap
      const hasTimeOverlap = 
        (data.startTime >= existingStart && data.startTime < existingEnd) ||
        (data.endTime > existingStart && data.endTime <= existingEnd) ||
        (data.startTime <= existingStart && data.endTime >= existingEnd);

      if (hasTimeOverlap) {
        // Check room conflict
        if (schedule.roomId === data.roomId) {
          conflicts.push(`Room ${schedule.roomNumber || 'Unknown'} is already booked for ${schedule.courseCode || 'Unknown'} at ${existingStart}-${existingEnd}`);
        }

        // Check teacher conflict
        if (schedule.teacherId === data.teacherId) {
          conflicts.push(`You have another class (${schedule.courseCode || 'Unknown'}) at this time (${existingStart}-${existingEnd})`);
        }

        // Check program/semester conflict (same batch can't have two classes at same time)
        if (data.program && data.semester && schedule.program === data.program && schedule.semester === data.semester) {
          conflicts.push(`${data.program.toUpperCase()} Semester ${data.semester} already has ${schedule.courseCode || 'Unknown'} at ${existingStart}-${existingEnd}`);
        }
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts };
  } catch (error) {
    console.error("Error checking conflicts:", error);
    return { hasConflict: false, conflicts: [] };
  }
}

// GET - Fetch all schedules
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const semester = searchParams.get("semester");
    const program = searchParams.get("program");
    const day = searchParams.get("day");
    const teacherId = searchParams.get("teacherId");

    // Build filters for getSchedules (semester-based system)
    const filters: {
      semester?: number;
      program?: string;
      day?: string;
      teacherId?: string;
    } = {};

    if (semester) filters.semester = parseInt(semester);
    if (program) filters.program = program;
    if (day) filters.day = day;
    if (teacherId) filters.teacherId = teacherId;

    // Fetch schedules
    const schedules = await getSchedules(filters);

    // Get today's schedule changes
    const today = new Date().toISOString().split("T")[0];
    const scheduleChanges = await getScheduleChanges({ effectiveDate: today });

    // Map changes to schedules
    const changesMap = new Map(scheduleChanges.map((change) => [change.scheduleId, change]));
    const schedulesWithChanges = schedules.map((schedule) => ({
      ...schedule,
      change: changesMap.get(schedule.id) || null,
    }));

    return NextResponse.json({ success: true, data: schedulesWithChanges });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch schedules" }, { status: 500 });
  }
}

// POST - Create a new schedule (Admin or Teacher can create)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.dayOfWeek || !body.startTime || !body.endTime || !body.roomId) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: dayOfWeek, startTime, endTime, and roomId are required" 
      }, { status: 400 });
    }
    
    // If teacher, force their own ID as teacherId
    const teacherId = session.user.role === 'teacher' ? session.user.id : body.teacherId;
    const teacherName = session.user.role === 'teacher' ? session.user.name : body.teacherName;
    
    // Check for conflicts
    const conflictCheck = await checkScheduleConflicts({
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      roomId: body.roomId,
      teacherId: teacherId,
      program: body.program || 'bsc',
      semester: body.semester || 1,
    });

    if (conflictCheck.hasConflict) {
      return NextResponse.json({ 
        success: false, 
        error: "Schedule conflicts detected",
        conflicts: conflictCheck.conflicts 
      }, { status: 400 });
    }
    
    const schedule = await createSchedule({
      ...body,
      courseId: body.courseId || `course-${Date.now()}`, // Generate if not provided
      timeSlotId: body.timeSlotId || `slot-${body.startTime}-${body.endTime}`, // Generate if not provided
      teacherId,
      teacherName,
      semester: body.semester || 1,
      program: body.program || 'bsc',
      isActive: true,
    });

    return NextResponse.json({ success: true, data: schedule, message: "Schedule created successfully" });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ success: false, error: "Failed to create schedule" }, { status: 500 });
  }
}

// PUT - Update schedule (Admin only, with conflict check)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Schedule ID required" }, { status: 400 });
    }

    const body = await request.json();

    // If changing time/day/room, check for conflicts
    if (body.dayOfWeek || body.startTime || body.endTime || body.roomId || body.teacherId) {
      const conflictCheck = await checkScheduleConflicts({
        dayOfWeek: body.dayOfWeek || "",
        startTime: body.startTime || "",
        endTime: body.endTime || "",
        roomId: body.roomId || "",
        teacherId: body.teacherId || "",
        program: body.program || "",
        semester: body.semester || 1,
        excludeId: scheduleId,
      });

      if (conflictCheck.hasConflict) {
        return NextResponse.json({ 
          success: false, 
          error: "Schedule conflicts detected",
          conflicts: conflictCheck.conflicts 
        }, { status: 400 });
      }
    }

    const docRef = doc(db, "schedules", scheduleId);
    await updateDoc(docRef, { ...body, updatedAt: serverTimestamp() });

    return NextResponse.json({ success: true, message: "Schedule updated successfully" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ success: false, error: "Failed to update schedule" }, { status: 500 });
  }
}

// DELETE - Delete schedule (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Schedule ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "schedules", scheduleId));

    return NextResponse.json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ success: false, error: "Failed to delete schedule" }, { status: 500 });
  }
}
