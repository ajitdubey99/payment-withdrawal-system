/**
 * Logger Utility
 * 
 * This file sets up a global logger using Winston.
 * It writes logs to files and also prints them to console in development.
 * 
 * Example:
 *   const logger = require('./utils/logger');
 *   logger.info('User created', { userId: '123' });
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Folder where logs will be stored
const logsDir = config.logging.filePath;

// Create logs folder if not exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Default log format (JSON)
 * Used for file logs
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console format (pretty output)
 * Used only in development
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
 * Create main logger instance
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'payment-withdrawal-service' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Print logs to console in non-production
if (!config.isProduction()) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

/**
 * Creates child logger with extra data
 * Useful for request-level logs
 */
logger.createChild = (metadata) => {
  return logger.child(metadata);
};

module.exports = logger;