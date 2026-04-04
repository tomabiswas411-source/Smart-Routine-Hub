import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCourses, createCourse, getCourse } from "@/lib/firebase-services";

// GET - Fetch all courses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const type = searchParams.get("type");

    const filters: { year?: number; semester?: number; type?: string } = {};
    if (year) filters.year = parseInt(year);
    if (semester) filters.semester = parseInt(semester);
    if (type) filters.type = type;

    const courses = await getCourses(filters);

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST - Create a new course (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, code, creditHours, type, year, semester } = body;

    // Check if course code already exists
    const existingCourses = await getCourses();
    const exists = existingCourses.some(c => c.code === code);

    if (exists) {
      return NextResponse.json(
        { success: false, error: "Course code already exists" },
        { status: 400 }
      );
    }

    const course = await createCourse({
      name,
      code,
      creditHours: parseFloat(creditHours),
      type,
      year,
      semester,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: course,
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create course" },
      { status: 500 }
    );
  }
}
