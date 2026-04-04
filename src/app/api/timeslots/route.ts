import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all time slots
export async function GET() {
  try {
    const timeSlots = await db.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { slotOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: timeSlots,
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch time slots" },
      { status: 500 }
    );
  }
}
