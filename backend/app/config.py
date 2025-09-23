# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, case_sensitive=False)

    APP_NAME: str = "PingPong Notifier"
    APP_ENV: str = "dev"
    SECRET_KEY: str = "dev-key"
    TZ: str = "Europe/Athens"
    PORT: int = 8000

    FRONTEND_ORIGINS: str = "http://localhost:5173"  # comma-separated if multiple

settings = Settings()
