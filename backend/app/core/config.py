from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "SNS Uploader"
    API_V1_STR: str = "/api/v1"
    
    # Environment & URLs
    SERVER_BASE_URL: str = os.getenv("SERVER_BASE_URL", "https://tosns.greenbee.cloud")
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "https://tosns.greenbee.cloud")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-at-all-costs")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Encryption key for OAuth tokens
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "your-32-byte-base64-encoded-key-here")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://tosns_user:gbTosns2024!@tosns-db:5432/tosns"
    )
    
    # OAuth Configurations
    YOUTUBE_CLIENT_ID: str = os.getenv("YOUTUBE_CLIENT_ID", "")
    YOUTUBE_CLIENT_SECRET: str = os.getenv("YOUTUBE_CLIENT_SECRET", "")
    
    # Redirect URIs - Generated based on SERVER_BASE_URL if not explicitly set in env
    @property
    def YOUTUBE_REDIRECT_URI(self) -> str:
        return os.getenv("YOUTUBE_REDIRECT_URI", f"{self.SERVER_BASE_URL}{self.API_V1_STR}/oauth/youtube/callback")
    
    X_CLIENT_ID: str = os.getenv("X_CLIENT_ID", "")
    X_CLIENT_SECRET: str = os.getenv("X_CLIENT_SECRET", "")
    
    @property
    def X_REDIRECT_URI(self) -> str:
        return os.getenv("X_REDIRECT_URI", f"{self.SERVER_BASE_URL}{self.API_V1_STR}/oauth/x/callback")
    
    # TikTok OAuth
    TIKTOK_CLIENT_KEY: str = os.getenv("TIKTOK_CLIENT_KEY", "")
    TIKTOK_CLIENT_SECRET: str = os.getenv("TIKTOK_CLIENT_SECRET", "")
    TIKTOK_SCOPES: str = "user.info.basic,video.upload,video.publish"
    
    @property
    def TIKTOK_REDIRECT_URI(self) -> str:
        return os.getenv("TIKTOK_REDIRECT_URI", f"{self.SERVER_BASE_URL}{self.API_V1_STR}/oauth/tiktok/callback")
    
    # Instagram (Meta) OAuth
    INSTA_CLIENT_ID: str = os.getenv("INSTA_CLIENT_ID", "")
    INSTA_CLIENT_SECRET: str = os.getenv("INSTA_CLIENT_SECRET", "")
    
    @property
    def INSTA_REDIRECT_URI(self) -> str:
        return os.getenv("INSTA_REDIRECT_URI", f"{self.SERVER_BASE_URL}{self.API_V1_STR}/oauth/insta/callback")
    
    # Telegram
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    
    # Google Gemini
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
