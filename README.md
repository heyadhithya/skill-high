# Skill-High

Student-first work marketplace MVP. The project supports profiles, skills, availability, projects, services, applications, orders, messages, delivery, revisions, reviews, Proof-of-Work, disputes, and a development-only payment simulator.

## Local startup

```bash
podman run --name skillhigh-postgres --replace -d -e POSTGRES_DB=skillhigh_dev -e POSTGRES_USER=skillhigh -e POSTGRES_PASSWORD=skillhigh -p 127.0.0.1:54329:5432 docker.io/library/postgres:17-alpine
uv sync --dev
uv run alembic upgrade head
uv run python backend/seed.py
uv run uvicorn app:app --app-dir backend --reload --port 8000
bun install
bun run dev
```

Open `http://localhost:3000`. The API is at `http://127.0.0.1:8000/docs`.

Demo password for all seeded accounts: `skillhigh-demo-123`.

- `ravi@skillhigh-campus.com` — student service provider
- `maya@skillhigh-campus.com` — client
- `admin@skillhigh-campus.com` — administrator

`compose.yaml` is provided for environments with a Compose provider. This Fedora installation uses the equivalent direct Podman command above.

## Development constraints

Payments are a development-only simulator (`DEV_PAYMENT_SIMULATOR=true`). It never contacts a payment provider. File upload remains quarantined and returns an actionable error until a malware scanner is configured; delivery links work in the MVP.

Password reset and email verification tokens are written only to `.data/dev-mail/` in development. API responses never return them. Start the PostgreSQL-backed notification worker after its schema is installed:

```bash
PYTHONPATH=backend .venv/bin/procrastinate --app worker.app schema
PYTHONPATH=backend .venv/bin/procrastinate --app worker.app worker
```

## Verification

```bash
uv run pytest backend/tests -q
bun run build
```

The PostgreSQL integration suite uses `skillhigh_test`, never `skillhigh_dev`; it creates the test database automatically with the local PostgreSQL development role.
