import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const limit = searchParams.get("limit");
    const pinned = searchParams.get("pinned");

    // Build where clause
    const where: Record<string, unknown> = { isApproved: true };

    if (category && category !== "all") {
      where.category = category;
    }

    if (pinned === "true") {
      where.isPinned = true;
    }

    // Fetch notices
    const notices = await db.notice.findMany({
      where,
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: notices,
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notices" },
      { status: 500 }
    );
  }
}
