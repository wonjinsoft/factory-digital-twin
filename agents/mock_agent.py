"""
파일: agents/mock_agent.py
역할: 가짜 기계 20대의 상태를 Redis에 저장하는 시뮬레이터
      제어 명령(power, material_loaded)은 존중하고 덮어쓰지 않음
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


async def update_state(redis, machine_id: str) -> dict:
    """현재 Redis 상태를 읽어서 온도/RPM/알람만 랜덤 변경"""
    key = f"factory:{SITE_ID}:machine:{machine_id}:state"

    # 현재 저장된 상태 읽기
    current = await redis.hgetall(key)

    # power, material_loaded는 현재 값 유지 (제어 명령 존중)
    power = current.get("power", "on")
    material_loaded = current.get("material_loaded", "true")

    # 알람 랜덤 발생 (5% warning, 2% critical)
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
    redis = await aioredis.from_url(REDIS_URL, decode_responses=True)

    # 기계 ID 목록 생성 (M001 ~ M020)
    machine_ids = [f"M{i:03d}" for i in range(1, MACHINE_COUNT + 1)]
    print(f"Mock 에이전트 시작 — 기계 {MACHINE_COUNT}대", flush=True)

    tick = 0
    while True:
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