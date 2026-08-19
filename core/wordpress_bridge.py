"""
EchoDub Bridge - WordPress & Downloadly.ir Integration
Injects responsive dubbed video players and download links into Downloadly.ir course posts.
"""

import logging
import requests
from typing import Dict, Any, Optional

from config import settings

logger = logging.getLogger("EchoDub.WordPressBridge")

class WordPressBridge:
    @staticmethod
    def generate_player_html(stream_url: str, title: str, telegram_link: Optional[str] = None) -> str:
        """
        Generates a responsive HTML5 video player embed with download buttons and Persian dubbing badge.
        """
        telegram_btn = f'<a href="{telegram_link}" target="_blank" class="downloadly-tg-btn">🚀 دانلود مستقیم از کانال تلگرام</a>' if telegram_link else ''
        
        html_code = f"""
<!-- EchoDub AI Player Embed for Downloadly.ir -->
<div class="echodub-player-wrapper" style="margin: 25px 0; background: #0c101d; border-radius: 16px; padding: 18px; border: 1px solid rgba(139, 92, 246, 0.3); font-family: Tahoma, sans-serif; direction: rtl; text-align: right; color: #fff;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
    <span style="font-weight: bold; font-size: 15px; color: #38bdf8;">🎙️ تماشای آنلاین با دوبله هوشمند فارسی</span>
    <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">کیفیت 1080p نیم‌بها</span>
  </div>
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; background: #000;">
    <video controls playsinline preload="metadata" style="position: absolute; top:0; left: 0; width: 100%; height: 100%;">
      <source src="{stream_url}" type="video/mp4">
      مرورگر شما از تماشای آنلاین ویدیو پشتیبانی نمی‌کند.
    </video>
  </div>
  <div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center;">
    <span style="font-size: 13px; color: #94a3b8;">دوبله اختصاصی تیم با هوش مصنوعی انسانی</span>
    <div style="display: flex; gap: 8px;">
      <a href="{stream_url}" download style="background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: #fff; text-decoration: none; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: bold;">📥 دانلود ویدیوی دوبله</a>
      {telegram_btn}
    </div>
  </div>
</div>
<!-- End EchoDub Player Embed -->
        """
        return html_code.strip()

    @staticmethod
    def update_post(post_id: int, stream_url: str, title: str, telegram_link: Optional[str] = None) -> bool:
        """
        Updates WordPress post content via REST API by appending the dubbed player embed.
        """
        if not settings.WORDPRESS_REST_USER or not settings.WORDPRESS_APP_PASSWORD:
            logger.warning("WordPress credentials not configured. Embed code generated but not auto-published.")
            return False

        endpoint = f"{settings.WORDPRESS_SITE_URL.rstrip('/')}/wp-json/wp/v2/posts/{post_id}"
        player_html = WordPressBridge.generate_player_html(stream_url, title, telegram_link)

        try:
            # Fetch current post
            resp = requests.get(endpoint, auth=(settings.WORDPRESS_REST_USER, settings.WORDPRESS_APP_PASSWORD))
            if resp.status_code != 200:
                logger.error(f"Failed to fetch WordPress post #{post_id}. HTTP {resp.status_code}")
                return False

            post_data = resp.json()
            current_content = post_data.get("content", {}).get("raw", post_data.get("content", {}).get("rendered", ""))

            # Append player embed to post content
            new_content = current_content + "\n\n" + player_html

            update_resp = requests.post(
                endpoint,
                auth=(settings.WORDPRESS_REST_USER, settings.WORDPRESS_APP_PASSWORD),
                json={"content": new_content}
            )

            if update_resp.status_code == 200:
                logger.info(f"Successfully injected dubbed video player into WordPress post #{post_id} on {settings.WORDPRESS_SITE_URL}")
                return True
            else:
                logger.error(f"WordPress update failed for post #{post_id}. Response: {update_resp.text}")
                return False

        except Exception as e:
            logger.error(f"Error communicating with WordPress REST API: {e}")
            return False
