import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/firebase-services";
import { hash } from "bcryptjs";

// GET - Easy setup via browser URL
export async function GET() {
  try {
    // Check if admin already exists
    const existingAdmin = await getUserByEmail("admin@ice.ru.ac.bd");
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: "Admin already exists!",
        credentials: {
          email: "admin@ice.ru.ac.bd",
          password: "password123",
          role: "admin"
        }
      });
    }

    // Create admin user
    const hashedPassword = await hash("password123", 10);
    
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
      message: "Admin user created successfully!",
      credentials: {
        email: "admin@ice.ru.ac.bd",
        password: "password123",
        role: "admin"
      },
      userId: admin.id
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create admin user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Same as GET for convenience
export async function POST() {
  return GET();
}
