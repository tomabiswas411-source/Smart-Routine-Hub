import { NextRequest, NextResponse } from "next/server";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limitCount = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const constraints = [where("userId", "==", userId)];
    
    if (unreadOnly) {
      constraints.push(where("isRead", "==", false));
    }

    const q = query(collection(db, "notifications"), ...constraints, limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const notifications = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }));

    // Sort by createdAt descending
    notifications.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt as unknown as string).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt as unknown as string).getTime() : 0;
      return bTime - aTime;
    });

    // Count unread
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, body: message, type, data } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "notifications"), {
      userId,
      title,
      body: message,
      type: type || "general",
      data: data || {},
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: { id: docRef.id },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ success: false, error: "Failed to create notification" }, { status: 500 });
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, markAllRead, userId } = body;

    if (markAllRead && userId) {
      // Mark all as read for user
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("isRead", "==", false)
      );
      const querySnapshot = await getDocs(q);
      
      const batch = [];
      querySnapshot.docs.forEach((docSnap) => {
        batch.push(updateDoc(doc(db, "notifications", docSnap.id), { isRead: true }));
      });
      
      await Promise.all(batch);
      
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Notification ID required" }, { status: 400 });
    }

    await updateDoc(doc(db, "notifications", notificationId), { isRead: true });

    return NextResponse.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ success: false, error: "Failed to update notification" }, { status: 500 });
  }
}

// DELETE - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Notification ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "notifications", notificationId));

    return NextResponse.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ success: false, error: "Failed to delete notification" }, { status: 500 });
  }
}
