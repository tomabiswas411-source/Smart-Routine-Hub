import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get site settings
    let settings = await db.siteSettings.findUnique({
      where: { id: "general" },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await db.siteSettings.create({
        data: {
          id: "general",
          departmentName: "Information & Communication Engineering",
          universityName: "Rajshahi University",
          contactEmail: "ice@ru.ac.bd",
          contactPhone: "+880-721-750123",
          address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
          aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research in the fields of information technology and communication systems.",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
