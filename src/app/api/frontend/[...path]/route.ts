import { NextRequest } from "next/server";
import axios from "axios";

// Fallback to prod backend
// const BACKEND_URL = "https://exp-admin.smartalmaty.kz/api/v1"; // production backend


// Fallback to localhost backend
const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("❌ BACKEND_API_URL is not set in production");
      })()
    : "http://127.0.0.1:8000/api/v1");

// 🛡️ Proxy all frontend requests through Next.js API route
function buildBackendUrl(path: string[], req: NextRequest): string {
  const frontendPrefix = "/api/frontend";
  const backendPrefix = BACKEND_URL.replace(/\/$/, "");

  let pathSuffix = req.nextUrl.pathname.replace(frontendPrefix, "");

  // ✅ ensure trailing slash ONLY on backend target
  if (!pathSuffix.endsWith("/")) {
    pathSuffix += "/";
  }

  const endpoint = `${backendPrefix}${pathSuffix}`;
  const query = req.nextUrl.searchParams.toString();
  return query ? `${endpoint}?${query}` : endpoint;
}

// Forward request to the backend
async function forwardRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  req: NextRequest,
  context: { params?: { path?: string[] } } // ✅ Loosened typing
): Promise<Response> {
  const path = context.params?.path || [];
  const url = buildBackendUrl(path, req);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;

  const csrf = req.headers.get("x-csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;

  const body = ["POST", "PUT"].includes(method) ? await req.json() : undefined;

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: body,
      withCredentials: true,
    });

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

// ✅ Route handlers with relaxed typing to avoid Next.js error
export async function GET(req: NextRequest, context: any) {
  return forwardRequest("GET", req, context);
}

export async function POST(req: NextRequest, context: any) {
  return forwardRequest("POST", req, context);
}

export async function PUT(req: NextRequest, context: any) {
  return forwardRequest("PUT", req, context);
}

export async function DELETE(req: NextRequest, context: any) {
  return forwardRequest("DELETE", req, context);
}
