# CLAUDE.md — Mock Agent

## 파일

```
agents/
└── mock_agent.py   # 기계 20대 시뮬레이터, 1초 주기로 Redis에 기록
```

---

## 동작 방식

- 기계 20대(M001~M020), **1초 주기**, Redis Hash에 기록 후 Pub/Sub 발행
- `factory:control:mock_agent:paused = "true"` 이면 발행 일시정지

| 필드 | 설명 |
|------|------|
| `power` | `"on"` / `"off"` (제어 명령 유지) |
| `temperature` | 60~80°C |
| `rpm` | 800~1500 (power=on), 0 (power=off) |
| `material_loaded` | `"true"` / `"false"` (제어 명령 유지) |
| `alarm_level` | `critical` 2% · `warning` 5% · `none` 93% |
| `error_code` | `E101` / `E201` / `E000` |
| `last_updated` | ISO 8601 타임스탬프 |

---

## Redis 키 규칙 (절대 변경 금지)

```
기계 상태:     factory:{site_id}:machine:{machine_id}:state
Pub/Sub 채널:  factory/{site_id}/state/update
Agent 제어:    factory:control:mock_agent:paused
```

---

## 코딩 규칙

- `time.sleep()` 사용 금지 → `asyncio.sleep()` 사용
- Redis 키 규칙 변경 금지
- Railway 배포 시 `mock-agent` 서비스로 실행됨
