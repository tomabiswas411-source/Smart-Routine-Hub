import { NextResponse } from "next/server";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createUser } from "@/lib/firebase-services";
import { hash } from "bcryptjs";

// This endpoint resets the admin user (for emergency use)
export async function GET() {
  try {
    // Delete existing admin users
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map((docSnap) => 
      deleteDoc(doc(db, "users", docSnap.id))
    );
    await Promise.all(deletePromises);
    
    // Create new admin user
    const hashedPassword = await hash("admin123", 10);
    
    const admin = await createUser({
      email: "admin@ice.ru.ac.bd",
      password: hashedPassword,
      fullName: "System Admin",
      role: "admin",
      department: "Information & Communication Engineering",
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "Admin user reset successfully!",
      credentials: {
        email: "admin@ice.ru.ac.bd",
        password: "admin123",
        role: "admin"
      },
      userId: admin.id
    });
  } catch (error) {
    console.error("Error resetting admin:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to reset admin user", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
