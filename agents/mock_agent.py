"""
파일: agents/mock_agent.py
역할: 가짜 기계 20대의 상태를 Redis에 저장하는 시뮬레이터
      제어 명령(power, material_loaded)은 존중하고 덮어쓰지 않음
      PAUSE_KEY 플래그가 "true"이면 발행 일시정지
"""
import sys
import asyncio
import json
import random
from datetime import datetime, timezone
import redis.asyncio as aioredis
sys.stdout.reconfigure(line_buffering=True)

# 설정
import os
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
SITE_ID = "site1"
MACHINE_COUNT = 20
PAUSE_KEY = "factory:control:mock_agent:paused"  # ✅ UI 토글 플래그


async def update_state(redis, machine_id: str) -> dict:
    """현재 Redis 상태를 읽어서 온도/RPM/알람만 랜덤 변경"""
    key = f"factory:{SITE_ID}:machine:{machine_id}:state"

    current = await redis.hgetall(key)

    power = current.get("power", "on")
    material_loaded = current.get("material_loaded", "true")

    alarm_roll = random.random()
    if alarm_roll < 0.02:
        alarm_level = "critical"
        error_code = "E101"
    elif alarm_roll < 0.07:
        alarm_level = "warning"
        error_code = "E201"
    else:
        alarm_level = "none"
        error_code = "E000"

    return {
        "machine_id": machine_id,
        "power": power,
        "temperature": str(round(random.uniform(60.0, 80.0), 1)),
        "rpm": str(random.randint(800, 1500) if power == "on" else 0),
        "material_loaded": material_loaded,
        "alarm_level": alarm_level,
        "error_code": error_code,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


async def run():
    """메인 루프 — 1초마다 20대 기계 상태를 Redis에 저장"""
    # Redis 연결 재시도 (컨테이너 기동 지연 대비)
    redis = None
    for attempt in range(1, 16):
        try:
            client = await aioredis.from_url(REDIS_URL, decode_responses=True)
            await client.ping()
            redis = client
            print(f"Redis 연결 성공 (시도 {attempt}회)", flush=True)
            break
        except Exception as e:
            print(f"Redis 연결 대기 중... ({attempt}/15) {e}", flush=True)
            await asyncio.sleep(2)

    if redis is None:
        print("Redis 연결 실패 — 종료합니다.", flush=True)
        return

    machine_ids = [f"M{i:03d}" for i in range(1, MACHINE_COUNT + 1)]
    print(f"Mock 에이전트 시작 — 기계 {MACHINE_COUNT}대", flush=True)

    tick = 0
    while True:
        # ✅ 일시정지 플래그 확인 — "true"면 발행 건너뜀
        is_paused = await redis.get(PAUSE_KEY)
        if is_paused == "true":
            await asyncio.sleep(1)
            continue

        tick += 1
        for machine_id in machine_ids:
            state = await update_state(redis, machine_id)
            key = f"factory:{SITE_ID}:machine:{machine_id}:state"
            await redis.hset(key, mapping=state)
            await redis.publish(
                f"factory/{SITE_ID}/state/update",
                json.dumps(state)
            )

        if tick % 10 == 0:
            print(f"상태 업데이트 완료 — {MACHINE_COUNT}대 / tick {tick}", flush=True)

        await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(run())