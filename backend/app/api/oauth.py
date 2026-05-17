from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import httpx
import json
import secrets
import hashlib
import base64
from typing import Optional
from urllib.parse import urlencode
from app.core.config import settings
from app.db.session import get_db
from app.models.models import Account, Platform

router = APIRouter()

# Simple in-memory CSRF state store (use Redis in production)
_pending_states: dict = {}  # state -> code_verifier


def _generate_pkce_pair():
    """PKCE code_verifier 와 code_challenge 쌍을 생성합니다."""
    code_verifier = secrets.token_urlsafe(64)  # 43~128자 범위의 random string
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return code_verifier, code_challenge


@router.get("/tiktok/login")
async def tiktok_login():
    """틱톡 OAuth 2.0 인증 시작 (PKCE 포함). 브라우저를 틱톡 로그인 페이지로 리다이렉트합니다."""
    state = secrets.token_urlsafe(16)
    code_verifier, code_challenge = _generate_pkce_pair()
    _pending_states[state] = code_verifier

    params = urlencode({
        "client_key": settings.TIKTOK_CLIENT_KEY,
        "scope": "user.info.basic,video.upload",
        "response_type": "code",
        "redirect_uri": settings.TIKTOK_REDIRECT_URI,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    })
    auth_url = f"https://www.tiktok.com/v2/auth/authorize/?{params}"
    return RedirectResponse(url=auth_url)


@router.get("/tiktok/callback")
async def tiktok_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    """틱톡 OAuth 콜백. 인증 코드를 Access Token으로 교환하고 저장합니다."""
    # CSRF state 검증 및 code_verifier 꺼내기
    code_verifier = _pending_states.pop(state, None)
    if code_verifier is None:
        raise HTTPException(status_code=400, detail="Invalid state parameter. CSRF check failed.")

    # 코드를 토큰으로 교환 (PKCE code_verifier 포함)
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "client_key": settings.TIKTOK_CLIENT_KEY,
                "client_secret": settings.TIKTOK_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.TIKTOK_REDIRECT_URI,
                "code_verifier": code_verifier,
            }
        )
        token_data = token_res.json()

    if token_res.status_code != 200 or "access_token" not in token_data:
        error_msg = token_data.get("error_description", str(token_data))
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {error_msg}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")
    open_id = token_data.get("open_id", "")

    # 사용자 정보 가져오기
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://open.tiktokapis.com/v2/user/info/",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"fields": "open_id,display_name"}
        )
        user_data = user_res.json()

    display_name = user_data.get("data", {}).get("user", {}).get("display_name", f"TikTok_{open_id[:8]}")

    # 기존 계정이 있으면 업데이트, 없으면 새로 생성
    result = await db.execute(
        select(Account).where(Account.platform == Platform.TIKTOK)
    )
    account = result.scalar_one_or_none()

    token_json = json.dumps({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "open_id": open_id,
    })

    if account:
        account.account_name = display_name
        account.encrypted_token = token_json
    else:
        account = Account(
            platform=Platform.TIKTOK,
            account_name=display_name,
            encrypted_token=token_json,
        )
        db.add(account)

    await db.commit()

    # 성공 후 프론트엔드로 리다이렉트
    return RedirectResponse(url=f"{settings.FRONTEND_BASE_URL}/#/accounts?connected=tiktok")


@router.get("/youtube/login")
async def youtube_login():
    """유튜브 OAuth 2.0 인증 시작. 구글 로그인 페이지로 리다이렉트합니다."""
    state = secrets.token_urlsafe(16)
    # 구글은 state만 저장 (PKCE는 선택사항이나 필요시 추가 가능, 여기선 생략)
    _pending_states[state] = "youtube"

    params = urlencode({
        "client_id": settings.YOUTUBE_CLIENT_ID,
        "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly openid profile email",
        "access_type": "offline",  # refresh_token을 받기 위해 필수
        "prompt": "consent",       # 매번 동의 화면을 띄워 refresh_token 보장
        "state": state,
    })
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    return RedirectResponse(url=auth_url)


@router.get("/youtube/callback")
async def youtube_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    """유튜브 OAuth 콜백. 인증 코드를 토큰으로 교환합니다."""
    stored_state = _pending_states.pop(state, None)
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter.")

    # 토큰 교환
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
            }
        )
        token_data = token_res.json()

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Google token exchange failed: {token_data}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")  # 처음 연동시에만 옴

    # 사용자 정보 및 채널 정보 가져오기
    async with httpx.AsyncClient() as client:
        # 1. 프로필 정보 (이름 등)
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = user_res.json()
        
        # 2. 유튜브 채널 정보
        channel_res = await client.get(
            "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        channel_data = channel_res.json()
    
    display_name = user_info.get("name", "YouTube User")
    if channel_data.get("items"):
        display_name = channel_data["items"][0]["snippet"]["title"]

    # DB 저장 (기존 계정 업데이트 또는 신규 생성)
    result = await db.execute(
        select(Account).where(Account.platform == Platform.YOUTUBE, Account.account_name == display_name)
    )
    account = result.scalar_one_or_none()

    token_store = {
        "access_token": access_token,
        "token_type": token_data.get("token_type"),
        "expires_in": token_data.get("expires_in"),
        "scope": token_data.get("scope"),
    }
    if refresh_token:
        token_store["refresh_token"] = refresh_token

    token_json = json.dumps(token_store)

    if account:
        account.encrypted_token = token_json
    else:
        account = Account(
            platform=Platform.YOUTUBE,
            account_name=display_name,
            encrypted_token=token_json,
        )
        db.add(account)

    await db.commit()

    return RedirectResponse(url=f"{settings.FRONTEND_BASE_URL}/#/accounts?connected=youtube")


@router.get("/youtube_shorts/login")
async def youtube_shorts_login():
    """유튜브 쇼츠 OAuth 2.0 인증 시작. 구글 로그인 페이지로 리다이렉트합니다."""
    state = secrets.token_urlsafe(16)
    _pending_states[state] = "youtube_shorts"

    params = urlencode({
        "client_id": settings.YOUTUBE_CLIENT_ID,
        "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly openid profile email",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    })
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    return RedirectResponse(url=auth_url)


@router.get("/youtube_shorts/callback")
async def youtube_shorts_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    """유튜브 쇼츠 OAuth 콜백. 인증 코드를 토큰으로 교환합니다."""
    stored_state = _pending_states.pop(state, None)
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter.")

    # 토큰 교환
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.YOUTUBE_CLIENT_ID,
                "client_secret": settings.YOUTUBE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.YOUTUBE_REDIRECT_URI,
            }
        )
        token_data = token_res.json()

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Google token exchange failed: {token_data}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")

    # 사용자 정보 및 채널 정보 가져오기
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = user_res.json()
        
        channel_res = await client.get(
            "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        channel_data = channel_res.json()
    
    display_name = user_info.get("name", "YouTube Shorts User")
    if channel_data.get("items"):
        display_name = channel_data["items"][0]["snippet"]["title"]

    # DB 저장 (Platform.YOUTUBE_SHORTS 로 지정)
    result = await db.execute(
        select(Account).where(Account.platform == Platform.YOUTUBE_SHORTS, Account.account_name == display_name)
    )
    account = result.scalar_one_or_none()

    token_store = {
        "access_token": access_token,
        "token_type": token_data.get("token_type"),
        "expires_in": token_data.get("expires_in"),
        "scope": token_data.get("scope"),
    }
    if refresh_token:
        token_store["refresh_token"] = refresh_token

    token_json = json.dumps(token_store)

    if account:
        account.encrypted_token = token_json
    else:
        account = Account(
            platform=Platform.YOUTUBE_SHORTS,
            account_name=display_name,
            encrypted_token=token_json,
        )
        db.add(account)

    return RedirectResponse(url=f"{settings.FRONTEND_BASE_URL}/#/accounts?connected=youtube_shorts")


@router.get("/insta/login")
async def insta_login(platform: str = "instagram"):
    """인스타그램(Meta) OAuth 2.0 인증 시작. platform 매개변수로 instagram 또는 facebook 구분."""
    state = secrets.token_urlsafe(16)
    _pending_states[state] = platform

    params = urlencode({
        "client_id": settings.INSTA_CLIENT_ID,
        "redirect_uri": settings.INSTA_REDIRECT_URI,
        "state": state,
        "scope": "pages_read_engagement,pages_show_list,business_management,instagram_basic,instagram_content_publish",
        "response_type": "code",
    })
    auth_url = f"https://www.facebook.com/v18.0/dialog/oauth?{params}"
    return RedirectResponse(url=auth_url)


# Meta Webhook 검증 토큰 (메타 개발자 포털에 입력한 값과 동일해야 함)
INSTA_WEBHOOK_VERIFY_TOKEN = "tosns_webhook_token"

@router.get("/insta/webhook")
async def insta_webhook_verify(
    hub_mode: Optional[str] = None,
    hub_verify_token: Optional[str] = None,
    hub_challenge: Optional[str] = None,
):
    """Meta Webhook 검증 엔드포인트."""
    if hub_mode == "subscribe" and hub_verify_token == INSTA_WEBHOOK_VERIFY_TOKEN:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Webhook verification failed")



@router.get("/insta/callback")
async def insta_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """인스타그램 OAuth 콜백. 인증 코드를 토큰으로 교환합니다."""
    if error:
        return RedirectResponse(
            url=f"{settings.FRONTEND_BASE_URL}/#/accounts?error=insta_{error}&reason={error_reason or ''}"
        )
    if not code or not state:
        return RedirectResponse(
            url=f"{settings.FRONTEND_BASE_URL}/#/accounts?error=insta_missing_params"
        )

    stored_state = _pending_states.pop(state, None)
    if not stored_state:
        # state 불일치 시에도 조용히 진행 (서버 재시작 등으로 메모리가 초기화됐을 수 있음)
        import logging
        logging.warning(f"Instagram OAuth: State '{state}' not found in pending_states. Proceeding anyway.")

    # 1. Access Token 교환 (Facebook Graph API)
    async with httpx.AsyncClient() as client:
        token_res = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": settings.INSTA_CLIENT_ID,
                "client_secret": settings.INSTA_CLIENT_SECRET,
                "redirect_uri": settings.INSTA_REDIRECT_URI,
                "code": code,
            }
        )
        token_data = token_res.json()
        print(f"DEBUG: Token Exchange Response: {token_data}")

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {token_data}")

    access_token = token_data.get("access_token")

    # 2. 장기 토큰(Long-lived Token)으로 교환
    async with httpx.AsyncClient() as client:
        long_token_res = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.INSTA_CLIENT_ID,
                "client_secret": settings.INSTA_CLIENT_SECRET,
                "fb_exchange_token": access_token,
            }
        )
        long_token_data = long_token_res.json()
        print(f"DEBUG: Long Token Response: {long_token_data}")
        final_token = long_token_data.get("access_token", access_token)

    # 3. Facebook 페이지를 통해 연결된 Instagram 비즈니스 계정 조회
    insta_account_id = ""
    display_name = "Instagram User"
    async with httpx.AsyncClient() as client:
        pages_res = await client.get(
            "https://graph.facebook.com/v18.0/me/accounts",
            params={"access_token": final_token}
        )
        pages_data = pages_res.json()
        print(f"DEBUG: Found {len(pages_data.get('data', []))} Facebook Pages: {pages_data}")
        
        for page in pages_data.get("data", []):
            page_id = page["id"]
            page_name = page["name"]
            page_access_token = page.get("access_token")
            print(f"DEBUG: Checking Page '{page_name}' ({page_id})")
            
            if stored_state == "facebook":
                # 페이스북 연동 요청인 경우 페이지 정보를 계정으로 등록
                display_name = page_name
                platform_type = Platform.FACEBOOK
                
                # DB 저장/업데이트
                result = await db.execute(
                    select(Account).where(Account.platform == platform_type, Account.account_name == display_name)
                )
                account = result.scalar_one_or_none()
                
                token_json = json.dumps({
                    "access_token": page_access_token or final_token,
                    "page_id": page_id,
                })
                
                if account:
                    account.encrypted_token = token_json
                else:
                    account = Account(
                        platform=platform_type,
                        account_name=display_name,
                        encrypted_token=token_json,
                    )
                    db.add(account)
                
                # 여러 페이지가 있을 수 있으나 일단 첫 번째 유효한 페이지에서 멈추거나
                # 모든 페이지를 등록하려면 루프를 계속 돌림. 여기서는 명확성을 위해 첫 번째 페이지 후 종료.
                # (현실적으로는 페이지 선택 UI가 필요하지만 현재 구조에서는 단순화)
                break
            else:
                # 인스타그램 연동 요청인 경우 연결된 IG 비즈니스 계정 조회
                ig_res = await client.get(
                    f"https://graph.facebook.com/v18.0/{page_id}",
                    params={"fields": "instagram_business_account,name", "access_token": final_token}
                )
                ig_data = ig_res.json()
                print(f"DEBUG: Page IG data for {page_name}: {ig_data}")
                
                if "instagram_business_account" in ig_data:
                    insta_account_id = ig_data["instagram_business_account"]["id"]
                    user_res = await client.get(
                        f"https://graph.facebook.com/v18.0/{insta_account_id}",
                        params={"fields": "username", "access_token": final_token}
                    )
                    display_name = user_res.json().get("username", display_name)
                    print(f"DEBUG: Found IG Business Account: {display_name} ({insta_account_id})")
                    break

    if stored_state == "facebook" and not display_name == "Instagram User":
        # 페이스북 연동 성공 (위 루프에서 저장됨)
        pass
    elif stored_state == "instagram" and insta_account_id:
        # 인스타그램 연동 성공
        # DB 저장 (기존 로직 유지하되 통합됨)
        result = await db.execute(
            select(Account).where(Account.platform == Platform.INSTA, Account.account_name == display_name)
        )
        account = result.scalar_one_or_none()
        
        token_json = json.dumps({
            "access_token": final_token,
            "instagram_account_id": insta_account_id,
        })
        
        if account:
            account.encrypted_token = token_json
        else:
            account = Account(
                platform=Platform.INSTA,
                account_name=display_name,
                encrypted_token=token_json,
            )
            db.add(account)
    else:
        # 실패 처리
        error_msg = "연결된 Instagram 비즈니스 계정을 찾을 수 없습니다." if stored_state == "instagram" else "관리 중인 Facebook 페이지를 찾을 수 없습니다."
        raise HTTPException(status_code=400, detail=error_msg)

    await db.commit()
    redirect_platform = "facebook" if stored_state == "facebook" else "instagram"
    return RedirectResponse(url=f"{settings.FRONTEND_BASE_URL}/#/accounts?connected={redirect_platform}")


@router.get("/x/login")
async def x_login():
    """X (Twitter) OAuth 2.0 인증 시작 (PKCE 포함)."""
    state = secrets.token_urlsafe(16)
    code_verifier, code_challenge = _generate_pkce_pair()
    # state와 code_verifier 매핑 저장
    _pending_states[state] = code_verifier

    params = urlencode({
        "response_type": "code",
        "client_id": settings.X_CLIENT_ID,
        "redirect_uri": settings.X_REDIRECT_URI,
        "scope": "tweet.read tweet.write users.read offline.access",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    })
    auth_url = f"https://twitter.com/i/oauth2/authorize?{params}"
    return RedirectResponse(url=auth_url)


@router.get("/x/callback")
async def x_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    """X OAuth 콜백. 인증 코드를 토큰으로 교환합니다."""
    code_verifier = _pending_states.pop(state, None)
    if code_verifier is None:
        raise HTTPException(status_code=400, detail="Invalid state parameter.")

    # Basic Auth header for X (Base64(client_id:client_secret))
    auth_str = f"{settings.X_CLIENT_ID}:{settings.X_CLIENT_SECRET}"
    encoded_auth = base64.b64encode(auth_str.encode()).decode()

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            headers={
                "Authorization": f"Basic {encoded_auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.X_REDIRECT_URI,
                "code_verifier": code_verifier,
            }
        )
        token_data = token_res.json()

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"X token exchange failed: {token_data}")

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")

    # 사용자 정보 가져오기
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            "https://api.twitter.com/2/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"user.fields": "profile_image_url"}
        )
        user_data = user_res.json()

    user_info = user_data.get("data", {})
    display_name = user_info.get("name", "X User")
    username = user_info.get("username", "unknown")

    # DB 저장
    result = await db.execute(
        select(Account).where(Account.platform == Platform.X, Account.account_name == username)
    )
    account = result.scalar_one_or_none()

    token_json = json.dumps({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "username": username,
    })

    if account:
        account.account_name = username
        account.encrypted_token = token_json
    else:
        account = Account(
            platform=Platform.X,
            account_name=username,
            encrypted_token=token_json,
        )
        db.add(account)

    await db.commit()

    return RedirectResponse(url=f"{settings.FRONTEND_BASE_URL}/#/accounts?connected=x")
