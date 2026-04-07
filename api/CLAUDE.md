# CLAUDE.md — 백엔드 (FastAPI + Redis)

## 디렉토리 구조

```
api/
├── main.py              # FastAPI 앱 진입점, 라우터 등록, CORS
├── config.py            # 환경변수 (REDIS_URL 등)
├── routers/
│   ├── machines.py      # GET/POST /machines
│   ├── alarms.py        # GET /alarms, POST /alarms/{id}/acknowledge
│   ├── layout.py        # GET/POST /layout → api/layout.json
│   ├── websocket.py     # WS /ws/state (Redis Pub/Sub 브릿지)
│   ├── agent_control.py # POST /control/agent/toggle, GET /control/agent/status
│   └── events.py        # 이벤트 타임라인 (알람 발생 이력)
└── services/
    └── redis_service.py # Redis 연결·읽기·쓰기·Pub/Sub 헬퍼
```

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/machines` | 전체 기계 목록 |
| GET | `/machines/{id}` | 특정 기계 상태 |
| POST | `/machines/{id}/control` | 제어 (`power_on`, `power_off`, `material_load`, `material_unload`) |
| GET | `/alarms` | 활성 알람 목록 (`alarm_level != "none"`) |
| POST | `/alarms/{id}/acknowledge` | 알람 확인 처리 |
| WS | `/ws/state` | Redis Pub/Sub → 실시간 상태 스트림 |
| GET/POST | `/layout` | 기계 배치 좌표 조회/저장 (`api/layout.json`) |
| POST | `/control/agent/toggle` | Mock Agent 일시정지/재개 |
| GET | `/control/agent/status` | Agent 일시정지 상태 조회 |

---

## Redis 키 규칙 (절대 변경 금지)

```
기계 상태:     factory:{site_id}:machine:{machine_id}:state
Pub/Sub 채널:  factory/{site_id}/state/update
Agent 제어:    factory:control:mock_agent:paused
예시:          factory:site1:machine:M001:state
```

---

## 코딩 규칙

- `time.sleep()` 사용 금지 → `asyncio.sleep()` 사용
- Redis 키 규칙 변경 금지
- 비동기 엔드포인트는 반드시 `async def` 사용
- `redis_service.py`를 통해서만 Redis 접근 (직접 redis 클라이언트 호출 금지)

---

## 배포

- Railway 플랫폼, `api/Dockerfile` 기준으로 빌드
- 환경변수 `REDIS_URL`은 Railway 대시보드에서 주입
- 로컬: `uvicorn main:app --reload --port 8000`
