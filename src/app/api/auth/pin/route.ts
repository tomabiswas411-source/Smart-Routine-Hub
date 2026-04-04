import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/firebase-services";

// Demo PINs for development - In production, these should be stored in Firebase
// with proper hashing. Set USE_DEMO_PINS=false in production.
const DEMO_PINS: Record<string, { email: string; role: string }> = {
  "123456": { email: "admin@ice.ru.ac.bd", role: "admin" },
  "654321": { email: "rahman@ru.ac.bd", role: "teacher" },
  "111111": { email: "kamal@ru.ac.bd", role: "teacher" },
  "222222": { email: "nafisa@ru.ac.bd", role: "teacher" },
};

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string" || pin.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN format" },
        { status: 400 }
      );
    }

    // Check demo PINs (for development only)
    const pinData = DEMO_PINS[pin];
    
    if (!pinData) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN code" },
        { status: 401 }
      );
    }

    // Get user from Firebase
    const user = await getUserByEmail(pinData.email);
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: "User not found or inactive" },
        { status: 401 }
      );
    }

    // Return user info for client-side session handling
    return NextResponse.json({
      success: true,
      data: {
        email: pinData.email,
        password: "password123", // Demo password - in production, use proper auth
        role: user.role,
        name: user.fullName,
      },
    });
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
