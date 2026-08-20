"""
EchoDub Bridge - Main FastAPI Server (Iran Hub)
Hosts the Video Stream Proxy, Downloadly Course Unpacker, Autonomous Watcher Agent, and WordPress API.
"""

import os
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from core.stream_proxy import VideoStreamProxy
from core.dispatcher import JobDispatcher
from core.wordpress_bridge import WordPressBridge
from core.course_unpacker import CourseUnpacker
from core.watcher import DownloadlyWatcherAgent

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("EchoDub.Bridge")

# Lifespan manager for FastAPI (starts background watcher agent)
@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.AUTO_WATCHER_ENABLED:
        logger.info("Starting Downloadly Watcher Agent in background...")
        asyncio.create_task(DownloadlyWatcherAgent.start_background_loop(
            interval_seconds=settings.WATCHER_CHECK_INTERVAL_SECONDS,
            auto_dub=settings.AUTO_DUB_NEW_COURSES
        ))
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Domestic Video Stream Proxy, Course Unpacker & Autonomous Watcher Gateway",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CourseDispatchRequest(BaseModel):
    video_url: str
    title: str
    voice_gender: Optional[str] = "male"
    wordpress_post_id: Optional[int] = None

class FullCourseRequest(BaseModel):
    course_url: str
    voice_gender: Optional[str] = "male"

class ManualEmbedRequest(BaseModel):
    post_id: int
    video_id: str
    title: str
    telegram_link: Optional[str] = None

# ==============================================================================
# Endpoints
# ==============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "watcher_enabled": settings.AUTO_WATCHER_ENABLED,
        "cache_dir": str(settings.CACHE_DIR)
    }

@app.get("/stream/{video_id}", tags=["Streaming"])
async def stream_video(video_id: str, request: Request):
    """
    High-Speed Domestic Video Streaming without VPN (HTTP 206 Range support).
    """
    remote_source = f"{settings.US_WORKER_API_URL.rstrip('/')}/storage/output/{video_id}.mp4"
    return await VideoStreamProxy.get_video_stream(video_id, remote_source, request)

@app.post("/api/v1/bridge/watcher/check-now", tags=["Watcher Agent"])
async def trigger_watcher_check(background_tasks: BackgroundTasks):
    """
    Forces an immediate check for new courses on Downloadly.ir without waiting for the 15-minute timer.
    """
    background_tasks.add_task(DownloadlyWatcherAgent.run_watcher_cycle, auto_dub=settings.AUTO_DUB_NEW_COURSES)
    return {"status": "TRIGGERED", "message": "Downloadly Watcher check triggered in background."}

@app.post("/api/v1/bridge/course/process", tags=["Course Pipeline"])
async def process_full_downloadly_course(req: FullCourseRequest, background_tasks: BackgroundTasks):
    """
    Takes a Downloadly course URL, downloads all multi-part RAR archives,
    extracts them with password, and dubs every lesson video sequentially!
    """
    background_tasks.add_task(CourseUnpacker.process_full_course, req.course_url, req.voice_gender)
    return {
        "status": "QUEUED",
        "message": f"Full course pipeline started for: {req.course_url}. Downloading parts & extracting...",
        "course_url": req.course_url
    }

@app.post("/api/v1/bridge/dispatch", tags=["Dispatch"])
async def dispatch_course_video(req: CourseDispatchRequest):
    """
    1. Downloads video from Downloadly.ir with Iranian IP (bypassing foreign Geo-IP blocking).
    2. Sends the video to US Worker for AI dubbing.
    3. Updates WordPress post upon completion.
    """
    result = await JobDispatcher.fetch_from_iran_and_dispatch(
        video_url=req.video_url,
        title=req.title,
        voice_gender=req.voice_gender,
        post_id=req.wordpress_post_id
    )
    return result

@app.post("/api/v1/bridge/embed-manual", tags=["WordPress"])
async def manual_embed_post(req: ManualEmbedRequest, request: Request):
    base_host = request.base_url
    stream_url = f"{str(base_host).rstrip('/')}/stream/{req.video_id}"
    
    success = WordPressBridge.update_post(
        post_id=req.post_id,
        stream_url=stream_url,
        title=req.title,
        telegram_link=req.telegram_link
    )
    
    return {
        "success": success,
        "stream_url": stream_url,
        "post_id": req.post_id
    }

static_path = Path(__file__).resolve().parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

    @app.get("/", response_class=HTMLResponse, tags=["Studio"])
    async def serve_studio_home():
        index_file = static_path / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return HTMLResponse("<h1>EchoDub Bridge is Running!</h1>")
