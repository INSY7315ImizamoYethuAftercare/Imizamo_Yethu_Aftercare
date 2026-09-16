# Imizamo Yethu Aftercare Management System

Part 2. React + Tailwind client, Node.js/Express API,
managed as an npm workspaces monorepo. See the Part 1 planning document for full
architecture, data schema, and design pattern decisions - this README covers day-to-day
setup only.

## Structure

```
.
├── client/            React app (Vite + Tailwind CSS)
│   └── src/
│       ├── components/    Reusable UI pieces
│       ├── pages/         Route-level screens (Teacher/Manager/Admin/Guardian views)
│       ├── hooks/         Custom React hooks
│       └── services/      API client, auth helpers
├── server/            Express API
│   └── src/
│       ├── routes/        Route definitions only — no logic
│       ├── controllers/   Request/response handling, calls into services
│       ├── services/      Business logic (framework-agnostic)
│       ├── repositories/  Data access layer (Repository pattern, wraps PostgreSQL)
│       ├── middleware/    Logger, auth, error handling, rate limiting
│       ├── config/        Environment loading/validation
│       └── db/            Migrations and seed scripts 
└── package.json       Root workspace config
```

This mirrors the Layered pattern (Routes/Controllers → Services → Repositories) and the
middleware Chain of Responsibility (logger → authenticate → authorize → handler) from the
System Architecture doc.

## Prerequisites

- Node.js 22 (see `.nvmrc` - run `nvm use` if you have nvm installed)
- npm 10+ (ships with Node 22)

## Getting started

```bash
# from the repo root - installs both client and server dependencies
npm install

# copy env templates and fill in real values
cp server/.env.example server/.env
cp client/.env.example client/.env.local   # optional - defaults work for local dev
```

Run both apps in separate terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

The client's dev server proxies `/api/*` requests to the server automatically (see
`client/vite.config.js`), so components can call `apiClient.get('/health')` without any
CORS configuration during local development.

Confirm both are wired up correctly:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","timestamp":"..."}
```

## Environment variables

Never commit a real `.env` file - `.env.example` files document what's needed and are
safe to commit. See `server/.env.example` and `client/.env.example` for the full list.
In production, these are set via Azure App Service → Configuration, not committed files.

## Scripts (from repo root)

| Command | Description |
|---|---|
| `npm run dev:server` | Start the API with auto-reload (nodemon) |
| `npm run dev:client` | Start the Vite dev server |
| `npm run build:client` | Production build of the React app |
| `npm run start:server` | Start the API without auto-reload (production mode) |
| `npm test` | Run tests in every workspace that has them |

## Database Setup (Local Development - for now)

The full database schema is committed at `database/schema.sql`. Run this once
against your local PostgreSQL to create all tables.

### Prerequisites
- PostgreSQL installed locally (with `psql` available)
- A local database named 'imizamo_dev'

### Steps

1. Create an empty local database (only needed once):
```powershell
   psql.exe -U postgres -c "CREATE DATABASE imizamo_dev;"
```
2. Run the schema file against it:
```powershell
   psql.exe -U postgres -d imizamo_dev -f database/schema.sql
```
3. Update your local `.env` file with your database connection details
   (see `.env.example` for the required variables).

### If `psql` isn't recognized

Add PostgreSQL's `bin` folder to your PATH, or call it directly:
```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d imizamo_dev -f server/src/db/schema.sql
```

### Keeping schema.sql up to date

If you change the database structure locally (e.g. add a column or table),
re-export it and commit the updated file so the rest of the team stays in
sync:
```powershell
pg_dump.exe -U postgres -d imizamo_dev --schema-only -f server/src/db/schema.sql
```
Flag the change to the team (in WhatsApp) so everyone knows to re-run
step 2 above against their own local database.

## Branching & team workflow

There is no `develop` branch. Each team member works on their own personal branch
(`Thomas-backend`, `Michaela-backend`, `Justin-frontend`, `Nomsa-Frontend`, etc.),
branched from and merged back into `main` via pull request.

**A note on enforcement:** GitHub Free for organizations does not support branch
protection rules on private repositories (this requires GitHub Team or above), so
none of the rules below are technically enforced by GitHub - they're a team agreement
everyone commits to following manually:

- Never push directly to `main` - always open a pull request, even for small changes.
- Pull the latest `main` into your branch before opening a PR, to catch conflicts early
  rather than at merge time.
- Get at least one teammate's review/approval on a PR before merging it, even though
  GitHub won't block the merge if you skip this.
- Keep commits scoped and clearly described (what changed and why), so `git log` stays
  useful for the team and for the module's Proof of Collaboration evidence.

## Contributing

- Keep controllers thin - business logic belongs in `services/`, data access in
  `repositories/`. This keeps everything testable without a real database connection.
- Add new environment variables to the relevant `.env.example` in the same PR that
