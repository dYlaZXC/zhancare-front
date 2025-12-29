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

// 🛡️ Construct backend URL from request
function buildBackendUrl(path: string[], req: NextRequest): string {
  const frontendPrefix = "/api/frontend";
  const backendPrefix = BACKEND_URL.replace(/\/$/, "");

  // Extract path suffix by removing frontendPrefix from the request path
  let pathSuffix = req.nextUrl.pathname.replace(frontendPrefix, "");

  // Ensure the backend URL ends with a slash to avoid misrouting
  if (!pathSuffix.endsWith("/")) {
    pathSuffix += "/";
  }

  // Construct the final backend URL
  const endpoint = `${backendPrefix}${pathSuffix}`;

  // Add query parameters if any exist in the request
  const query = req.nextUrl.searchParams.toString();

  return query ? `${endpoint}?${query}` : endpoint;
}

// 🔁 Forward the request
async function forwardRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  req: NextRequest,
  path: string[]
): Promise<Response> {
  const url = buildBackendUrl(path, req);
  // console.log("🔁 Proxying to:", url);

  // Prepare headers to forward the request with cookies and authorization
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const csrf = req.headers.get("x-csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;

  // Body for POST/PUT requests
  const body = ["POST", "PUT"].includes(method) ? await req.json() : undefined;

  try {
    // Send the request to the backend via axios
    const response = await axios({
      method,
      url,
      headers,
      data: body,
      withCredentials: true, // Ensure cookies are sent
      timeout: 25000, // 25 second timeout (Vercel has 30s limit)
    });

    // Prepare response headers for Set-Cookie
    const resHeaders = new Headers({
      "Content-Type": "application/json",
    });

    // Handle Set-Cookie header if any from the backend
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

    // Return the response data with status and headers
    return new Response(JSON.stringify(response.data), {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error: any) {
    // Handle errors and respond with the error message
    console.error("Error while proxying request:", error);

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

// ✅ Route handlers with proper async-safe access
export async function GET(req: NextRequest, context: { params: any }) {
  const path = await context.params?.path ?? []; // Await params to ensure they're resolved properly
  return forwardRequest("GET", req, path);
}

export async function POST(req: NextRequest, context: { params: any }) {
  const path = await context.params?.path ?? [];
  return forwardRequest("POST", req, path);
}

export async function PUT(req: NextRequest, context: { params: any }) {
  const path = await context.params?.path ?? [];
  return forwardRequest("PUT", req, path);
}

export async function DELETE(req: NextRequest, context: { params: any }) {
  const path = await context.params?.path ?? [];
  return forwardRequest("DELETE", req, path);
}
