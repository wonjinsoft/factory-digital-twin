# Factory Digital Twin — 프로젝트 가이드

## 프로젝트 개요
삼성전기 공장 설비 디지털 트윈 시스템
실시간 기계 상태 모니터링 + 3D 시각화 + 원격 제어

---

## 기술 스택
- **OS**: Windows 11
- **컨테이너**: Podman 5.8.1 + podman-compose 1.5.0
- **백엔드**: Python 3.11 · FastAPI · Redis 7.2
- **프론트엔드**: React · Vite 4 · Tailwind CSS 3 · Zustand · React Three Fiber
- **모니터링**: Prometheus + Grafana
- **배포**: Railway (백엔드) + Vercel (프론트엔드)

---

## 배포 주소
- **React (Vercel)**: https://factory-digital-twin-rho.vercel.app
- **FastAPI (Railway)**: https://factory-digital-twin-production-7e7f.up.railway.app
- **GitHub**: https://github.com/wonjinsoft/factory-digital-twin

---

## Railway 프로젝트 구조
| 프로젝트 | 서비스 | 역할 |
|----------|--------|------|
| factory-digital-twin | api | FastAPI 백엔드 |
| redis | redis | Redis 데이터 허브 |
| mock-agent | mock-agent | 설비 시뮬레이터 (24시간) |

---

## Redis 키 규칙 (절대 변경 금지)
```
기계 상태:  factory:{site_id}:machine:{machine_id}:state
Pub/Sub:    factory/{site_id}/state/update
예시:       factory:site1:machine:M001:state
```

---

## 프로젝트 구조
```
factory-digital-twin/
├── CLAUDE.md
├── docker-compose.yml         ← Redis + FastAPI + Prometheus + Grafana
├── .env.example
├── .gitignore
├── api/
│   ├── main.py               ← FastAPI 진입점 + CORS + Prometheus
│   ├── config.py             ← 설정값 + Redis 키 헬퍼
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── routers/
│   │   ├── machines.py       ← GET/POST /machines, POST /control
│   │   ├── alarms.py         ← GET /alarms, POST /acknowledge
│   │   └── websocket.py      ← WS /ws/state (Redis Pub/Sub)
│   └── services/
│       └── redis_service.py
├── agents/
│   ├── mock_agent.py         ← 기계 20대 시뮬레이터
│   ├── latency_test.py       ← 레이턴시 측정 (평균 1.31ms)
│   ├── requirements.txt      ← redis==5.0.8
│   └── Dockerfile            ← Railway 배포용
├── web/
│   └── src/
│       ├── App.tsx            ← 탭 전환 (대시보드/3D뷰)
│       ├── config.ts          ← API_URL, WS_URL
│       ├── stores/machineStore.ts
│       ├── hooks/useWebSocket.ts
│       ├── components/
│       │   ├── MachineCard.tsx
│       │   ├── ControlPanel.tsx
│       │   ├── AlarmPanel.tsx
│       │   └── scene/
│       │       ├── FactoryScene.tsx   ← R3F 3D 씬
│       │       └── MachinePopup.tsx   ← 인라인 스타일
│       └── public/Glb Test/          ← 3D 모델 파일
└── infra/
    └── prometheus.yml
```

---

## 로컬 개발 시작 순서 (매일)
```powershell
# 터미널 1
podman machine start

# 터미널 2
cd C:\Projects\factory-digital-twin
podman-compose up -d

# 터미널 3
python agents/mock_agent.py

# 터미널 4
cd C:\Projects\factory-digital-twin\web
npm run dev
```

## 접속 주소 (로컬)
- 웹 대시보드: http://localhost:5173
- API 문서:    http://localhost:8000/docs
- Grafana:     http://localhost:3000 (admin/admin)
- Prometheus:  http://localhost:9090

---

## 완료된 Sprint
- ✅ Sprint 0: Walking Skeleton
- ✅ Sprint 1: 기계 20대 상태 확장
- ✅ Sprint 2: React 대시보드 + WebSocket
- ✅ Sprint 3: 제어 API + 알람 패널
- ✅ Sprint 4: 3D 모델 파일 적용 (Glb Test.gltf)
- ✅ Sprint 5: R3F 3D 기본 뷰
- ✅ Sprint 6: 3D 인터랙션 (클릭, 팝업, 카메라)
- ✅ Sprint 7: Grafana 모니터링 + 레이턴시 측정
- ✅ GitHub 푸시 완료
- ✅ Railway 배포 완료 (FastAPI + Redis + Mock 에이전트)
- ✅ Vercel 배포 완료 (React)

---

## 다음 작업 (TODO)
- ⬜ Claude Code 설치 및 활용
- ⬜ 공장 도면 이미지를 3D 씬 바닥에 깔기
- ⬜ 기계 위치 드래그 UI (JSON 파일로 좌표 관리)
- ⬜ Oracle Cloud 가입 후 Railway → 무료 전환
- ⬜ 실제 공장 기계 3D 모델 교체

---

## 금지 패턴 (코딩 시 절대 하지 말 것)
- Redis 키 규칙 변경 금지
- time.sleep() 사용 금지 (asyncio.sleep() 사용)
- API URL 하드코딩 금지 (config.ts에서만 관리)
- Canvas에 onClick 이벤트 추가 금지 (selectedId 초기화 버그)