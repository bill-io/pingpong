"""Endpoints for managing application agents."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import hash_password

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("", response_model=schemas.AgentOut, status_code=status.HTTP_201_CREATED)
def create_agent(payload: schemas.AgentCreate, db: Session = Depends(get_db)):
    email = payload.email.lower()

    exists = db.query(models.Agent).filter(models.Agent.email == email).first()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    agent = models.Agent(
        full_name=payload.full_name,
        email=email,
        password_hash=hash_password(payload.password),
    )

    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent
