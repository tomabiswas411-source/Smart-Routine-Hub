import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("id");
    const search = searchParams.get("search");

    // Single teacher fetch
    if (teacherId) {
      const teacher = await db.user.findUnique({
        where: { id: teacherId, role: "teacher" },
        select: {
          id: true,
          email: true,
          fullName: true,
          designation: true,
          department: true,
          phone: true,
          photoURL: true,
          officeRoom: true,
          bio: true,
          role: true,
          isActive: true,
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { success: false, error: "Teacher not found" },
          { status: 404 }
        );
      }

      // Get teacher's schedules
      const schedules = await db.schedule.findMany({
        where: { teacherId, isActive: true },
        include: {
          timeSlot: true,
        },
        orderBy: [
          { dayOfWeek: "asc" },
          { timeSlot: { slotOrder: "asc" } },
        ],
      });

      return NextResponse.json({
        success: true,
        data: { ...teacher, schedules },
      });
    }

    // Build where clause for list
    const where: Record<string, unknown> = { role: "teacher", isActive: true };

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { designation: { contains: search } },
      ];
    }

    // Fetch all teachers
    const teachers = await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        designation: true,
        department: true,
        phone: true,
        photoURL: true,
        officeRoom: true,
        bio: true,
        role: true,
        isActive: true,
      },
      orderBy: [
        { designation: "asc" },
        { fullName: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
