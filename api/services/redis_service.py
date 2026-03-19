"""
파일: api/services/redis_service.py
역할: Redis에서 기계 상태를 읽고 쓰는 서비스
"""
import json
import redis.asyncio as aioredis
from config import settings

# 전역 Redis 클라이언트 (싱글톤)
_redis = None


async def get_redis() -> aioredis.Redis:
    """Redis 클라이언트 반환 (연결 재사용)"""
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(
            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
            decode_responses=True,
        )
    return _redis


async def get_machine_state(machine_id: str) -> dict | None:
    """Redis에서 기계 1대 상태 조회"""
    redis = await get_redis()
    key = settings.machine_state_key(machine_id)
    data = await redis.hgetall(key)
    if not data:
        return None
    return data


async def get_all_machine_ids() -> list[str]:
    """Redis에 저장된 모든 기계 ID 목록 반환"""
    redis = await get_redis()
    pattern = f"factory:{settings.SITE_ID}:machine:M*:state"
    keys = []
    async for key in redis.scan_iter(match=pattern):
        machine_id = key.split(":")[3]
        keys.append(machine_id)
    return sorted(keys)


async def set_machine_field(machine_id: str, field: str, value: str) -> None:
    """Redis Hash에서 기계 상태 필드 1개 변경 + Pub/Sub 발행"""
    redis = await get_redis()
    key = settings.machine_state_key(machine_id)

    # 필드 업데이트
    await redis.hset(key, field, value)

    # 변경된 전체 상태 조회 후 이벤트 발행
    state = await redis.hgetall(key)
    await redis.publish(
        settings.pubsub_channel(),
        json.dumps(state)
    )