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
    await pubsub.subscribe("factory/site1/state/update", "factory/site1/agent/status")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                if message["channel"] == "factory/site1/agent/status":
                    await websocket.send_json({"type": "agent_status", "data": data})
                else:
                    await websocket.send_json({"type": "state_update", "data": data})
    except WebSocketDisconnect:
        await pubsub.unsubscribe("factory/site1/state/update", "factory/site1/agent/status")