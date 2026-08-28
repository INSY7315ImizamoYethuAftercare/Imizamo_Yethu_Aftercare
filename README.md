# Imizamo Yethu Aftercare Management System

Part 2. React + Tailwind client, Node.js/Express API,
managed as an npm workspaces monorepo. See the Part 1 planning document for full
architecture, data schema, and design pattern decisions — this README covers day-to-day
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
│       └── db/            Migrations and seed scripts (added in Epic B)
└── package.json       Root workspace config
```

This mirrors the Layered pattern (Routes/Controllers → Services → Repositories) and the
middleware Chain of Responsibility (logger → authenticate → authorize → handler) from the
System Architecture doc.

## Prerequisites

- Node.js 22 (see `.nvmrc` — run `nvm use` if you have nvm installed)
- npm 10+ (ships with Node 22)

## Getting started

```bash
# from the repo root — installs both client and server dependencies
npm install

# copy env templates and fill in real values
cp server/.env.example server/.env
cp client/.env.example client/.env.local   # optional — defaults work for local dev
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

Never commit a real `.env` file — `.env.example` files document what's needed and are
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

## Contributing

- Branch from `develop`, not `main` (see the DevOps: GitHub Actions Pipeline task for
  the full branching strategy).
- Keep controllers thin — business logic belongs in `services/`, data access in
  `repositories/`. This keeps everything testable without a real database connection.
- Add new environment variables to the relevant `.env.example` in the same PR that
  introduces them, so nobody's local setup silently breaks.
