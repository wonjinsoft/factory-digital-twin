"""
파일: api/main.py
역할: FastAPI 앱 진입점
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from config import settings
from routers.machines import router as machines_router
from routers.alarms import router as alarms_router
from routers.websocket import router as ws_router
from routers.agent_control import router as agent_control_router

app = FastAPI(
    title="Factory Digital Twin API",
    description="공장 설비 디지털 트윈 백엔드 API",
    version="0.1.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus 메트릭 설정
Instrumentator().instrument(app).expose(app)

# 라우터 등록
app.include_router(machines_router)
app.include_router(alarms_router)
app.include_router(ws_router)
app.include_router(agent_control_router)

@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    return {"status": "ok", "site_id": settings.SITE_ID, "version": "v0.1"}

@app.get("/debug")
async def debug():
    """환경변수 확인용"""
    return {
        "redis_url": settings.REDIS_URL,
        "get_redis_url": settings.get_redis_url(),
    }