import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Fetch all courses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { isActive: true };

    if (year) where.year = parseInt(year);
    if (semester) where.semester = parseInt(semester);
    if (type) where.type = type;

    const courses = await db.course.findMany({
      where,
      orderBy: [{ year: "asc" }, { semester: "asc" }, { code: "asc" }],
    });

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
    const existingCourse = await db.course.findUnique({
      where: { code },
    });

    if (existingCourse) {
      return NextResponse.json(
        { success: false, error: "Course code already exists" },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data: {
        name,
        code,
        creditHours: parseFloat(creditHours),
        type,
        year,
        semester,
      },
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
