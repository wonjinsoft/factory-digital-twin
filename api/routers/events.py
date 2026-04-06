"""
파일: api/routers/events.py
역할: 설비 이벤트 이력 조회 API
"""
import json
from fastapi import APIRouter
from services.redis_service import get_redis

router = APIRouter(prefix="/events", tags=["events"])

EVENTS_KEY = "factory:site1:events"
MAX_EVENTS = 100


async def record_event(machine_id: str, event_type: str, detail: str):
    """이벤트를 Redis 리스트에 기록"""
    redis = await get_redis()
    from datetime import datetime, timezone
    event = json.dumps({
        "machine_id": machine_id,
        "event_type": event_type,
        "detail": detail,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    await redis.lpush(EVENTS_KEY, event)
    await redis.ltrim(EVENTS_KEY, 0, MAX_EVENTS - 1)


@router.get("")
async def get_events(limit: int = 30):
    """최근 이벤트 이력 반환"""
    redis = await get_redis()
    raw = await redis.lrange(EVENTS_KEY, 0, limit - 1)
    events = [json.loads(r) for r in raw]
    return {"total": len(events), "events": events}
