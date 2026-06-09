# PeerCritic

A social platform for reviewing and discussing movies, TV shows, and songs.

## Architecture

| Component | Stack | Local | Production |
|-----------|-------|-------|------------|
| Frontend | Next.js 16 (`frontend/`) | http://localhost:3000 | [Vercel](https://vercel.com) |
| Backend | FastAPI (`main.py`) | http://127.0.0.1:8000 | [Render](https://render.com) (free Web Service) |
| Database | PostgreSQL via SQLModel + Alembic | Neon (or any Postgres) | [Neon](https://neon.tech) |

The backend exposes a persistent WebSocket at `/ws/messages`, so it must run as a long-lived process (not serverless).

## Local development

### Prerequisites

- Python 3.12
- Node.js 18+
- A PostgreSQL database (e.g. [Neon](https://neon.tech) free tier)

### Backend

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the repo root (see [Environment variables](#environment-variables)). Then:

```bash
alembic upgrade head
fastapi dev main.py
```

- API docs: http://127.0.0.1:8000/docs
- Admin panel: http://127.0.0.1:8000/admin

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend reads `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://127.0.0.1:8000` when unset).

## Environment variables

### Backend (`.env` locally, Render dashboard in production)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing secret |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` |
| `ALGORITHM` | No | JWT algorithm (default `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Access token TTL (default `480`) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | Refresh token TTL (default `30`) |
| `CORS_ORIGINS` | Prod only | Comma-separated allowed origins (e.g. `https://peercritic.vercel.app`) |
| `CREATE_TABLES_ON_STARTUP` | No | Set to `true` for local quick-start; production uses Alembic |

TMDB / Spotify / Last.fm keys are only needed for offline import scripts in `scripts/`, not the running API.

### Frontend (Vercel dashboard in production)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Prod | Backend URL, e.g. `https://peercritic-api.onrender.com` (no trailing slash) |

## Production deployment

Full step-by-step instructions are in [DEPLOYMENT.md](DEPLOYMENT.md). Summary:

1. **Push** the repo (includes `requirements.txt`, `Procfile`, `runtime.txt`, optional `render.yaml`).
2. **Render** — create a Web Service from the repo root. Start command runs migrations then uvicorn. Set backend env vars from the table above; add your Vercel URL to `CORS_ORIGINS`.
3. **Vercel** — import the repo with root directory `frontend`. Set `NEXT_PUBLIC_API_BASE_URL` to the Render URL.
4. **Verify** — hit `/health`, sign in, load content, and confirm the WebSocket connects on the Messages page.

## Database migrations

```bash
alembic upgrade head          # apply migrations
alembic revision --autogenerate -m "description"   # create a new migration
```

Migrations run automatically on Render deploy via the `Procfile` start command.
