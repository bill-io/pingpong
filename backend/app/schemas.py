# backend/app/schemas.py
from datetime import datetime
from typing import Optional,List
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

class PlayerCreate(BaseModel):
    full_name: str
    phone_number:str

class PlayerOut(BaseModel):
    id: UUID
    full_name: str
    phone_number: str
    created_at: datetime

    model_config = {"from_attributes": True}  # pydantic v2

class BulkImportResult(BaseModel):
    total_rows: int
    created: int
    skipped: int
    errors: List[str] = []

class RegistrationCreate(BaseModel):
    player_id: Optional[UUID] = None
    phone_number: Optional[str] = None
    seed: Optional[int] = None


class RegistrationOut(BaseModel):
    id: UUID
    event_id: UUID
    player_id: UUID
    seed: Optional[int] = None
    created_at: datetime
    player: PlayerOut
    model_config = {"from_attributes": True}  
    