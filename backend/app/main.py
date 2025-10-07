# backend/app/main.py
import os
from fastapi import FastAPI
from .config import settings
from .db import Base, engine
from .routers import assignments, events, players, registrations, tables
from .twilio_status import router as twilio_router

os.environ["TZ"] = settings.TZ

app = FastAPI(title=settings.APP_NAME, version="0.1.0")

API_PREFIX = "/api"

@app.on_event("startup")
def on_startup():
    # Dev-only convenience: create tables if not exist.
    Base.metadata.create_all(bind=engine)

@app.get("/healthz", tags=["meta"])
def healthz():
    return {"status": "ok", "env": settings.APP_ENV, "tz": settings.TZ, "app": settings.APP_NAME}

@app.get("/", tags=["meta"])
def root():
    return {"message": "Backend is alive. Go to /docs or /healthz"}





# Routers
app.include_router(events.router, prefix=API_PREFIX)
app.include_router(players.router, prefix=API_PREFIX)
app.include_router(registrations.router, prefix=API_PREFIX)
app.include_router(tables.router, prefix=API_PREFIX)
app.include_router(assignments.router, prefix=API_PREFIX)
app.include_router(twilio_router)