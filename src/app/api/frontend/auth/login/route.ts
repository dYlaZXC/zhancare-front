import { NextRequest } from "next/server";
import axios from "axios";

// 🟢 Backend URL resolution
const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("❌ BACKEND_API_URL is not set in production");
      })()
    : "http://127.0.0.1:8000/api/v1");

// 🔁 Forward the request to backend (login)
async function forwardLoginRequest(
  method: "POST",
  req: NextRequest
): Promise<Response> {
  const url = `${BACKEND_URL}/auth/login/`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const csrf = req.headers.get("x-csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;

  // Get the body of the request for POST
  const body = await req.json();

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: body,
      withCredentials: true, // Ensure cookies are sent
    });

    const resHeaders = new Headers({
      "Content-Type": "application/json",
    });

    // Handle Set-Cookie response header from backend (e.g., setting the authentication cookie)
    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        for (const cookie of setCookie) {
          resHeaders.append("Set-Cookie", cookie);
        }
      } else {
        resHeaders.set("Set-Cookie", setCookie);
      }
    }

    // Return response data with appropriate headers
    return new Response(JSON.stringify(response.data), {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error: any) {
    // Handle any errors and return a response
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.response?.data || null,
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ✅ Login route handler (POST request)
export async function POST(req: NextRequest) {
  return forwardLoginRequest("POST", req);
}
