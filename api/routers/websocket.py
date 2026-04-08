"""
파일: api/routers/websocket.py
역할: WebSocket 엔드포인트 — 실시간 상태 푸시
"""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.redis_service import get_redis

router = APIRouter()


@router.websocket("/ws/state")
async def websocket_state(websocket: WebSocket):
    """Redis Pub/Sub → WebSocket으로 실시간 상태 전송"""
    await websocket.accept()
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(
        "factory/site1/state/update",
        "factory/site1/agent/status",
        "factory/site1/device/update",
    )

    # 새 연결 시 현재 디바이스 상태를 즉시 전송 (재연결 시 누락 방지)
    from services.redis_service import get_all_device_ids, get_device_state
    device_ids = await get_all_device_ids()
    for device_id in device_ids:
        state = await get_device_state(device_id)
        if state:
            await websocket.send_json({"type": "device_update", "data": state})

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                channel = message["channel"]
                if channel == "factory/site1/agent/status":
                    await websocket.send_json({"type": "agent_status", "data": data})
                elif channel == "factory/site1/device/update":
                    await websocket.send_json({"type": "device_update", "data": data})
                else:
                    await websocket.send_json({"type": "state_update", "data": data})
    except WebSocketDisconnect:
        await pubsub.unsubscribe(
            "factory/site1/state/update",
            "factory/site1/agent/status",
            "factory/site1/device/update",
        )