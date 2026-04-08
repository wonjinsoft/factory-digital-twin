"""
파일: api/routers/admin.py
역할: 관리자 전용 — 가입 대기 목록 조회 + 승인/거부
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.models import User
from db.session import get_db
from deps import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def list_users(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    """전체 사용자 목록 (status 필터 가능: pending / approved / rejected)"""
    query = select(User).order_by(User.created_at.desc())
    if status:
        query = query.where(User.status == status)
    result = await db.execute(query)
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "picture": u.picture,
            "role": u.role,
            "status": u.status,
            "oauth_provider": u.oauth_provider,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = await _get_user_or_404(db, user_id)
    user.status = "approved"
    await db.commit()
    return {"ok": True, "user_id": user_id, "status": "approved"}


@router.post("/users/{user_id}/reject")
async def reject_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = await _get_user_or_404(db, user_id)
    user.status = "rejected"
    await db.commit()
    return {"ok": True, "user_id": user_id, "status": "rejected"}


@router.post("/users/{user_id}/set-admin")
async def set_admin(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = await _get_user_or_404(db, user_id)
    user.role = "admin"
    await db.commit()
    return {"ok": True, "user_id": user_id, "role": "admin"}


async def _get_user_or_404(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없음")
    return user
