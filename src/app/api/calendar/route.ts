import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get("type");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (eventType) {
      where.eventType = eventType;
    }

    // Fetch calendar events
    const events = await db.academicCalendar.findMany({
      where,
      orderBy: { date: "asc" },
    });

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
