/**
 * Rate Limiter Middleware
 * 
 * This middleware protects APIs from being called too frequently.
 * It helps prevent abuse and brute-force attacks.
 * 
 * Example:
 *   app.use('/api', apiLimiter);
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { HTTP_STATUS } = require('../constants');

/**
 * General rate limiter for all APIs
 * Limits number of requests per IP
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,

  // Response when limit is exceeded
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },

  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS
});

/**
 * Strict rate limiter for withdrawals
 * Used for sensitive endpoints
 */
const withdrawalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 requests allowed
  standardHeaders: true,
  legacyHeaders: false,

  // Response when limit is exceeded
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many withdrawal requests, please try again later'
    }
  },

  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: false
});

module.exports = {
  apiLimiter,
  withdrawalLimiter
};
