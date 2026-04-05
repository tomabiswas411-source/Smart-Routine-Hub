import { NextResponse } from "next/server";
import { getSiteSettings, updateSiteSettings } from "@/lib/firebase-services";

// GET - Update library URL directly (one-time setup)
export async function GET() {
  try {
    const libraryURL = "https://drive.google.com/drive/folders/1NHA8cKFjuOFyTvpTjwxvysfOe4qfgL_B";
    
    // Get existing settings
    const existingSettings = await getSiteSettings();
    
    // Update with library URL
    await updateSiteSettings({
      ...existingSettings,
      id: "general",
      libraryURL: libraryURL,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Library URL updated successfully!",
      libraryURL: libraryURL,
    });
  } catch (error) {
    console.error("Error updating library URL:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update library URL", 
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
