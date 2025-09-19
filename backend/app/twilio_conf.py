from pydantic_settings import BaseSettings, SettingsConfigDict

class TwilioSettings(BaseSettings):
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    # Use ONE of the two below:
    TWILIO_MESSAGING_SERVICE_SID: str | None = None  # preferred after upgrade
    TWILIO_FROM_NUMBER: str | None = None            # trial: your Twilio number in E.164
    BASE_URL: str = "http://localhost:8000"

    # Let it read a .env file when running locally; Docker will still pass env vars.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

twilio_settings = TwilioSettings()
