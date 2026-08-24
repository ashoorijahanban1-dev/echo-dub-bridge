import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Track failed login attempts per IP to prevent brute-forcing
const loginAttempts = new Map<string, { attempts: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const now = Date.now();

    const attemptData = loginAttempts.get(ip) || { attempts: 0, lockedUntil: 0 };
    if (attemptData.lockedUntil > now) {
      const remainingMin = Math.ceil((attemptData.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `حساب کاربری موقتاً به دلیل تلاش‌های ناموفق قفل شده است. لطفاً ${remainingMin} دقیقه دیگر تلاش کنید.` },
        { status: 429 }
      );
    }

    const { password } = await request.json();
    const VALID_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";

    if (!password || password !== VALID_ADMIN_PASSWORD) {
      attemptData.attempts += 1;
      if (attemptData.attempts >= MAX_ATTEMPTS) {
        attemptData.lockedUntil = now + LOCKOUT_DURATION_MS;
      }
      loginAttempts.set(ip, attemptData);

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptData.attempts);
      return NextResponse.json(
        { error: `رمز عبور مدیریت اشتباه است. (فرصت باقیمانده: ${remainingAttempts})` },
        { status: 401 }
      );
    }

    // Login success: reset attempts
    loginAttempts.delete(ip);

    // Set secure HTTP-Only cookie
    const cookieStore = await cookies();
    cookieStore.set("echodub_admin_token", "echodub_auth_active_admin_session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true, message: "احراز هویت با موفقیت انجام شد." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
