from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import and_
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models, schemas
from ..notifications import NotificationError, notify_players
from ..security import get_current_agent

router = APIRouter(prefix="/events/{event_id}", tags=["assignments"])

def _get_event(db: Session, event_id: int, agent_id: int) -> models.Event:
    ev = (
        db.query(models.Event)
        .filter(models.Event.id == event_id, models.Event.agent_id == agent_id)
        .first()
    )
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev

def _get_player_by_id_or_phone(
    db: Session,
    pid: Optional[int],
    phone: Optional[str],
    agent_id: int,
) -> models.Player:
    if pid is not None:
        p = (
            db.query(models.Player)
            .filter(models.Player.id == pid, models.Player.agent_id == agent_id)
            .first()
        )
        if p: return p
    if phone:
        p = (
            db.query(models.Player)
            .filter(
                models.Player.phone_number == phone,
                models.Player.agent_id == agent_id,
            )
            .first()
        )
        if p: return p
    raise HTTPException(status_code=404, detail="Player not found")

def _ensure_registered(db: Session, event_id: int, player_id: int, agent_id: int):
    reg = db.query(models.Registration.id).join(models.Event).filter(
        models.Registration.event_id == event_id,
        models.Registration.player_id == player_id,
        models.Event.agent_id == agent_id,
    ).first()
    if not reg:
        raise HTTPException(status_code=400, detail=f"Player {player_id} not registered for this event")

@router.post("/tables/{table_id}/assign", response_model=schemas.AssignmentOut)
def assign_to_table(
    payload: schemas.AssignmentCreate,
    event_id: int = Path(...),
    table_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    event = _get_event(db, event_id, current_agent.id)

    t = db.query(models.Table).filter(
        and_(models.Table.id == table_id, models.Table.event_id == event_id)
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Table not found for this event")
    if t.status != "free":
        raise HTTPException(status_code=409, detail=f"Table '{t.position}' is not free")

    p1 = _get_player_by_id_or_phone(db, payload.player1_id, payload.player1_phone, current_agent.id)
    p2 = _get_player_by_id_or_phone(db, payload.player2_id, payload.player2_phone, current_agent.id)
    if p1.id == p2.id:
        raise HTTPException(status_code=400, detail="Choose two different players")
    _ensure_registered(db, event_id, p1.id, current_agent.id)
    _ensure_registered(db, event_id, p2.id, current_agent.id)

    # Make sure both players are not already active on any table in this event
    active_for_players = db.query(models.Assignment.id).filter(
        models.Assignment.event_id == event_id,
        models.Assignment.status == "active",
        ((models.Assignment.player1_id.in_([p1.id, p2.id])) |
         (models.Assignment.player2_id.in_([p1.id, p2.id])))
    ).first()
    if active_for_players:
        raise HTTPException(status_code=409, detail="One of the players is already assigned to another table")

    now = datetime.now(timezone.utc)
    a = models.Assignment(
        event_id=event_id,
        table_id=t.id,
        player1_id=p1.id,
        player2_id=p2.id,
        status="active",
        notified_at=None,
        created_at=now,
    )
    db.add(a)
    db.flush()  # get a.id before commit

    t.status = "occupied"
    t.current_assignment_id = a.id

    if payload.notify:
        try:
            result = notify_players(
                t,
                a,
                (p1, p2),
                (p2, p1),
                event.name,
            )
            a.notified_at = result.timestamp
        except NotificationError as exc:
            raise HTTPException(status_code=502, detail=str(exc))

    db.commit()
    db.refresh(a)
    return a

@router.post("/tables/{table_id}/free", response_model=schemas.TableOut)
def free_table(
    event_id: int = Path(...),
    table_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _get_event(db, event_id, current_agent.id)
    t = db.query(models.Table).filter(
        and_(models.Table.id == table_id, models.Table.event_id == event_id)
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Table not found for this event")

    if t.current_assignment_id:
        a = db.query(models.Assignment).filter(models.Assignment.id == t.current_assignment_id).first()
        if a and a.status == "active":
            a.status = "finished"
            a.ended_at = datetime.now(timezone.utc)
    t.status = "free"
    t.current_assignment_id = None
    db.commit()
    db.refresh(t)
    return t

@router.post("/assignments/{assignment_id}/move", response_model=schemas.AssignmentOut)
def move_assignment(
    payload: schemas.AssignmentMove,
    event_id: int = Path(...),
    assignment_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _get_event(db, event_id, current_agent.id)
    a = db.query(models.Assignment).filter(
        and_(models.Assignment.id == assignment_id, models.Assignment.event_id == event_id)
    ).first()
    if not a or a.status != "active":
        raise HTTPException(status_code=404, detail="Active assignment not found")

    new_t = db.query(models.Table).filter(
        and_(models.Table.id == payload.new_table_id, models.Table.event_id == event_id)
    ).first()
    if not new_t:
        raise HTTPException(status_code=404, detail="Target table not found")
    if new_t.status != "free":
        raise HTTPException(status_code=409, detail="Target table is not free")

    # free old table
    if a.table_id:
        old_t = db.query(models.Table).filter(models.Table.id == a.table_id).first()
        if old_t:
            old_t.status = "free"
            old_t.current_assignment_id = None

    # occupy new table
    a.table_id = new_t.id
    new_t.status = "occupied"
    new_t.current_assignment_id = a.id

    db.commit()
    db.refresh(a)
    return a


@router.post("/assignments/{assignment_id}/notify", response_model=schemas.AssignmentOut)
def notify_assignment(
    event_id: int = Path(...),
    assignment_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    event = _get_event(db, event_id, current_agent.id)
    assignment = db.query(models.Assignment).filter(
        and_(models.Assignment.id == assignment_id, models.Assignment.event_id == event_id)
    ).first()
    if not assignment or assignment.status != "active":
        raise HTTPException(status_code=404, detail="Active assignment not found")
    table = assignment.table
    if not table:
        raise HTTPException(status_code=400, detail="Assignment does not have a table")

    try:
        result = notify_players(
            table,
            assignment,
            (assignment.player1, assignment.player2),
            (assignment.player2, assignment.player1),
            event.name,
        )
    except NotificationError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    assignment.notified_at = result.timestamp
    db.commit()
    db.refresh(assignment)
    return assignment


@router.post("/assignments/{assignment_id}/start", response_model=schemas.AssignmentOut)
def start_assignment_timer(
    event_id: int = Path(...),
    assignment_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _get_event(db, event_id, current_agent.id)
    assignment = db.query(models.Assignment).filter(
        and_(models.Assignment.id == assignment_id, models.Assignment.event_id == event_id)
    ).first()
    if not assignment or assignment.status != "active":
        raise HTTPException(status_code=404, detail="Active assignment not found")

    assignment.started_at = datetime.now(timezone.utc)
    assignment.ended_at = None
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/tables/swap", response_model=list[schemas.TableOut])
def swap_tables(
    payload: schemas.SwapTables,
    event_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _get_event(db, event_id, current_agent.id)
    ta = db.query(models.Table).filter(and_(models.Table.id == payload.table_a_id, models.Table.event_id == event_id)).first()
    tb = db.query(models.Table).filter(and_(models.Table.id == payload.table_b_id, models.Table.event_id == event_id)).first()
    if not ta or not tb:
        raise HTTPException(status_code=404, detail="One or both tables not found")

    # both must have an active assignment to swap
    if not (ta.current_assignment_id and tb.current_assignment_id):
        raise HTTPException(status_code=400, detail="Both tables must have active assignments to swap")

    aa = db.query(models.Assignment).filter(models.Assignment.id == ta.current_assignment_id).first()
    ab = db.query(models.Assignment).filter(models.Assignment.id == tb.current_assignment_id).first()
    if not aa or not ab or aa.status != "active" or ab.status != "active":
        raise HTTPException(status_code=400, detail="Assignments must be active to swap")

    # swap
    aa.table_id, ab.table_id = tb.id, ta.id
    ta.current_assignment_id, tb.current_assignment_id = ab.id, aa.id

    db.commit()
    db.refresh(ta); db.refresh(tb)
    return [ta, tb]
