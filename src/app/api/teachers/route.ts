import { NextRequest, NextResponse } from "next/server";
import { getUser, getUsers, getSchedules } from "@/lib/firebase-services";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("id");
    const search = searchParams.get("search");

    // Single teacher fetch
    if (teacherId) {
      const teacher = await getUser(teacherId);

      if (!teacher || teacher.role !== "teacher") {
        return NextResponse.json(
          { success: false, error: "Teacher not found" },
          { status: 404 }
        );
      }

      // Get teacher's schedules
      const schedules = await getSchedules({ teacherId });

      // Remove password from response
      const { password: _, ...teacherWithoutPassword } = teacher as { password?: string; [key: string]: unknown };

      return NextResponse.json({
        success: true,
        data: { ...teacherWithoutPassword, schedules },
      });
    }

    // Fetch all teachers
    const teachers = await getUsers("teacher");

    // Filter by search if provided
    let filteredTeachers = teachers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTeachers = teachers.filter(
        (teacher) =>
          teacher.fullName.toLowerCase().includes(searchLower) ||
          teacher.designation?.toLowerCase().includes(searchLower)
      );
    }

    // Remove passwords from response
    const teachersWithoutPasswords = filteredTeachers.map((teacher) => {
      const { password: _, ...teacherWithoutPassword } = teacher as { password?: string; [key: string]: unknown };
      return teacherWithoutPassword;
    });

    return NextResponse.json({
      success: true,
      data: teachersWithoutPasswords,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
