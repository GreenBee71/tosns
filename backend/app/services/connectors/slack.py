import httpx
import os
from app.services.connectors.base import BaseConnector

class SlackConnector(BaseConnector):
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        Slack Web API (files.upload) 또는 Webhook을 사용합니다.
        영상 업로드를 위해 files.upload 방식을 권장합니다.
        가이드: https://api.slack.com/methods/files.upload
        """
        bot_token = token_data.get("bot_token")
        channel_id = token_data.get("channel_id")
        
        if not bot_token or not channel_id:
            return {"status": "FAILED", "error": "Missing Bot Token or Channel ID"}

        initial_comment = f"*{title}*\n\n{description}\n\n{' '.join(['#' + t for t in tags])}".strip()
        
        async with httpx.AsyncClient(timeout=180.0) as client:
            try:
                # Slack File Upload API (v1 is deprecated but widely used, v2 is complex)
                # Using files.upload (classic)
                url = "https://slack.com/api/files.upload"
                
                with open(file_path, "rb") as video_file:
                    files = {"file": (os.path.basename(file_path), video_file, "video/mp4")}
                    data = {
                        "channels": channel_id,
                        "initial_comment": initial_comment,
                        "title": title
                    }
                    headers = {"Authorization": f"Bearer {bot_token}"}
                    
                    print(f"[{title}] Slack Upload starting...")
                    res = await client.post(url, data=data, files=files, headers=headers)
                    res_data = res.json()
                    
                    if not res_data.get("ok"):
                        error_msg = res_data.get("error", "Unknown Slack error")
                        return {"status": "FAILED", "error": error_msg}
                    
                    return {"id": res_data.get("file", {}).get("id"), "status": "COMPLETED"}

            except Exception as e:
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        bot_token = token_data.get("bot_token")
        if not bot_token:
            return {"name": "Slack App", "thumbnail": ""}
            
        async with httpx.AsyncClient() as client:
            try:
                # Auth test to get workspace info
                res = await client.post(
                    "https://slack.com/api/auth.test",
                    headers={"Authorization": f"Bearer {bot_token}"}
                )
                data = res.json()
                if data.get("ok"):
                    return {
                        "name": f"Slack ({data.get('team', 'Workspace')})",
                        "thumbnail": "https://cdn.brandfolder.io/5H075Y69/at/pgs7v82m6m6k7p9ms8jgtv6/slack-logo-icon.png"
                    }
            except:
                pass
        return {"name": "Slack App", "thumbnail": ""}
