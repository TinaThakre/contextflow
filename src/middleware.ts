/**
 * Next.js Middleware
 * Route protection and authentication
 */

import { NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/trends",
  "/api/health",
];

// Routes that require authentication
const protectedPaths = [
  "/dashboard",
  "/api/content",
  "/api/voice-dna",
  "/api/analytics",
  "/api/subscription",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Get auth token from cookies or header
  const token = request.cookies.get("fb-id-token")?.value ||
    request.cookies.get("sb-access-token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // If route is protected and no token, redirect to login
  if (!isPublicPath && !token) {
    // Allow API routes to return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (token && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
