/**
 * Security Utilities
 * 
 * Provides cryptographic functions for data integrity and security.
 * 
 * Functions:
 *   - generateIntegrityHash: Creates tamper-detection hash
 *   - verifyIntegrityHash: Verifies data integrity
 *   - generateIdempotencyKey: Creates unique request identifier
 * 
 * Usage:
 *   const { generateIntegrityHash } = require('./utils/security');
 *   const hash = generateIntegrityHash(data);
 */

const crypto = require('crypto');
const config = require('../config');

/**
 * Generates HMAC-SHA256 hash for data integrity verification
 * Used to detect tampering of withdrawal requests
 * 
 * @param {Object} data - Data object to hash
 * @returns {string} Hexadecimal hash string
 * 
 * @example
 * const hash = generateIntegrityHash({
 *   userId: '123',
 *   amount: 1000,
 *   destination: { accountNumber: '456' }
 * });
 */
function generateIntegrityHash(data) {
  const sortedData = sortObjectKeys(data);
  const dataString = JSON.stringify(sortedData);
  
  const hmac = crypto.createHmac('sha256', config.security.hashSecret);
  hmac.update(dataString);
  
  return hmac.digest('hex');
}

/**
 * Verifies integrity hash matches the data
 * Returns true if data has not been tampered with
 * 
 * @param {Object} data - Original data object
 * @param {string} hash - Hash to verify against
 * @returns {boolean} True if hash matches
 * 
 * @example
 * const isValid = verifyIntegrityHash(data, storedHash);
 * if (!isValid) throw new Error('Data tampering detected');
 */
function verifyIntegrityHash(data, hash) {
  const computedHash = generateIntegrityHash(data);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  );
}

/**
 * Sorts object keys recursively for consistent hashing
 * Ensures same data always produces same hash
 * 
 * @param {Object} obj - Object to sort
 * @returns {Object} Object with sorted keys
 * @private
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sortedObj = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  
  return sortedObj;
}

/**
 * Generates a unique idempotency key
 * Used when client doesn't provide one
 * 
 * @returns {string} UUID v4 string
 * 
 * @example
 * const key = generateIdempotencyKey();
 */
function generateIdempotencyKey() {
  return crypto.randomUUID();
}

/**
 * Sanitizes user input to prevent injection attacks
 * Removes potentially dangerous characters
 * 
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 * 
 * @example
 * const safe = sanitizeInput(userInput);
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Validates ObjectId format
 * Checks if string is valid MongoDB ObjectId
 * 
 * @param {string} id - ID string to validate
 * @returns {boolean} True if valid ObjectId
 * 
 * @example
 * if (!isValidObjectId(userId)) throw new Error('Invalid user ID');
 */
function isValidObjectId(id) {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
}

/**
 * Generates random string for tokens
 * 
 * @param {number} length - Length of random string
 * @returns {string} Random hexadecimal string
 * 
 * @example
 * const token = generateRandomString(32);
 */
function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

module.exports = {
  generateIntegrityHash,
  verifyIntegrityHash,
  generateIdempotencyKey,
  sanitizeInput,
  isValidObjectId,
  generateRandomString
};
