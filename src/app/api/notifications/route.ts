import { NextRequest, NextResponse } from "next/server";

// In-memory notifications store (in production, use database)
let notifications: NotificationItem[] = [];

interface NotificationItem {
  id: string;
  type: "class_cancelled" | "class_rescheduled" | "room_changed" | "general";
  title: string;
  message: string;
  semester?: number;
  program?: string;
  courseCode?: string;
  timestamp: string;
  isRead: boolean;
}

// GET - Fetch all notifications
export async function GET(request: NextRequest) {
  try {
    // If no notifications, add some demo ones
    if (notifications.length === 0) {
      notifications = [
        {
          id: "1",
          type: "class_cancelled",
          title: "Class Cancelled",
          message: "CSE-101 class scheduled for today at 10:00 AM has been cancelled by Dr. Rahman",
          semester: 1,
          program: "BSc",
          courseCode: "CSE-101",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
        },
        {
          id: "2",
          type: "class_rescheduled",
          title: "Class Rescheduled",
          message: "CSE-205 Lab class moved from Room 301 to Room 305 for tomorrow",
          semester: 2,
          program: "BSc",
          courseCode: "CSE-205",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          isRead: false,
        },
        {
          id: "3",
          type: "room_changed",
          title: "Room Changed",
          message: "ICE-301 class room changed from Room 201 to Room 401",
          semester: 3,
          program: "BSc",
          courseCode: "ICE-301",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
        },
      ];
    }

    // Sort by timestamp (newest first)
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedNotifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST - Add a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, message, semester, program, courseCode } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      type,
      title,
      message,
      semester,
      program,
      courseCode,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    notifications.unshift(newNotification);

    return NextResponse.json({
      success: true,
      data: newNotification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    const notificationIndex = notifications.findIndex((n) => n.id === id);
    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    notifications[notificationIndex].isRead = true;

    return NextResponse.json({
      success: true,
      data: notifications[notificationIndex],
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Notification ID required" },
        { status: 400 }
      );
    }

    const initialLength = notifications.length;
    notifications = notifications.filter((n) => n.id !== id);

    if (notifications.length === initialLength) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
