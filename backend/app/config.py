from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
EXPORT_DIR = DATA_DIR / "exports"
DB_PATH = DATA_DIR / "joklob.db"


class Settings(BaseSettings):
    app_name: str = "JOKLOB"
    secret_key: str = "joklob-dev-change-in-production-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 14
    database_url: str = f"sqlite:///{DB_PATH.as_posix()}"
    max_upload_mb: int = 20
    compute_timeout_seconds: int = 12
    share_default_hours: int = 48
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"


settings = Settings()
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EXPORT_DIR.mkdir(parents=True, exist_ok=True)
