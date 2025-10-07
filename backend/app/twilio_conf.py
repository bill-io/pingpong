from typing import Optional

from pydantic import ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class TwilioSettings(BaseSettings):
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    # Use ONE of the two below:
    TWILIO_MESSAGING_SERVICE_SID: str | None = None  # preferred after upgrade
    TWILIO_FROM_NUMBER: str | None = None  # trial: your Twilio number in E.164
    BASE_URL: str = "http://localhost:8000"

    # Let it read a .env file when running locally; Docker will still pass env vars.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


_cached_settings: TwilioSettings | None = None


def get_twilio_settings() -> TwilioSettings | None:
    global _cached_settings
    if _cached_settings is not None:
        return _cached_settings

    try:
        _cached_settings = TwilioSettings()
    except ValidationError:
        _cached_settings = None
    return _cached_settings
