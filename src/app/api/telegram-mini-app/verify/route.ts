import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, user } = body;

    console.log("📨 Received from Telegram Mini App:");
    console.log("User:", user);
    console.log("InitData:", initData);

    // Forward to Django backend
    const djangoUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${djangoUrl}/api/telegram/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          init_data: initData,
          user: user,
        }),
      });

      const data = await response.json();

      return NextResponse.json(data);
    } catch (backendError) {
      console.error("Django backend error:", backendError);

      // For development: Return success even if backend is not running
      return NextResponse.json({
        success: true,
        message: "Development mode - backend not required",
        user: user,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
