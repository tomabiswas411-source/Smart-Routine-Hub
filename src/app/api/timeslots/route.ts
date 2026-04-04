import { NextResponse } from "next/server";
import { getTimeSlots } from "@/lib/firebase-services";

// GET - Fetch all time slots
export async function GET() {
  try {
    const timeSlots = await getTimeSlots();

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
