import httpx
import os
import json
import aiofiles
from app.services.connectors.base import BaseConnector
from app.core.config import settings

class YouTubeConnector(BaseConnector):
    async def _refresh_token(self, refresh_token: str):
        """구글 리프레시 토큰을 사용하여 새로운 엑세스 토큰을 발급받습니다."""
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.YOUTUBE_CLIENT_ID,
                    "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                }
            )
            if res.status_code == 200:
                return res.json().get("access_token")
            return None

    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        YouTube Data API v3를 사용하여 비디오를 업로드합니다.
        가이드: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
        """
        if not os.path.exists(file_path):
            return {"status": "FAILED", "error": f"File not found: {file_path}"}

        file_size = os.path.getsize(file_path)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")

        # 1. 초기 업로드 세션 요청
        init_url = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Length": str(file_size),
            "X-Upload-Content-Type": "video/mp4"
        }
        
        metadata = {
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags,
                "categoryId": "22" # People & Blogs (기본값)
            },
            "status": {
                "privacyStatus": "public" # 기본값 공개
            }
        }

        async with httpx.AsyncClient(timeout=600.0) as client:
            res = await client.post(init_url, json=metadata, headers=headers)
            
            # 토큰 만료시 갱신 시도
            if res.status_code == 401 and refresh_token:
                print("YouTube Access Token expired. Refreshing...")
                new_token = await self._refresh_token(refresh_token)
                if new_token:
                    headers["Authorization"] = f"Bearer {new_token}"
                    res = await client.post(init_url, json=metadata, headers=headers)
            
            if res.status_code != 200:
                return {"status": "FAILED", "error": f"Init failed: {res.text}"}

            upload_url = res.headers.get("Location")
            if not upload_url:
                return {"status": "FAILED", "error": "No upload URL received"}

            # 2. 실제 파일 바이너리 업로드 (Streaming via Async Generator)
            async def file_generator():
                async with aiofiles.open(file_path, "rb") as f:
                    while True:
                        chunk = await f.read(1024 * 1024) # 1MB chunks
                        if not chunk:
                            break
                        yield chunk

            # X-Upload-Content-Length header is already set in the initial request, 
            # here we just need to send the body.
            upload_res = await client.put(upload_url, content=file_generator())

            if upload_res.status_code in (200, 201):
                data = upload_res.json()
                return {"id": data.get("id"), "status": "COMPLETED"}
            else:
                return {"status": "FAILED", "error": f"Upload failed: {upload_res.text}"}

    async def get_account_info(self, token_data: dict):
        # (기존 코드 유지)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )
            if response.status_code != 200:
                return {"name": "YouTube User", "thumbnail": ""}
            data = response.json()
            if not data.get("items"):
                return {"name": "YouTube Channel Not Found", "thumbnail": ""}
            return {
                "name": data["items"][0]["snippet"]["title"],
                "thumbnail": data["items"][0]["snippet"]["thumbnails"]["default"]["url"]
            }

    async def delete_video(self, video_id: str, token_data: dict):
        """YouTube에서 영상을 삭제합니다."""
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")

        async with httpx.AsyncClient() as client:
            url = f"https://www.googleapis.com/youtube/v3/videos?id={video_id}"
            headers = {"Authorization": f"Bearer {access_token}"}
            res = await client.delete(url, headers=headers)

            if res.status_code == 401 and refresh_token:
                new_token = await self._refresh_token(refresh_token)
                if new_token:
                    headers["Authorization"] = f"Bearer {new_token}"
                    res = await client.delete(url, headers=headers)

            if res.status_code == 204:
                return True
            return False
