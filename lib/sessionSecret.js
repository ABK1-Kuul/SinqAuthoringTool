// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
/**
 * Session secret management - avoids hardcoded secrets in config.
 * Priority: SESSION_SECRET env var > .session-key file > generate and persist.
 *
 * @module sessionSecret
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SESSION_KEY_FILENAME = '.session-key';
const SECRET_LENGTH = 64;

/**
 * Resolves the path for the .session-key file.
 * @param {string} [baseDir] - Base directory (e.g. config dir or server root). Defaults to process.cwd().
 * @returns {string}
 */
function getSessionKeyPath(baseDir) {
  const dir = baseDir || process.cwd();
  return path.join(dir, SESSION_KEY_FILENAME);
}

/**
 * Gets or creates a session secret.
 * Priority: SESSION_SECRET env var > .session-key file > generate and save.
 *
 * @param {string} [baseDir] - Directory for .session-key (e.g. conf/ or userData/config). Defaults to process.cwd().
 * @returns {string} 64-character hex session secret
 */
function getSessionSecret(baseDir) {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }

  const keyPath = getSessionKeyPath(baseDir);
  const keyDir = path.dirname(keyPath);

  if (fs.existsSync(keyPath)) {
    try {
      const secret = fs.readFileSync(keyPath, 'utf8').trim();
      if (secret && secret.length >= 32) {
        return secret;
      }
    } catch (err) {
      // Fall through to generate new
    }
  }

  const secret = crypto.randomBytes(SECRET_LENGTH).toString('hex');
  try {
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }
    fs.writeFileSync(keyPath, secret, { mode: 0o600 });
  } catch (err) {
    // Non-fatal: caller can still use the generated secret for this run
    console.warn('[sessionSecret] Could not persist .session-key:', err.message);
  }
  return secret;
}

module.exports = {
  getSessionSecret,
  getSessionKeyPath,
  SESSION_KEY_FILENAME,
};
