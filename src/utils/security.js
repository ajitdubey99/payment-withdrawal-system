/**
 * Security Utilities
 * 
 * This file handles basic security helpers.
 * Mainly used to make sure data is not changed (tampered).
 * 
 * Example:
 *   const { generateIntegrityHash } = require('./utils/security');
 *   const hash = generateIntegrityHash(data);
 */

const crypto = require('crypto');
const config = require('../config');

/**
 * Creates a hash for given data
 * Used to detect if data was modified later
 */
function generateIntegrityHash(data) {
  // Sort keys so same data always gives same hash
  const sortedData = sortObjectKeys(data);
  const dataString = JSON.stringify(sortedData);

  const hmac = crypto.createHmac(
    'sha256',
    config.security.hashSecret
  );

  hmac.update(dataString);
  return hmac.digest('hex');
}

/**
 * Checks if data is still valid
 * Returns true if hash matches
 */
function verifyIntegrityHash(data, hash) {
  const computedHash = generateIntegrityHash(data);

  // Safe comparison to avoid timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedHash),
    Buffer.from(hash)
  );
}

/**
 * Sorts object keys (recursively)
 * This avoids hash mismatch due to key order
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

module.exports = {
  generateIntegrityHash,
  verifyIntegrityHash
};