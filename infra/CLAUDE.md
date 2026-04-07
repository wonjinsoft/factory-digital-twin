# CLAUDE.md — 인프라 (Podman · Prometheus · Grafana)

## 파일

```
infra/
└── prometheus.yml       # Prometheus 스크레이프 설정
docker-compose.yml       # Podman Compose 전체 서비스 정의
```

---

## 서비스 구성 (docker-compose.yml)

| 서비스 | 포트 | 설명 |
|--------|------|------|
| `api` | 8000 | FastAPI 백엔드 |
| `redis` | 6379 | Redis 7.2 |
| `prometheus` | 9090 | 메트릭 수집 |
| `grafana` | 3000 | 대시보드 (admin/admin) |

---

## 로컬 실행

```bash
# Podman VM 시작 (Windows 필수)
podman machine start

# 전체 서비스 기동
podman-compose up -d

# 서비스 중지
podman-compose down
```

---

## Prometheus

- `infra/prometheus.yml` — FastAPI `/metrics` 엔드포인트 스크레이프
- Grafana 데이터소스로 Prometheus 연결 (http://prometheus:9090)

---

## 주의사항

- Windows 11 + Podman 5.8.1 환경 — Docker Desktop 미사용
- `podman-compose` 1.5.0 사용 (`docker compose` 명령 아님)
- Railway 배포 시 인프라 파일은 사용하지 않음 (Railway 자체 서비스 이용)
