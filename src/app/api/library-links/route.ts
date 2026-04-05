import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all library links or filter by degree/semester
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const degree = searchParams.get("degree");
    const semester = searchParams.get("semester");

    let whereClause: { degree?: string; semester?: number; isActive: boolean } = {
      isActive: true,
    };

    if (degree) {
      whereClause.degree = degree;
    }

    if (semester) {
      whereClause.semester = parseInt(semester);
    }

    const links = await db.libraryLink.findMany({
      where: whereClause,
      orderBy: [
        { degree: "asc" },
        { semester: "asc" },
      ],
    });

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
    const { degree, semester, url, title } = body;

    if (!degree || !semester || !url) {
      return NextResponse.json(
        { success: false, error: "Degree, semester, and URL are required" },
        { status: 400 }
      );
    }

    // Validate degree
    if (!["bsc", "msc"].includes(degree)) {
      return NextResponse.json(
        { success: false, error: "Degree must be 'bsc' or 'msc'" },
        { status: 400 }
      );
    }

    // Validate semester
    const maxSemester = degree === "msc" ? 3 : 8;
    if (semester < 1 || semester > maxSemester) {
      return NextResponse.json(
        { success: false, error: `Semester must be between 1 and ${maxSemester} for ${degree.toUpperCase()}` },
        { status: 400 }
      );
    }

    // Check if link already exists
    const existing = await db.libraryLink.findUnique({
      where: {
        degree_semester: {
          degree,
          semester,
        },
      },
    });

    if (existing) {
      // Update existing link
      const updated = await db.libraryLink.update({
        where: {
          id: existing.id,
        },
        data: {
          url,
          title,
          isActive: true,
        },
      });
      return NextResponse.json({
        success: true,
        data: updated,
        message: "Library link updated successfully",
      });
    }

    // Create new link
    const link = await db.libraryLink.create({
      data: {
        degree,
        semester,
        url,
        title,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: link,
      message: "Library link created successfully",
    });
  } catch (error) {
    console.error("Error creating library link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create library link" },
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

    const link = await db.libraryLink.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: link,
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

    await db.libraryLink.delete({
      where: { id },
    });

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
