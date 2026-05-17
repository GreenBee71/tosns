from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/info")
async def get_system_info():
    """현재 시스템의 환경 설정 정보를 반환합니다."""
    return {
        "project_name": settings.PROJECT_NAME,
        "api_version": settings.API_V1_STR,
        "server_base_url": settings.SERVER_BASE_URL,
        "frontend_base_url": settings.FRONTEND_BASE_URL,
        "environment": "LOCAL" if "localhost" in settings.SERVER_BASE_URL else "PRODUCTION"
    }
