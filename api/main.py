"""
파일: api/main.py
역할: FastAPI 앱 진입점
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from config import settings
from db.base import engine, Base
from routers.machines import router as machines_router
from routers.alarms import router as alarms_router
from routers.websocket import router as ws_router
from routers.agent_control import router as agent_control_router
from routers.layout import router as layout_router
from routers.events import router as events_router
from routers.devices import router as devices_router
from routers.auth import router as auth_router
from routers.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # 누락 컬럼 자동 추가 (기존 테이블 대응)
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'user'"
        ))
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending'"
        ))
    yield


app = FastAPI(
    title="Factory Digital Twin API",
    description="공장 설비 디지털 트윈 백엔드 API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://factory-digital-twin-rho.vercel.app"
        ],
    
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
app.include_router(layout_router)
app.include_router(events_router)
app.include_router(devices_router)
app.include_router(auth_router)
app.include_router(admin_router)

@app.get("/health")
async def health_check():
    """헬스체크 엔드포인트"""
    return {"status": "ok", "site_id": settings.SITE_ID, "version": "v0.1"}

