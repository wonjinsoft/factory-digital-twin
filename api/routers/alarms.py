"""
파일: api/routers/alarms.py
역할: 알람 조회 및 확인 처리 API
"""
from fastapi import APIRouter, HTTPException
from services.redis_service import get_all_machine_ids, get_machine_state, set_machine_field

router = APIRouter()


@router.get("/alarms")
async def get_alarms():
    """활성 알람 목록 반환 (alarm_level이 none이 아닌 기계)"""
    machine_ids = await get_all_machine_ids()
    alarms = []

    for machine_id in machine_ids:
        state = await get_machine_state(machine_id)
        if state and state.get("alarm_level", "none") != "none":
            alarms.append({
                "machine_id": machine_id,
                "alarm_level": state["alarm_level"],
                "error_code": state.get("error_code", "E000"),
                "temperature": state.get("temperature", "0"),
                "last_updated": state.get("last_updated", ""),
            })

    return {"total": len(alarms), "alarms": alarms}


@router.post("/alarms/{machine_id}/acknowledge")
async def acknowledge_alarm(machine_id: str):
    """알람 확인 처리 — alarm_level을 none으로 초기화"""
    state = await get_machine_state(machine_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"{machine_id} 를 찾을 수 없어요")

    await set_machine_field(machine_id, "alarm_level", "none")
    await set_machine_field(machine_id, "error_code", "E000")

    return {"ok": True, "machine_id": machine_id, "message": "알람 확인 처리 완료"}