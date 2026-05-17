import httpx
import os
import asyncio
from app.services.connectors.base import BaseConnector

class InstaConnector(BaseConnector):
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        Instagram Graph API를 사용하여 릴스(Reels)를 업로드합니다.
        가이드: https://developers.facebook.com/docs/instagram-api/guides/content-publishing/
        """
        access_token = token_data.get("access_token")
        instagram_account_id = token_data.get("instagram_account_id")
        
        if not access_token or not instagram_account_id:
            return {"status": "FAILED", "error": "Missing access token or Instagram Account ID"}

        # 1. 미디어 컨테이너 생성 (비디오)
        # 릴스는 video_url을 통해 업로드하므로, 먼저 파일을 공용 URL로 노출하거나 
        # 페이스북 전용 바이너리 업로드 방식을 사용해야 합니다. 
        # (현 MVP에서는 URL 방식 기준 skeleton 작성)
        
        # 인스타그램 릴스는 공개된 URL을 통해 비디오를 가져가므로, 서버의 정적 파일 경로를 전달합니다.
        # 실제 운영 환경의 베이스 URL을 사용해야 합니다.
        base_url = "https://tosns.greenbee.cloud/api/v1"
        video_url = f"{base_url}/static/{os.path.basename(file_path)}"
        
        caption = f"{title}\n\n{description}\n {' '.join(['#' + t for t in tags])}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                # 컨테이너 생성 요청
                init_url = f"https://graph.facebook.com/v18.0/{instagram_account_id}/media"
                params = {
                    "media_type": "REELS",
                    "video_url": video_url,
                    "caption": caption,
                    "access_token": access_token
                }
                
                res = await client.post(init_url, params=params)
                data = res.json()
                
                if res.status_code != 200:
                    return {"status": "FAILED", "error": f"Init failed: {data}"}
                
                creation_id = data["id"]
                
                # 2. 업로드 상태 확인 (비동기 처리이므로 완료될 때까지 대기 필요)
                status = "IN_PROGRESS"
                for _ in range(20): # 최대 10분 대기 (30초 * 20)
                    await asyncio.sleep(30)
                    status_url = f"https://graph.facebook.com/v18.0/{creation_id}"
                    status_res = await client.get(status_url, params={"fields": "status_code", "access_token": access_token})
                    status_data = status_res.json()
                    
                    if status_data.get("status_code") == "FINISHED":
                        status = "FINISHED"
                        break
                    elif status_data.get("status_code") == "ERROR":
                        return {"status": "FAILED", "error": "Media processing failed on Instagram"}

                if status != "FINISHED":
                    return {"status": "FAILED", "error": "Media processing timeout"}

                # 3. 미디어 게시 (Publish)
                publish_url = f"https://graph.facebook.com/v18.0/{instagram_account_id}/media_publish"
                publish_res = await client.post(publish_url, params={
                    "creation_id": creation_id,
                    "access_token": access_token
                })
                publish_data = publish_res.json()
                
                if publish_res.status_code != 200:
                    return {"status": "FAILED", "error": f"Publish failed: {publish_data}"}

                return {"id": publish_data["id"], "status": "COMPLETED"}

            except Exception as e:
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        """인스타그램 계정 정보를 가져옵니다."""
        access_token = token_data.get("access_token")
        instagram_account_id = token_data.get("instagram_account_id")

        if not access_token or not instagram_account_id:
            return {"name": "Instagram User (No ID)", "thumbnail": ""}

        async with httpx.AsyncClient() as client:
            try:
                # 인스타그램 비즈니스 계정 상세 정보 조회
                res = await client.get(
                    f"https://graph.facebook.com/v18.0/{instagram_account_id}",
                    params={
                        "fields": "username,profile_picture_url",
                        "access_token": access_token
                    }
                )
                data = res.json()
                
                if res.status_code != 200:
                    return {"name": "Instagram Account", "thumbnail": ""}
                
                return {
                    "name": data.get("username", "Instagram User"),
                    "thumbnail": data.get("profile_picture_url", "")
                }
            except Exception:
                return {"name": "Instagram Account (Error)", "thumbnail": ""}
