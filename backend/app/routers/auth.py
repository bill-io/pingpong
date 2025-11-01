"""Authentication endpoints for agent login."""

import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..security import verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.AgentLoginResponse)
def login(payload: schemas.AgentLoginRequest, db: Session = Depends(get_db)):
    agent = db.query(models.Agent).filter(models.Agent.email == payload.email.lower()).first()

    if not agent or not verify_password(payload.password, agent.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )

    token = secrets.token_urlsafe(32)
    agent.api_token = token
    db.commit()
    db.refresh(agent)

    return schemas.AgentLoginResponse(agent=agent, token=token)
