from app.services.connectors.base import BaseConnector
import httpx
import os
import aiofiles
import json
from app.core.config import settings

class TikTokConnector(BaseConnector):
    async def _refresh_token(self, refresh_token: str):
        """틱톡 리프레시 토큰을 사용하여 새로운 엑세스 토큰을 발급받습니다."""
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://open.tiktokapis.com/v2/oauth/token/",
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={
                    "client_key": settings.TIKTOK_CLIENT_KEY,
                    "client_secret": settings.TIKTOK_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                }
            )
            if res.status_code == 200:
                data = res.json()
                return data.get("access_token"), data.get("refresh_token")
            return None, None

    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        TikTok Content Posting API v2를 사용하여 영상을 업로드합니다.
        가이드: https://developers.tiktok.com/doc/content-posting-api-reference/
        """
        if not os.path.exists(file_path):
            return {"status": "FAILED", "error": f"File not found: {file_path}"}

        file_size = os.path.getsize(file_path)
        access_token = token_data.get("access_token", "")
        refresh_token = token_data.get("refresh_token")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # 1. 업로드 초기화
                init_url = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json; charset=UTF-8"
                }
                
                chunk_size = 10 * 1024 * 1024
                if file_size < chunk_size:
                    chunk_size = file_size
                total_chunk_count = (file_size + chunk_size - 1) // chunk_size

                payload = {
                    "source_info": {
                        "source": "FILE_UPLOAD",
                        "video_size": file_size,
                        "chunk_size": chunk_size,
                        "total_chunk_count": total_chunk_count
                    }
                }
                
                print(f"[{title}] TikTok Upload Init start...")
                init_res = await client.post(init_url, json=payload, headers=headers)
                
                # 토큰 만료 처리
                if init_res.status_code == 401 and refresh_token:
                    print("TikTok Access Token expired. Refreshing...")
                    new_access, new_refresh = await self._refresh_token(refresh_token)
                    if new_access:
                        headers["Authorization"] = f"Bearer {new_access}"
                        # 갱신된 토큰으로 재시도
                        init_res = await client.post(init_url, json=payload, headers=headers)
                        # TODO: 실전에서는 DB에도 갱신된 토큰을 저장해야 함 (여기서는 반환값으로 전달 필요할 수 있음)

                init_data = init_res.json()
                
                if init_res.status_code != 200 or init_data.get("error", {}).get("code") != "ok":
                    error_msg = init_data.get("error", {}).get("message", "Unknown initialization error")
                    print(f"Init Failed: {init_data}")
                    return {"status": "FAILED", "error": f"Init failed: {error_msg}"}
                    
                publish_id = init_data["data"]["publish_id"]
                upload_url = init_data["data"]["upload_url"]
                print(f"Init Success. Publish ID: {publish_id}")

                # 2. 청크 업로드
                async with aiofiles.open(file_path, 'rb') as f:
                    for i in range(total_chunk_count):
                        start_byte = i * chunk_size
                        current_chunk_size = min(chunk_size, file_size - start_byte)
                        chunk_data = await f.read(current_chunk_size)
                        
                        end_byte = start_byte + len(chunk_data) - 1
                        
                        chunk_headers = {
                            "Content-Range": f"bytes {start_byte}-{end_byte}/{file_size}",
                            "Content-Length": str(len(chunk_data)),
                            "Content-Type": "video/mp4"
                        }
                        
                        print(f"Uploading chunk {i+1}/{total_chunk_count} ({len(chunk_data)} bytes)...")
                        upload_res = await client.put(upload_url, content=chunk_data, headers=chunk_headers)
                        
                        if upload_res.status_code not in (200, 201):
                            print(f"Chunk {i} failed: {upload_res.status_code} - {upload_res.text}")
                            return {"status": "FAILED", "error": f"Chunk {i} upload failed: {upload_res.text}"}

                print(f"All chunks uploaded successfully for {publish_id}")
                return {"id": publish_id, "status": "COMPLETED"}

            except Exception as e:
                print(f"TikTok Connector Exception: {str(e)}")
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        access_token = token_data.get('access_token', '')
        refresh_token = token_data.get('refresh_token')

        async with httpx.AsyncClient() as client:
            try:
                headers = {"Authorization": f"Bearer {access_token}"}
                response = await client.get(
                    "https://open.tiktokapis.com/v2/user/info/",
                    headers=headers,
                    params={"fields": "open_id,display_name,avatar_url"}
                )
                
                if response.status_code == 401 and refresh_token:
                    new_access, _ = await self._refresh_token(refresh_token)
                    if new_access:
                        headers["Authorization"] = f"Bearer {new_access}"
                        response = await client.get(
                            "https://open.tiktokapis.com/v2/user/info/",
                            headers=headers,
                            params={"fields": "open_id,display_name,avatar_url"}
                        )

                if response.status_code != 200:
                    return {
                        "name": f"TikTok User ({access_token[:5]}...)",
                        "thumbnail": "https://via.placeholder.com/150"
                    }
                    
                data = response.json()
                user_info = data.get("data", {}).get("user", {})
                
                return {
                    "name": user_info.get("display_name", "Unknown User"),
                    "thumbnail": user_info.get("avatar_url", "https://via.placeholder.com/150")
                }
            except Exception as e:
                return {
                    "name": "Mock TikTok User",
                    "thumbnail": "https://via.placeholder.com/150"
                }
