from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
import shutil
import os
from datetime import datetime

from app.db.session import get_db
from app.models.models import MediaProject, MediaAsset

router = APIRouter()

# --- Projects API ---

@router.get("/projects", response_model=List[dict])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaProject).order_by(MediaProject.created_at.desc()))
    projects = result.scalars().all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "asset_count": len(p.assets) if p.assets else 0
        } for p in projects
    ]

@router.post("/projects")
async def create_project(
    title: str = Form(...),
    description: str = Form(""),
    db: AsyncSession = Depends(get_db)
):
    new_project = MediaProject(
        title=title,
        description=description
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

@router.delete("/projects/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaProject).where(MediaProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted successfully"}

# --- Assets API ---

@router.get("/projects/{project_id}/assets")
async def list_assets(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaAsset).where(MediaAsset.project_id == project_id).order_by(MediaAsset.created_at.desc()))
    return result.scalars().all()

@router.post("/assets")
async def upload_asset(
    project_id: Optional[int] = Form(None),
    asset_type: str = Form(...), # image, video, voice
    prompt: Optional[str] = Form(""),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # 1. Create directory structure
    upload_dir = f"media/library/{project_id if project_id else 'unorganized'}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    
    # 2. Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 3. Create Asset record
    new_asset = MediaAsset(
        project_id=project_id,
        asset_type=asset_type,
        file_path=file_path,
        prompt=prompt
    )
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    
    return new_asset

@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MediaAsset).where(MediaAsset.id == asset_id))
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Delete physical file
    if os.path.exists(asset.file_path):
        os.remove(asset.file_path)
        
    await db.delete(asset)
    await db.commit()
    return {"message": "Asset deleted successfully"}
