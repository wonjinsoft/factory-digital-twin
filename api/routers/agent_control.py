import json
from fastapi import APIRouter
from services.redis_service import get_redis

router = APIRouter(prefix="/control/agent", tags=["agent-control"])

PAUSE_KEY = "factory:control:mock_agent:paused"
AGENT_STATUS_CHANNEL = "factory/site1/agent/status"


@router.post("/toggle")
async def toggle_mock_agent():
    redis = await get_redis()
    current = await redis.get(PAUSE_KEY)
    new_paused = current != "true"
    await redis.set(PAUSE_KEY, "true" if new_paused else "false")
    await redis.publish(AGENT_STATUS_CHANNEL, json.dumps({"paused": new_paused}))
    return {
        "paused": new_paused,
        "message": "Mock Agent paused" if new_paused else "Mock Agent resumed",
    }


@router.get("/status")
async def get_mock_agent_status():
    redis = await get_redis()
    current = await redis.get(PAUSE_KEY)
    return {"paused": current == "true"}
