/**
 * Logger Utility
 * 
 * Centralized logging utility using Winston.
 * Provides structured logging with different levels and transports.
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User created', { userId: '123' });
 *   logger.error('Error occurred', { error: err.message });
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const logsDir = config.logging.filePath;

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Custom log format that includes timestamp, level, and message
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format for development environment
 * Provides colorized output with readable formatting
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

/**
 * Create Winston logger instance with multiple transports
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'payment-withdrawal-service' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

if (!config.isProduction()) {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Creates a child logger with additional context
 * Useful for adding request-specific metadata
 * 
 * @param {Object} metadata - Additional metadata to include in all logs
 * @returns {winston.Logger} Child logger instance
 */
logger.createChild = (metadata) => {
  return logger.child(metadata);
};

module.exports = logger;
