"""
EchoDub Bridge - Smart Domestic Fetcher & US Dispatcher
Downloads video from Downloadly.ir using Iranian IP (bypassing Geo-IP block),
then transfers the video directly to the US Worker for AI dubbing.
"""

import os
import aiohttp
import aiofiles
import asyncio
import logging
from pathlib import Path
from typing import Dict, Any, Optional

from config import settings
from core.wordpress_bridge import WordPressBridge

logger = logging.getLogger("EchoDub.Dispatcher")

class JobDispatcher:
    @staticmethod
    async def fetch_from_iran_and_dispatch(
        video_url: str,
        title: str,
        voice_gender: str = "male",
        post_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        1. Downloads video from Downloadly.ir using domestic Iran network (Geo-IP permitted).
        2. Uploads the video file directly to US Worker /api/v1/dub/upload.
        3. Deletes temporary downloaded file on Iran server to preserve disk space.
        4. Coordinates automatic WordPress publishing.
        """
        temp_download_dir = settings.BASE_DIR / "temp_downloads"
        os.makedirs(temp_download_dir, exist_ok=True)
        
        raw_name = video_url.split("?")[0].split("/")[-1]
        filename = raw_name if raw_name.endswith(('.mp4', '.mkv', '.webm', '.mov')) else f"course_{int(asyncio.get_event_loop().time())}.mp4"
        local_video_path = temp_download_dir / filename

        logger.info(f"Downloading from Downloadly.ir with domestic Iran IP: {video_url}")

        # Step 1: Download from downloadly.ir
        timeout = aiohttp.ClientTimeout(total=1800)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(video_url) as resp:
                if resp.status != 200:
                    logger.error(f"Download from Downloadly.ir failed. HTTP {resp.status}")
                    return {"success": False, "error": f"Downloadly HTTP error: {resp.status}"}
                
                async with aiofiles.open(local_video_path, "wb") as f:
                    while chunk := await resp.content.read(1024 * 1024):
                        await f.write(chunk)

        logger.info(f"Download complete ({local_video_path.stat().st_size / (1024*1024):.2f} MB). Transferring to US Worker...")

        # Step 2: Upload to US Worker endpoint /api/v1/dub/upload
        us_upload_endpoint = f"{settings.US_WORKER_API_URL.rstrip('/')}/api/v1/dub/upload"
        
        try:
            async with aiohttp.ClientSession() as session:
                data = aiohttp.FormData()
                data.add_field('title', title)
                data.add_field('voice_gender', voice_gender)
                data.add_field('preserve_bgm', 'true')
                
                # Open and stream file
                f = open(local_video_path, 'rb')
                data.add_field('file', f, filename=filename, content_type='video/mp4')

                async with session.post(us_upload_endpoint, data=data, timeout=aiohttp.ClientTimeout(total=1800)) as upload_resp:
                    f.close()
                    
                    if upload_resp.status != 200:
                        err_text = await upload_resp.text()
                        logger.error(f"Transfer to US Worker failed. HTTP {upload_resp.status}: {err_text}")
                        return {"success": False, "error": f"US Worker transfer failed: {upload_resp.status}"}

                    resp_data = await upload_resp.json()
                    job_id = resp_data.get("job_id")
                    logger.info(f"Video transferred to US Worker! Job ID: {job_id}")

                    # Step 3: Remove temporary file on Iran server
                    try:
                        os.remove(local_video_path)
                    except Exception:
                        pass

                    # Step 4: Schedule background polling & WordPress updater
                    if post_id and job_id:
                        asyncio.create_task(JobDispatcher.poll_and_update_wordpress(job_id, post_id, title))

                    return {"success": True, "job_id": job_id, "data": resp_data}

        except Exception as e:
            logger.error(f"Error transferring video to US Worker: {e}")
            if local_video_path.exists():
                os.remove(local_video_path)
            return {"success": False, "error": str(e)}

    @staticmethod
    async def poll_and_update_wordpress(job_id: str, post_id: int, title: str):
        status_endpoint = f"{settings.US_WORKER_API_URL.rstrip('/')}/api/v1/dub/status/{job_id}"
        logger.info(f"Started polling US worker for Job [{job_id}]...")

        for _ in range(120):
            await asyncio.sleep(30)
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(status_endpoint) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            status = data.get("status")
                            logger.info(f"Job [{job_id}] Status: {status} ({data.get('progress')}%)")

                            if status == "COMPLETED":
                                result = data.get("result", {})
                                telegram_link = result.get("telegram", {}).get("telegram_link")
                                
                                iran_stream_url = f"http://YOUR_IRAN_SERVER_IP:{settings.PORT}/stream/{job_id}"
                                
                                WordPressBridge.update_post(
                                    post_id=post_id,
                                    stream_url=iran_stream_url,
                                    title=title,
                                    telegram_link=telegram_link
                                )
                                logger.info(f"Job [{job_id}] published to Downloadly post #{post_id}!")
                                break

                            elif status == "FAILED":
                                logger.error(f"Job [{job_id}] failed on US worker: {data.get('error')}")
                                break
            except Exception as e:
                logger.warning(f"Polling error for job {job_id}: {e}")
