import { NextRequest, NextResponse } from "next/server";
import { 
  getLibraryLinks, 
  getLibraryLinkByDegreeSemester, 
  createLibraryLink, 
  updateLibraryLink, 
  deleteLibraryLink 
} from "@/lib/firebase-services";

// GET - Fetch all library links or filter by degree/semester
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const degree = searchParams.get("degree") || undefined;
    const semesterParam = searchParams.get("semester");
    const semester = semesterParam ? parseInt(semesterParam) : undefined;

    const links = await getLibraryLinks(degree, semester);

    return NextResponse.json({
      success: true,
      data: links,
    });
  } catch (error) {
    console.error("Error fetching library links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch library links" },
      { status: 500 }
    );
  }
}

// POST - Create a new library link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { degree, semester: semesterInput, url, title } = body;

    // Convert semester to number if it's a string
    const semester = typeof semesterInput === 'string' ? parseInt(semesterInput) : semesterInput;

    console.log("POST /api/library-links - Received:", { degree, semester, url, title });

    // Validate URL
    if (!url || typeof url !== 'string' || !url.trim()) {
      console.log("Validation failed - missing or invalid URL");
      return NextResponse.json(
        { success: false, error: "URL is required and must be a valid string" },
        { status: 400 }
      );
    }

    if (!degree || !semester || isNaN(semester)) {
      console.log("Validation failed - missing required fields");
      return NextResponse.json(
        { success: false, error: "Degree and semester are required" },
        { status: 400 }
      );
    }

    // Validate degree
    if (!["bsc", "msc", "others"].includes(degree)) {
      console.log("Validation failed - invalid degree:", degree);
      return NextResponse.json(
        { success: false, error: "Degree must be 'bsc', 'msc', or 'others'" },
        { status: 400 }
      );
    }

    // Validate semester
    let maxSemester = 8;
    if (degree === "msc") maxSemester = 3;
    if (degree === "others") maxSemester = 0;
    
    if (semester < 0 || semester > maxSemester) {
      console.log("Validation failed - invalid semester:", semester);
      return NextResponse.json(
        { success: false, error: `Semester must be between 0 and ${maxSemester} for ${degree.toUpperCase()}` },
        { status: 400 }
      );
    }

    console.log("Checking for existing link...");

    // Check if link already exists
    const existing = await getLibraryLinkByDegreeSemester(degree, semester);

    if (existing) {
      console.log("Updating existing link:", existing.id);
      // Update existing link
      await updateLibraryLink(existing.id, {
        url: url.trim(),
        title: title?.trim() || null,
        isActive: true,
      });
      
      const updatedLink = await getLibraryLinkByDegreeSemester(degree, semester);
      console.log("Link updated successfully:", existing.id);
      return NextResponse.json({
        success: true,
        data: updatedLink,
        message: "Library link updated successfully",
      });
    }

    console.log("Creating new link...");
    // Create new link
    const link = await createLibraryLink({
      degree,
      semester,
      url: url.trim(),
      title: title?.trim() || null,
      isActive: true,
    });

    console.log("Link created successfully:", link.id);
    return NextResponse.json({
      success: true,
      data: link,
      message: "Library link created successfully",
    });
  } catch (error) {
    console.error("Error creating library link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create library link: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PUT - Update a library link
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, url, title, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Link ID is required" },
        { status: 400 }
      );
    }

    const updateData: { url?: string; title?: string; isActive?: boolean } = {};
    if (url !== undefined) updateData.url = url;
    if (title !== undefined) updateData.title = title;
    if (isActive !== undefined) updateData.isActive = isActive;

    await updateLibraryLink(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Library link updated successfully",
    });
  } catch (error) {
    console.error("Error updating library link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update library link" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a library link
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Link ID is required" },
        { status: 400 }
      );
    }

    await deleteLibraryLink(id);

    return NextResponse.json({
      success: true,
      message: "Library link deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting library link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete library link" },
      { status: 500 }
    );
  }
}
