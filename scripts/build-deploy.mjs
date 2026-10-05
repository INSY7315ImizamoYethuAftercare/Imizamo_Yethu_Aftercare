// Builds the folder that gets deployed to the Azure Web App:
//
//   npm run build:deploy
//
// deploy/
//   public/         the built React app (client/dist)
//   src/            the Express API (server/src, without tests or seed data)
//   package.json    production dependencies only, "npm start"
//   node_modules/   production dependencies only (no Jest, Vite, ...)
//   web.config      Windows Web App: run Node through IIS (ignored on Linux)
//   start.cjs       Windows Web App entry (iisnode needs CommonJS)
//
// Deploy the deploy/ folder, never the repo root: the root node_modules holds
// every build and test tool and is far too big for the Web App's disk.
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const out = path.join(root, 'deploy')
const run = (command, cwd = root) => {
  console.log(`> ${command}`)
  execSync(command, { cwd, stdio: 'inherit' })
}

// 1. Build the React app.
run('npm run build --workspace client')
const dist = path.join(root, 'client', 'dist')
if (!existsSync(path.join(dist, 'index.html'))) throw new Error('client/dist/index.html is missing: the client build failed.')

// 2. Start from an empty deploy/ folder.
rmSync(out, { recursive: true, force: true })
mkdirSync(out)

// 3. The API, without unit tests or local-only seed data.
const skip = (src) => {
  const rel = path.relative(path.join(root, 'server', 'src'), src).split(path.sep).join('/')
  return /\.test\.js$/.test(rel) || rel === 'db/seed' || rel.startsWith('db/seed/')
}
cpSync(path.join(root, 'server', 'src'), path.join(out, 'src'), { recursive: true, filter: (src) => !skip(src) })

// 4. The website.
cpSync(dist, path.join(out, 'public'), { recursive: true })

// 5. package.json with production dependencies only.
const server = JSON.parse(readFileSync(path.join(root, 'server', 'package.json'), 'utf8'))
const nodeVersion = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim()
writeFileSync(
  path.join(out, 'package.json'),
  JSON.stringify(
    {
      name: server.name,
      version: server.version,
      private: true,
      type: server.type,
      main: 'src/server.js',
      engines: { node: `>=${nodeVersion}` },
      scripts: { start: 'node src/server.js' },
      dependencies: server.dependencies,
    },
    null,
    2,
  ) + '\n',
)

// 6. Windows Web App files.
for (const file of ['web.config', 'start.cjs']) cpSync(path.join(root, 'scripts', 'azure', file), path.join(out, file))

// 7. Install production dependencies inside deploy/ (it isn't a workspace,
// so they land in deploy/node_modules rather than the repo root).
run('npm install --omit=dev --no-audit --no-fund --loglevel=error', out)

// 8. Report the size, so a bloated package is noticed before it's uploaded.
const sizeOf = (p) => (statSync(p).isDirectory() ? readdirSync(p).reduce((sum, f) => sum + sizeOf(path.join(p, f)), 0) : statSync(p).size)
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`
console.log(`\nDeploy package ready: ${out}`)
console.log(`  total ${mb(sizeOf(out))} (node_modules ${mb(sizeOf(path.join(out, 'node_modules')))}, website ${mb(sizeOf(path.join(out, 'public')))})`)
