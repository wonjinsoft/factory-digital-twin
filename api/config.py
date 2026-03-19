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
    API_PORT: int = 8000
    SITE_ID: str = "site1"

    def machine_state_key(self, machine_id: str) -> str:
        """factory:{site_id}:machine:{machine_id}:state"""
        return f"factory:{self.SITE_ID}:machine:{machine_id}:state"

    def pubsub_channel(self) -> str:
        """factory/{site_id}/state/update"""
        return f"factory/{self.SITE_ID}/state/update"

settings = Settings()
