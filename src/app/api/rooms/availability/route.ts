import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get("day");
    const timeSlotId = searchParams.get("timeSlotId");
    const excludeScheduleId = searchParams.get("excludeScheduleId");

    if (!day || !timeSlotId) {
      return NextResponse.json(
        { success: false, error: "Day and timeSlotId are required" },
        { status: 400 }
      );
    }

    // Get all active rooms
    const rooms = await db.room.findMany({
      where: { isActive: true },
      orderBy: { roomNumber: "asc" },
    });

    // Get schedules for the given day and time slot
    const schedules = await db.schedule.findMany({
      where: {
        dayOfWeek: day,
        timeSlotId,
        isActive: true,
        ...(excludeScheduleId && { id: { not: excludeScheduleId } }),
      },
      include: {
        course: true,
      },
    });

    // Create a map of occupied rooms
    const occupiedRooms = new Map(
      schedules.map((s) => [
        s.roomId,
        {
          courseCode: s.courseCode,
          courseName: s.courseName,
          teacherName: s.teacherName,
        },
      ])
    );

    // Build availability response
    const availability = rooms.map((room) => ({
      room,
      isAvailable: !occupiedRooms.has(room.id),
      occupiedBy: occupiedRooms.get(room.id) || null,
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
