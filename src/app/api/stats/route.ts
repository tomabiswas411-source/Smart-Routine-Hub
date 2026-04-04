import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get counts from database
    const [teachers, courses, rooms, schedules, pendingNotices] = await Promise.all([
      db.user.count({ where: { role: "teacher", isActive: true } }),
      db.course.count({ where: { isActive: true } }),
      db.room.count({ where: { isActive: true } }),
      db.schedule.count({ where: { isActive: true } }),
      db.notice.count({ where: { isApproved: false } }),
    ]);

    // Get current semester info (could be derived from date or settings)
    const currentMonth = new Date().getMonth() + 1;
    const currentSemester = currentMonth >= 1 && currentMonth <= 6 ? "Spring 2025" : "Fall 2025";

    return NextResponse.json({
      success: true,
      data: {
        totalTeachers: teachers,
        activeCourses: courses,
        totalRooms: rooms,
        totalSchedules: schedules,
        pendingNotices,
        currentSemester,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
