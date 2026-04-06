import { NextResponse } from "next/server";
import { createUser, getUserByEmail, createRoom, createTimeSlot, updateSiteSettings } from "@/lib/firebase-services";
import { hash } from "bcryptjs";

// Simple initialization - creates admin only
export async function GET() {
  try {
    // Check if admin already exists
    const existingAdmin = await getUserByEmail("admin@ice.ru.ac.bd");
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: "System already initialized!",
        credentials: {
          email: "admin@ice.ru.ac.bd",
          password: "password123",
          role: "admin"
        }
      });
    }

    // Create admin user
    const hashedPassword = await hash("password123", 10);
    
    await createUser({
      email: "admin@ice.ru.ac.bd",
      password: hashedPassword,
      fullName: "System Admin",
      role: "admin",
      department: "Information & Communication Engineering",
      isActive: true,
    });

    // Create basic time slots
    const timeSlots = [
      { label: "1st Period", startTime: "08:00", endTime: "08:50", slotOrder: 1 },
      { label: "2nd Period", startTime: "09:00", endTime: "09:50", slotOrder: 2 },
      { label: "3rd Period", startTime: "10:00", endTime: "10:50", slotOrder: 3 },
      { label: "4th Period", startTime: "11:00", endTime: "11:50", slotOrder: 4 },
      { label: "5th Period", startTime: "12:00", endTime: "12:50", slotOrder: 5 },
      { label: "6th Period", startTime: "14:00", endTime: "14:50", slotOrder: 6 },
    ];

    for (const slot of timeSlots) {
      await createTimeSlot({
        ...slot,
        isBreak: false,
        isActive: true,
      });
    }

    // Create basic rooms
    const rooms = [
      { roomNumber: "301", building: "Main Building", type: "classroom" as const, capacity: 60 },
      { roomNumber: "302", building: "Main Building", type: "classroom" as const, capacity: 60 },
      { roomNumber: "Lab 101", building: "ICE Building", type: "lab" as const, capacity: 30 },
    ];

    for (const room of rooms) {
      await createRoom({
        ...room,
        isActive: true,
      });
    }

    // Update site settings
    await updateSiteSettings({
      siteName: "Smart Routine Hub",
      departmentName: "Information & Communication Engineering",
      universityName: "Rajshahi University",
      contactEmail: "ice@ru.ac.bd",
      contactPhone: "+880-721-750123",
      address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
      aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research.",
      facebookURL: "https://facebook.com/iceru",
      websiteURL: "https://ice.ru.ac.bd",
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "System initialized successfully! You can now login.",
      credentials: {
        email: "admin@ice.ru.ac.bd",
        password: "password123",
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Initialization error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
