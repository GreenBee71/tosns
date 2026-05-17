import httpx
import os
from app.services.connectors.base import BaseConnector

class LinkedInConnector(BaseConnector):
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        LinkedIn API를 사용하여 영상을 게시합니다.
        가이드: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/vector-asset-api
        """
        access_token = token_data.get("access_token")
        author_urn = token_data.get("author_urn") # e.g., urn:li:person:ABC or urn:li:organization:123
        
        if not access_token or not author_urn:
            return {"status": "FAILED", "error": "Missing Access Token or Author URN"}

        headers = {
            "Authorization": f"Bearer {access_token}",
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                # 1. Register Upload
                print(f"[{title}] LinkedIn: Registering upload...")
                reg_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
                reg_payload = {
                    "registerUploadRequest": {
                        "recipes": ["urn:li:digitalmediaRecipe:feedshare-video"],
                        "owner": author_urn,
                        "serviceRelationships": [{
                            "relationshipType": "OWNER",
                            "identifier": "urn:li:userGeneratedContent"
                        }]
                    }
                }
                reg_res = await client.post(reg_url, headers=headers, json=reg_payload)
                if reg_res.status_code != 200:
                    return {"status": "FAILED", "error": f"LinkedIn registration failed: {reg_res.text}"}
                
                reg_data = reg_res.json()
                asset_id = reg_data["value"]["asset"]
                upload_url = reg_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]

                # 2. Upload Binary
                print(f"[{title}] LinkedIn: Uploading binary...")
                with open(file_path, "rb") as video_file:
                    video_data = video_file.read()
                    # Binary PUT upload
                    bin_headers = {"Authorization": f"Bearer {access_token}"}
                    upload_res = await client.put(upload_url, content=video_data, headers=bin_headers)
                    if upload_res.status_code != 201:
                        return {"status": "FAILED", "error": f"LinkedIn binary upload failed: {upload_res.status_code}"}

                # 3. Create Share (Post)
                print(f"[{title}] LinkedIn: Creating share...")
                share_url = "https://api.linkedin.com/v2/ugcPosts"
                share_payload = {
                    "author": author_urn,
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {
                                "text": f"{title}\n\n{description}\n\n{' '.join(['#' + t for t in tags])}".strip()
                            },
                            "shareMediaCategory": "VIDEO",
                            "media": [{
                                "status": "READY",
                                "description": {"text": description},
                                "media": asset_id,
                                "title": {"text": title}
                            }]
                        }
                    },
                    "visibility": {
                        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                    }
                }
                share_res = await client.post(share_url, headers=headers, json=share_payload)
                if share_res.status_code != 201:
                    return {"status": "FAILED", "error": f"LinkedIn share failed: {share_res.text}"}
                
                return {"id": asset_id, "status": "COMPLETED"}

            except Exception as e:
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        access_token = token_data.get("access_token")
        if not access_token:
            return {"name": "LinkedIn Account", "thumbnail": ""}
            
        async with httpx.AsyncClient() as client:
            try:
                headers = {"Authorization": f"Bearer {access_token}"}
                res = await client.get("https://api.linkedin.com/v2/me", headers=headers)
                data = res.json()
                if res.status_code == 200:
                    return {
                        "name": f"LinkedIn ({data.get('localizedFirstName', '')} {data.get('localizedLastName', '')})",
                        "thumbnail": ""
                    }
            except:
                pass
        return {"name": "LinkedIn", "thumbnail": ""}
