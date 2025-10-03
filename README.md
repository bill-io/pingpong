# PingPong App

A small tournament helper for assigning players to tables and tracking availability in real time.

## TL;DR

* **Stack:** FastAPI + PostgreSQL + SQLAlchemy | React (Vite + TypeScript + Tailwind) | Nginx reverse-proxy → **/api**
* **Everything runs in Docker Compose** for dev & prod. The frontend talks to the backend through **/api**.
* **Swagger UI:** `http://localhost:8000/docs` (dev) — see `docker-compose.yml` for exact ports.

> Repository: `bill-io/pingpong`
> Frontend service name expects the API service to be reachable at **`http://api:8000`** inside the Docker network. In the browser it’s available via **`/api`** through Nginx/proxy (prod) or directly on the exposed port (dev).

---

## Features (MVP)

* List players.
* List tables with **availability (green/red)**.
* Select a player and **assign** them to a table.
* **Free** a table.
* (Future) **Send SMS** notification to a player.

---

## Architecture

```
┌───────────┐    HTTP (/api)    ┌─────────────┐        ┌─────────────┐
│  React    │  ───────────────▶ │   Nginx     │ ─────▶ │   FastAPI   │
│ (Vite)    │ ◀───────────────  │  reverse    │ ◀────  │  (Uvicorn)  │
└───────────┘    static (prod)  │   proxy     │        └─────────────┘
                                └─────────────┘              │
                                                       SQLAlchemy
                                                             │
                                                       ┌──────────┐
                                                       │PostgreSQL│
                                                       └──────────┘
```

* **Frontend:** React + Vite + TypeScript + Tailwind. In dev it runs its own dev server. In prod the built assets are served by Nginx.
* **Backend:** FastAPI with SQLAlchemy models. Automatic docs via Swagger (`/docs`).
* **Database:** PostgreSQL.
* **Reverse proxy:** Nginx routes **`/api` → FastAPI** and serves the frontend (prod).

---

## Repository Structure

```
pingpong/
├─ backend/
│  ├─ app/
│  │  ├─ main.py            # FastAPI entrypoint
│  │  ├─ models.py / schemas.py
│  │  ├─ routers/
│  │  │  ├─ players.py
│  │  │  ├─ events.py
│  │  │  └─ tables.py
│  │  └─ ...
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  ├─ index.html
│  ├─ vite.config.ts
│  └─ Dockerfile
├─ docker-compose.yml
├─ .env                     # root env vars consumed by compose/services
└─ README.md (this file)
```

> Exact file names can evolve; check the repo for the latest layout.

---

## Prerequisites

* **Docker** and **Docker Compose**
* **Node 20+** (only if you want to run the frontend locally without Docker)
* **Python 3.11+** (only if you want to run the backend locally without Docker)

---

## Getting Started

### 1) Clone

```bash
git clone https://github.com/bill-io/pingpong.git
cd pingpong
```

### 2) Configure environment

Create/update **.env** at the repo root (sample values):

```env
# Database
POSTGRES_DB=pingpong
POSTGRES_USER=pguser
POSTGRES_PASSWORD=pgpass
POSTGRES_PORT=5432

# Backend
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173,http://localhost

# Frontend
VITE_API_BASE=/api

# Nginx
NGINX_HTTP_PORT=8080
```

> The compose file reads from `.env`. Adjust ports as you like.

### 3) Run with Docker (recommended)

```bash
# build and start all services in the background
docker compose up -d --build

# follow logs (optional)
docker compose logs -f
```

* **Prod-like URL (Nginx):** `http://localhost:8080` (if `NGINX_HTTP_PORT=8080`)
* **API (FastAPI):** `http://localhost:8000` → docs at `/docs`
* **Frontend (Vite dev):** `http://localhost:5173` (only in dev-mode setup; in prod it’s served by Nginx)

> The exact exposed ports depend on your `docker-compose.yml` and `.env`. Look there if the above differ.

---

## Development

### Frontend (React + Vite)

Run inside Docker:

```bash
# install deps (first time)
docker compose exec frontend npm ci

# start Vite dev server
docker compose exec frontend npm run dev
```

Local (without Docker):

```bash
cd frontend
npm ci
npm run dev
```

Environment:

* The frontend calls the backend via `VITE_API_BASE` (default **/api**). In Docker, the proxy/Nginx maps `/api` → `api:8000`.

### Backend (FastAPI)

Run inside Docker:

```bash
# start the api (compose handles it automatically, but to run commands)
docker compose exec api uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Local (without Docker):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Database

```bash
# open a psql shell
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

> For a fresh schema during development: `docker compose down -v && docker compose up -d --build` (⚠️ destroys volumes/data).

---

## API Overview

* **`GET /players`** – list players
* **`GET /tables`** – list tables (with availability)
* **`POST /tables/{table_id}/assign`** – assign a player
* **`POST /tables/{table_id}/free`** – free a table
* **`GET /players/{phone_number}`** – fetch a player by phone number (e.g., `+3069...`)
* **`POST /events/{event_id}/tables/seed`** – create N tables for an event

> Full, live docs at **`/docs`** (Swagger) on the API port.

Examples

```bash
# List players
curl -s http://localhost:8000/players | jq

# Seed 5 tables for event 2
curl -X POST http://localhost:8000/events/2/tables/seed \
  -H 'Content-Type: application/json' \
  -d '{"count":5, "reset":false, "starts_at":1}'
```

---

## CORS

Set allowed origins in `.env` as a comma-separated list in `CORS_ORIGINS`. The backend reads this and configures FastAPI’s CORSMiddleware accordingly.

---

## Docker Compose Services (typical)

* **db** – PostgreSQL with a named volume for persistence.
* **api** – FastAPI app (Uvicorn) depending on db.
* **frontend** – Vite dev server (dev) or build stage (prod).
* **nginx** – Serves frontend (prod) and proxies **/api** → api:8000.

Check `docker-compose.yml` for final service names and ports.

---

## Common Tasks

* **Reset everything (dangerous):** `docker compose down -v && docker compose up -d --build`
* **Tail a service’s logs:** `docker compose logs -f api` (or `frontend`, `db`, `nginx`)
* **Open Swagger:** `http://localhost:8000/docs`

---

## Contributing

1. Create a feature branch from `main`.
2. Commit early, commit often.
3. Open a PR.

---

## Roadmap

* Player SMS notifications.
* Basic auth for admin actions.
* Minimal event dashboard (active tables, waiting players).

---

## License

TBD.
