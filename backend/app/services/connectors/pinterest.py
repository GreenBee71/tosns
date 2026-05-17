import httpx
import os
import asyncio
from app.services.connectors.base import BaseConnector

class PinterestConnector(BaseConnector):
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        Pinterest API v5를 사용하여 비디오 핀을 생성합니다.
        가이드: https://developers.pinterest.com/docs/api/v5/#tag/media
        """
        access_token = token_data.get("access_token")
        board_id = token_data.get("board_id")
        
        if not access_token or not board_id:
            return {"status": "FAILED", "error": "Missing Access Token or Board ID"}

        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # 1. Register Media Upload
                print(f"[{title}] Pinterest: Registering media...")
                reg_url = "https://api.pinterest.com/v5/media"
                reg_res = await client.post(reg_url, headers=headers, json={"media_type": "video"})
                if reg_res.status_code != 201:
                    return {"status": "FAILED", "error": f"Media registration failed: {reg_res.text}"}
                
                reg_data = reg_res.json()
                media_id = reg_data["media_id"]
                upload_url = reg_data["upload_url"]
                upload_params = reg_data["upload_parameters"]

                # 2. Upload Video File
                print(f"[{title}] Pinterest: Uploading file...")
                with open(file_path, "rb") as video_file:
                    # Pinterest uses multipart/form-data for the upload_url
                    files = {"file": (os.path.basename(file_path), video_file, "video/mp4")}
                    # upload_params must be included in the form data
                    upload_res = await client.post(upload_url, data=upload_params, files=files)
                    if upload_res.status_code >= 400:
                        return {"status": "FAILED", "error": f"File upload failed: {upload_res.text}"}

                # 3. Poll Media Status
                print(f"[{title}] Pinterest: Waiting for processing...")
                max_retries = 30
                for _ in range(max_retries):
                    status_res = await client.get(f"{reg_url}/{media_id}", headers=headers)
                    status_data = status_res.json()
                    status = status_data.get("status")
                    
                    if status == "succeeded":
                        break
                    elif status == "failed":
                        return {"status": "FAILED", "error": "Pinterest media processing failed"}
                    
                    await asyncio.sleep(10) # Wait 10 seconds before next check
                else:
                    return {"status": "FAILED", "error": "Pinterest media processing timed out"}

                # 4. Create Pin
                print(f"[{title}] Pinterest: Creating Pin...")
                pin_url = "https://api.pinterest.com/v5/pins"
                pin_data = {
                    "board_id": board_id,
                    "title": title,
                    "description": f"{description}\n\n{' '.join(['#' + t for t in tags])}".strip(),
                    "media_source": {
                        "source_type": "video_id",
                        "media_id": media_id
                    }
                }
                pin_res = await client.post(pin_url, headers=headers, json=pin_data)
                pin_res_data = pin_res.json()
                
                if pin_res.status_code != 201:
                    return {"status": "FAILED", "error": f"Pin creation failed: {pin_res_data}"}
                
                return {"id": pin_res_data.get("id"), "status": "COMPLETED"}

            except Exception as e:
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        access_token = token_data.get("access_token")
        if not access_token:
            return {"name": "Pinterest Account", "thumbnail": ""}
            
        async with httpx.AsyncClient() as client:
            try:
                headers = {"Authorization": f"Bearer {access_token}"}
                res = await client.get("https://api.pinterest.com/v5/user_account", headers=headers)
                data = res.json()
                if res.status_code == 200:
                    return {
                        "name": f"Pinterest ({data.get('username', 'User')})",
                        "thumbnail": data.get("profile_image", "")
                    }
            except:
                pass
        return {"name": "Pinterest Account", "thumbnail": ""}
