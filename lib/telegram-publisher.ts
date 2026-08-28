import { prisma } from "./prisma";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8773331933:AAHOavxMB4jHC6CTojqBXjLM13NG6ERh2Ic";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "-1004449817719";
const US_ENGINE_URL = process.env.NEXT_PUBLIC_US_ENGINE_URL || "http://75glmxpk5jxiudgaa1jzsny9.209.145.63.253.sslip.io";

export interface TelegramPublishOptions {
  courseTitleFa: string;
  courseTitleEn?: string;
  slug: string;
  instructor?: string;
  category?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  telegramFileId?: string;
  episodeTitle?: string;
}

/**
 * Robust Telegram API request with US datacenter proxy fallback to bypass Iran censorship
 */
async function callTelegramAPI(method: string, payload: any): Promise<any> {
  // 1. First attempt: US AI Engine Proxy (bypasses Iran filtering 100%)
  try {
    const pRes = await fetch(`${US_ENGINE_URL}/api/v1/telegram/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, payload }),
      signal: AbortSignal.timeout(15000)
    });
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData && pData.ok) {
        return pData;
      }
    }
  } catch (err: any) {
    console.warn("US Engine Telegram Proxy attempt failed:", err.message);
  }

  // 2. Second attempt: Direct Telegram Bot API
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    const data = await res.json();
    if (data && data.ok) {
      return data;
    }
  } catch (err: any) {
    console.warn("Direct Telegram API attempt failed:", err.message);
  }

  return { ok: false, description: "All Telegram endpoints unreachable" };
}

/**
 * Publishes a dubbed course announcement and streamable video to the Telegram Channel
 */
export async function publishCourseToTelegram(opts: TelegramPublishOptions) {
  const {
    courseTitleFa,
    courseTitleEn,
    slug,
    instructor = "مدرس بین‌المللی",
    category = "برنامه‌نویسی و هوش مصنوعی",
    thumbnailUrl,
    videoUrl,
    telegramFileId,
    episodeTitle
  } = opts;

  const webCourseUrl = `https://rpim.ir/courses/${slug}`;
  const botUsername = "EchoDub_bot";

  const captionHtml = `🎬 <b>دوره جدید با دوبله فارسی هوش مصنوعی</b>\n\n📌 <b>عنوان:</b> ${courseTitleFa}\n${courseTitleEn ? `🌐 <b>Original:</b> <i>${courseTitleEn}</i>\n` : ""}🎙 <b>دوبله هوش مصنوعی:</b> فارسی روان و تخصصی (EchoDub AI)\n👨‍🏫 <b>مدرس:</b> ${instructor}\n🏷 <b>دسته‌بندی:</b> ${category}\n⚡ <b>کیفیت:</b> 1080p Full HD\n\n🔗 <b>تماشا و استریم آنلاین در وبسایت:</b>\n<a href="${webCourseUrl}">${webCourseUrl}</a>\n\n🆔 @${botUsername} | 🌐 rpim.ir`;

  let sentMessageId: number | null = null;
  let sentFileId: string | null = null;

  // 1. Send Course Poster / Banner with Inline Button
  const photoPayload: any = {
    chat_id: TELEGRAM_CHANNEL_ID,
    caption: captionHtml,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ تماشای آنلاین با دوبله فارسی در سایت",
            url: webCourseUrl
          }
        ]
      ]
    }
  };

  if (thumbnailUrl && thumbnailUrl.startsWith("http")) {
    photoPayload.photo = thumbnailUrl;
    const res = await callTelegramAPI("sendPhoto", photoPayload);
    if (res.ok) {
      sentMessageId = res.result?.message_id || null;
    }
  }

  if (!sentMessageId) {
    photoPayload.text = captionHtml;
    const res = await callTelegramAPI("sendMessage", photoPayload);
    if (res.ok) {
      sentMessageId = res.result?.message_id || null;
    }
  }

  // 2. If genuine video file_id or videoUrl is provided, send the real video
  if (telegramFileId || (videoUrl && videoUrl.startsWith("http"))) {
    const videoCaption = `🎥 <b>جلسه ۱: ${episodeTitle || "مقدمه و شروع دوره"}</b>\n\n🎙 <b>دوبله فارسی هوش مصنوعی</b>\n🌐 <a href="${webCourseUrl}">مشاهده تمامی جلسات در سایت</a>`;

    const videoPayload: any = {
      chat_id: TELEGRAM_CHANNEL_ID,
      video: telegramFileId || videoUrl,
      caption: videoCaption,
      parse_mode: "HTML",
      supports_streaming: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎬 باز کردن دوره در وبسایت",
              url: webCourseUrl
            }
          ]
        ]
      }
    };

    const vRes = await callTelegramAPI("sendVideo", videoPayload);
    if (vRes.ok) {
      sentFileId = vRes.result?.video?.file_id || telegramFileId || null;
      if (!sentMessageId) {
        sentMessageId = vRes.result?.message_id || null;
      }
    }
  }

  return {
    success: !!sentMessageId,
    messageId: sentMessageId,
    fileId: sentFileId
  };
}
