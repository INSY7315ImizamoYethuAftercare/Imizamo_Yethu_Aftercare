# Deploying to Azure

The app runs on one **Azure Web App** (`Imizamo-Yethu-Aftercare-WebApp`), which serves both the website and the `/api` routes, with its data in **Azure Database for PostgreSQL**.

## What gets deployed

Only the `deploy/` folder, which `npm run build:deploy` creates (about 6 MB):

| In `deploy/` | What it is |
|---|---|
| `public/` | The built React app (from `client/dist`) |
| `src/` | The Express API (from `server/src`, without tests) |
| `package.json`, `node_modules/` | Production dependencies only |
| `web.config`, `start.cjs` | Run Node on a Windows Web App (a Linux Web App ignores these and runs `npm start`) |

**Never deploy the repo root.** Its `node_modules` holds every build and test tool (over 350 MB) and fills the Web App's disk: *"There is not enough space on the disk."*

`.env` files are never deployed. The Web App reads its settings from Azure (below).

## Deploying

**Automatically:** merging a pull request into `main` runs every test in GitHub Actions, then builds `deploy/` and deploys it. The `AZURE_WEBAPP_PUBLISH_PROFILE` secret must be the publish profile of `Imizamo-Yethu-Aftercare-WebApp` (Azure portal → the Web App → **Download publish profile**; GitHub → Settings → Secrets and variables → Actions).

**By hand from VS Code**, in PowerShell from the project folder:

```powershell
npm run build:deploy
```

Then in the Azure extension, right-click the Web App and choose **Deploy to Web App…**. The workspace setting `"appService.deploySubpath": "deploy"` makes it upload only `deploy/`. Always run `build:deploy` first, or you deploy an old build.

## Web App settings (one-off)

Azure portal → the Web App → **Settings → Environment variables → App settings**:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | The Azure PostgreSQL connection string (`postgresql://ImizamoYethu:<password>@imizamo-yethu.postgres.database.azure.com:5432/imizamo_prod?sslmode=require`) |
| `JWT_SECRET` | A long random string (not the one from your `.env`) |
| `CLIENT_ORIGIN` | The site's own address, e.g. `https://imizamo-yethu-aftercare-webapp.azurewebsites.net` |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~22` (Windows Web App only) |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false` (the package already contains its dependencies) |

Azure sets `PORT` itself. On Linux, also set **Configuration → General settings → Startup command** to `npm start`.

The Azure PostgreSQL server must allow the Web App: **Networking → Allow public access from any Azure service within Azure**.

## Database updates

Run each migration once on the Azure database, in order, before deploying code that needs it. They're safe to run again.

**First, let your computer through the database firewall** (once per network: home and campus Wi-Fi have different addresses). Azure portal → the PostgreSQL server `imizamo-yethu` → **Settings → Networking** → **+ Add current client IP address** → **Save**. Without this the connection times out or *"server closed the connection unexpectedly"*.

Then in PowerShell, from the project folder. `psql` asks for the Azure database password; don't put it in the command, where it stays in your PowerShell history.

```powershell
$azure = "host=imizamo-yethu.postgres.database.azure.com port=5432 dbname=imizamo_prod user=ImizamoYethu sslmode=require"
# Check the connection first: prints a single 1.
& "C:/Program Files/PostgreSQL/17/bin/psql.exe" $azure -c "SELECT 1"
& "C:/Program Files/PostgreSQL/17/bin/psql.exe" $azure -f server/src/db/migrations/001_signout_by_manager.sql
& "C:/Program Files/PostgreSQL/17/bin/psql.exe" $azure -f server/src/db/migrations/002_pickups_without_accounts.sql
& "C:/Program Files/PostgreSQL/17/bin/psql.exe" $azure -f server/src/db/migrations/003_class_colour.sql
& "C:/Program Files/PostgreSQL/17/bin/psql.exe" $azure -f server/src/db/migrations/004_master_admin_manages.sql
```

Never run `npm run seed:demo` against Azure (it refuses to).

## After a deploy

1. Open `https://<web app>.azurewebsites.net/api/health`: `{"status":"ok", …}`.
2. Open the site and sign in. Refresh on a page such as `/manager/learners`: it should reload that page, not show an error.
3. If it doesn't start: Azure portal → the Web App → **Log stream**. *"Failed to connect to PostgreSQL"* means `DATABASE_URL` or the database firewall; *"Missing required environment variable"* names the setting to add.
