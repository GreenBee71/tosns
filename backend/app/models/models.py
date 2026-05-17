from sqlalchemy import Column, Integer, String, DateTime, Enum, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAIL = "fail"
    DELETED = "deleted"

class Platform(str, enum.Enum):
    YOUTUBE = "youtube"
    YOUTUBE_SHORTS = "youtube_shorts"
    X = "x"
    INSTA = "insta"
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    PINTEREST = "pinterest"
    SNAPCHAT = "snapchat"
    VIMEO = "vimeo"
    REDDIT = "reddit"
    THREADS = "threads"
    BLUESKY = "bluesky"
    MASTODON = "mastodon"
    NAVER_BLOG = "naver_blog"
    NAVER_CAFE = "naver_cafe"
    NAVER_TV = "naver_tv"
    TISTORY = "tistory"
    CHZZK = "chzzk"
    SOOP = "soop"
    AFREECATV = "afreecatv"
    KAKAO_TV = "kakao_tv"
    TWITCH = "twitch"
    DAILYMOTION = "dailymotion"
    RUMBLE = "rumble"
    BRUNCH = "brunch"
    VELOG = "velog"
    POSTYPE = "postype"
    KAKAOSTORY = "kakaostory"
    MEDIUM = "medium"
    SUBSTACK = "substack"
    WORDPRESS = "wordpress"
    TUMBLR = "tumblr"
    TELEGRAM = "telegram"
    DISCORD = "discord"
    SLACK = "slack"
    KAKAO_CH = "kakao_ch"
    LINE = "line"
    BEHANCE = "behance"
    DRIBBBLE = "dribbble"
    FLICKR = "flickr"

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(Enum(Platform), nullable=False)
    account_name = Column(String, nullable=False)
    encrypted_token = Column(String, nullable=False)  # Encrypted JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    jobs = relationship("UploadJob", back_populates="account")

class UploadJob(Base):
    __tablename__ = "upload_jobs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    platform = Column(Enum(Platform), nullable=False)
    title = Column(String)
    description = Column(String)
    tags = Column(String)  # Comma separated
    file_path = Column(String, nullable=False)
    scheduled_at = Column(DateTime)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    error_log = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("Account", back_populates="jobs")

class MediaProject(Base):
    __tablename__ = "media_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assets = relationship("MediaAsset", back_populates="project", cascade="all, delete-orphan")

class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("media_projects.id"), nullable=True)
    asset_type = Column(String)  # image, video, voice
    file_path = Column(String, nullable=False)
    prompt = Column(String)
    metadata_json = Column(JSON)  # For subtitles, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("MediaProject", back_populates="assets")

class MediaSchedule(Base):
    __tablename__ = "media_schedules"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("media_assets.id"), nullable=False)
    platform = Column(Enum(Platform), nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # pending, published, failed
    caption = Column(String)
    tags = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("MediaAsset")

class MediaInsight(Base):
    __tablename__ = "media_insights"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("media_assets.id"), nullable=False)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    sentiment_score = Column(JSON)  # { "positive": 0.8, "negative": 0.1, "neutral": 0.1 }
    insight_report = Column(String) # AI generated insight summary
    captured_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("MediaAsset")
