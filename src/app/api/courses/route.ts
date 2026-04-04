import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCourses, createCourse, getCourse } from "@/lib/firebase-services";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// GET - Fetch all courses or single course
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("id");
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const program = searchParams.get("program");
    const type = searchParams.get("type");

    // Single course fetch
    if (courseId) {
      const course = await getCourse(courseId);
      if (!course) {
        return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: course });
    }

    const filters: { year?: number; semester?: number; program?: string; type?: string } = {};
    if (year) filters.year = parseInt(year);
    if (semester) filters.semester = parseInt(semester);
    if (program) filters.program = program;
    if (type) filters.type = type;

    const courses = await getCourses(filters);

    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST - Create a new course (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, creditHours, type, year, semester, program } = body;

    // Check if course code already exists
    const existingCourses = await getCourses();
    const exists = existingCourses.some(c => c.code === code);

    if (exists) {
      return NextResponse.json({ success: false, error: "Course code already exists" }, { status: 400 });
    }

    const course = await createCourse({
      name,
      code,
      creditHours: parseFloat(creditHours),
      type,
      year: year ? parseInt(year) : undefined,
      semester: semester ? parseInt(semester) : 1,
      program: program || "bsc",
      isActive: true,
    });

    return NextResponse.json({ success: true, data: course, message: "Course created successfully" });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ success: false, error: "Failed to create course" }, { status: 500 });
  }
}

// PUT - Update course (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID required" }, { status: 400 });
    }

    const body = await request.json();
    const docRef = doc(db, "courses", courseId);
    await updateDoc(docRef, body);

    return NextResponse.json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ success: false, error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE - Delete course (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("id");

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "courses", courseId));

    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ success: false, error: "Failed to delete course" }, { status: 500 });
  }
}
