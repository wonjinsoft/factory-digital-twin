"""
파일: api/routers/machines.py
역할: 기계 조회 및 제어 API
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.redis_service import get_machine_state, get_all_machine_ids, set_machine_field

router = APIRouter()


# 제어 명령 모델
class ControlCommand(BaseModel):
    action: str  # power_on, power_off, material_load, material_unload


@router.get("/machines")
async def get_machines():
    """전체 기계 목록 + 상태 반환"""
    machine_ids = await get_all_machine_ids()
    machines = []
    for machine_id in machine_ids:
        state = await get_machine_state(machine_id)
        if state:
            machines.append(state)
    return {"total": len(machines), "machines": machines}


@router.get("/machines/{machine_id}")
async def get_machine(machine_id: str):
    """기계 1대 상태 조회"""
    state = await get_machine_state(machine_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"{machine_id} 를 찾을 수 없어요")
    return state


@router.post("/machines/{machine_id}/control")
async def control_machine(machine_id: str, cmd: ControlCommand):
    """기계 제어 명령 실행"""
    state = await get_machine_state(machine_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"{machine_id} 를 찾을 수 없어요")

    # 명령에 따라 상태 변경
    if cmd.action == "power_on":
        await set_machine_field(machine_id, "power", "on")
    elif cmd.action == "power_off":
        await set_machine_field(machine_id, "power", "off")
    elif cmd.action == "material_load":
        await set_machine_field(machine_id, "material_loaded", "true")
    elif cmd.action == "material_unload":
        await set_machine_field(machine_id, "material_loaded", "false")
    else:
        raise HTTPException(status_code=400, detail=f"알 수 없는 명령: {cmd.action}")

    return {"ok": True, "machine_id": machine_id, "action": cmd.action}