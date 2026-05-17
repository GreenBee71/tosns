from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.models import UploadJob, JobStatus, Account, Platform
from app.services.connectors.tiktok import TikTokConnector
from app.services.connectors.youtube import YouTubeConnector
from app.services.connectors.insta import InstaConnector
from app.services.connectors.telegram import TelegramConnector
from app.services.connectors.discord import DiscordConnector
from app.services.connectors.slack import SlackConnector
from app.services.connectors.pinterest import PinterestConnector
from app.services.connectors.linkedin import LinkedInConnector
import asyncio
from datetime import datetime
import json

jobstores = {
    'default': SQLAlchemyJobStore(url=settings.DATABASE_URL)
}

scheduler = AsyncIOScheduler(jobstores=jobstores)

async def upload_worker(job_id: int):
    print(f"[{datetime.now()}] Executing upload job {job_id}")
    
    async with AsyncSessionLocal() as db:
        # 1. Fetch job from DB
        result = await db.execute(select(UploadJob).where(UploadJob.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            print(f"Job {job_id} not found")
            return
            
        if job.status != JobStatus.PENDING and job.status != JobStatus.FAIL:
            print(f"Job {job_id} is not PENDING or FAIL. Current status: {job.status}")
            return
            
        print(f"Processing job {job_id} for platform {job.platform}")
        
        # Mark as processing
        job.status = JobStatus.RUNNING
        await db.commit()
        
        try:
            # 2. Get account and token
            search_platform = job.platform
            account_result = await db.execute(
                select(Account).where(Account.platform == search_platform)
            )
            account = account_result.scalar_one_or_none()
            
            # Fallback for Shorts to reuse YouTube account
            if not account and job.platform == Platform.YOUTUBE_SHORTS:
                account_result = await db.execute(
                    select(Account).where(Account.platform == Platform.YOUTUBE)
                )
                account = account_result.scalar_one_or_none()
            
            if not account:
                raise Exception(f"No account found in DB for platform {job.platform}")

            # Parse token data (JSON stored in encrypted_token field for MVP)
            try:
                token_data = json.loads(account.encrypted_token)
            except json.JSONDecodeError:
                # Fallback if it was stored as a plain string
                token_data = {"access_token": account.encrypted_token}
            
            # 3. Call appropriate connector
            result_data = None
            tags_list = [t.strip() for t in job.tags.split(',')] if job.tags else []

            if job.platform == Platform.TIKTOK:
                connector = TikTokConnector()
                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=job.description or "",
                    tags=tags_list,
                    token_data=token_data
                )
            elif job.platform in [Platform.YOUTUBE, Platform.YOUTUBE_SHORTS]:
                connector = YouTubeConnector()
                description = job.description or ""
                # Ensure #Shorts tag for Shorts platform
                if job.platform == Platform.YOUTUBE_SHORTS and "#Shorts" not in description:
                    description = f"{description}\n\n#Shorts".strip()

                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=description,
                    tags=tags_list,
                    token_data=token_data
                )
            elif job.platform in [Platform.INSTA, Platform.FACEBOOK]:
                connector = InstaConnector()
                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=job.description or "",
                    tags=tags_list,
                    token_data=token_data
                )
            elif job.platform == Platform.TELEGRAM:
                connector = TelegramConnector()
                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=job.description or "",
                    tags=tags_list,
                    token_data=token_data
                )
            elif job.platform == Platform.DISCORD:
                connector = DiscordConnector()
                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=job.description or "",
                    tags=tags_list,
                    token_data=token_data
                )
            elif job.platform == Platform.SLACK:
                connector = SlackConnector()
                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=job.description or "",
                    tags=tags_list,
                    token_data=token_data
                )
            elif job.platform == Platform.PINTEREST:
                connector = PinterestConnector()
                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=job.description or "",
                    tags=tags_list,
                    token_data=token_data
                )
            elif job.platform == Platform.LINKEDIN:
                connector = LinkedInConnector()
                result_data = await connector.upload(
                    file_path=job.file_path,
                    title=job.title,
                    description=job.description or "",
                    tags=tags_list,
                    token_data=token_data
                )
            else:
                raise Exception(f"Platform {job.platform} not fully implemented yet")
                
            # 4. Update job status
            if result_data and result_data.get("status") == "COMPLETED":
                job.status = JobStatus.SUCCESS
                job.error_log = result_data.get("id") # Store publish_id/post_id
                print(f"Job {job_id} completed successfully. ID: {job.error_log}")
            else:
                job.status = JobStatus.FAIL
                job.error_log = result_data.get("error", "Unknown error during upload")
                print(f"Job {job_id} failed: {job.error_log}")
                
        except Exception as e:
            job.status = JobStatus.FAIL
            job.error_log = str(e)
            print(f"Job {job_id} exception: {str(e)}")
            
        finally:
            await db.commit()

def start_scheduler():
    scheduler.start()
    print("Scheduler started")
