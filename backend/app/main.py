# backend/app/main.py
import os
from fastapi import FastAPI
from .config import settings
from .db import Base, engine
from .routers import events , players , registrations , tables,assignments

from fastapi.middleware.cors import CORSMiddleware

os.environ["TZ"] = settings.TZ

app = FastAPI(title=settings.APP_NAME, version="0.1.0")

# --- CORS (add this block) ---
origins = [o.strip() for o in settings.FRONTEND_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- end CORS ---

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
app.include_router(players.router)
app.include_router(registrations.router)
app.include_router(tables.router)
app.include_router(assignments.router)


