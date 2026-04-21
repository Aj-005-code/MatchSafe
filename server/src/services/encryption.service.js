import crypto from 'crypto';
import env from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.AES_KEY, 'hex');

/**
 * Encrypt a plaintext string using AES-256-GCM
 * @param {string} plaintext
 * @returns {string} iv:authTag:ciphertext (hex encoded)
 */
export function encrypt(plaintext) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 * @param {string} encryptedStr  iv:authTag:ciphertext (hex)
 * @returns {string} plaintext
 */
export function decrypt(encryptedStr) {
    const [ivHex, authTagHex, ciphertext] = encryptedStr.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
