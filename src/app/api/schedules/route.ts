import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSchedules, getScheduleChanges, createSchedule } from "@/lib/firebase-services";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// GET - Fetch all schedules
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");
    const program = searchParams.get("program");
    const day = searchParams.get("day");
    const teacherId = searchParams.get("teacherId");

    // Build filters for getSchedules
    const filters: {
      year?: number;
      semester?: number;
      program?: string;
      day?: string;
      teacherId?: string;
    } = {};

    if (year) filters.year = parseInt(year);
    if (semester) filters.semester = parseInt(semester);
    if (program) filters.program = program;
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

    return NextResponse.json({ success: true, data: schedulesWithChanges });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch schedules" }, { status: 500 });
  }
}

// POST - Create a new schedule (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const schedule = await createSchedule({
      ...body,
      isActive: true,
    });

    return NextResponse.json({ success: true, data: schedule, message: "Schedule created successfully" });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ success: false, error: "Failed to create schedule" }, { status: 500 });
  }
}

// PUT - Update schedule (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Schedule ID required" }, { status: 400 });
    }

    const body = await request.json();
    const docRef = doc(db, "schedules", scheduleId);
    await updateDoc(docRef, { ...body, updatedAt: serverTimestamp() });

    return NextResponse.json({ success: true, message: "Schedule updated successfully" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ success: false, error: "Failed to update schedule" }, { status: 500 });
  }
}

// DELETE - Delete schedule (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Schedule ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "schedules", scheduleId));

    return NextResponse.json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ success: false, error: "Failed to delete schedule" }, { status: 500 });
  }
}
