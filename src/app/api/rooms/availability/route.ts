import { NextRequest, NextResponse } from "next/server";
import { getRoomAvailability } from "@/lib/firebase-services";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get("day");
    const timeSlotId = searchParams.get("timeSlotId");
    const excludeScheduleId = searchParams.get("excludeScheduleId");

    if (!day || !timeSlotId) {
      return NextResponse.json(
        { success: false, error: "Day and timeSlotId are required" },
        { status: 400 }
      );
    }

    const availability = await getRoomAvailability(day, timeSlotId, excludeScheduleId || undefined);

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error("Error checking room availability:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check room availability" },
      { status: 500 }
    );
  }
}
