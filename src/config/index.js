/**
 * Configuration Manager
 * 
 * Centralized configuration management for the application.
 * Loads and validates environment variables, provides typed access to config values.
 * 
 * Usage:
 *   const config = require('./config');
 *   console.log(config.port);
 */

require('dotenv').config();

/**
 * Validates required environment variables
 * Throws error if any required variable is missing
 */
function validateConfig() {
  const required = [
    'MONGODB_URI',
    'PORT'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateConfig();

/**
 * Application configuration object
 * Contains all configuration parameters organized by category
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiVersion: process.env.API_VERSION || 'v1',

  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  security: {
    hashSecret: process.env.HASH_SECRET || 'change-this-hash-secret'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  withdrawal: {
    minAmount: parseFloat(process.env.WITHDRAWAL_MIN_AMOUNT) || 10,
    maxAmount: parseFloat(process.env.WITHDRAWAL_MAX_AMOUNT) || 100000,
    processingDelayMs: parseInt(process.env.WITHDRAWAL_PROCESSING_DELAY_MS, 10) || 2000
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  },

  transaction: {
    retryAttempts: parseInt(process.env.TRANSACTION_RETRY_ATTEMPTS, 10) || 3,
    retryDelayMs: parseInt(process.env.TRANSACTION_RETRY_DELAY_MS, 10) || 1000
  },

  /**
   * Check if running in production environment
   * @returns {boolean} True if production environment
   */
  isProduction() {
    return this.env === 'production';
  },

  /**
   * Check if running in development environment
   * @returns {boolean} True if development environment
   */
  isDevelopment() {
    return this.env === 'development';
  },

  /**
   * Check if running in test environment
   * @returns {boolean} True if test environment
   */
  isTest() {
    return this.env === 'test';
  }
};

module.exports = config;
