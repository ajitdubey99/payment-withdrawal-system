/**
 * Error Handler Middleware
 * 
 * Global error handler for Express application.
 * Catches all errors and formats consistent error responses.
 * 
 * Usage:
 *   app.use(errorHandler);
 */

const logger = require('../utils/logger');
const { formatErrorResponse, isOperationalError } = require('../utils/errors');
const { HTTP_STATUS } = require('../constants');

/**
 * Global error handling middleware
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  logger.error('Error caught by error handler', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (res.headersSent) {
    return next(err);
  }
  
  const errorResponse = formatErrorResponse(err);
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  
  if (!isOperationalError(err)) {
    logger.error('Non-operational error occurred', {
      error: err.message,
      stack: err.stack
    });
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function notFoundHandler(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
