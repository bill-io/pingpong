from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..db import get_db
from .. import models, schemas
from ..security import get_current_agent

router = APIRouter(prefix="/events/{event_id}/tables", tags=["tables"])


def _event_exists(db: Session, event_id: int, agent_id: int):
    exists = (
        db.query(models.Event.id)
        .filter(models.Event.id == event_id, models.Event.agent_id == agent_id)
        .first()
    )
    if not exists:
        raise HTTPException(status_code=404, detail="Event not found")


@router.get("", response_model=List[schemas.TableOut])
def list_tables(
    event_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _event_exists(db, event_id, current_agent.id)
    return db.query(models.Table).filter(models.Table.event_id == event_id).order_by(models.Table.id).all()


@router.post("/pos/{position}",response_model=schemas.TableOut, status_code=201)
def create_table_at_position(
    event_id: int = Path(...),
    position:int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _event_exists(db, event_id, current_agent.id)
    exist= (
        db.query(models.Table.id)
        .filter(models.Table.event_id == event_id, models.Table.position == position)
        .first()
    )
    if exist:
        raise HTTPException(status_code=409, detail="Table with this position already exists")
    
    t = models.Table(event_id=event_id,position=position ,status="free")
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@router.post("/seed",response_model=List[schemas.TableOut], status_code=201)
def seed_tables(
    payload: schemas.TableSeed,
    event_id : int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _event_exists(db,event_id, current_agent.id)
    event= (
        db.query(models.Event)
        .filter(models.Event.id == event_id, models.Event.agent_id == current_agent.id)
        .first()
    )
    target= payload.count if payload.count is not None else event.tables_count  # use event.tables_count if not provided
    if target <= 0:
        raise HTTPException(status_code=400, detail="Target table count must be positive")

    start_at=max(1, payload.start_at)  # ensure start_at is at least 1
    if payload.reset:
        # Delete existing tables & their assignments
        db.query(models.Table).filter(models.Table.event_id == event_id).delete(synchronize_session=False)
        db.flush()
    
    # Create missing tables so that positions cover [start_at .. start_at+target-1]
    desired_positions = set(range(start_at, start_at + target))
    existing_positions = {
        p for (p,) in db.query(models.Table.position).filter(models.Table.event_id == event_id).all()
    }
    to_create = sorted(desired_positions - existing_positions)

    created: list[models.Table] = []
    for pos in to_create:
        t = models.Table(
            event_id=event_id,
            position=pos,
            status="free",
        )
        db.add(t)
        created.append(t)

    db.commit()

    return (
        db.query(models.Table)
          .filter(models.Table.event_id == event_id)
          .order_by(models.Table.position.asc(), models.Table.id.asc())
          .all()
    )


# ----- Set table status (free/occupied)  ACCORDING TO TABLE_ID---- 
@router.post("/{table_id}/status/{status}", response_model=schemas.TableOut)
def set_table_status(
    data: schemas.TableUpdate,
    event_id: int = Path(...),
    table_id: int = Path(...),
    status : str = Path(..., pattern="^(free|occupied)$"),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _event_exists(db, event_id, current_agent.id)
    t = db.query(models.Table).filter(
        and_(models.Table.id == table_id, models.Table.event_id == event_id)).first()
    if not t:
        raise HTTPException(status_code=404, detail="Table not found")
    if status == "free":
        # If your schema has assignments, optionally finish & clear them:
        if t.current_assignment_id:
            a = db.query(models.Assignment).filter(models.Assignment.id == t.current_assignment_id).first()
            if a and a.status == "active":
                a.status = "finished"
        t.current_assignment_id = None
        t.status = "free"
    else:  # "occupied"
        t.status = "occupied"
        # note: we don't create/attach an assignment here; purely status flip

    
    db.commit()
    db.refresh(t)
    return t


# ----- Set table status (free/occupied)  ACCORDING TO POSITION---- 
@router.post("/{position}/status/{status}", response_model=schemas.TableOut)
def set_table_status(
    data: schemas.TableUpdate,
    event_id: int = Path(...),
    position: int = Path(...),
    status : str = Path(..., pattern="^(free|occupied)$"),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _event_exists(db, event_id, current_agent.id)
    t = db.query(models.Table).filter(
        and_(models.Table.position == position, models.Table.event_id == event_id)).first()
    if not t:
        raise HTTPException(status_code=404, detail="Table not found")
    if status == "free":
        # If your schema has assignments, optionally finish & clear them:
        if t.current_assignment_id:
            a = db.query(models.Assignment).filter(models.Assignment.id == t.current_assignment_id).first()
            if a and a.status == "active":
                a.status = "finished"
        t.current_assignment_id = None
        t.status = "free"
    else:  # "occupied"
        t.status = "occupied"
        # note: we don't create/attach an assignment here; purely status flip
    db.commit()
    db.refresh(t)
    return t



@router.get("/board", response_model=List[schemas.TableBoardRow])
def board(
    event_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _event_exists(db, event_id, current_agent.id)
    rows: list[schemas.TableBoardRow] = []
    tables = db.query(models.Table).filter(models.Table.event_id == event_id).order_by(models.Table.id).all()
    for t in tables:
        p1 = p2 = None
        assignment_status = None
        started_at = notified_at = ended_at = created_at = None
        if t.current_assignment_id:
            a = db.query(models.Assignment).filter(models.Assignment.id == t.current_assignment_id).first()
            if a and a.status == "active":
                p1, p2 = a.player1, a.player2
                assignment_status = a.status
                started_at = a.started_at
                notified_at = a.notified_at
                ended_at = a.ended_at
                created_at = a.created_at
        rows.append(
            schemas.TableBoardRow(
                id=t.id,
                position=t.position,
                status=t.status,
                label=f"Table {t.position}" if t.position is not None else f"Table {t.id}",
                current_assignment_id=t.current_assignment_id,
                assignment_status=assignment_status,
                assignment_created_at=created_at,
                started_at=started_at,
                notified_at=notified_at,
                ended_at=ended_at,
                player1=p1,
                player2=p2,
            )
        )
    return rows


#---------DELETE-----------------
@router.delete("/{table_id}", status_code=204)
def delete_table(
    event_id: int = Path(...),
    table_id: int = Path(...),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    _event_exists(db, event_id, current_agent.id)
    t = (
        db.query(models.Table)
        .filter(and_(models.Table.id == table_id, models.Table.event_id == event_id))
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Table not found")
    if t.current_assignment_id:
        raise HTTPException(status_code=400, detail="Cannot delete a table with an active assignment")
    db.delete(t)
    db.commit()
    return None



@router.delete("/pos/{position}", status_code=204)
def delete_table_by_position(event_id: int = Path(...), position: int = Path(...), db: Session = Depends(get_db)):
    _event_exists(db, event_id)
    t = db.query(models.Table).filter(and_(models.Table.position == position, models.Table.event_id == event_id)).first()
    if not t:
        raise HTTPException(status_code=404, detail="Table not found")
    if t.current_assignment_id:
        raise HTTPException(status_code=400, detail="Cannot delete a table with an active assignment")
    db.delete(t)
    db.commit()
    return

@router.delete("", status_code=204)
def delete_all_tables(event_id: int = Path(...), db: Session = Depends(get_db)):
    _event_exists(db, event_id)
    db.query(models.Table).filter(models.Table.event_id == event_id).delete(synchronize_session=False)
    db.commit()
    return

