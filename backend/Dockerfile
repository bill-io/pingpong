# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps (add git/build tools later if needed)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install deps first (better layer caching)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy app code
COPY app /app/app

# Default envs (can be overridden by .env.dev)
ENV TZ=Europe/Athens

EXPOSE 8000

# For dev we run with --reload via docker-compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
