# backend/app/schemas.py
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

class EventCreate(BaseModel):
    name: str
    tables_count: int = Field(ge=1)
    starts_at: Optional[datetime] = None
    location: Optional[str] = None

class EventOut(BaseModel):
    id: UUID
    name: str
    tables_count: int
    starts_at: Optional[datetime] = None
    location: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}  # pydantic v2
