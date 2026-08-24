import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const US_ENGINE_HEALTH_URL = process.env.NEXT_PUBLIC_US_ENGINE_URL || "http://75glmxpk5jxiudgaa1jzsny9.209.145.63.253.sslip.io";

export async function GET() {
  const startTotal = Date.now();
  const results: any = {
    timestamp: new Date().toISOString(),
    status: "HEALTHY",
    services: {}
  };

  // 1. Iran Database Health
  try {
    const dbStart = Date.now();
    const coursesCount = await prisma.course.count();
    const episodesCount = await prisma.episode.count();
    const dbLatency = Date.now() - dbStart;

    results.services.database = {
      name: "دیتابیس سیستم (Prisma / SQLite)",
      status: "ONLINE",
      latencyMs: dbLatency,
      details: `${coursesCount} دوره | ${episodesCount} قسمت ذخیره‌شده`
    };
  } catch (err: any) {
    results.status = "DEGRADED";
    results.services.database = {
      name: "دیتابیس سیستم (Prisma / SQLite)",
      status: "ERROR",
      error: err.message
    };
  }

  // 2. US AI Engine Health
  try {
    const usStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${US_ENGINE_HEALTH_URL}/health`, {
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeoutId);

    const usLatency = Date.now() - usStart;
    if (res.ok) {
      const data = await res.json();
      results.services.usEngine = {
        name: "موتور هوش مصنوعی سرور آمریکا (US AI Engine)",
        status: "ONLINE",
        latencyMs: usLatency,
        details: `نسخه: ${data.version || "1.0.0"} | Whisper & Gemini فعال`
      };
    } else {
      results.services.usEngine = {
        name: "موتور هوش مصنوعی سرور آمریکا (US AI Engine)",
        status: "WARNING",
        latencyMs: usLatency,
        details: `کد وضعیت: ${res.status}`
      };
    }
  } catch (err: any) {
    results.services.usEngine = {
      name: "موتور هوش مصنوعی سرور آمریکا (US AI Engine)",
      status: "UNREACHABLE",
      error: err.message
    };
  }

  // 3. Telegram Cloud CDN Health
  try {
    const tgStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const tgRes = await fetch("https://api.telegram.org", {
      signal: controller.signal,
      cache: "no-store"
    });
    clearTimeout(timeoutId);
    const tgLatency = Date.now() - tgStart;

    results.services.telegramCdn = {
      name: "فضای ابری نامحدود تلگرام (Telegram Cloud CDN)",
      status: "ONLINE",
      latencyMs: tgLatency,
      details: "اتصال به شبکه پرسرعت CDN تلگرام فعال است"
    };
  } catch (err: any) {
    results.services.telegramCdn = {
      name: "فضای ابری نامحدود تلگرام (Telegram Cloud CDN)",
      status: "WARNING",
      error: "اتصال مستقیم نیازمند پروکسی است یا پاسخ با تاخیر مواجه شد"
    };
  }

  results.totalLatencyMs = Date.now() - startTotal;
  return NextResponse.json(results);
}
