# backend/app/main.py
import os
from fastapi import FastAPI
from .config import settings

# Ensure container uses the desired timezone (helps logs/timestamps)
os.environ["TZ"] = settings.TZ

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
)

@app.get("/healthz", tags=["meta"])
def healthz():
    return {
        "status": "ok",
        "env": settings.APP_ENV,
        "tz": settings.TZ,
        "app": settings.APP_NAME,
    }

@app.get("/", tags=["meta"])
def root():
    return {"message": "Backend is alive. Go to /healthz"}
