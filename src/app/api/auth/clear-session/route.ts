import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Session cleared" });
  
  // Clear the session cookie
  response.cookies.set("next-auth.session-token", "", {
    expires: new Date(0),
    path: "/",
  });
  
  response.cookies.set("next-auth.callback-url", "", {
    expires: new Date(0),
    path: "/",
  });
  
  response.cookies.set("next-auth.csrf-token", "", {
    expires: new Date(0),
    path: "/",
  });
  
  return response;
}
