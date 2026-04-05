import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings } from "@/lib/firebase-services";

// GET - Fetch site settings
export async function GET() {
  try {
    let settings = await getSiteSettings();

    // Create default settings if not exists
    if (!settings) {
      const defaultSettings = {
        id: "general",
        siteName: "Smart Routine Hub",
        siteTagline: "Academic Schedule Management",
        logoUrl: "",
        departmentName: "Information & Communication Engineering",
        universityName: "Rajshahi University",
        contactEmail: "ice@ru.ac.bd",
        contactPhone: "+880-721-750123",
        address: "ICE Building, Rajshahi University, Rajshahi-6205, Bangladesh",
        aboutText: "The Department of Information and Communication Engineering (ICE) at Rajshahi University is dedicated to excellence in education and research.",
        facebookURL: "https://facebook.com/iceru",
        websiteURL: "https://ice.ru.ac.bd",
        twitterURL: "",
        youtubeURL: "",
        instagramURL: "",
        libraryURL: "",
        developerName: "",
        developerURL: "",
        headerLinks: [
          { label: "Home", href: "/" },
          { label: "Master Routine", href: "/?view=master-calendar" },
          { label: "Student View", href: "/?view=student" },
        ],
        footerQuickLinks: [
          { label: "Home", href: "/" },
          { label: "Master Routine", href: "/?view=master-calendar" },
          { label: "Student View", href: "/?view=student" },
          { label: "Library", href: "/?view=library" },
        ],
        footerDescription: "Your complete academic companion for managing class schedules, routines, and academic activities.",
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

// PUT - Update site settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const settings = {
      ...body,
      id: "general",
      updatedAt: new Date(),
    };

    await updateSiteSettings(settings);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
