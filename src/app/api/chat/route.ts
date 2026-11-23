import { NextResponse } from "next/server";
import { isInjectionAttempt } from "@/lib/ai";

const API_KEY = process.env.MISTRAL_API_KEY;
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;
  record.count++;
  return true;
}

export async function POST(req: Request) {
  if (!API_KEY) {
    console.error("MISTRAL_API_KEY is not configured");
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { messages, model, temperature, top_p } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      );
    }

    // Scan all user messages for injection attempts
    const userMessages: string[] = messages
      .filter((m: any) => m.role === "user")
      .map((m: any) => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)));

    for (const text of userMessages) {
      if (isInjectionAttempt(text)) {
        return NextResponse.json(
          { error: "I am a medical assistant. Please describe your symptoms." },
          { status: 400 }
        );
      }
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "pixtral-12b-2409",
        messages,
        temperature: 0.2,
        top_p: top_p || 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Mistral API error:", error);
      return NextResponse.json(
        { error: error.message || "API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
