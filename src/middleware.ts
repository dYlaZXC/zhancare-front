import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/admin",
  "/doctor",
  "/nurse",
  "/patient",
  "/profile",
  "/doctor-profile",
  "/nurse-profile",
  "/admin-profile",
  "/video-call",
  "/appointments",
  "/documents",
  "/history",
  "/chat",
];

// Routes only accessible when NOT authenticated
const AUTH_ONLY_ROUTES = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // 301 redirect www → non-www
  if (hostname.startsWith("www.")) {
    const nonWww = hostname.replace(/^www\./, "");
    return NextResponse.redirect(
      `https://${nonWww}${pathname}${search}`,
      { status: 301 }
    );
  }

  const brand = hostname.startsWith("uz.") ? "uz" : "kz";

  const isAuthenticated = !!request.cookies.get("zha_auth")?.value;

  const withBrand = (res: ReturnType<typeof NextResponse.next>) => {
    res.headers.set("x-brand", brand);
    return res;
  };

  // Redirect authenticated users away from login page
  if (AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
    return withBrand(NextResponse.next());
  }

  // Protect authenticated routes
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return withBrand(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon, icons, public assets
     * - api routes (handled by their own auth)
     */
    "/((?!_next/static|_next/image|favicon|icons|logosaas|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
