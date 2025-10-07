from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable
from zoneinfo import ZoneInfo

from twilio.base.exceptions import TwilioException
from twilio.rest import Client

from .config import settings
from .models import Assignment, Player, Table
from .twilio_conf import TwilioSettings, get_twilio_settings


class NotificationError(RuntimeError):
    """Raised when a notification could not be sent."""


@dataclass
class NotificationResult:
    success: bool
    timestamp: datetime


_client: Client | None = None
_cached_settings: TwilioSettings | None = None


def _get_settings() -> TwilioSettings:
    global _cached_settings
    if _cached_settings is None:
        twilio_settings = get_twilio_settings()
        if not twilio_settings or not twilio_settings.TWILIO_ACCOUNT_SID or not twilio_settings.TWILIO_AUTH_TOKEN:
            raise NotificationError("Twilio credentials are not configured")
        if not (twilio_settings.TWILIO_MESSAGING_SERVICE_SID or twilio_settings.TWILIO_FROM_NUMBER):
            raise NotificationError("Twilio messaging service SID or from number must be configured")
        _cached_settings = twilio_settings
    return _cached_settings


def _get_client() -> Client:
    global _client
    if _client is None:
        cfg = _get_settings()
        _client = Client(cfg.TWILIO_ACCOUNT_SID, cfg.TWILIO_AUTH_TOKEN)
    return _client


def _format_table_label(table: Table) -> str:
    if getattr(table, "position", None):
        return f"Table {table.position}"
    return f"Table {table.id}"


def _format_match_time(dt: datetime | None) -> str:
    if dt is None:
        dt = datetime.now(timezone.utc)
    tz = ZoneInfo(settings.TZ)
    local = dt.astimezone(tz)
    return local.strftime("%H:%M")


def _message_body(player: Player, opponent: Player, table: Table, match_time: datetime | None, event_name: str | None) -> str:
    label = _format_table_label(table)
    time_str = _format_match_time(match_time)
    intro = f"PingPong match update for {event_name}" if event_name else "PingPong match update"
    return (
        f"{intro}: {player.full_name}, you are playing {opponent.full_name} at {label} at {time_str}. "
        "Please head to your table."
    )


def _send_sms(to: str, body: str, cfg: TwilioSettings) -> None:
    client = _get_client()
    params: dict[str, str] = {"to": to, "body": body}
    if cfg.TWILIO_MESSAGING_SERVICE_SID:
        params["messaging_service_sid"] = cfg.TWILIO_MESSAGING_SERVICE_SID
    else:
        params["from_"] = cfg.TWILIO_FROM_NUMBER  # type: ignore[assignment]
    params["status_callback"] = f"{cfg.BASE_URL.rstrip('/')}/twilio/status"
    try:
        client.messages.create(**params)
    except TwilioException as exc:  # pragma: no cover - network
        raise NotificationError(f"Failed to send SMS via Twilio: {exc}") from exc


def notify_players(table: Table, assignment: Assignment, players: Iterable[Player], opponents: Iterable[Player], event_name: str | None) -> NotificationResult:
    cfg = _get_settings()
    timestamp = datetime.now(timezone.utc)

    for player, opponent in zip(players, opponents):
        if not player.phone_number:
            raise NotificationError(f"Player {player.full_name} does not have a phone number configured")
        body = _message_body(player, opponent, table, assignment.created_at or timestamp, event_name)
        _send_sms(player.phone_number, body, cfg)

    return NotificationResult(success=True, timestamp=timestamp)
