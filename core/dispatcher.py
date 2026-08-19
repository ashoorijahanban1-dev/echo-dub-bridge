"""
EchoDub Bridge - Job Dispatcher & Queue Manager
Sends jobs to US Worker API and coordinates final website updates upon completion.
"""

import aiohttp
import asyncio
import logging
from typing import Dict, Any, Optional

from config import settings
from core.wordpress_bridge import WordPressBridge

logger = logging.getLogger("EchoDub.Dispatcher")

class JobDispatcher:
    @staticmethod
    async def dispatch_video_to_us_worker(
        video_url: str,
        title: str,
        voice_gender: str = "male",
        post_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Sends video URL to US Worker FastAPI endpoint for AI processing.
        """
        endpoint = f"{settings.US_WORKER_API_URL.rstrip('/')}/api/v1/dub/submit"
        payload = {
            "video_url": video_url,
            "title": title,
            "voice_gender": voice_gender,
            "preserve_bgm": True
        }

        logger.info(f"Dispatching video to US worker: {endpoint} -> {title}")

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(endpoint, json=payload, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                    if resp.status != 200:
                        err_text = await resp.text()
                        logger.error(f"Failed to submit job to US worker. HTTP {resp.status}: {err_text}")
                        return {"success": False, "error": f"US Worker error: {resp.status}"}
                    
                    data = await resp.json()
                    job_id = data.get("job_id")
                    logger.info(f"Job successfully queued on US Worker. Job ID: {job_id}")

                    # If post_id provided, start background polling task to update WordPress on completion
                    if post_id and job_id:
                        asyncio.create_task(JobDispatcher.poll_and_update_wordpress(job_id, post_id, title))

                    return {"success": True, "job_id": job_id, "data": data}

            except Exception as e:
                logger.error(f"Connection error to US Worker: {e}")
                return {"success": False, "error": str(e)}

    @staticmethod
    async def poll_and_update_wordpress(job_id: str, post_id: int, title: str):
        """
        Polls US worker until dubbing completes, then automatically injects player into WordPress post.
        """
        status_endpoint = f"{settings.US_WORKER_API_URL.rstrip('/')}/api/v1/dub/status/{job_id}"
        logger.info(f"Started polling US worker for Job [{job_id}]...")

        for _ in range(120): # Poll up to 60 minutes (every 30s)
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
                                
                                # Generate stream proxy URL on Iran server
                                iran_stream_url = f"http://YOUR_IRAN_SERVER_IP:{settings.PORT}/stream/{job_id}"
                                
                                # Update WordPress post
                                WordPressBridge.update_post(
                                    post_id=post_id,
                                    stream_url=iran_stream_url,
                                    title=title,
                                    telegram_link=telegram_link
                                )
                                logger.info(f"Job [{job_id}] successfully completed and published to Downloadly post #{post_id}!")
                                break

                            elif status == "FAILED":
                                logger.error(f"Job [{job_id}] failed on US worker: {data.get('error')}")
                                break
            except Exception as e:
                logger.warning(f"Polling error for job {job_id}: {e}")
