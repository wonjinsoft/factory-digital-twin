"""
파일: api/routers/layout.py
역할: 기계 위치 레이아웃 저장/조회 (Redis 영속)
"""
import json
from fastapi import APIRouter
from services.redis_service import get_redis

router = APIRouter(prefix="/layout", tags=["layout"])

LAYOUT_KEY = "factory:site1:layout"


@router.get("")
async def get_layout():
    """저장된 기계 위치 반환"""
    redis = await get_redis()
    data = await redis.get(LAYOUT_KEY)
    layout = json.loads(data) if data else {}
    return {"layout": layout}


@router.post("")
async def post_layout(body: dict):
    """기계 위치 저장 — body: { machine_id: {x, z} }"""
    redis = await get_redis()
    await redis.set(LAYOUT_KEY, json.dumps(body))
    return {"ok": True}