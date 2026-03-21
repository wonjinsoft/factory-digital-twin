# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
삼성전기 공장 설비 디지털 트윈 시스템 — 실시간 기계 상태 모니터링 + 3D 시각화 + 원격 제어

**기술 스택**: Python 3.11 · FastAPI · Redis 7.2 · React · Vite 4 · Tailwind CSS 3 · Zustand · React Three Fiber · Prometheus · Grafana
**컨테이너**: Podman 5.8.1 + podman-compose 1.5.0 (Windows 11)

---

## 개발 환경 시작

```bash
# 터미널 1 — Podman VM
podman machine start

# 터미널 2 — Redis + API + Prometheus + Grafana
cd C:\Projects\factory-digital-twin
podman-compose up -d

# 터미널 3 — 기계 시뮬레이터
python agents/mock_agent.py

# 터미널 4 — 프론트엔드
cd web && npm run dev
```

**로컬 접속**: 웹 http://localhost:5173 · API http://localhost:8000/docs · Grafana http://localhost:3000 (admin/admin) · Prometheus http://localhost:9090

---

## 배포 주소

| 서비스 | URL |
|--------|-----|
| React (Vercel) | https://factory-digital-twin-rho.vercel.app |
| FastAPI (Railway) | https://factory-digital-twin-production-7e7f.up.railway.app |
| GitHub | https://github.com/wonjinsoft/factory-digital-twin |

Railway 서비스 3개: `api` (FastAPI) · `redis` (Redis) · `mock-agent` (시뮬레이터)

---

## Redis 키 규칙 (절대 변경 금지)

```
기계 상태:     factory:{site_id}:machine:{machine_id}:state
Pub/Sub 채널:  factory/{site_id}/state/update
Agent 제어:    factory:control:mock_agent:paused
예시:          factory:site1:machine:M001:state
```

---

## 아키텍처 — 데이터 흐름

```
[Mock Agent]
  └─ 1초마다 M001~M020 상태를 Redis Hash에 저장
  └─ Pub/Sub 채널로 변경 발행
       ↓
[FastAPI WebSocket /ws/state]
  └─ Redis Pub/Sub 구독 → 연결된 클라이언트에 실시간 전송
       ↓
[React Zustand (machineStore)]
  └─ updateMachine() → MachineCard, AlarmPanel, 3D 씬 색상 갱신

[제어 흐름]
  React 버튼 → POST /machines/{id}/control
  → redis_service.set_machine_field() → Redis 수정 + Pub/Sub 발행
  → Mock Agent가 다음 사이클에 power/material 상태 유지
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

## 프론트엔드 핵심 구조

**상태 관리** — `web/src/stores/machineStore.ts` (Zustand)
- `machines: Record<string, Machine>` — 전 기계 상태 보관
- `updateMachine()` — WebSocket 수신 시 단일 기계 갱신

**URL 관리** — `web/src/config.ts`
- `isProd` 판별로 로컬/Railway URL 자동 분기
- API URL은 반드시 이 파일에서만 관리 (하드코딩 금지)

**WebSocket** — `web/src/hooks/useWebSocket.ts`
- 연결 끊김 시 3초 후 자동 재연결

---

## 3D 씬 핵심 동작 (`web/src/components/scene/FactoryScene.tsx`)

**기계 구분**
- M001: `Glb Test.gltf` 3D 모델 (`public/Glb Test/`)
- M002~M020: 박스 메시 (GLB 모델 없음)

**색상 로직** (`getMachineColor`)
- `critical` → 빨강 `#ef4444`
- `warning` → 주황 `#f59e0b`
- `power=off` → 회색 `#9ca3af`
- 정상 → 초록 `#22c55e`

**기계 배치**
- `GET /layout` → `api/layout.json`에서 좌표 로드
- 좌표 없는 기계는 `defaultPosition(index)` (5×4 그리드) 사용
- 현재 M001만 `layout.json`에 저장됨, 나머지는 기본 그리드
- 드래그 종료 시 `POST /layout` 자동 저장

**ConveyorBox 애니메이션**
- `material_loaded` `false→true` 변화 감지 → 웨이포인트 큐 생성
- 모든 기계 순서대로 경유 → 시작점 복귀 (lerp, LERP_SPEED=0.05)

---

## Mock Agent 동작 (`agents/mock_agent.py`)

기계 20대(M001~M020), 1초 주기, Redis Hash에 기록:

| 필드 | 설명 |
|------|------|
| `power` | `"on"` / `"off"` (제어 명령 유지) |
| `temperature` | 60~80°C |
| `rpm` | 800~1500 (power=on), 0 (power=off) |
| `material_loaded` | `"true"` / `"false"` (제어 명령 유지) |
| `alarm_level` | `critical` 2% · `warning` 5% · `none` 93% |
| `error_code` | `E101` / `E201` / `E000` |
| `last_updated` | ISO 8601 타임스탬프 |

`factory:control:mock_agent:paused = "true"` 이면 발행 일시정지

---

## 금지 패턴

- Redis 키 규칙 변경 금지
- `time.sleep()` 사용 금지 → `asyncio.sleep()` 사용
- API URL 하드코딩 금지 → `web/src/config.ts` 에서만 관리
- `<Canvas>`에 `onClick` 이벤트 추가 금지 → `selectedId` 초기화 버그 발생

---

## 다음 작업 (TODO)

- ⬜ 공장 도면 이미지를 3D 씬 바닥에 텍스처로 깔기
- ⬜ M002~M020 기계 배치 좌표도 `layout.json`에 저장되도록 개선
- ⬜ Oracle Cloud 가입 후 Railway → 무료 전환
- ⬜ 실제 공장 기계 3D 모델 교체 (현재 M001만 GLB 적용)
