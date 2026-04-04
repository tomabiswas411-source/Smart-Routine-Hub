import { NextRequest, NextResponse } from "next/server";
import { getNotices } from "@/lib/firebase-services";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const limitCount = searchParams.get("limit");
    const pinned = searchParams.get("pinned");

    // Build filters
    const filters: {
      category?: string;
      limitCount?: number;
      pinnedOnly?: boolean;
    } = {};

    if (category) filters.category = category;
    if (limitCount) filters.limitCount = parseInt(limitCount);
    if (pinned === "true") filters.pinnedOnly = true;

    // Fetch notices
    const notices = await getNotices(filters);

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
