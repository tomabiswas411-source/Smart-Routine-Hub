import { NextResponse } from "next/server";
import { 
  createUser, 
  getUserByEmail, 
  getTimeSlots, 
  createTimeSlot,
  getRooms,
  createRoom,
  getSiteSettings,
  updateSiteSettings
} from "@/lib/firebase-services";
import { hash } from "bcryptjs";

// GET - Easy setup via browser URL - Creates admin + seed data
export async function GET() {
  try {
    const results: string[] = [];
    
    // 1. Check if admin already exists
    const existingAdmin = await getUserByEmail("admin@ice.ru.ac.bd");
    
    if (existingAdmin) {
      results.push("Admin user already exists");
    } else {
      // Create admin user
      const hashedPassword = await hash("admin123", 10);
      
      await createUser({
        email: "admin@ice.ru.ac.bd",
        password: hashedPassword,
        fullName: "System Admin",
        role: "admin",
        department: "Information & Communication Engineering",
        isActive: true,
      });
      results.push("Admin user created successfully");
    }

    // 2. Check and create time slots if not exist
    const existingSlots = await getTimeSlots();
    if (existingSlots.length === 0) {
      const defaultTimeSlots = [
        { label: "9:00 AM - 10:00 AM", startTime: "09:00", endTime: "10:00", slotOrder: 1, isBreak: false, isActive: true },
        { label: "10:00 AM - 11:00 AM", startTime: "10:00", endTime: "11:00", slotOrder: 2, isBreak: false, isActive: true },
        { label: "11:00 AM - 12:00 PM", startTime: "11:00", endTime: "12:00", slotOrder: 3, isBreak: false, isActive: true },
        { label: "12:00 PM - 1:00 PM", startTime: "12:00", endTime: "13:00", slotOrder: 4, isBreak: true, isActive: true },
        { label: "1:00 PM - 2:00 PM", startTime: "13:00", endTime: "14:00", slotOrder: 5, isBreak: false, isActive: true },
        { label: "2:00 PM - 3:00 PM", startTime: "14:00", endTime: "15:00", slotOrder: 6, isBreak: false, isActive: true },
        { label: "3:00 PM - 4:00 PM", startTime: "15:00", endTime: "16:00", slotOrder: 7, isBreak: false, isActive: true },
        { label: "4:00 PM - 5:00 PM", startTime: "16:00", endTime: "17:00", slotOrder: 8, isBreak: false, isActive: true },
      ];

      for (const slot of defaultTimeSlots) {
        await createTimeSlot(slot);
      }
      results.push("8 time slots created");
    } else {
      results.push(`${existingSlots.length} time slots already exist`);
    }

    // 3. Check and create rooms if not exist
    const existingRooms = await getRooms();
    if (existingRooms.length === 0) {
      const defaultRooms = [
        { roomNumber: "101", building: "Main Building", type: "classroom" as const, capacity: 60, isActive: true },
        { roomNumber: "102", building: "Main Building", type: "classroom" as const, capacity: 50, isActive: true },
        { roomNumber: "103", building: "Main Building", type: "classroom" as const, capacity: 45, isActive: true },
        { roomNumber: "201", building: "Main Building", type: "classroom" as const, capacity: 55, isActive: true },
        { roomNumber: "202", building: "Main Building", type: "classroom" as const, capacity: 50, isActive: true },
        { roomNumber: "Lab-1", building: "Lab Building", type: "lab" as const, capacity: 30, isActive: true },
        { roomNumber: "Lab-2", building: "Lab Building", type: "lab" as const, capacity: 30, isActive: true },
        { roomNumber: "Seminar", building: "Main Building", type: "seminar" as const, capacity: 100, isActive: true },
      ];

      for (const room of defaultRooms) {
        await createRoom(room);
      }
      results.push("8 rooms created");
    } else {
      results.push(`${existingRooms.length} rooms already exist`);
    }

    // 4. Check and create site settings if not exist
    const existingSettings = await getSiteSettings();
    if (!existingSettings) {
      await updateSiteSettings({
        id: "general",
        siteName: "ICE-RU Department Management System",
        siteTagline: "Smart Routine Hub",
        departmentName: "Information & Communication Engineering",
        universityName: "University of Rajshahi",
        contactEmail: "ice@ru.ac.bd",
        contactPhone: "+880-721-750123",
        address: "Department of ICE, University of Rajshahi, Rajshahi-6205, Bangladesh",
        aboutText: "The Department of Information and Communication Engineering at the University of Rajshahi is committed to excellence in education, research, and innovation.",
        updatedAt: new Date(),
      });
      results.push("Site settings created");
    } else {
      results.push("Site settings already exist");
    }

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully!",
      details: results,
      credentials: {
        email: "admin@ice.ru.ac.bd",
        password: "admin123",
        role: "admin"
      },
      instructions: "You can now login with these credentials. Please change the password after first login."
    });
  } catch (error) {
    console.error("Error during setup:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to complete setup", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

// POST - Same as GET for convenience
export async function POST() {
  return GET();
}
