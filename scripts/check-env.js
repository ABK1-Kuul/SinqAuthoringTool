const fs = require('fs');
const path = require('path');

/**
 * Validates the existence and permissions of critical resources before app startup.
 * Returns an object with 'success' and any 'errors' found.
 *
 * @param {Object} electronApp - Electron app instance (required for paths)
 * @returns {{ success: boolean, errors: string[] }}
 */
function runPreflightCheck(electronApp) {
  const results = { success: true, errors: [] };

  if (!electronApp || typeof electronApp.getPath !== 'function') {
    results.success = false;
    results.errors.push('Electron app instance not available for preflight check');
    return results;
  }

  const binaryName = process.platform === 'win32' ? 'mongod.exe' : 'mongod';

  // 1. Check MongoDB Binary (paths must match mongodb.js service)
  const mongoPath = electronApp.isPackaged && process.resourcesPath
    ? path.join(process.resourcesPath, 'mongodb', 'bin', binaryName)
    : path.join(process.cwd(), 'resources', 'mongodb', 'bin', binaryName);

  try {
    fs.accessSync(mongoPath, fs.constants.X_OK);
  } catch (err) {
    results.success = false;
    results.errors.push(`MongoDB binary missing or not executable at: ${mongoPath}`);
  }

  // 2. Ensure Database Directory exists and is writable (matches mongodb.js DB_DIR)
  const userDataPath = electronApp.getPath('userData');
  const dbDir = path.join(userDataPath, 'mongodb', 'data');

  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.accessSync(dbDir, fs.constants.W_OK);
  } catch (err) {
    results.success = false;
    results.errors.push(`Could not create or write to database directory at: ${dbDir}`);
  }

  return results;
}

module.exports = runPreflightCheck;
