import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUser, getUserByEmail, createUser, updateUser, deleteUser } from "@/lib/firebase-services";
import { hash } from "bcryptjs";

// GET - Fetch current user or user by ID
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const targetId = userId || session.user.id;
    const user = await getUser(targetId);

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user as unknown as { password?: string; [key: string]: unknown };

    return NextResponse.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, email, password, designation, phone, officeRoom, bio, role, department, isActive } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    const user = await createUser({
      email,
      password: hashedPassword,
      fullName,
      designation: designation || "",
      phone: phone || "",
      officeRoom: officeRoom || "",
      bio: bio || "",
      role: role || "teacher",
      department: department || "Information & Communication Engineering",
      isActive: isActive ?? true,
    });

    const { password: _, ...userWithoutPassword } = user as unknown as { password?: string; [key: string]: unknown };

    return NextResponse.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    // Only admin can update other users
    if (session.user.role !== "admin" && session.user.id !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // If updating password, hash it
    if (body.password) {
      body.password = await hash(body.password, 10);
    }

    await updateUser(userId, body);

    return NextResponse.json({ success: true, message: "User updated" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("id");
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    await deleteUser(userId);

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
