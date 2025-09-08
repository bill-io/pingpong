# backend/app/models.py
import uuid
from sqlalchemy import Column, String, Integer, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
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


class Player(Base):
    __tablename__ = "player"
    __table_args__ = (UniqueConstraint("phone_number",name="un_phone_number"),)

    id=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name=Column(String,nullable=False)
    phone_number=Column(String,nullable=True)
    created_at=Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
