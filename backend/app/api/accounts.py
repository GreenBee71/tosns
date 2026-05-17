from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
from app.db.session import get_db
from app.models.models import Account, Platform

router = APIRouter()

class AccountCreate(BaseModel):
    platform: Platform
    account_name: str
    token: str

class AccountResponse(BaseModel):
    id: int
    platform: Platform
    account_name: str
    token: str = ""  # Plain token for UI convenience
    
    class Config:
        orm_mode = True

@router.get("/", response_model=List[AccountResponse])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account))
    accounts = result.scalars().all()
    # Map encrypted_token to token field for response
    for acc in accounts:
        acc.token = acc.encrypted_token
    return accounts

@router.post("/", response_model=AccountResponse)
async def create_account(account_in: AccountCreate, db: AsyncSession = Depends(get_db)):
    # Simple check if already exists for this platform + name
    result = await db.execute(
        select(Account).where(
            Account.platform == account_in.platform,
            Account.account_name == account_in.account_name
        )
    )
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already registered for this platform")
        
    new_account = Account(
        platform=account_in.platform,
        account_name=account_in.account_name,
        encrypted_token=account_in.token
    )
    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)
    new_account.token = new_account.encrypted_token
    return new_account

@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(account_id: int, account_in: AccountCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.id == account_id))
    db_account = result.scalars().first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    db_account.account_name = account_in.account_name
    db_account.encrypted_token = account_in.token
    
    await db.commit()
    await db.refresh(db_account)
    db_account.token = db_account.encrypted_token
    return db_account

@router.delete("/{account_id}")
async def delete_account(account_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.id == account_id))
    db_account = result.scalars().first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    await db.delete(db_account)
    await db.commit()
    return {"status": "success", "message": "Account deleted"}
