/**
 * Rate Limiter Middleware
 * 
 * Implements rate limiting to prevent abuse.
 * 
 * Usage:
 *   app.use('/api', rateLimiter);
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const { HTTP_STATUS } = require('../constants');

/**
 * General API rate limiter
 * Limits requests per IP address
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
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
 * Strict rate limiter for sensitive operations
 * More restrictive limits for withdrawal requests
 */
const withdrawalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
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
