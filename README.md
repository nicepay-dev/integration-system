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

### Cloudflare Tunnel network

The frontend automatically joins the external Docker network configured by
`CLOUDFLARE_NETWORK` on every deployment. Create this network once and connect
the existing `cloudflared` container to it:

```powershell
docker network create cloudflared
docker network connect cloudflared cloudflared
```

If the tunnel container has a different name, replace the final `cloudflared`
with that container name. In Cloudflare Tunnel, set the origin service to:

```text
http://frontend:80
```

In Portainer, the same one-time setup can be done under **Networks**: create
`cloudflared`, then add the Cloudflare Tunnel container to that network.

The application services communicate over the automatically created
`nicepay_integration_internal` network. PostgreSQL is always available to the
backend through the fixed DNS alias `database`.

If the backend reports `getaddrinfo ENOTFOUND database`, redeploy the complete
stack rather than only the backend service. In Portainer, confirm that both the
backend and database containers are connected to
`nicepay_integration_internal`. When PostgreSQL is managed in another stack,
connect that container to the same network and set `DB_HOST` to its network
alias in the stack environment.

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

PostgreSQL starts without private application records. Apply the private
structure and data scripts manually when initializing a new server.
`DB_SYNCHRONIZE` defaults to `false` in production so NestJS does not
automatically alter protected database tables. All later changes are stored in
the permanent `merchant_pulse_postgres_data` volume. The volume survives
container replacement, image rebuilding, `docker compose down`, and Compose
project-name changes.

Do not run `docker compose down -v` unless you intentionally want to delete
the live Docker database. SQL dumps, backups, `.env` files, and the `db`
directory are excluded from Git so private records and credentials are not
committed.
