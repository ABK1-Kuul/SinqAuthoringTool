const path = require('path');
const fs = require('fs-extra');

let backendApp = null;
let backendReadyPromise = null;

function getBackendRoot() {
  // Backend code is at project root, not in backend/ subfolder
  return path.join(__dirname, '..', '..');
}

async function ensureConfig(configPath, configData) {
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeJson(configPath, configData, { spaces: 2 });
  // Also mirror into backend/conf so legacy loaders can find it if required.
  const backendConf = path.join(getBackendRoot(), 'conf', 'config.json');
  await fs.ensureDir(path.dirname(backendConf));
  await fs.writeJson(backendConf, configData, { spaces: 2 });
}

function startBackend({ configPath, port, dataRoot }) {
  if (backendReadyPromise) return backendReadyPromise;
  const backendRoot = getBackendRoot();
  // Use absolute paths; do not chdir to avoid global side effects
  // Force embedded Mongo settings for the backend process
  process.env.DB_PORT = process.env.DB_PORT || String(require('./mongodb').MONGO_PORT);
  process.env.MONGO_PORT = process.env.MONGO_PORT || String(require('./mongodb').MONGO_PORT);
  process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
  const createApp = require(path.join(backendRoot, 'lib', 'application'));
  backendApp = createApp();
  backendApp.use({ configFile: configPath });
  
  // Add error handlers to backend app
  backendApp.on('error', (err) => {
    // Connection errors are often non-fatal
    if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'EPIPE') {
      console.warn('[backend] Connection error (non-fatal):', err.message);
      return;
    }
    console.error('[backend] Error:', err);
  });
  
  backendReadyPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      backendReadyPromise = null;
      reject(new Error('Backend startup timeout after 30 seconds'));
    }, 30000);
    
    backendApp.once('serverStarted', () => {
      clearTimeout(timeout);
      resolve(backendApp);
    });
    
    backendApp.once('error', (err) => {
      clearTimeout(timeout);
      backendReadyPromise = null;
      // Don't reject on connection errors
      if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'EPIPE') {
        console.warn('[backend] Connection error during startup (non-fatal):', err.message);
        // Still resolve - backend might recover
        resolve(backendApp);
      } else {
        reject(err);
      }
    });
    
    try {
      backendApp.run({
        skipVersionCheck: true,
        skipDependencyCheck: true,
        serverPort: port,
        dataRoot,
      });
    } catch (err) {
      clearTimeout(timeout);
      backendReadyPromise = null;
      return reject(err);
    }
  });
  return backendReadyPromise;
}

function stopBackend() {
  if (backendApp && backendApp._httpServer) {
    try {
      backendApp._httpServer.close();
    } catch (err) {
      console.error('[backend] failed to stop server', err);
    } finally {
      backendApp = null;
      backendReadyPromise = null;
    }
  }
}

module.exports = {
  startBackend,
  stopBackend,
  ensureConfig,
};

