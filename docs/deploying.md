# Deploying to Azure

The app runs on one **Azure Web App** (`Imizamo-Yethu-Aftercare-WebApp`), which serves both the website and the `/api` routes, with its data in **Azure Database for PostgreSQL**.

## What gets deployed

Only the `deploy/` folder, which `npm run build:deploy` creates (about 6 MB):

| In `deploy/`                    | What it is                                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `public/`                       | The built React app (from `client/dist`)                                           |
| `src/`                          | The Express API (from `server/src`, without tests)                                 |
| `package.json`, `node_modules/` | Production dependencies only                                                       |
| `web.config`, `start.cjs`       | Run Node on a Windows Web App (a Linux Web App ignores these and runs `npm start`) |

**Never deploy the repo root.** Its `node_modules` holds every build and test tool (over 350 MB) and fills the Web App's disk: *"There is not enough space on the disk."*

`.env` files are never deployed. The Web App reads its settings from Azure (below).

## Deploying

**Automatically:** merging a pull request into `main` runs every test in GitHub Actions, then builds `deploy/` and deploys it. The `AZURE_WEBAPP_PUBLISH_PROFILE` secret must be the publish profile of `Imizamo-Yethu-Aftercare-WebApp` (Azure portal → the Web App → **Download publish profile**; GitHub → Settings → Secrets and variables → Actions).

**By hand from VS Code**, in PowerShell from the project folder:

```powershell
npm run build:deploy