"""
파일: agents/latency_test.py
역할: 데이터 전송 레이턴시 측정
"""
import asyncio
import json
import time
import redis.asyncio as aioredis

REDIS_URL = "redis://localhost:6379"
SITE_ID = "site1"


async def measure_latency():
    """Redis Pub/Sub 레이턴시 측정"""
    redis_pub = await aioredis.from_url(REDIS_URL, decode_responses=True)
    redis_sub = await aioredis.from_url(REDIS_URL, decode_responses=True)

    pubsub = redis_sub.pubsub()
    await pubsub.subscribe(f"factory/{SITE_ID}/state/update")

    latencies = []
    print("레이턴시 측정 시작 (10회)...")

    for i in range(10):
        # 발행 시간 기록
        send_time = time.time()
        await redis_pub.publish(
            f"factory/{SITE_ID}/state/update",
            json.dumps({"machine_id": "M001", "test": True, "sent_at": send_time})
        )

        # 수신 대기
        async for message in pubsub.listen():
            if message["type"] == "message":
                recv_time = time.time()
                data = json.loads(message["data"])
                if "sent_at" in data:
                    latency_ms = (recv_time - data["sent_at"]) * 1000
                    latencies.append(latency_ms)
                    print(f"  #{i+1}: {latency_ms:.2f}ms")
                    break

        await asyncio.sleep(0.1)

    print(f"\n결과:")
    print(f"  평균: {sum(latencies)/len(latencies):.2f}ms")
    print(f"  최소: {min(latencies):.2f}ms")
    print(f"  최대: {max(latencies):.2f}ms")
    print(f"  목표: 200ms 이내")
    print(f"  {'✅ 통과!' if max(latencies) < 200 else '❌ 튜닝 필요'}")

    await redis_pub.aclose()
    await redis_sub.aclose()


if __name__ == "__main__":
    asyncio.run(measure_latency())