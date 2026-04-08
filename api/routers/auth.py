"""
파일: api/routers/auth.py
역할: OAuth 2.0 로그인 (Google / Kakao) + /me
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.models import User
from db.session import get_db
from deps import get_current_user
from services.auth_service import (
    create_access_token,
    get_google_user_info,
    get_kakao_user_info,
)

router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = "https://factory-digital-twin-rho.vercel.app"


def _google_redirect_uri() -> str:
    return f"{settings.API_BASE_URL}/auth/google/callback"


def _kakao_redirect_uri() -> str:
    return f"{settings.API_BASE_URL}/auth/kakao/callback"


# ── Google ─────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login():
    """Google OAuth 인가 URL로 리다이렉트"""
    params = (
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={_google_redirect_uri()}"
        f"&response_type=code"
        f"&scope=openid email profile"
    )
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        info = await get_google_user_info(code, _google_redirect_uri())
    except Exception:
        raise HTTPException(status_code=400, detail="Google 인증 실패")

    user = await _upsert_user(db, provider="google", oauth_id=info["id"],
                              email=info["email"], name=info["name"],
                              picture=info.get("picture"))
    token = create_access_token(user.id, user.role)
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={token}&status={user.status}")


# ── Kakao ──────────────────────────────────────────────────────────────

@router.get("/kakao")
async def kakao_login():
    """Kakao OAuth 인가 URL로 리다이렉트"""
    params = (
        f"client_id={settings.KAKAO_CLIENT_ID}"
        f"&redirect_uri={_kakao_redirect_uri()}"
        f"&response_type=code"
    )
    return RedirectResponse(f"https://kauth.kakao.com/oauth/authorize?{params}")


@router.get("/kakao/callback")
async def kakao_callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        info = await get_kakao_user_info(code, _kakao_redirect_uri())
    except Exception:
        raise HTTPException(status_code=400, detail="Kakao 인증 실패")

    user = await _upsert_user(db, provider="kakao", oauth_id=info["id"],
                              email=info["email"], name=info["name"],
                              picture=info.get("picture"))
    token = create_access_token(user.id, user.role)
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={token}&status={user.status}")


# ── Me ─────────────────────────────────────────────────────────────────

@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture,
        "role": current_user.role,
        "status": current_user.status,
    }


# ── 내부 헬퍼 ──────────────────────────────────────────────────────────

async def _upsert_user(
    db: AsyncSession,
    provider: str,
    oauth_id: str,
    email: str,
    name: str,
    picture: str | None,
) -> User:
    """기존 유저면 반환, 신규면 pending 상태로 생성"""
    result = await db.execute(
        select(User).where(User.oauth_provider == provider, User.oauth_id == oauth_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            email=email,
            name=name,
            picture=picture,
            oauth_provider=provider,
            oauth_id=oauth_id,
            role="user",
            status="pending",
        )
        db.add(user)

    else:
        # 프로필 최신화
        user.name = name
        user.picture = picture

    await db.commit()
    await db.refresh(user)
    return user
