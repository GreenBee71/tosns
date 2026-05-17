from app.services.connectors.base import BaseConnector
import httpx
import os
import asyncio
import json
import base64
from app.core.config import settings

class XConnector(BaseConnector):
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        X (Twitter) API를 사용하여 영상을 업로드하고 트윗을 게시합니다.
        1. Media Upload (v1.1) - INIT, APPEND, FINALIZE
        2. Create Tweet (v2)
        """
        access_token = token_data.get("access_token")
        if not access_token:
            return {"status": "FAILED", "error": "Missing access token"}

        file_size = os.path.getsize(file_path)
        media_type = "video/mp4"

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # --- PHASE 1: INIT ---
                init_url = "https://upload.twitter.com/1.1/media/upload.json"
                params = {
                    "command": "INIT",
                    "total_bytes": str(file_size),
                    "media_type": media_type,
                    "media_category": "tweet_video"
                }
                headers = {"Authorization": f"Bearer {access_token}"}
                
                res_init = await client.post(init_url, params=params, headers=headers)
                if res_init.status_code != 202:
                    return {"status": "FAILED", "error": f"INIT failed: {res_init.text}"}
                
                media_id = res_init.json()["media_id_string"]

                # --- PHASE 2: APPEND ---
                chunk_size = 1024 * 1024 * 4 # 4MB chunks
                segment_index = 0
                
                with open(file_path, "rb") as f:
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        
                        files = {"media": chunk}
                        append_params = {
                            "command": "APPEND",
                            "media_id": media_id,
                            "segment_index": str(segment_index)
                        }
                        
                        res_append = await client.post(init_url, params=append_params, files=files, headers=headers)
                        if res_append.status_code < 200 or res_append.status_code >= 300:
                            return {"status": "FAILED", "error": f"APPEND failed: {res_append.text}"}
                        
                        segment_index += 1

                # --- PHASE 3: FINALIZE ---
                finalize_params = {
                    "command": "FINALIZE",
                    "media_id": media_id
                }
                res_finalize = await client.post(init_url, params=finalize_params, headers=headers)
                if res_finalize.status_code != 201:
                    return {"status": "FAILED", "error": f"FINALIZE failed: {res_finalize.text}"}

                # --- PHASE 4: STATUS CHECK (Wait for processing) ---
                for _ in range(30): # Max 5 mins
                    status_params = {
                        "command": "STATUS",
                        "media_id": media_id
                    }
                    res_status = await client.get(init_url, params=status_params, headers=headers)
                    status_data = res_status.json()
                    
                    processing_info = status_data.get("processing_info", {})
                    state = processing_info.get("state")
                    
                    if state == "succeeded":
                        break
                    elif state == "failed":
                        return {"status": "FAILED", "error": f"Processing failed: {processing_info.get('error')}"}
                    
                    wait_sec = processing_info.get("check_after_secs", 5)
                    await asyncio.sleep(wait_sec)

                # --- PHASE 5: CREATE TWEET (API v2) ---
                tweet_url = "https://api.twitter.com/2/tweets"
                full_text = f"{title}\n{description}\n{' '.join(['#'+t for t in tags])}".strip()
                
                tweet_payload = {
                    "text": full_text,
                    "media": {
                        "media_ids": [media_id]
                    }
                }
                
                res_tweet = await client.post(tweet_url, json=tweet_payload, headers=headers)
                tweet_data = res_tweet.json()
                
                if res_tweet.status_code != 201:
                    return {"status": "FAILED", "error": f"Tweet failed: {res_tweet.text}"}

                return {"id": tweet_data["data"]["id"], "status": "COMPLETED"}

            except Exception as e:
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "https://api.twitter.com/2/users/me",
                    headers={"Authorization": f"Bearer {token_data['access_token']}"},
                    params={"user.fields": "profile_image_url"}
                )
                data = response.json()
                if response.status_code != 200:
                    return {"name": "X Account", "thumbnail": ""}
                    
                user_info = data["data"]
                return {
                    "name": user_info["name"],
                    "thumbnail": user_info.get("profile_image_url", "")
                }
            except:
                return {"name": "X Account", "thumbnail": ""}
