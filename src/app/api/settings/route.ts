import { NextResponse } from "next/server";
import { getSiteSettings, updateSiteSettings } from "@/lib/firebase-services";

export async function GET() {
  try {
    let settings = await getSiteSettings();

    // Create default settings if not exists
    if (!settings) {
      const defaultSettings = {
        id: "general",
        departmentName: "Information & Communication Engineering",
        universityName: "Rajshahi University",
        contactEmail: "ice@ru.ac.bd",
        contactPhone: "+880-721-750123",
        address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
        aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research in the fields of information technology and communication systems.",
        facebookURL: "https://facebook.com/iceru",
        websiteURL: "https://ice.ru.ac.bd",
        updatedAt: new Date(),
      };
      
      await updateSiteSettings(defaultSettings);
      settings = defaultSettings as unknown as typeof settings;
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
