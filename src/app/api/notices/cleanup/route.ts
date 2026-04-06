import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Notice expiry configuration
const NOTICE_EXPIRY_DAYS = 30;

// Helper to convert Firestore timestamp to Date
function timestampToDate(timestamp: unknown): Date {
  if (!timestamp) return new Date(0);
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;
  }
  if (typeof timestamp === "object" && timestamp !== null) {
    const ts = timestamp as { seconds?: number; _seconds?: number };
    const seconds = ts.seconds || ts._seconds || 0;
    if (seconds) return new Date(seconds * 1000);
  }
  return new Date(0);
}

// POST - Delete expired notices (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized - Admin only" }, { status: 401 });
    }

    // Get all notices that are not pinned
    const q = query(
      collection(db, "notices"),
      where("isPinned", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    const now = new Date();
    const expiryMs = NOTICE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    const expiredNoticeIds: string[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      
      // Check if notice has expiry date set
      if (data.expiryDate) {
        const expiryDate = timestampToDate(data.expiryDate);
        if (expiryDate <= now) {
          expiredNoticeIds.push(docSnapshot.id);
        }
      } else {
        // Check creation date for auto-expiry
        const createdDate = timestampToDate(data.createdAt);
        const ageMs = now.getTime() - createdDate.getTime();
        if (ageMs >= expiryMs) {
          expiredNoticeIds.push(docSnapshot.id);
        }
      }
    }
    
    // Delete expired notices
    for (const id of expiredNoticeIds) {
      await deleteDoc(doc(db, "notices", id));
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${expiredNoticeIds.length} expired notices`,
      deletedCount: expiredNoticeIds.length,
    });
  } catch (error) {
    console.error("Error cleaning up notices:", error);
    return NextResponse.json({ success: false, error: "Failed to cleanup notices" }, { status: 500 });
  }
}

// GET - Get cleanup stats (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized - Admin only" }, { status: 401 });
    }

    // Get all notices
    const q = query(collection(db, "notices"));
    const querySnapshot = await getDocs(q);
    
    const now = new Date();
    const expiryMs = NOTICE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    let totalCount = 0;
    let pinnedCount = 0;
    let expiredCount = 0;
    let activeCount = 0;
    
    querySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      totalCount++;
      
      if (data.isPinned) {
        pinnedCount++;
        activeCount++;
        return;
      }
      
      // Check expiry
      if (data.expiryDate) {
        const expiryDate = timestampToDate(data.expiryDate);
        if (expiryDate <= now) {
          expiredCount++;
        } else {
          activeCount++;
        }
      } else {
        const createdDate = timestampToDate(data.createdAt);
        const ageMs = now.getTime() - createdDate.getTime();
        if (ageMs >= expiryMs) {
          expiredCount++;
        } else {
          activeCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount,
        active: activeCount,
        pinned: pinnedCount,
        expired: expiredCount,
        expiryDays: NOTICE_EXPIRY_DAYS,
      },
    });
  } catch (error) {
    console.error("Error getting cleanup stats:", error);
    return NextResponse.json({ success: false, error: "Failed to get cleanup stats" }, { status: 500 });
  }
}
