"""
EchoDub Bridge - Main FastAPI Server (Iran Hub)
Hosts the Video Stream Proxy, WordPress Integration API, and Frontend Studio.
"""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from core.stream_proxy import VideoStreamProxy
from core.dispatcher import JobDispatcher
from core.wordpress_bridge import WordPressBridge

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("EchoDub.Bridge")

app = FastAPI(
    title=settings.APP_NAME,
    description="Domestic Video Stream Proxy & Downloadly.ir Integration Gateway",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class CourseDispatchRequest(BaseModel):
    video_url: str
    title: str
    voice_gender: Optional[str] = "male"
    wordpress_post_id: Optional[int] = None

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
    """Health check for Coolify."""
    return {"status": "ok", "app": settings.APP_NAME, "cache_dir": str(settings.CACHE_DIR)}

@app.get("/stream/{video_id}", tags=["Streaming"])
async def stream_video(video_id: str, request: Request):
    """
    High-Speed Domestic Video Streaming with HTTP Range (206 Partial Content) support.
    Streams directly to Iranian browsers without needing a VPN!
    """
    # Connects to US Worker stream endpoint or serves from local NVMe cache
    remote_source = f"{settings.US_WORKER_API_URL.rstrip('/')}/storage/output/{video_id}.mp4"
    return await VideoStreamProxy.get_video_stream(video_id, remote_source, request)

@app.post("/api/v1/bridge/dispatch", tags=["Dispatch"])
async def dispatch_course_video(req: CourseDispatchRequest):
    """
    Sends an educational video to the US Worker for AI dubbing and schedules automatic publishing.
    """
    result = await JobDispatcher.dispatch_video_to_us_worker(
        video_url=req.video_url,
        title=req.title,
        voice_gender=req.voice_gender,
        post_id=req.wordpress_post_id
    )
    return result

@app.post("/api/v1/bridge/embed-manual", tags=["WordPress"])
async def manual_embed_post(req: ManualEmbedRequest, request: Request):
    """
    Manually generates and injects the dubbed video player into a Downloadly.ir post.
    """
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

# Mount static files (Frontend Studio) if directory exists
static_path = Path(__file__).resolve().parent / "static"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

    @app.get("/", response_class=HTMLResponse, tags=["Studio"])
    async def serve_studio_home():
        index_file = static_path / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return HTMLResponse("<h1>EchoDub Bridge is Running!</h1>")
