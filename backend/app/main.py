from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import auth, jobs, accounts, oauth, media, system
from fastapi.staticfiles import StaticFiles
import os
from app.db.session import engine
from app.models.models import Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])
app.include_router(jobs.router, prefix=settings.API_V1_STR + "/jobs", tags=["jobs"])
app.include_router(accounts.router, prefix=settings.API_V1_STR + "/accounts", tags=["accounts"])
app.include_router(oauth.router, prefix=settings.API_V1_STR + "/oauth", tags=["oauth"])
app.include_router(media.router, prefix=settings.API_V1_STR + "/media", tags=["media"])
app.include_router(system.router, prefix=settings.API_V1_STR + "/system", tags=["system"])


# Ensure upload directory exists
os.makedirs("data/uploads", exist_ok=True)
os.makedirs("media/library", exist_ok=True)

# Mount static files for Meta/Instagram scraping and Media Library
app.mount("/static", StaticFiles(directory="data/uploads"), name="static")
app.mount("/media", StaticFiles(directory="media"), name="media")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Welcome to SNS Uploader API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
