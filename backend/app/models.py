# backend/app/models.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base

class Event(Base):
    __tablename__ = "event"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agent.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    tables_count = Column(Integer, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    agent = relationship("Agent", back_populates="events")

    registrations = relationship(
        "Registration",
        back_populates="event",
        cascade="all, delete-orphan",
    )


class Player(Base):
    __tablename__ = "player"
    __table_args__ = (UniqueConstraint("agent_id", "phone_number", name="un_agent_phone_number"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agent.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    agent = relationship("Agent", back_populates="players")

    registrations = relationship(
        "Registration",
        back_populates="player",
        cascade="all, delete-orphan",
    )


class Registration(Base):
    __tablename__ = "registration"
    __table_args__ = (UniqueConstraint("event_id", "player_id", name="un_event_player"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("event.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("player.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    event = relationship("Event", back_populates="registrations")
    player = relationship("Player", back_populates="registrations")


class Table(Base):
    __tablename__ = "table"
    __table_args__ = (
        UniqueConstraint("event_id", "position", name="uq_table_event_position"),  # optional but useful
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id=Column(Integer, ForeignKey("event.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="free")  # free|occupied
    current_assignment_id = Column(Integer, ForeignKey("assignment.id", ondelete="SET NULL"), nullable=True)
    position = Column(Integer, nullable=False)

    event = relationship("Event")


class Assignment(Base):
    __tablename__ = "assignment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("event.id", ondelete="CASCADE"), nullable=False)
    table_id = Column(Integer, ForeignKey("table.id", ondelete="SET NULL"), nullable=True)

    player1_id = Column(Integer, ForeignKey("player.id", ondelete="RESTRICT"), nullable=False)
    player2_id = Column(Integer, ForeignKey("player.id", ondelete="RESTRICT"), nullable=False)

    status = Column(String, nullable=False, default="active")  # active | finished
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    notified_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    event = relationship("Event")
    table = relationship("Table", foreign_keys=[table_id])
    player1 = relationship("Player", foreign_keys=[player1_id])
    player2 = relationship("Player", foreign_keys=[player2_id])


class Agent(Base):
    __tablename__ = "agent"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    api_token = Column(String, nullable=True, unique=True)

    events = relationship("Event", back_populates="agent", cascade="all, delete-orphan")
    players = relationship("Player", back_populates="agent", cascade="all, delete-orphan")
