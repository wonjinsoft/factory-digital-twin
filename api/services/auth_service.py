"""
파일: api/services/auth_service.py
역할: JWT 발급·검증 + Google/Kakao OAuth 유저 정보 조회
"""
from datetime import datetime, timedelta, timezone

import httpx
from jose import JWTError, jwt

from config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일


# ── JWT ───────────────────────────────────────────────────────────────

def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """유효하지 않으면 JWTError 발생"""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])


# ── Google OAuth ──────────────────────────────────────────────────────

async def get_google_user_info(code: str, redirect_uri: str) -> dict:
    """인가 코드 → 액세스 토큰 → 유저 정보"""
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_res.raise_for_status()
        access_token = token_res.json()["access_token"]

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_res.raise_for_status()
        return user_res.json()  # {id, email, name, picture}


# ── Kakao OAuth ───────────────────────────────────────────────────────

async def get_kakao_user_info(code: str, redirect_uri: str) -> dict:
    """인가 코드 → 액세스 토큰 → 유저 정보"""
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_res.raise_for_status()
        access_token = token_res.json()["access_token"]

        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_res.raise_for_status()
        data = user_res.json()

        kakao_account = data.get("kakao_account", {})
        profile = kakao_account.get("profile", {})
        return {
            "id": str(data["id"]),
            "email": kakao_account.get("email", ""),
            "name": profile.get("nickname", ""),
            "picture": profile.get("profile_image_url", ""),
        }
