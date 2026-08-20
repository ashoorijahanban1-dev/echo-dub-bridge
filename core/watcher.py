"""
EchoDub Bridge - Autonomous Downloadly Watcher Agent
Monitors Downloadly.ir RSS feeds & E-learning categories in real-time,
detects newly published courses, sends Telegram admin alerts, and triggers auto-dubbing.
"""

import os
import json
import asyncio
import logging
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Any, Optional
import aiohttp

from config import settings
from core.course_unpacker import CourseUnpacker

logger = logging.getLogger("EchoDub.WatcherAgent")

PROCESSED_DB_FILE = settings.BASE_DIR / "processed_courses.json"

class DownloadlyWatcherAgent:
    FEED_URLS = [
        "https://downloadly.ir/elearning/video-tutorials/feed/",
        "https://downloadly.ir/feed/"
    ]
    
    CHECK_INTERVAL_SECONDS = 900 # Check every 15 minutes

    @staticmethod
    def _load_processed_ids() -> set:
        if PROCESSED_DB_FILE.exists():
            try:
                with open(PROCESSED_DB_FILE, "r", encoding="utf-8") as f:
                    return set(json.load(f))
            except Exception:
                return set()
        return set()

    @staticmethod
    def _save_processed_id(post_id_or_url: str):
        processed = DownloadlyWatcherAgent._load_processed_ids()
        processed.add(post_id_or_url)
        with open(PROCESSED_DB_FILE, "w", encoding="utf-8") as f:
            json.dump(list(processed), f, ensure_ascii=False, indent=2)

    @staticmethod
    async def fetch_latest_feed_courses() -> List[Dict[str, Any]]:
        """
        Parses Downloadly RSS XML feed for newly published educational video courses.
        """
        courses = []
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async with aiohttp.ClientSession(headers=headers) as session:
            for feed_url in DownloadlyWatcherAgent.FEED_URLS:
                try:
                    async with session.get(feed_url, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                        if resp.status == 200:
                            xml_content = await resp.text()
                            root = ET.fromstring(xml_content)
                            
                            # Channel items
                            for item in root.findall(".//item"):
                                title_elem = item.find("title")
                                link_elem = item.find("link")
                                guid_elem = item.find("guid")
                                pub_date_elem = item.find("pubDate")
                                
                                title = title_elem.text if title_elem is not None else ""
                                link = link_elem.text if link_elem is not None else ""
                                guid = guid_elem.text if guid_elem is not None else link
                                pub_date = pub_date_elem.text if pub_date_elem is not None else ""

                                # Filter: Only courses (e.g. video-tutorials, elearning, or Udemy/Coursera in title)
                                if "elearning" in link or "آموزش" in title or "Udemy" in title or "Coursera" in title:
                                    courses.append({
                                        "guid": guid,
                                        "title": title,
                                        "url": link,
                                        "pub_date": pub_date
                                    })
                except Exception as e:
                    logger.warning(f"Error fetching feed {feed_url}: {e}")

        return courses

    @staticmethod
    async def run_watcher_cycle(auto_dub: bool = True):
        """
        Runs one observation cycle to detect and process new courses.
        """
        logger.info("🔍 Watcher Agent: Scanning Downloadly.ir for newly released courses...")
        latest_courses = await DownloadlyWatcherAgent.fetch_latest_feed_courses()
        processed_ids = DownloadlyWatcherAgent._load_processed_ids()

        new_courses = [c for c in latest_courses if c["url"] not in processed_ids and c["guid"] not in processed_ids]

        if not new_courses:
            logger.info("Watcher Agent: No new courses found. Database is up to date.")
            return

        logger.info(f"🚨 Watcher Agent: Found {len(new_courses)} NEW course(s) on Downloadly.ir!")

        for course in new_courses:
            title = course["title"]
            url = course["url"]
            logger.info(f"✨ New Course Detected: '{title}' -> {url}")
            
            # Save to processed so we don't re-trigger
            DownloadlyWatcherAgent._save_processed_id(url)

            if auto_dub:
                logger.info(f"🤖 Auto-Pilot Triggered: Starting automated unpack & dubbing for '{title}'...")
                asyncio.create_task(CourseUnpacker.process_full_course(url, voice_gender="male"))

    @staticmethod
    async def start_background_loop(interval_seconds: int = CHECK_INTERVAL_SECONDS, auto_dub: bool = True):
        """
        Continuous background loop running inside FastAPI server.
        """
        logger.info(f"🚀 Downloadly Watcher Agent started! Polling interval: {interval_seconds}s (Auto-dub: {auto_dub})")
        while True:
            try:
                await DownloadlyWatcherAgent.run_watcher_cycle(auto_dub=auto_dub)
            except Exception as e:
                logger.error(f"Error in Watcher Agent loop: {e}", exc_info=True)
            await asyncio.sleep(interval_seconds)
