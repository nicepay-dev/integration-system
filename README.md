# Merchant Pulse

Merchant integration reporting and monitoring workspace built with React, NestJS, and PostgreSQL.

## Run locally

1. Copy `backend/.env.example` to `backend/.env`.
2. Start PostgreSQL: `docker compose up -d`.
3. Install dependencies: `npm install`, then `npm run install:all`.
4. Seed the first user: `npm run seed --prefix backend`.
5. Start both apps: `npm run dev`.

Open http://localhost:5173 and sign in with `lead@merchantpulse.dev` / `ChangeMe123!`.

The backend runs a daily stale-status check at 09:00 Jakarta time. It creates one notification per merchant per stale update timestamp after 7 inactive days.
# Merchant Pulse

## Run the complete application with Docker

The Docker stack contains three images:

- `merchant-pulse-frontend`: React compiled and served by Nginx
- `merchant-pulse-backend`: NestJS API
- `postgres:16-alpine`: empty PostgreSQL database with a persistent volume

Copy `.env.docker.example` to `.env`, then replace `JWT_SECRET` with a long
random value before using the application outside your computer.

```powershell
Copy-Item .env.docker.example .env
docker compose build
docker compose up -d
docker compose ps
```

Open `http://localhost:5173`.

Stop the application without deleting its data:

```powershell
docker compose stop
```

Start it again:

```powershell
docker compose start
```

Update and rebuild the application:

```powershell
docker compose up -d --build
```

View logs:

```powershell
docker compose logs -f
```

Remove containers but retain database data:

```powershell
docker compose down
```

Remove containers and the database volume:

```powershell
docker compose down -v
```

PostgreSQL starts without private application records. NestJS creates the
required tables on startup, and all later changes are stored in the permanent
`merchant_pulse_postgres_data` volume. The volume survives container
replacement, image rebuilding, `docker compose down`, and Compose project-name
changes.

Do not run `docker compose down -v` unless you intentionally want to delete
the live Docker database. SQL dumps, backups, `.env` files, and the `db`
directory are excluded from Git so private records and credentials are not
committed.
