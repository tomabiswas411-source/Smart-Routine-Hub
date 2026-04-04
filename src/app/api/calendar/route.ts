import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/firebase-services";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get("type");

    // Fetch calendar events
    const events = await getCalendarEvents(eventType || undefined);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching calendar:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
