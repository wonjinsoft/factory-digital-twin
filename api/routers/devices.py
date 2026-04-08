"""
파일: api/routers/devices.py
역할: 디바이스(스마트폰 등) 조회 및 제어 API
"""
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.redis_service import (
    get_device_state,
    get_all_device_ids,
    set_device_field,
    init_device,
)

router = APIRouter(prefix="/devices", tags=["devices"])

VALID_ACTIONS = {"flash_on", "flash_off"}


class ControlCommand(BaseModel):
    action: str  # flash_on | flash_off


class DeviceReport(BaseModel):
    """Android 앱이 주기적으로 올리는 실제 상태 보고"""
    battery: int        # 0~100
    flash: str          # "on" | "off"
    online: bool = True


# ── 조회 ──────────────────────────────────────────────────────────────

@router.get("")
async def get_devices():
    """등록된 전체 디바이스 목록 + 상태"""
    device_ids = await get_all_device_ids()
    devices = []
    for device_id in device_ids:
        state = await get_device_state(device_id)
        if state:
            devices.append(state)
    return {"total": len(devices), "devices": devices}


@router.get("/{device_id}")
async def get_device(device_id: str):
    """디바이스 1대 상태 조회"""
    state = await get_device_state(device_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"{device_id} 를 찾을 수 없어요")
    return state


# ── 제어 (가상→현실) ──────────────────────────────────────────────────

@router.post("/{device_id}/control")
async def control_device(device_id: str, cmd: ControlCommand):
    """
    3D 씬에서 디바이스 제어 명령 발행
    Android 앱이 WebSocket으로 이 변경을 수신해 실제 동작 수행
    """
    if cmd.action not in VALID_ACTIONS:
        raise HTTPException(status_code=400, detail=f"알 수 없는 명령: {cmd.action}")

    state = await get_device_state(device_id)
    if not state:
        # 첫 제어 시 자동 등록
        await init_device(device_id, "smartphone")

    flash_value = "on" if cmd.action == "flash_on" else "off"
    await set_device_field(device_id, "flash", flash_value)
    await set_device_field(device_id, "last_updated", datetime.now(timezone.utc).isoformat())

    return {"ok": True, "device_id": device_id, "action": cmd.action, "flash": flash_value}


# ── 상태 보고 (현실→가상) ──────────────────────────────────────────────

@router.post("/{device_id}/report")
async def report_device_state(device_id: str, report: DeviceReport):
    """
    Android 앱이 실제 상태를 서버에 보고
    → Redis 갱신 → WebSocket으로 3D 씬에 반영
    """
    state = await get_device_state(device_id)
    if not state:
        await init_device(device_id, "smartphone")

    await set_device_field(device_id, "battery", str(report.battery))
    await set_device_field(device_id, "flash", report.flash)
    await set_device_field(device_id, "online", "true" if report.online else "false")
    await set_device_field(device_id, "last_updated", datetime.now(timezone.utc).isoformat())

    return {"ok": True, "device_id": device_id}


# ── 등록 ──────────────────────────────────────────────────────────────

@router.delete("/{device_id}")
async def delete_device(device_id: str):
    """디바이스 삭제 (Redis 키 제거)"""
    from services.redis_service import get_redis
    from config import settings
    redis = await get_redis()
    key = settings.device_state_key(device_id)
    deleted = await redis.delete(key)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"{device_id} 를 찾을 수 없어요")
    return {"ok": True, "device_id": device_id}


@router.post("/{device_id}/register")
async def register_device(device_id: str, device_type: str = "smartphone"):
    """Android 앱 최초 실행 시 디바이스 등록"""
    state = await init_device(device_id, device_type)
    await set_device_field(device_id, "online", "true")
    await set_device_field(device_id, "last_updated", datetime.now(timezone.utc).isoformat())
    return {"ok": True, "device_id": device_id, "state": state}
