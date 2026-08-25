import { prisma } from "./prisma";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8773331933:AAHOavxMB4jHC6CTojqBXjLM13NG6ERh2Ic";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "-1004449817719";

export interface TelegramPublishOptions {
  courseTitleFa: string;
  courseTitleEn?: string;
  slug: string;
  instructor?: string;
  category?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  episodeTitle?: string;
}

/**
 * Robust Telegram API request with multi-endpoint fallback
 */
async function callTelegramAPI(method: string, payload: any): Promise<any> {
  const endpoints = [
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
      const data = await res.json();
      if (data && data.ok) {
        return data;
      }
      console.warn(`Telegram API [${method}] returned non-ok:`, data);
    } catch (err: any) {
      console.warn(`Telegram API [${method}] attempt failed via ${url}:`, err.message);
    }
  }

  return { ok: false, description: "All Telegram endpoints unreachable or returned error" };
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
    episodeTitle
  } = opts;

  const webCourseUrl = `https://rpim.ir/courses/${slug}`;
  const botUsername = "EchoDub_bot";

  const captionHtml = `🎬 <b>دوره جدید با دوبله فارسی منتشر شد</b>

📌 <b>عنوان:</b> ${courseTitleFa}
${courseTitleEn ? `🌐 <b>Original:</b> <i>${courseTitleEn}</i>\n` : ""}
🎙 <b>دوبله هوش مصنوعی:</b> فارسی استودیویی و روان (EchoDub AI)
👨‍🏫 <b>مدرس:</b> ${instructor}
🏷 <b>دسته‌بندی:</b> ${category}
⚡ <b>کیفیت:</b> 1080p Full HD دو زبانه (فارسی + زبان اصلی)

🔗 <b>تماشا و استریم آنلاین در وبسایت:</b>
<a href="${webCourseUrl}">${webCourseUrl}</a>

🆔 @${botUsername} | 🌐 rpim.ir`;

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

  // 2. Send Video Preview to Telegram Channel
  const videoCaption = `🎥 <b>جلسه ۱: ${episodeTitle || "مقدمه و شروع دوره"}</b>\n\n🎙 <b>دوبله فارسی هوش مصنوعی</b>\n🌐 <a href="${webCourseUrl}">مشاهده تمامی جلسات در سایت</a>`;

  // Try file_id directly for instant, zero-failure delivery
  const videoPayload: any = {
    chat_id: TELEGRAM_CHANNEL_ID,
    video: "BAACAgQAAyEGAAMBCTrUdwADD2qNX1lnmd3wefwO24Zsme1qjAmGAAKbCAACcSE8U0teE2H-MI6XPQQ",
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
    sentFileId = vRes.result?.video?.file_id || null;
    if (!sentMessageId) {
      sentMessageId = vRes.result?.message_id || null;
    }
  }

  return {
    success: !!sentMessageId,
    messageId: sentMessageId,
    fileId: sentFileId
  };
}
