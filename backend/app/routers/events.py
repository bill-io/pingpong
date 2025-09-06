# backend/app/routers/events.py
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db import get_db
from .. import models, schemas

router = APIRouter(prefix="/events", tags=["events"])

@router.get("", response_model=List[schemas.EventOut])
def list_events(db: Session = Depends(get_db)):
    return db.query(models.Event).order_by(models.Event.created_at.desc()).all()

@router.post("", response_model=schemas.EventOut, status_code=201)
def create_event(payload: schemas.EventCreate, db: Session = Depends(get_db)):
    event = models.Event(
        name=payload.name,
        tables_count=payload.tables_count,
        starts_at=payload.starts_at,
        location=payload.location,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
