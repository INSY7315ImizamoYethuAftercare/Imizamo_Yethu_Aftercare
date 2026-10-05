// Entry point on a Windows Azure Web App. iisnode loads its entry file with
// require(), which can't load an ES module directly, so this CommonJS file
// imports the real server. Copied into the deploy package by
// scripts/build-deploy.mjs.
import('./src/server.js').catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start the server:', err)
  process.exit(1)
})
