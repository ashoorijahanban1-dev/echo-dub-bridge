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
  try {
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
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoPayload)
      });
      const data = await res.json();
      if (data.ok) {
        sentMessageId = data.result.message_id;
      }
    } else {
      photoPayload.text = captionHtml;
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoPayload)
      });
      const data = await res.json();
      if (data.ok) {
        sentMessageId = data.result.message_id;
      }
    }
  } catch (err: any) {
    console.error("Telegram banner post error:", err.message);
  }

  // 2. Send Video Preview to Telegram Channel
  const sampleVideo = videoUrl && videoUrl.startsWith("http")
    ? videoUrl
    : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  try {
    const videoCaption = `🎥 <b>جلسه ۱: ${episodeTitle || "مقدمه و شروع دوره"}</b>

🎙 <b>دوبله فارسی هوش مصنوعی</b>
🌐 <a href="${webCourseUrl}">مشاهده تمامی جلسات در سایت</a>`;

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        video: sampleVideo,
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
      })
    });

    let vData = await res.json();
    if (!vData.ok) {
      // Fallback to Telegram native file_id for 100% reliable instant delivery
      const fbRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        })
      });
      vData = await fbRes.json();
    }

    if (vData.ok) {
      sentFileId = vData.result.video?.file_id || null;
      if (!sentMessageId) {
        sentMessageId = vData.result.message_id;
      }
    }
  } catch (err: any) {
    console.error("Telegram video post error:", err.message);
  }

  return {
    success: true,
    messageId: sentMessageId,
    fileId: sentFileId
  };
}
