"""
파일: api/services/redis_service.py
역할: Redis에서 기계 상태를 읽고 쓰는 서비스
"""
import json
from datetime import datetime, timezone
import redis.asyncio as aioredis
from config import settings

# 전역 Redis 클라이언트 (싱글톤)
_redis = None


async def get_redis() -> aioredis.Redis:
    """Redis 클라이언트 반환 (연결 재사용)"""
    global _redis
    if _redis is None:
        _redis = await aioredis.from_url(
            settings.get_redis_url(),  # ← 이렇게 변경
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


# ── Device (스마트폰 등 외부 기기) ──────────────────────────────────────

async def get_device_state(device_id: str) -> dict | None:
    """Redis에서 디바이스 1대 상태 조회"""
    redis = await get_redis()
    key = settings.device_state_key(device_id)
    data = await redis.hgetall(key)
    if not data:
        return None
    return data


async def get_all_device_ids() -> list[str]:
    """Redis에 등록된 모든 디바이스 ID 목록 반환"""
    redis = await get_redis()
    pattern = f"factory:{settings.SITE_ID}:device:*:state"
    keys = []
    async for key in redis.scan_iter(match=pattern):
        device_id = key.split(":")[3]
        keys.append(device_id)
    return sorted(keys)


async def set_device_field(device_id: str, field: str, value: str) -> None:
    """Redis Hash에서 디바이스 상태 필드 변경 + Pub/Sub 발행"""
    redis = await get_redis()
    key = settings.device_state_key(device_id)
    await redis.hset(key, field, value)
    state = await redis.hgetall(key)
    await redis.publish(
        settings.device_pubsub_channel(),
        json.dumps(state)
    )


async def mark_device_offline(device_id: str) -> None:
    """디바이스를 오프라인 + 플래시 off 처리 후 Pub/Sub 발행"""
    redis = await get_redis()
    key = settings.device_state_key(device_id)
    await redis.hset(key, mapping={"online": "false", "flash": "off"})
    state = await redis.hgetall(key)
    await redis.publish(settings.device_pubsub_channel(), json.dumps(state))


async def init_device(device_id: str, device_type: str) -> dict:
    """디바이스 최초 등록 (키가 없을 때만 초기화) — 신규 생성 시 Pub/Sub 발행"""
    redis = await get_redis()
    key = settings.device_state_key(device_id)
    exists = await redis.exists(key)
    if not exists:
        initial = {
            "device_id": device_id,
            "device_type": device_type,
            "flash": "off",
            "battery": "100",
            "online": "false",
            "last_updated": "",
        }
        await redis.hset(key, mapping=initial)
        await redis.publish(settings.device_pubsub_channel(), json.dumps(initial))
        return initial
    return await redis.hgetall(key)