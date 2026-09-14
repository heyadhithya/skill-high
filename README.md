# Skill-High

Skill-High is a local, student-first marketplace for finding practical help, agreeing a focused scope, delivering work, and keeping verified Proof-of-Work after graduation.

It is a full-stack MVP, not a static mockup. The public page is a search-first marketplace backed by the live API; signed-in users can hire, offer services, manage orders, message, deliver, review, and resolve disputes.

## Documentation

- [Technical Design Document](docs/TECHNICAL_DESIGN.md)
- [Sample data and test cases](docs/SAMPLE_DATA_AND_TEST_CASES.md)

## What works

- Public service and project discovery with search, category shortcuts, rupee filters, local category photography, and shareable detail screens.
- Registration, login, logout, profile editing, skills, and availability.
- Client projects, service offers, applications, service requests, and server-enforced order transitions.
- Messages, HTTP(S) delivery links, revision requests, completion of the latest delivery only, verified reviews, and Proof-of-Work.
- Rule-based matching, simulated local payments, disputes, and administrator resolution.
- Server-side sessions, CSRF protection, Argon2 passwords, PostgreSQL persistence, Alembic migrations, and a PostgreSQL-backed Procrastinate worker.

## Quick start

Prerequisites: Podman, Python with `uv`, and Bun.

Create the dedicated local PostgreSQL database the first time:

```bash
podman volume create skillhigh_postgres
podman run --name skillhigh-postgres -d \
  -e POSTGRES_DB=skillhigh_dev \
  -e POSTGRES_USER=skillhigh \
  -e POSTGRES_PASSWORD=skillhigh \
  -p 127.0.0.1:54329:5432 \
  -v skillhigh_postgres:/var/lib/postgresql/data \
  docker.io/library/postgres:17-alpine
```

Install dependencies, migrate, and seed fictional development data:

```bash
uv sync --dev
bun install
uv run alembic upgrade head
uv run python backend/seed.py
```

Run the API and frontend in separate terminals:

```bash
uv run uvicorn app:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```

```bash
bun run dev
```

Open http://127.0.0.1:3000. API documentation is at http://127.0.0.1:8000/docs.

If the database container already exists, start it with:

```bash
podman start skillhigh-postgres
```

`compose.yaml` provides the equivalent PostgreSQL setup for environments with a Compose provider.

## Environment variables

The defaults in `.env.example` target the local Podman/Compose database above. The API reads variables from its process environment; export only the values you need to override.

| Variable                | Default                                                                   | Purpose                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | `postgresql+psycopg://skillhigh:skillhigh@127.0.0.1:54329/skillhigh_dev`  | Development database used by the API, migrations, seed command, and worker.                                                         |
| `TEST_DATABASE_URL`     | `postgresql+psycopg://skillhigh:skillhigh@127.0.0.1:54329/skillhigh_test` | Isolated database created and reset by the integration tests. It must differ from `DATABASE_URL`.                                   |
| `APP_ENV`               | `development`                                                             | Enables local seed data and mail sink. `production` disables seed data, enables secure cookies, and disables the payment simulator. |
| `DEV_PAYMENT_SIMULATOR` | `true`                                                                    | Enables the local-only payment simulator outside production.                                                                        |
| `DEV_MAIL_DIR`          | `.data/dev-mail`                                                          | Location for development-only verification and password-reset messages.                                                             |

For example, to use another local database for one command:

```bash
DATABASE_URL=postgresql+psycopg://skillhigh:skillhigh@127.0.0.1:54329/another_local_db \
  uv run alembic upgrade head
```

## Demo accounts

In development, the dedicated sign-in screen has Worker, Client, and Admin buttons that fill a demo account automatically. All seeded accounts use this password:

```text
skillhigh-demo-123
```

| Role                      | Email                        |
| ------------------------- | ---------------------------- |
| Worker / service provider | `ravi@skillhigh-campus.com`  |
| Client                    | `maya@skillhigh-campus.com`  |
| Administrator             | `admin@skillhigh-campus.com` |

The additive seed creates eight service listings and four fictional client projects. Category photography is editorial context, not seller portfolio evidence; seeded reviews and completed orders are intentionally absent.

The seed command is idempotent and is blocked when `APP_ENV=production`.

## Development services and constraints

- Payments are an explicitly labeled local simulator (`DEV_PAYMENT_SIMULATOR=true`). It never contacts a provider or moves real money.
- Verification and password-reset tokens go only to `DEV_MAIL_DIR` (default: `.data/dev-mail`) in development; API responses never expose them.
- Uploads fail closed until a malware scanner is configured. Delivery links continue to work.
- The worker is local and PostgreSQL-backed. Install its schema and start it when developing or manually exercising worker handlers:

  ```bash
  PYTHONPATH=backend .venv/bin/procrastinate --app worker.app schema --apply
  PYTHONPATH=backend .venv/bin/procrastinate --app worker.app worker
  ```

## Verify

```bash
uv run pytest backend/tests -q
bun run build
```

Integration tests always use `skillhigh_test`, never `skillhigh_dev`. The test database is created automatically by the local PostgreSQL development role, so running tests does not remove the seeded demo accounts.

## Project structure

```text
app/                  Next.js interface and local API proxy
backend/app.py        FastAPI modular-monolith API
backend/migrations/   Alembic schema migration
backend/seed.py       Idempotent fictional development data
backend/tests/        PostgreSQL integration coverage
backend/worker.py     Procrastinate worker entry point
```
