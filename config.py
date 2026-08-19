"""
EchoDub Bridge - Central Configuration (Iran Server)
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "EchoDub Bridge (Iran Hub)"
    DEBUG: bool = False
    PORT: int = 8080
    
    # Workspace & Cache Paths
    BASE_DIR: Path = Path(__file__).resolve().parent
    CACHE_DIR: Path = BASE_DIR / "cache"
    STATIC_DIR: Path = BASE_DIR / "static"
    
    # US Worker Engine Connection
    US_WORKER_API_URL: str = "http://YOUR_US_SERVER_IP:8000"
    US_WORKER_SECRET_KEY: str = ""
    
    # Telegram Proxy Connection (Stream Tunnel to US Server)
    STREAM_TUNNEL_ENABLED: bool = True
    MAX_CACHE_SIZE_GB: int = 40  # Keep hot videos on 100GB NVMe
    
    # Downloadly / WordPress REST API Settings
    WORDPRESS_SITE_URL: str = "https://downloadly.ir"
    WORDPRESS_REST_USER: str = ""
    WORDPRESS_APP_PASSWORD: str = ""
    
    # Security
    ADMIN_API_KEY: str = "change_me_in_env"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

os.makedirs(settings.CACHE_DIR, exist_ok=True)
os.makedirs(settings.STATIC_DIR, exist_ok=True)
