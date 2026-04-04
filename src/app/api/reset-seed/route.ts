import { NextResponse } from "next/server";
import { 
  collection, 
  getDocs, 
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST() {
  try {
    const collections = [
      "users",
      "courses", 
      "rooms",
      "timeSlots",
      "schedules",
      "notices",
      "calendarEvents",
      "siteSettings",
      "scheduleChanges"
    ];

    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });
        await batch.commit();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database reset successfully",
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset database" },
      { status: 500 }
    );
  }
}
