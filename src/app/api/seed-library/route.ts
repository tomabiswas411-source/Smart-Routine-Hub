import { NextResponse } from "next/server";
import { seedLibraryLinks, getLibraryLinks } from "@/lib/firebase-services";

// GET - Seed library links (can be called from browser)
export async function GET() {
  try {
    const result = await seedLibraryLinks();
    const allLinks = await getLibraryLinks();

    return NextResponse.json({
      success: true,
      message: `Library links seeded: ${result.created} created, ${result.updated} updated`,
      total: allLinks.length,
      data: allLinks,
    });
  } catch (error) {
    console.error("Error seeding library links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed library links: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
