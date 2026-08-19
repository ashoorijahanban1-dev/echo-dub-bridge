"""
EchoDub Bridge - High-Speed Domestic Video Stream Proxy
Streams video content to Iranian users with HTTP Range support (206 Partial Content) without VPN.
"""

import os
import aiohttp
import aiofiles
import logging
from pathlib import Path
from typing import Optional, AsyncGenerator
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse

from config import settings

logger = logging.getLogger("EchoDub.StreamProxy")

class VideoStreamProxy:
    @staticmethod
    async def get_video_stream(
        video_id: str,
        source_url: str,
        request: Request
    ) -> StreamingResponse:
        """
        Handles video streaming with HTTP Range requests (seeking/scrubbing support)
        serving either from domestic NVMe cache or tunneling from the US Worker.
        """
        cached_file = settings.CACHE_DIR / f"{video_id}.mp4"
        
        # Check if video is already cached locally on Iran NVMe SSD
        if cached_file.exists():
            logger.info(f"Serving video from local Iran NVMe cache: {cached_file.name}")
            return VideoStreamProxy._stream_local_file(cached_file, request)

        # Otherwise tunnel stream from US server / CDN and cache concurrently
        logger.info(f"Tunneling stream from US worker for video: {video_id}")
        return await VideoStreamProxy._stream_remote_file(source_url, cached_file, request)

    @staticmethod
    def _stream_local_file(file_path: Path, request: Request) -> StreamingResponse:
        file_size = file_path.stat().st_size
        range_header = request.headers.get("range")

        start = 0
        end = file_size - 1

        if range_header:
            range_data = range_header.replace("bytes=", "").split("-")
            start = int(range_data[0]) if range_data[0] else 0
            end = int(range_data[1]) if len(range_data) > 1 and range_data[1] else file_size - 1

        chunk_size = end - start + 1

        async def file_generator():
            async with aiofiles.open(file_path, "rb") as f:
                await f.seek(start)
                bytes_left = chunk_size
                while bytes_left > 0:
                    read_bytes = min(bytes_left, 1024 * 1024) # 1MB chunk
                    data = await f.read(read_bytes)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": "video/mp4",
        }

        status_code = 206 if range_header else 200
        return StreamingResponse(file_generator(), status_code=status_code, headers=headers)

    @staticmethod
    async def _stream_remote_file(remote_url: str, cache_path: Path, request: Request) -> StreamingResponse:
        range_header = request.headers.get("range", "bytes=0-")
        headers = {"Range": range_header}

        client_session = aiohttp.ClientSession()
        resp = await client_session.get(remote_url, headers=headers)

        if resp.status not in (200, 206):
            await client_session.close()
            raise HTTPException(status_code=resp.status, detail="Remote video stream unavailable")

        async def stream_and_cache():
            try:
                async with resp:
                    async for chunk in resp.content.iter_chunked(1024 * 1024):
                        yield chunk
            finally:
                await client_session.close()

        response_headers = {
            "Content-Range": resp.headers.get("Content-Range", ""),
            "Accept-Ranges": "bytes",
            "Content-Length": resp.headers.get("Content-Length", ""),
            "Content-Type": "video/mp4",
        }

        return StreamingResponse(stream_and_cache(), status_code=resp.status, headers=response_headers)
