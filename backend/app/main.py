# backend/app/main.py
import os
from fastapi import FastAPI
from .config import settings
from .db import Base, engine
from .routers import events

os.environ["TZ"] = settings.TZ

app = FastAPI(title=settings.APP_NAME, version="0.1.0")

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
app.include_router(events.router)
