# CLAUDE.md — 프로젝트 루트

삼성전기 공장 설비 디지털 트윈 시스템 — 실시간 기계 상태 모니터링 + 3D 시각화 + 원격 제어

**기술 스택**: Python 3.11 · FastAPI · Redis 7.2 · React · Vite 4 · Tailwind CSS 3 · Zustand · React Three Fiber · Prometheus · Grafana  
**컨테이너**: Podman 5.8.1 + podman-compose 1.5.0 (Windows 11)

> 영역별 상세 지침은 각 디렉토리의 CLAUDE.md를 참조:
> - **백엔드/에이전트** → `api/CLAUDE.md`, `agents/CLAUDE.md`
> - **프론트엔드** → `web/CLAUDE.md`
> - **인프라** → `infra/CLAUDE.md`

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

## Redis 키 규칙 (절대 변경 금지)

```
기계 상태:     factory:{site_id}:machine:{machine_id}:state
Pub/Sub 채널:  factory/{site_id}/state/update
Agent 제어:    factory:control:mock_agent:paused
예시:          factory:site1:machine:M001:state
```

---

## 다음 작업 (TODO)

- ⬜ 공장 도면 이미지를 3D 씬 바닥에 텍스처로 깔기
- ⬜ M002~M020 기계 배치 좌표도 `layout.json`에 저장되도록 개선
- ⬜ Oracle Cloud 가입 후 Railway → 무료 전환
- ⬜ 실제 공장 기계 3D 모델 교체 (현재 M001만 GLB 적용)
