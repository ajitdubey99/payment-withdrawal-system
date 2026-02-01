/**
 * Error Handler Middleware
 * 
 * This file contains global error handlers for the app.
 * It catches all errors and sends a proper response to the client.
 * 
 * Example:
 *   app.use(errorHandler);
 */

const logger = require('../utils/logger');
const { formatErrorResponse, isOperationalError } = require('../utils/errors');
const { HTTP_STATUS } = require('../constants');

/**
 * Handles all runtime errors in one place
 */
function errorHandler(err, req, res, next) {
  // Log error details
  logger.error('Error caught by error handler', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // If response is already sent, forward the error
  if (res.headersSent) {
    return next(err);
  }

  // Create standard error response
  const errorResponse = formatErrorResponse(err);
  const statusCode =
    err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Log only serious errors separately
  if (!isOperationalError(err)) {
    logger.error('Non-operational error occurred', {
      error: err.message,
      stack: err.stack
    });
  }

  // Send error to client
  res.status(statusCode).json(errorResponse);
}

/**
 * Handles unknown routes (404)
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
