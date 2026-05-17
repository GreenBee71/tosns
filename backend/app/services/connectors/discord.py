import httpx
import os
from app.services.connectors.base import BaseConnector

class DiscordConnector(BaseConnector):
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        Discord Webhook을 사용하여 영상을 전송합니다.
        가이드: https://discord.com/developers/docs/resources/webhook#execute-webhook
        """
        webhook_url = token_data.get("webhook_url")
        
        if not webhook_url:
            return {"status": "FAILED", "error": "Missing Webhook URL"}

        content = f"**{title}**\n\n{description}\n\n{' '.join(['#' + t for t in tags])}".strip()
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # Discord Webhook file upload
                with open(file_path, "rb") as video_file:
                    files = {"file": (os.path.basename(file_path), video_file, "video/mp4")}
                    data = {"content": content}
                    
                    print(f"[{title}] Discord Upload starting...")
                    res = await client.post(webhook_url, data=data, files=files)
                    
                    if res.status_code < 200 or res.status_code >= 300:
                        return {"status": "FAILED", "error": f"Discord error: {res.text}"}
                    
                    return {"id": "discord_webhook_msg", "status": "COMPLETED"}

            except Exception as e:
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        webhook_url = token_data.get("webhook_url")
        if not webhook_url:
            return {"name": "Discord Webhook", "thumbnail": ""}
            
        async with httpx.AsyncClient() as client:
            try:
                res = await client.get(webhook_url)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "name": f"Discord Webhook ({data.get('name', 'Channel')})",
                        "thumbnail": "https://cdn.prod.website-files.com/6257adef93867e3d0394e0ff/636e0a6a49f96297a5729163_icon_clyde_blurple_RGB.png"
                    }
            except:
                pass
        return {"name": "Discord Webhook", "thumbnail": ""}
