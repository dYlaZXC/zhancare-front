// /app/api/frontend/auth/csrf/route.ts

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Generate the CSRF token (you may have a utility function for this)
  const csrfToken = generateCsrfToken();

  // Send the CSRF token in a response and set it as a cookie
  return new Response(JSON.stringify({ csrfToken }), {
    status: 200,
    headers: {
      "Set-Cookie": `csrftoken=${csrfToken}; Path=/; HttpOnly`, // Cookie will be sent to the browser
      "Content-Type": "application/json",
    },
  });
}

// Utility function to generate CSRF token
function generateCsrfToken() {
  // This should return a proper CSRF token
  return Math.random().toString(36).substring(2);
}
