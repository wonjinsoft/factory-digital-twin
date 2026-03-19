# Factory Digital Twin — Cline 전역 지시 파일

## 개발 환경
- OS: Windows
- 컨테이너: Podman (docker 명령어 사용 금지, podman 사용)
- 터미널: PowerShell
- Python: 3.11
- Node.js: 24

## 프로젝트 개요
공장 설비 디지털 트윈 시스템.
Redis 상태 저장 + FastAPI 백엔드 + React + React Three Fiber 3D 시각화.

## 모노레포 구조
api/       FastAPI 백엔드
web/       React + R3F 프론트엔드
agents/    Mock 에이전트
schemas/   JSON Schema

## Redis 키 규칙 — 절대 변경 금지
factory:{site_id}:machine:{machine_id}:state
site_id 기본값: site1
machine_id 형식: M001, M002 ...
안녕! 잘 작동하고 있어?
## WebSocket 메시지 포맷 — 절대 변경 금지
{
  "type": "state_update",
  "machine_id": "M001",
  "site_id": "site1",
  "data": {},
  "timestamp": "ISO8601"
}

## 코딩 규칙
- Python: asyncio 기반, redis.asyncio 사용, 타입 힌트 필수
- 설정값 하드코딩 금지 — config.py Settings 클래스에서만
- 경로: pathlib.Path() 사용
- 한국어 주석 작성
- 함수 하나 = 역할 하나 (20줄 이하)
- podman 명령어 사용 (docker 금지)

## 금지 패턴
- time.sleep() → await asyncio.sleep()
- print() → logger.info()
- 동기 Redis 클라이언트
- 하드코딩 IP/포트/시크릿