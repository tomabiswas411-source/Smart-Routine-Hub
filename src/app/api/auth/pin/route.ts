import { NextRequest, NextResponse } from "next/server";
import { getUserByPin } from "@/lib/firebase-services";
import { compare } from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string" || pin.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN format. PIN must be 6 digits." },
        { status: 400 }
      );
    }

    // Look up user by PIN in Firebase
    const user = await getUserByPin(pin);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN code. Please contact admin if you forgot your PIN." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "Your account has been deactivated. Please contact admin." },
        { status: 401 }
      );
    }

    // For PIN login, we need to provide credentials for NextAuth
    // The user must have a password set in Firebase
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "Account not configured for login. Please contact admin." },
        { status: 401 }
      );
    }

    // Return user info for client-side session handling
    // We return the email so the client can authenticate via NextAuth
    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        // Return a flag indicating PIN was verified
        pinVerified: true,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
