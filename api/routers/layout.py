"""
파일: api/routers/layout.py
역할: 기계 위치 레이아웃 저장/조회 (JSON 파일 영속)
"""
import json
import os
from fastapi import APIRouter

router = APIRouter(prefix="/layout", tags=["layout"])

LAYOUT_FILE = "layout.json"


def load_layout() -> dict:
    if os.path.exists(LAYOUT_FILE):
        with open(LAYOUT_FILE, "r") as f:
            return json.load(f)
    return {}


def save_layout(data: dict):
    with open(LAYOUT_FILE, "w") as f:
        json.dump(data, f, indent=2)


@router.get("")
async def get_layout():
    """저장된 기계 위치 반환"""
    return {"layout": load_layout()}


@router.post("")
async def post_layout(body: dict):
    """기계 위치 저장 — body: { machine_id: {x, z} }"""
    save_layout(body)
    return {"ok": True}