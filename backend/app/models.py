# backend/app/models.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime, UniqueConstraint , ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base

class Event(Base):
    __tablename__ = "event"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    tables_count = Column(Integer, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    registrations=relationship(
        "Registration",
        back_populates="event",
        cascade="all, delete-orphan",
    )


class Player(Base):
    __tablename__ = "player"
    __table_args__ = (UniqueConstraint("phone_number",name="un_phone_number"),)

    id=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name=Column(String,nullable=False)
    phone_number=Column(String,nullable=True)
    created_at=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    registrations = relationship(
        "Registration",
        back_populates="player",                   # <-- must match below
        cascade="all, delete-orphan",
    )


class Registration(Base):
    __tablename__ = "registration"
    __table_args__ = (UniqueConstraint("event_id", "player_id", name="un_event_player"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("event.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(UUID(as_uuid=True), ForeignKey("player.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    event = relationship("Event", back_populates="registrations")
    player = relationship("Player", back_populates="registrations")
