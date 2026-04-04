import { NextRequest, NextResponse } from "next/server";
import { getNotices } from "@/lib/firebase-services";

// GET - Fetch all notifications from Firebase notices
export async function GET(request: NextRequest) {
  try {
    // Fetch schedule_change notices from Firebase
    const notices = await getNotices({ 
      category: "schedule_change",
      limitCount: 50 
    });

    // Transform notices to notification format
    const notifications = notices.map((notice) => {
      // Determine notification type from changeType
      let type: "class_cancelled" | "class_rescheduled" | "room_changed" | "general" = "general";
      if (notice.changeType === "cancelled") type = "class_cancelled";
      else if (notice.changeType === "rescheduled") type = "class_rescheduled";
      else if (notice.changeType === "room_changed") type = "room_changed";

      // Handle timestamp
      let timestamp = new Date().toISOString();
      if (notice.createdAt) {
        if (typeof notice.createdAt === "string") {
          timestamp = notice.createdAt;
        } else if (typeof notice.createdAt === "object" && notice.createdAt !== null) {
          // Firestore timestamp
          const ts = notice.createdAt as { seconds?: number; _seconds?: number };
          if (ts.seconds || ts._seconds) {
            timestamp = new Date((ts.seconds || ts._seconds || 0) * 1000).toISOString();
          }
        }
      }

      return {
        id: notice.id,
        type,
        title: notice.title,
        message: notice.content,
        semester: notice.affectedSemester,
        program: notice.affectedProgram,
        courseCode: notice.content?.match(/[A-Z]+-\d+/)?.[0] || undefined,
        timestamp,
        isRead: false, // For now, all are unread - could implement read tracking later
      };
    });

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
