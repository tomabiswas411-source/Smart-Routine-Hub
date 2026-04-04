import { NextRequest, NextResponse } from "next/server";
import { getRoomAvailability, getRooms, getSchedules } from "@/lib/firebase-services";

// Enhanced room availability check with custom time support
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get("day");
    const timeSlotId = searchParams.get("timeSlotId");
    const startTime = searchParams.get("startTime"); // Custom start time (e.g., "09:33")
    const endTime = searchParams.get("endTime"); // Custom end time (e.g., "10:44")
    const excludeScheduleId = searchParams.get("excludeScheduleId");

    if (!day) {
      return NextResponse.json(
        { success: false, error: "Day is required" },
        { status: 400 }
      );
    }

    // If using predefined time slot
    if (timeSlotId) {
      const availability = await getRoomAvailability(day, timeSlotId, excludeScheduleId || undefined);
      return NextResponse.json({
        success: true,
        data: availability,
      });
    }

    // If using custom time range
    if (startTime && endTime) {
      const rooms = await getRooms();
      const allSchedules = await getSchedules({ day });

      // Filter schedules that overlap with the custom time range
      const overlappingSchedules = allSchedules.filter(s => {
        const sStart = s.startTime || "00:00";
        const sEnd = s.endTime || "23:59";
        
        // Check for time overlap
        return (
          (startTime >= sStart && startTime < sEnd) ||
          (endTime > sStart && endTime <= sEnd) ||
          (startTime <= sStart && endTime >= sEnd)
        );
      });

      // Create a map of occupied rooms
      const occupiedRooms = new Map(
        overlappingSchedules
          .filter(s => s.id !== excludeScheduleId)
          .map(s => [
            s.roomId,
            {
              courseCode: s.courseCode,
              courseName: s.courseName,
              teacherName: s.teacherName,
              startTime: s.startTime,
              endTime: s.endTime,
            },
          ])
      );

      // Build availability response
      const availability = rooms.map(room => ({
        room,
        isAvailable: !occupiedRooms.has(room.id),
        occupiedBy: occupiedRooms.get(room.id) || null,
      }));

      return NextResponse.json({
        success: true,
        data: availability,
        timeRange: { startTime, endTime },
      });
    }

    // Return all rooms with availability status (no specific time)
    const rooms = await getRooms();
    const availability = rooms.map(room => ({
      room,
      isAvailable: true, // Default to available
      occupiedBy: null,
    }));

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error checking room availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check room availability" },
      { status: 500 }
    );
  }
}
