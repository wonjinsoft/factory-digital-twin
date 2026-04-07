# CLAUDE.md — 프론트엔드 (React + Three.js)

## 디렉토리 구조

```
web/src/
├── App.tsx                      # 레이아웃 루트, 모바일/데스크탑 분기
├── config.ts                    # API/WS URL 관리 (isProd 분기)
├── stores/
│   └── machineStore.ts          # Zustand 전역 상태
├── hooks/
│   └── useWebSocket.ts          # WebSocket 연결·재연결
└── components/
    ├── MachineCard.tsx           # 기계 상태 카드 (목록)
    ├── AlarmPanel.tsx            # 활성 알람 목록
    ├── ControlPanel.tsx          # 기계 제어 버튼 (power, material)
    ├── KpiPanel.tsx              # KPI 요약 패널
    ├── EventTimeline.tsx         # 알람 발생 이벤트 타임라인
    └── scene/
        ├── FactoryScene.tsx      # R3F Canvas + 씬 루트
        ├── MachineModels.tsx     # M001 GLB 모델 / M002~M020 박스 메시
        ├── MachinePopup.tsx      # 3D 씬 내 기계 클릭 팝업
        ├── CameraController.tsx  # lerp 기반 카메라 포커스
        ├── ConveyorBox.tsx       # 컨베이어 애니메이션 박스
        ├── DragController.tsx    # 기계 드래그 배치
        ├── FloorSlab.tsx         # 바닥 슬라브 메시
        └── machineColor.ts       # 상태별 색상 매핑
```

---

## 상태 관리 (Zustand)

**`web/src/stores/machineStore.ts`**
- `machines: Record<string, Machine>` — 전 기계 상태 보관
- `updateMachine(id, data)` — WebSocket 수신 시 단일 기계 갱신
- `selectedId: string | null` — 3D 씬에서 선택된 기계 ID

---

## URL 관리

**`web/src/config.ts`** — API URL은 반드시 이 파일에서만 관리 (하드코딩 금지)
- `isProd` 판별로 로컬(`localhost`) / Railway URL 자동 분기
- WS URL도 동일 파일에서 관리

---

## WebSocket

**`web/src/hooks/useWebSocket.ts`**
- `/ws/state` 연결 → JSON 파싱 → `machineStore.updateMachine()` 호출
- 연결 끊김 시 **3초 후 자동 재연결**

---

## 3D 씬 (`web/src/components/scene/`)

### 기계 렌더링
- **M001**: `public/Glb Test/Glb Test.gltf` 3D 모델
- **M002~M020**: 박스 메시 (GLB 모델 없음)

### 색상 로직 (`machineColor.ts` — `getMachineColor`)
| 상태 | 색상 |
|------|------|
| `alarm_level = critical` | 빨강 `#ef4444` |
| `alarm_level = warning` | 주황 `#f59e0b` |
| `power = off` | 회색 `#9ca3af` |
| 정상 | 초록 `#22c55e` |

### 기계 배치
- `GET /layout` → `api/layout.json`에서 좌표 로드
- 좌표 없는 기계는 `defaultPosition(index)` (5×4 그리드) 사용
- 현재 M001만 `layout.json`에 저장됨, 나머지는 기본 그리드
- 드래그 종료 시 `POST /layout` 자동 저장

### CameraController
- `ref + lerp` 방식으로 기계 선택 시 부드럽게 포커스 이동
- `selectedId` 변경 → 해당 기계 좌표로 카메라 lerp

### ConveyorBox 애니메이션
- `material_loaded` `false→true` 변화 감지 → 웨이포인트 큐 생성
- 모든 기계 순서대로 경유 → 시작점 복귀 (lerp, `LERP_SPEED=0.05`)

---

## 금지 패턴

- API URL 하드코딩 금지 → `web/src/config.ts` 에서만 관리
- `<Canvas>`에 `onClick` 이벤트 추가 금지 → `selectedId` 초기화 버그 발생
- 3D 씬 내 이벤트는 개별 메시(`<mesh onClick>`)에만 부착

---

## 빌드 · 배포

- Vercel 배포, `web/` 디렉토리 루트
- 빌드 명령: `npm run build` (TypeScript 오류 시 배포 실패)
- 로컬 개발: `npm run dev` (포트 5173)
- 환경변수 없음 — URL은 `config.ts`의 `isProd` 플래그로 분기
