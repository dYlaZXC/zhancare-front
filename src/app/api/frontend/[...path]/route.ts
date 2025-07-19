import { NextRequest } from "next/server";
import axios from "axios";

// Fallback to localhost backend
const BACKEND_URL = process.env.BACKEND_API_URL || "https://exp-admin.smartalmaty.kz/api/v1"; // prod
// const BACKEND_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1"; // Local

// 🛡️ Proxy all frontend requests through Next.js API route
// ✅ Build full backend URL from actual request path
function buildBackendUrl(path: string[], req: NextRequest): string {
  const frontendPrefix = "/api/frontend";
  const backendPrefix = BACKEND_URL.replace(/\/$/, "");

  let pathSuffix = req.nextUrl.pathname.replace(frontendPrefix, "");

  // Ensure trailing slash
  if (!pathSuffix.endsWith("/")) {
    pathSuffix += "/";
  }

  const endpoint = `${backendPrefix}${pathSuffix}`;
  const query = req.nextUrl.searchParams.toString();
  return query ? `${endpoint}?${query}` : endpoint;
}


async function forwardRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  req: NextRequest,
  context: { params: { path: string[] } }
): Promise<Response> {
  const { path } = context.params;
  const url = buildBackendUrl(path, req);

  // Prepare headers to forward
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const csrf = req.headers.get("x-csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;

  // Forward body only if needed
  const body = ["POST", "PUT"].includes(method) ? await req.json() : undefined;

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: body,
      withCredentials: true, // 🔐 Required for CSRF + session cookies
    });

    // Handle backend response cookies
    const resHeaders = new Headers({
      "Content-Type": "application/json",
    });

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

    return new Response(JSON.stringify(response.data), {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error: any) {
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

// Dynamic route handlers for all methods
export async function GET(req: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest("GET", req, context);
}

export async function POST(req: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest("POST", req, context);
}

export async function PUT(req: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest("PUT", req, context);
}

export async function DELETE(req: NextRequest, context: { params: { path: string[] } }) {
  return forwardRequest("DELETE", req, context);
}
