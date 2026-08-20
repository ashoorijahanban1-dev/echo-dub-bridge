"""
EchoDub Bridge - Main FastAPI Server & Master Command Center (Iran Hub)
Hosts the Video Stream Proxy, Course Unpacker, Autonomous Watcher Agent, and Dashboard APIs.
"""

import os
import shutil
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager
from pydantic import BaseModel
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import aiohttp

from config import settings
from core.stream_proxy import VideoStreamProxy
from core.dispatcher import JobDispatcher
from core.wordpress_bridge import WordPressBridge
from core.course_unpacker import CourseUnpacker
from core.watcher import DownloadlyWatcherAgent, PROCESSED_DB_FILE

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("EchoDub.Bridge")

recent_logs: List[str] = []

class InterceptHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record)
            recent_logs.append(msg)
            if len(recent_logs) > 100:
                recent_logs.pop(0)
        except Exception:
            pass

log_handler = InterceptHandler()
log_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", "%H:%M:%S"))
logging.getLogger("EchoDub").addHandler(log_handler)

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
    description="Domestic Video Stream Proxy, Course Unpacker & Master Command Center",
    version="1.1.0",
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
# Master Monitoring & Control APIs
# ==============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "watcher_enabled": settings.AUTO_WATCHER_ENABLED,
        "cache_dir": str(settings.CACHE_DIR)
    }

@app.get("/api/v1/bridge/system/status", tags=["Dashboard"])
async def get_system_status():
    """
    Returns unified health & telemetry data for both Iran and US servers.
    """
    # Iran Server Disk Telemetry
    total, used, free = shutil.disk_usage(settings.BASE_DIR)
    total_gb = round(total / (1024**3), 1)
    free_gb = round(free / (1024**3), 1)
    used_gb = round(used / (1024**3), 1)
    
    # Processed Courses Count
    processed_count = len(DownloadlyWatcherAgent._load_processed_ids())

    # Check US Worker Connection
    us_online = False
    us_jobs = []
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{settings.US_WORKER_API_URL.rstrip('/')}/health", timeout=aiohttp.ClientTimeout(total=3)) as resp:
                if resp.status == 200:
                    us_online = True
            async with session.get(f"{settings.US_WORKER_API_URL.rstrip('/')}/api/v1/dub/jobs", timeout=aiohttp.ClientTimeout(total=3)) as resp:
                if resp.status == 200:
                    us_jobs = await resp.json()
    except Exception:
        us_online = False

    return {
        "iran_server": {
            "status": "ONLINE",
            "disk": {
                "total_gb": total_gb,
                "used_gb": used_gb,
                "free_gb": free_gb,
                "percent_used": round((used / total) * 100, 1)
            },
            "port": settings.PORT,
            "stream_proxy": "ENABLED"
        },
        "us_server": {
            "status": "ONLINE" if us_online else "OFFLINE",
            "url": settings.US_WORKER_API_URL,
            "jobs_count": len(us_jobs),
            "jobs": us_jobs[-10:] # Last 10 jobs
        },
        "watcher_agent": {
            "enabled": settings.AUTO_WATCHER_ENABLED,
            "interval_seconds": settings.WATCHER_CHECK_INTERVAL_SECONDS,
            "auto_dub": settings.AUTO_DUB_NEW_COURSES,
            "processed_courses_count": processed_count
        },
        "wordpress_integration": {
            "site_url": settings.WORDPRESS_SITE_URL,
            "connected": bool(settings.WORDPRESS_REST_USER and settings.WORDPRESS_APP_PASSWORD)
        }
    }

@app.get("/api/v1/bridge/system/logs", tags=["Dashboard"])
async def get_system_logs():
    return {"logs": recent_logs}

@app.get("/stream/{video_id}", tags=["Streaming"])
async def stream_video(video_id: str, request: Request):
    remote_source = f"{settings.US_WORKER_API_URL.rstrip('/')}/storage/output/{video_id}.mp4"
    return await VideoStreamProxy.get_video_stream(video_id, remote_source, request)

@app.post("/api/v1/bridge/watcher/check-now", tags=["Watcher Agent"])
async def trigger_watcher_check(background_tasks: BackgroundTasks):
    background_tasks.add_task(DownloadlyWatcherAgent.run_watcher_cycle, auto_dub=settings.AUTO_DUB_NEW_COURSES)
    return {"status": "TRIGGERED", "message": "Downloadly Watcher check triggered in background."}

@app.post("/api/v1/bridge/course/process", tags=["Course Pipeline"])
async def process_full_downloadly_course(req: FullCourseRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(CourseUnpacker.process_full_course, req.course_url, req.voice_gender)
    return {
        "status": "QUEUED",
        "message": f"Full course pipeline started for: {req.course_url}. Downloading parts & extracting...",
        "course_url": req.course_url
    }

@app.post("/api/v1/bridge/dispatch", tags=["Dispatch"])
async def dispatch_course_video(req: CourseDispatchRequest):
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

    @app.get("/dashboard", response_class=HTMLResponse, tags=["Dashboard UI"])
    async def serve_dashboard():
        dash_file = static_path / "dashboard.html"
        if dash_file.exists():
            return FileResponse(dash_file)
        return HTMLResponse("<h1>Dashboard under construction</h1>")

    @app.get("/", response_class=HTMLResponse, tags=["Studio"])
    async def serve_studio_home():
        index_file = static_path / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return HTMLResponse("<h1>EchoDub Bridge is Running!</h1>")
