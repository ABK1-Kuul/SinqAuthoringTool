const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives an encryption key from a password using PBKDF2
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypts sensitive data (e.g., SMTP password)
 * Returns a string format: salt:iv:tag:encryptedData (all base64)
 */
function encrypt(text, masterPassword) {
  if (!text) return '';
  if (!masterPassword) {
    throw new Error('Master password required for encryption');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterPassword, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();

  return [
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted,
  ].join(':');
}

/**
 * Decrypts sensitive data
 */
function decrypt(encryptedData, masterPassword) {
  if (!encryptedData) return '';
  if (!masterPassword) {
    throw new Error('Master password required for decryption');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format');
  }

  const [saltBase64, ivBase64, tagBase64, encrypted] = parts;
  const salt = Buffer.from(saltBase64, 'base64');
  const iv = Buffer.from(ivBase64, 'base64');
  const tag = Buffer.from(tagBase64, 'base64');
  const key = deriveKey(masterPassword, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates a master password from app-specific data
 * This ensures encryption is tied to the installation
 */
function generateMasterPassword(appPath) {
  const { app } = require('electron');
  const path = require('path');
  const fs = require('fs');
  
  // Use app path + a constant secret to generate master password
  // In production, this could use a hardware ID or similar
  let userDataPath;
  try {
    userDataPath = app && typeof app.getPath === 'function' 
      ? app.getPath('userData') 
      : appPath;
  } catch (err) {
    userDataPath = appPath || path.join(process.cwd(), 'userData');
  }
  
  const secretFile = path.join(userDataPath, '.encryption_secret');
  
  let secret;
  if (fs.existsSync(secretFile)) {
    secret = fs.readFileSync(secretFile, 'utf8');
  } else {
    secret = crypto.randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(secretFile, secret, { mode: 0o600 });
    } catch (err) {
      // If we can't write the secret file, use a fallback
      console.warn('[encryption] Could not write secret file, using fallback');
      secret = crypto.createHash('sha256').update(userDataPath).digest('hex');
    }
  }
  
  return crypto.createHash('sha256')
    .update(userDataPath + secret)
    .digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateMasterPassword,
};

