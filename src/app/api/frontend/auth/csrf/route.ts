import { NextRequest } from "next/server";
import { randomBytes } from "crypto"; // for generating a cryptographically secure token

// Utility function to generate CSRF token securely
function generateCsrfToken() {
  return randomBytes(32).toString("hex"); // 64 characters hex token
}

// Handle CSRF token generation request (GET method)
export async function GET(req: NextRequest) {
  const csrfToken = generateCsrfToken();

  // Set cookie with proper attributes
  return new Response(JSON.stringify({ csrfToken }), {
    status: 200,
    headers: {
      "Set-Cookie": `csrftoken=${csrfToken}; Path=/; HttpOnly; SameSite=None; Secure`, // for cross-site requests in production
      "Content-Type": "application/json",
    },
  });
}