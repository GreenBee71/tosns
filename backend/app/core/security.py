from cryptography.fernet import Fernet
from app.core.config import settings

def encrypt_token(token: str) -> str:
    f = Fernet(settings.ENCRYPTION_KEY.encode())
    return f.encrypt(token.encode()).decode()

def decrypt_token(token: str) -> str:
    f = Fernet(settings.ENCRYPTION_KEY.encode())
    return f.decrypt(token.encode()).decode()
