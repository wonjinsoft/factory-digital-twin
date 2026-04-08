from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        case_sensitive=False,
    )

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = ""  # Railway Redis URL
    API_PORT: int = 8000
    SITE_ID: str = "site1"

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/factorytwin"

    # JWT
    JWT_SECRET: str = "change-me-in-production"

    # OAuth — Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # OAuth — Kakao
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""

    # 현재 API 베이스 URL (OAuth 콜백 URI 생성에 사용)
    API_BASE_URL: str = "http://localhost:8000"

    def get_redis_url(self) -> str:
        """Railway 환경이면 REDIS_URL, 로컬이면 REDIS_HOST:PORT"""
        if self.REDIS_URL:
            return self.REDIS_URL
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"

    def machine_state_key(self, machine_id: str) -> str:
        """factory:{site_id}:machine:{machine_id}:state"""
        return f"factory:{self.SITE_ID}:machine:{machine_id}:state"

    def pubsub_channel(self) -> str:
        """factory/{site_id}/state/update"""
        return f"factory/{self.SITE_ID}/state/update"

    def device_state_key(self, device_id: str) -> str:
        """factory:{site_id}:device:{device_id}:state"""
        return f"factory:{self.SITE_ID}:device:{device_id}:state"

    def device_pubsub_channel(self) -> str:
        """factory/{site_id}/device/update"""
        return f"factory/{self.SITE_ID}/device/update"

settings = Settings()