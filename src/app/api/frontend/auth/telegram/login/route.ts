import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Helper function to validate Telegram WebApp initData
function validateTelegramWebAppData(
  initData: string,
  botToken: string
): { valid: boolean; data?: any } {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");

    // Create data-check-string
    const dataCheckArr: string[] = [];
    urlParams.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join("\n");

    // Calculate secret key
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Validate hash
    if (calculatedHash !== hash) {
      return { valid: false };
    }

    // Parse user data
    const userParam = urlParams.get("user");
    if (!userParam) {
      return { valid: false };
    }

    const userData = JSON.parse(userParam);

    return {
      valid: true,
      data: {
        user: userData,
        auth_date: parseInt(urlParams.get("auth_date") || "0"),
        query_id: urlParams.get("query_id"),
      },
    };
  } catch (error) {
    console.error("Telegram validation error:", error);
    return { valid: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, initDataUnsafe } = body;

    if (!initData) {
      return NextResponse.json(
        { success: false, message: "Missing initData" },
        { status: 400 }
      );
    }

    // Get bot token from environment
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not configured");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate Telegram data
    const validation = validateTelegramWebAppData(initData, botToken);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: "Invalid Telegram data" },
        { status: 401 }
      );
    }

    const telegramUser = validation.data?.user;
    if (!telegramUser) {
      return NextResponse.json(
        { success: false, message: "No user data" },
        { status: 400 }
      );
    }

    // Call your backend API to authenticate/register user
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${backendUrl}/api/auth/telegram/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name || "",
          username: telegramUser.username || "",
          language_code: telegramUser.language_code || "en",
          photo_url: telegramUser.photo_url || "",
        }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        // User exists and is authenticated
        return NextResponse.json({
          success: true,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          user: data.user,
        });
      } else if (response.status === 404 || data.requiresPhone) {
        // User doesn't exist, needs to complete registration
        return NextResponse.json({
          success: false,
          requiresPhone: true,
          message: "Please provide your phone number to complete registration",
          telegram_user: telegramUser,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: data.message || "Authentication failed",
          },
          { status: response.status }
        );
      }
    } catch (backendError) {
      console.error("Backend API error:", backendError);
      return NextResponse.json(
        { success: false, message: "Backend service unavailable" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Telegram login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
