import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting for API routes
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_API_REQUESTS_PER_WINDOW = 120; // 120 requests per min

export function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const path = request.nextUrl.pathname;
  const now = Date.now();

  // 1. Rate Limiting on /api/* routes
  if (path.startsWith("/api/")) {
    const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };
    if (now - rateData.lastReset > RATE_LIMIT_WINDOW_MS) {
      rateData.count = 1;
      rateData.lastReset = now;
    } else {
      rateData.count += 1;
    }
    rateLimitMap.set(ip, rateData);

    if (rateData.count > MAX_API_REQUESTS_PER_WINDOW) {
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests (Rate limit exceeded). Please slow down." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  }

  // 2. Admin Route Protection (/admin/* except /admin/login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const adminToken = request.cookies.get("echodub_admin_token")?.value;
    if (!adminToken || adminToken !== "echodub_auth_active_admin_session") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
