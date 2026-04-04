import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");
    const day = searchParams.get("day");
    const teacherId = searchParams.get("teacherId");

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };

    if (year) where.year = parseInt(year);
    if (semester) where.semester = parseInt(semester);
    if (section) where.section = section;
    if (day) where.dayOfWeek = day;
    if (teacherId) where.teacherId = teacherId;

    // Fetch schedules
    const schedules = await db.schedule.findMany({
      where,
      include: {
        timeSlot: {
          orderBy: { slotOrder: "asc" },
        },
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { timeSlot: { slotOrder: "asc" } },
      ],
    });

    // Get today's schedule changes
    const today = new Date().toISOString().split("T")[0];
    const scheduleChanges = await db.scheduleChange.findMany({
      where: {
        isActive: true,
        effectiveDate: today,
      },
    });

    // Map changes to schedules
    const changesMap = new Map(scheduleChanges.map((change) => [change.scheduleId, change]));
    const schedulesWithChanges = schedules.map((schedule) => ({
      ...schedule,
      change: changesMap.get(schedule.id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: schedulesWithChanges,
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
