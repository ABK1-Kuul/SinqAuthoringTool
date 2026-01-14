const { app } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const fsSync = require('fs');
const net = require('net');
const path = require('path');
const os = require('os');
const isDev = require('electron-is-dev');

// In unit tests (Node only) Electron's app may be undefined, so fall back to a local path
function getUserDataPath() {
  try {
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData');
    }
  } catch (err) {
    // ignore and fall through to default
  }
  return path.join(process.cwd(), 'userData');
}

const USER_DATA = getUserDataPath();
const MONGO_PORT = 27017; // Changed to standard port for portable app
const DB_DIR = path.join(USER_DATA, 'mongodb', 'data'); // Store in app folder
const LOG_FILE = path.join(USER_DATA, 'mongodb', 'mongod.log');

let mongoProcess = null;
let stopping = false;

function getMongoBinaryPath() {
  // Packaged build: use resourcesPath
  if (app.isPackaged && process.resourcesPath) {
    return path.join(process.resourcesPath, 'mongodb', 'bin', 'mongod.exe');
  }
  // Dev mode: assume npm run electron from project root
  return path.join(process.cwd(), 'resources', 'mongodb', 'bin', 'mongod.exe');
}

async function ensureDbDir() {
  await fs.ensureDir(DB_DIR);
  await fs.ensureDir(path.dirname(LOG_FILE));
  // Precreate log file so user can open it if mongod exits early
  await fs.ensureFile(LOG_FILE);
  
  // Check for and remove lock file if it exists (from unclean shutdown)
  const lockFile = path.join(DB_DIR, 'mongod.lock');
  if (await fs.pathExists(lockFile)) {
    console.log('[mongo] Removing stale lock file:', lockFile);
    try {
      await fs.remove(lockFile);
    } catch (err) {
      console.warn('[mongo] Could not remove lock file:', err.message);
      // Don't throw - try to continue anyway
    }
  }
}

function waitForMongoReady(timeoutMs = 15000, processRef) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    let processExited = false;
    let exitCode = null;
    
    // Watch for process exit while waiting
    const exitHandler = (code, signal) => {
      processExited = true;
      exitCode = code;
    };
    if (processRef) {
      processRef.once('exit', exitHandler);
    }
    
    const check = () => {
      // Check if process exited before connection succeeded
      if (processExited && exitCode !== 0) {
        return reject(new Error(`MongoDB process exited with code ${exitCode} before it was ready. Check the log file for details: ${LOG_FILE}`));
      }
      
      const socket = net.createConnection(MONGO_PORT, '127.0.0.1');
      socket.once('connect', () => {
        socket.end();
        if (processRef) processRef.removeListener('exit', exitHandler);
        resolve();
      });
      socket.once('error', err => {
        socket.destroy();
        if (processExited && exitCode !== 0) {
          if (processRef) processRef.removeListener('exit', exitHandler);
          return reject(new Error(`MongoDB process exited with code ${exitCode} before it was ready. Check the log file for details: ${LOG_FILE}`));
        }
        if (Date.now() - start > timeoutMs) {
          if (processRef) processRef.removeListener('exit', exitHandler);
          // Try to read log file for more details
          let errorMsg = `MongoDB failed to start within ${timeoutMs}ms. Connection refused on port ${MONGO_PORT}`;
          try {
            if (fsSync.existsSync(LOG_FILE)) {
              const logContent = fsSync.readFileSync(LOG_FILE, 'utf8');
              const lastLines = logContent.split('\n').slice(-5).join('\n');
              if (lastLines) {
                errorMsg += `\n\nLast log entries:\n${lastLines}`;
              }
            }
          } catch (e) {
            // Ignore log read errors
          }
          return reject(new Error(errorMsg));
        }
        setTimeout(check, 250);
      });
    };
    check();
  });
}

async function startMongo() {
  if (mongoProcess && !mongoProcess.killed) return mongoProcess;
  stopping = false;
  await ensureDbDir();
  const mongoBin = getMongoBinaryPath();
  console.log('[mongo] binary path:', mongoBin);
  const args = [
    `--dbpath=${DB_DIR}`,
    `--port=${MONGO_PORT}`,
    '--bind_ip=127.0.0.1',
    '--quiet',
    `--logpath=${LOG_FILE}`,
  ];
  // Verify binary exists before spawning
  if (!await fs.pathExists(mongoBin)) {
    throw new Error(`MongoDB binary not found at: ${mongoBin}`);
  }
  mongoProcess = spawn(mongoBin, args, {
    stdio: ['ignore', 'pipe', 'pipe'], // Capture stderr for debugging
    windowsHide: true,
  });
  
  let stderrData = '';
  mongoProcess.stderr.on('data', (data) => {
    const output = data.toString();
    stderrData += output;
    console.error(`[mongo] stderr: ${output}`);
    try {
      fsSync.appendFileSync(LOG_FILE, output);
    } catch (_) {}
  });
  
  mongoProcess.on('error', (err) => {
    console.error(`[mongo] spawn error:`, err);
    mongoProcess = null;
    throw err;
  });
  
  mongoProcess.on('exit', (code, signal) => {
    console.log(`[mongo] exited code=${code} signal=${signal}`);
    if (code !== 0 && stderrData) {
      console.error(`[mongo] stderr output: ${stderrData}`);
    }
    mongoProcess = null;
    if (!stopping && code !== 0) {
      // auto-restart on crash with small delay
      setTimeout(() => startMongo().catch(err => console.error('[mongo] restart failed', err)), 500);
    }
  });
  
  await waitForMongoReady(15000, mongoProcess);
  return mongoProcess;
}

function stopMongo() {
  stopping = true;
  if (mongoProcess && !mongoProcess.killed) {
    mongoProcess.kill('SIGINT');
  }
}

module.exports = {
  startMongo,
  stopMongo,
  MONGO_PORT,
  DB_DIR,
  getMongoBinaryPath, // Export for error messages
};

