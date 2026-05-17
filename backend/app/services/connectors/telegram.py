import httpx
import os
from app.services.connectors.base import BaseConnector

class TelegramConnector(BaseConnector):
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        """
        Telegram Bot API를 사용하여 영상을 전송합니다.
        가이드: https://core.telegram.org/bots/api#sendvideo
        """
        bot_token = token_data.get("bot_token")
        chat_id = token_data.get("chat_id")
        
        if not bot_token or not chat_id:
            return {"status": "FAILED", "error": "Missing Bot Token or Chat ID"}

        caption = f"<b>{title}</b>\n\n{description}\n\n{' '.join(['#' + t for t in tags])}".strip()
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                url = f"https://api.telegram.org/bot{bot_token}/sendVideo"
                
                # 영상 파일과 함께 전송
                with open(file_path, "rb") as video_file:
                    files = {"video": video_file}
                    data = {
                        "chat_id": chat_id,
                        "caption": caption,
                        "parse_mode": "HTML"
                    }
                    
                    print(f"[{title}] Telegram Upload starting...")
                    res = await client.post(url, data=data, files=files)
                    res_data = res.json()
                    
                    if res.status_code != 200:
                        error_msg = res_data.get("description", "Unknown Telegram error")
                        return {"status": "FAILED", "error": error_msg}
                    
                    message_id = res_data.get("result", {}).get("message_id")
                    return {"id": str(message_id), "status": "COMPLETED"}

            except Exception as e:
                return {"status": "FAILED", "error": str(e)}

    async def get_account_info(self, token_data: dict):
        bot_token = token_data.get("bot_token")
        chat_id = token_data.get("chat_id")
        
        async with httpx.AsyncClient() as client:
            try:
                # 봇정보 가져오기
                bot_url = f"https://api.telegram.org/bot{bot_token}/getMe"
                bot_res = await client.get(bot_url)
                bot_info = bot_res.json().get("result", {})
                
                return {
                    "name": f"Telegram Bot (@{bot_info.get('username', 'bot')})",
                    "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
                }
            except:
                return {"name": "Telegram Channel", "thumbnail": ""}
