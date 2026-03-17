import crypto from 'crypto';

const NODE_ENV = process.env.NODE_ENV || 'development';
const encryptionKeyRaw = process.env.ENCRYPTION_KEY;

if (NODE_ENV === 'production' && !encryptionKeyRaw) {
  throw new Error('ENCRYPTION_KEY environment variable must be set in production');
}

const KEY_INPUT = encryptionKeyRaw || 'dev-encryption-key-change-in-production';
const SALT = Buffer.from('ipa-resign-static-salt-v1');
// Derive a 32-byte key using scrypt for consistent key length regardless of input length
const ENCRYPTION_KEY = crypto.scryptSync(KEY_INPUT, SALT, 32);
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}
