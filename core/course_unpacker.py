"""
EchoDub Bridge - Automated Downloadly Course Scraper & Multi-Part RAR Unpacker
Scrapes course pages, downloads multi-part RAR archives, extracts with password 'www.downloadly.ir',
and orders all MP4 lesson videos for sequential AI dubbing.
"""

import os
import re
import shutil
import asyncio
import logging
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional
import aiohttp
import aiofiles

from config import settings
from core.dispatcher import JobDispatcher

logger = logging.getLogger("EchoDub.CourseUnpacker")

DEFAULT_DOWNLOADLY_PASSWORD = "www.downloadly.ir"

class CourseUnpacker:
    @staticmethod
    async def scrape_course_links(course_url: str) -> Dict[str, Any]:
        """
        Scrapes a Downloadly course post HTML to extract title, post_id, and all RAR part download URLs.
        """
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(course_url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                if resp.status != 200:
                    raise Exception(f"Failed to fetch course page. HTTP {resp.status}")
                
                html = await resp.text()

        # Extract Title
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL | re.IGNORECASE)
        title = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else "Downloadly Course"
        title = title.replace("دانلود", "").replace("&#8211;", "-").strip()

        # Extract Post ID
        post_id_match = re.search(r'GLOBAL_CURRENT_ID\s*=\s*[\'"](\d+)[\'"]', html) or re.search(r'data-postid=[\'"](\d+)[\'"]', html)
        post_id = int(post_id_match.group(1)) if post_id_match else None

        # Extract RAR Download Links
        rar_links = []
        for match in re.finditer(r'<a[^>]+href=[\'"]([^\'"]+\.(?:rar|zip|7z)(?:\?[^\'"]*)?)[\'"][^>]*>(.*?)</a>', html, re.IGNORECASE):
            link_url = match.group(1)
            link_text = re.sub(r'<[^>]+>', '', match.group(2)).strip()
            rar_links.append({"url": link_url, "title": link_text})

        # Remove duplicates while preserving order
        seen = set()
        unique_links = []
        for item in rar_links:
            if item["url"] not in seen:
                seen.add(item["url"])
                unique_links.append(item)

        logger.info(f"Scraped course: '{title}' (Post ID: {post_id}) with {len(unique_links)} part links.")
        return {
            "title": title,
            "post_id": post_id,
            "parts": unique_links,
            "parts_count": len(unique_links)
        }

    @staticmethod
    async def download_part(url: str, output_path: Path) -> bool:
        """
        Downloads a single RAR part file using high-speed domestic connection.
        """
        logger.info(f"Downloading part: {url} -> {output_path.name}")
        timeout = aiohttp.ClientTimeout(total=3600)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    logger.error(f"Download failed for {url}. HTTP {resp.status}")
                    return False
                
                async with aiofiles.open(output_path, "wb") as f:
                    while chunk := await resp.content.read(1024 * 1024):
                        await f.write(chunk)
                        
        logger.info(f"Downloaded: {output_path.name} ({output_path.stat().st_size / (1024*1024):.1f} MB)")
        return True

    @staticmethod
    def extract_archives(archive_dir: Path, output_dir: Path, password: str = DEFAULT_DOWNLOADLY_PASSWORD) -> bool:
        """
        Extracts multi-part RAR archives using 7z or unrar with password.
        """
        os.makedirs(output_dir, exist_ok=True)
        
        # Find first part or all rar files
        part1_files = list(archive_dir.glob("*.part01.rar")) or list(archive_dir.glob("*.part1.rar")) or list(archive_dir.glob("*.rar"))
        if not part1_files:
            logger.error("No RAR files found to extract.")
            return False

        first_part = part1_files[0]
        logger.info(f"Extracting archive volume: {first_part.name} with password '{password}'...")

        cmd = [
            "7z", "x",
            f"-p{password}",
            "-y",
            str(first_part),
            f"-o{output_dir}"
        ]

        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0:
                logger.info(f"Archive extracted successfully into {output_dir}")
                return True
            else:
                # Fallback to unrar if 7z failed
                unrar_cmd = ["unrar", "x", f"-p{password}", "-y", str(first_part), str(output_dir)]
                unrar_res = subprocess.run(unrar_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                return unrar_res.returncode == 0
        except Exception as e:
            logger.error(f"Extraction error: {e}")
            return False

    @staticmethod
    def discover_video_lessons(extracted_dir: Path) -> List[Path]:
        """
        Recursively finds all MP4 and MKV video lessons and sorts them naturally.
        """
        video_extensions = {".mp4", ".mkv", ".webm", ".mov", ".avi"}
        videos = [
            p for p in extracted_dir.rglob("*")
            if p.suffix.lower() in video_extensions and not p.name.startswith("._")
        ]

        def natural_sort_key(p: Path):
            # Extract numbers inside filename for natural sorting: 1, 2, 10 instead of 1, 10, 2
            return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(p))]

        videos.sort(key=natural_sort_key)
        logger.info(f"Discovered {len(videos)} video lessons in course directory.")
        return videos

    @staticmethod
    async def process_full_course(course_url: str, voice_gender: str = "male") -> Dict[str, Any]:
        """
        Full End-to-End Orchestrator:
        1. Scrapes course page
        2. Downloads all RAR parts
        3. Extracts videos with password
        4. Submits each lesson sequentially to US AI Dubbing Engine
        5. Automatically publishes all lessons to Downloadly WordPress
        """
        course_data = await CourseUnpacker.scrape_course_links(course_url)
        title = course_data["title"]
        post_id = course_data["post_id"]
        parts = course_data["parts"]

        if not parts:
            return {"success": False, "error": "No download parts found on course page."}

        work_dir = settings.BASE_DIR / "temp_courses" / f"course_{int(asyncio.get_event_loop().time())}"
        archive_dir = work_dir / "archives"
        extracted_dir = work_dir / "extracted"
        os.makedirs(archive_dir, exist_ok=True)
        os.makedirs(extracted_dir, exist_ok=True)

        try:
            # 1. Download all parts
            for part in parts:
                url = part["url"]
                filename = url.split("?")[0].split("/")[-1]
                part_path = archive_dir / filename
                await CourseUnpacker.download_part(url, part_path)

            # 2. Extract Archives
            extracted = CourseUnpacker.extract_archives(archive_dir, extracted_dir)
            if not extracted:
                return {"success": False, "error": "Failed to extract course RAR archives"}

            # 3. Clean up RAR archive files to free disk space
            shutil.rmtree(archive_dir, ignore_errors=True)

            # 4. Discover video lessons
            lessons = CourseUnpacker.discover_video_lessons(extracted_dir)
            if not lessons:
                return {"success": False, "error": "No MP4 video files found inside extracted course."}

            # 5. Dispatch each lesson to US Worker
            dispatched_jobs = []
            for idx, lesson_path in enumerate(lessons, start=1):
                lesson_title = f"{title} - بخش {idx}: {lesson_path.stem.replace('_', ' ').replace('-', ' ').title()}"
                logger.info(f"Dispatching lesson {idx}/{len(lessons)}: {lesson_title}")

                job_result = await JobDispatcher.fetch_from_iran_and_dispatch(
                    video_url=f"file://{lesson_path}",
                    title=lesson_title,
                    voice_gender=voice_gender,
                    post_id=post_id
                )
                dispatched_jobs.append(job_result)

            # Clean up extracted directory
            shutil.rmtree(work_dir, ignore_errors=True)

            return {
                "success": True,
                "course_title": title,
                "post_id": post_id,
                "total_lessons": len(lessons),
                "jobs": dispatched_jobs
            }

        except Exception as e:
            logger.error(f"Course processing failed: {e}", exc_info=True)
            shutil.rmtree(work_dir, ignore_errors=True)
            return {"success": False, "error": str(e)}
