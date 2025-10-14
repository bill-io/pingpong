# backend/app/schemas.py
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field

class EventCreate(BaseModel):
    name: str
    tables_count: int = Field(ge=1)
    starts_at: Optional[datetime] = None
    location: Optional[str] = None

class EventOut(BaseModel):
    id: int
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
    id: int
    full_name: str
    phone_number: str
    created_at: datetime

    model_config = {"from_attributes": True}  # pydantic v2

# ---- Slim player (for board) ----
class PlayerSlim(BaseModel):
    id: int
    full_name: str
    phone_number: str
    model_config = {"from_attributes": True}


class PlayerStateOut(BaseModel):
    player: PlayerSlim
    state: Literal["free", "playing"]
    assignment_id: Optional[int] = None
    table_id: Optional[int] = None
    table_position: Optional[str] = None
    opponent: Optional[PlayerSlim] = None
    model_config = {"from_attributes": True}

class BulkImportResult(BaseModel):
    total_rows: int
    created: int
    skipped: int
    errors: List[str] = []

class RegistrationCreate(BaseModel):
    player_id: Optional[int] = None
    phone_number: Optional[str] = None


class RegistrationOut(BaseModel):
    id: int
    event_id: int
    player_id: int
    created_at: datetime
    player: PlayerOut
    model_config = {"from_attributes": True}


class AgentCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)


class AgentOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AgentLoginResponse(BaseModel):
    agent: AgentOut
    token: str



# ---- Table (include current assignment id) ----
class TableSeed(BaseModel):
    count: Optional[int] = None  # if provided, create this many tables or we are going to use event.tables_count
    reset: bool = False  # if true, delete existing tables first
    start_at : int= 1  

class TableCreateBulk(BaseModel):
    labels: list[str]

class TableOut(BaseModel):
    id: int
    event_id: int
    status: str
    position: int
    current_assignment_id: Optional[int] = None
    model_config = {"from_attributes": True}

class TableUpdate(BaseModel):
    status: Optional[str] = None
    position: Optional[int] = None

# ---- Assignment ----
class AssignmentCreate(BaseModel):
    # choose by ids or phones; ids take precedence
    player1_id: Optional[int] = None
    player2_id: Optional[int] = None
    player1_phone: Optional[str] = None
    player2_phone: Optional[str] = None
    notify: bool = True

class AssignmentOut(BaseModel):
    id: int
    event_id: int
    table_id: Optional[int]
    status: str
    created_at: datetime
    notified_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    player1: PlayerSlim
    player2: PlayerSlim
    model_config = {"from_attributes": True}

class AssignmentMove(BaseModel):
    new_table_id: int

class SwapTables(BaseModel):
    table_a_id: int
    table_b_id: int

# ---- Optional: board view row ----
class TableBoardRow(BaseModel):
    id: int
    position: int
    status: str
    label: Optional[str] = None
    current_assignment_id: Optional[int] = None
    assignment_status: Optional[str] = None
    assignment_created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    notified_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    player1: Optional[PlayerSlim] = None
    player2: Optional[PlayerSlim] = None