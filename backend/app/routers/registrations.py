from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models, schemas

router=APIRouter(prefix="/events/{event_id}/registrations", tags=["registrations"])

@router.get("", response_model=List[schemas.RegistrationOut])
async def get_registrations(db: Session = Depends(get_db)):
    return db.query(models.Registration).order_by(models.Registration.created_at.desc()).all() #list all players ordered by created_at desc



def get_event_or_404(event_id: int, db: Session):
    event=db.query(models.Event).filter(models.Event.id==event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.get("",response_model=List[schemas.RegistrationOut])
def list_registrations(
    event_id: int=Path(..., description="The ID of the event"),
    db: Session=Depends(get_db)
):
    get_event_or_404(event_id, db)
    regs=(
        db.query(models.Registration)
        .filter(models.Registration.event_id == event_id)
        .order_by(models.Registration.created_at.desc())
        .all()
    )
    return regs



@router.post("", response_model=schemas.RegistrationOut, status_code=201)
def add_registration(
    payload: schemas.RegistrationCreate,
    event_id: int = Path(...),
    db: Session = Depends(get_db),
):
    get_event_or_404(event_id, db)

    # Resolve the player
    player = None
    if payload.player_id:
        player = db.query(models.Player).filter(models.Player.id == payload.player_id).first()
    elif payload.phone_number:
        player = db.query(models.Player).filter(models.Player.phone_number == payload.phone_number).first()

    if not player:
        raise HTTPException(status_code=404, detail="Player not found (use player_id or phone_number)")

    # Check duplicate
    exists = (
        db.query(models.Registration)
        .filter(
            models.Registration.event_id == event_id,
            models.Registration.player_id == player.id,
        )
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="Player already registered for this event")

    reg = models.Registration(
        event_id=event_id,
        player_id=player.id,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg

@router.delete("/{registration_id}", status_code=204)
def remove_registration(
    registration_id: int,
    event_id: int = Path(...),
    db: Session = Depends(get_db),
):
    _get_event_or_404(db, event_id)
    reg = (
        db.query(models.Registration)
        .filter(models.Registration.id == registration_id, models.Registration.event_id == event_id)
        .first()
    )
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    db.delete(reg)
    db.commit()
    return None