from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
import shutil
import os
from sqlalchemy import select
from app.db.session import get_db
from app.models.models import UploadJob, Platform, JobStatus
from app.services.scheduler.manager import upload_worker

router = APIRouter()

@router.post("/upload")
async def create_upload_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(""),
    tags: str = Form(""),
    platforms: str = Form(...),  # Comma separated
    scheduled_at: Optional[datetime] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    # 1. Save file locally
    file_path = f"data/uploads/{file.filename}"
    os.makedirs("data/uploads", exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Create job in DB for each platform
    platform_ids = [p.strip() for p in platforms.split(',')]
    created_jobs = []
    
    for pid in platform_ids:
        try:
            platform_enum = Platform(pid)
            new_job = UploadJob(
                title=title,
                description=description,
                tags=tags,
                platform=platform_enum,
                file_path=file_path,
                status=JobStatus.PENDING,
                scheduled_at=scheduled_at
            )
            db.add(new_job)
            created_jobs.append(new_job)
        except ValueError:
            # Skip invalid platforms
            continue
            
    await db.commit()
    
    # 3. Trigger background processing for immediate jobs
    for job in created_jobs:
        if not scheduled_at or scheduled_at <= datetime.now():
            background_tasks.add_task(upload_worker, job.id)
            
    # Refresh to get IDs
    for job in created_jobs:
        await db.refresh(job)
    
    return {
        "message": "Jobs created successfully", 
        "file_path": file_path,
        "jobs_created": len(created_jobs)
    }

@router.get("/")
async def list_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UploadJob).order_by(UploadJob.created_at.desc()))
    return result.scalars().all()

@router.post("/{job_id}/retry")
async def retry_job(
    job_id: int, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(UploadJob).where(UploadJob.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = JobStatus.PENDING
    job.error_log = None
    await db.commit()
    
    background_tasks.add_task(upload_worker, job_id)
    
    return {"message": f"Retrying job {job_id}"}

@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    delete_on_sns: bool = True,
    remove_from_db: bool = False,
    db: AsyncSession = Depends(get_db)
):
    import json
    from app.services.connectors.youtube import YouTubeConnector
    from app.models.models import Account
    
    result = await db.execute(select(UploadJob).where(UploadJob.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # 1. Delete from SNS if requested and successful previously
    if delete_on_sns and job.status == JobStatus.SUCCESS and job.error_log:
        if job.platform == Platform.YOUTUBE:
            # Get account for token
            acc_result = await db.execute(select(Account).where(Account.id == job.account_id))
            account = acc_result.scalar_one_or_none()
            if not account:
                # Fallback to general account for platform if specific one not linked
                acc_result = await db.execute(select(Account).where(Account.platform == job.platform))
                account = acc_result.scalar_one_or_none()
            
            if account:
                try:
                    token_data = json.loads(account.encrypted_token)
                except:
                    token_data = {"access_token": account.encrypted_token}
                
                connector = YouTubeConnector()
                deleted = await connector.delete_video(job.error_log, token_data)
                if not deleted:
                    # Depending on policy, we might still proceed or error out. 
                    # For now, let's just log and proceed with internal deletion if requested.
                    print(f"Failed to delete video {job.error_log} from YouTube")

    # 2. Handle internal DB
    if remove_from_db:
        await db.delete(job)
    else:
        job.status = JobStatus.DELETED
        # Optionally keep the video id but mark as deleted
    
    await db.commit()
    return {"message": "Job deleted successfully", "sns_deleted": delete_on_sns}
