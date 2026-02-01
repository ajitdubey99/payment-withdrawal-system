/**
 * Config Manager
 * 
 * This file loads all environment variables and
 * keeps application configuration in one place.
 * 
 * Example:
 *   const config = require('./config');
 *   console.log(config.port);
 */

require('dotenv').config();

/**
 * Checks if all required environment variables are present.
 * If something is missing, the app will stop with an error.
 */
function validateConfig() {
  const required = [
    'MONGODB_URI',
    'PORT'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Run validation on app start
validateConfig();

/**
 * Main configuration object.
 * All app settings are grouped here.
 */
const config = {
  // Current environment (development / production / test)
  env: process.env.NODE_ENV || 'development',

  // Port on which server will run
  port: parseInt(process.env.PORT, 10) || 3000,

  // API version
  apiVersion: process.env.API_VERSION || 'v1',

  // MongoDB related settings
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Security related config
  security: {
    hashSecret: process.env.HASH_SECRET || 'change-this-hash-secret'
  },

  // Rate limiting settings
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  // Withdrawal rules
  withdrawal: {
    minAmount: parseFloat(process.env.WITHDRAWAL_MIN_AMOUNT) || 10,
    maxAmount: parseFloat(process.env.WITHDRAWAL_MAX_AMOUNT) || 100000,
    processingDelayMs:
      parseInt(process.env.WITHDRAWAL_PROCESSING_DELAY_MS, 10) || 2000
  },

  // Logging config
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  },

  // Transaction retry settings
  transaction: {
    retryAttempts:
      parseInt(process.env.TRANSACTION_RETRY_ATTEMPTS, 10) || 3,
    retryDelayMs:
      parseInt(process.env.TRANSACTION_RETRY_DELAY_MS, 10) || 1000
  },

  /**
   * Returns true if app is running in production.
   */
  isProduction() {
    return this.env === 'production';
  },

  /**
   * Returns true if app is running in development.
   */
  isDevelopment() {
    return this.env === 'development';
  },

  /**
   * Returns true if app is running in test mode.
   */
  isTest() {
    return this.env === 'test';
  }
};

module.exports = config;