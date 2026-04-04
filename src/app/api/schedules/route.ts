import { NextRequest, NextResponse } from "next/server";
import { getSchedules, getScheduleChanges } from "@/lib/firebase-services";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");
    const day = searchParams.get("day");
    const teacherId = searchParams.get("teacherId");

    // Build filters
    const filters: {
      year?: number;
      semester?: number;
      section?: string;
      day?: string;
      teacherId?: string;
    } = {};

    if (year) filters.year = parseInt(year);
    if (semester) filters.semester = parseInt(semester);
    if (section) filters.section = section;
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
