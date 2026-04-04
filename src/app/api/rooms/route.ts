import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRooms, createRoom, getRoom } from "@/lib/firebase-services";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// GET - Fetch all rooms or single room
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get("id");
    const type = searchParams.get("type");

    // Single room fetch
    if (roomId) {
      const room = await getRoom(roomId);
      if (!room) {
        return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: room });
    }

    const rooms = await getRooms(type || undefined);

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch rooms" }, { status: 500 });
  }
}

// POST - Create a new room (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { roomNumber, building, type, capacity } = body;

    const room = await createRoom({
      roomNumber,
      building,
      type,
      capacity: parseInt(capacity),
      isActive: true,
    });

    return NextResponse.json({ success: true, data: room, message: "Room created successfully" });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ success: false, error: "Failed to create room" }, { status: 500 });
  }
}

// PUT - Update room (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get("id");

    if (!roomId) {
      return NextResponse.json({ success: false, error: "Room ID required" }, { status: 400 });
    }

    const body = await request.json();
    const docRef = doc(db, "rooms", roomId);
    await updateDoc(docRef, body);

    return NextResponse.json({ success: true, message: "Room updated successfully" });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json({ success: false, error: "Failed to update room" }, { status: 500 });
  }
}

// DELETE - Delete room (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get("id");

    if (!roomId) {
      return NextResponse.json({ success: false, error: "Room ID required" }, { status: 400 });
    }

    await deleteDoc(doc(db, "rooms", roomId));

    return NextResponse.json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json({ success: false, error: "Failed to delete room" }, { status: 500 });
  }
}
