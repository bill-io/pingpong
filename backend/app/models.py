# backend/app/models.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime, UniqueConstraint , ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .db import Base

class Event(Base):
    __tablename__ = "event"

    id = Column(Integer, primary_key=True, autoincrement=True)
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

    id = Column(Integer, primary_key=True, autoincrement=True)
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
