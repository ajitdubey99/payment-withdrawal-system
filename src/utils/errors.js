/**
 * Custom Error Classes
 * 
 * This file contains all custom error types used in the app.
 * Instead of throwing generic errors, we throw meaningful ones.
 * This helps in debugging and sending proper API responses.
 * 
 * Example:
 *   throw new ValidationError('Invalid input');
 */

const { ERROR_CODES, HTTP_STATUS } = require('../constants');

/**
 * Base error class for the application
 * All other errors extend from this
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // known and expected errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for invalid user input
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(
      message || 'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      details
    );
  }
}

/**
 * Error when resource is not found
 */
class NotFoundError extends AppError {
  constructor(resource, details = {}) {
    super(
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      details
    );
  }
}

/**
 * Error for low wallet balance
 */
class InsufficientBalanceError extends AppError {
  constructor(details = {}) {
    super(
      'Insufficient balance for this transaction',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      ERROR_CODES.INSUFFICIENT_BALANCE,
      details
    );
  }
}

/**
 * Error when user is suspended
 */
class UserSuspendedError extends AppError {
  constructor(details = {}) {
    super(
      'User account is suspended',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.USER_SUSPENDED,
      details
    );
  }
}

/**
 * Error when user is blocked
 */
class UserBlockedError extends AppError {
  constructor(details = {}) {
    super(
      'User account is blocked',
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.USER_BLOCKED,
      details
    );
  }
}

/**
 * Error for duplicate requests
 */
class DuplicateRequestError extends AppError {
  constructor(details = {}) {
    super(
      'Duplicate request detected',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.DUPLICATE_REQUEST,
      details
    );
  }
}

/**
 * Error when amount is not in allowed range
 */
class AmountOutOfRangeError extends AppError {
  constructor(min, max, details = {}) {
    super(
      `Amount must be between ${min} and ${max}`,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.AMOUNT_OUT_OF_RANGE,
      { ...details, min, max }
    );
  }
}

/**
 * Error during transaction failure
 */
class TransactionError extends AppError {
  constructor(message, details = {}) {
    super(
      message || 'Transaction processing failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.TRANSACTION_FAILED,
      details
    );
  }
}

/**
 * Error for concurrency conflicts
 */
class ConcurrencyError extends AppError {
  constructor(details = {}) {
    super(
      'Concurrent modification detected. Please retry.',
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.CONCURRENCY_ERROR,
      details
    );
  }
}

/**
 * Error when data integrity check fails
 */
class IntegrityError extends AppError {
  constructor(details = {}) {
    super(
      'Data integrity check failed',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.INTEGRITY_CHECK_FAILED,
      details
    );
  }
}

/**
 * Formats error for API response
 */
function formatErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        details: error.details
      }
    };
  }

  // For unknown/unexpected errors
  return {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      details: {}
    }
  };
}

/**
 * Checks if error is expected (operational)
 */
function isOperationalError(error) {
  return error instanceof AppError && error.isOperational;
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  InsufficientBalanceError,
  UserSuspendedError,
  UserBlockedError,
  DuplicateRequestError,
  AmountOutOfRangeError,
  TransactionError,
  ConcurrencyError,
  IntegrityError,
  formatErrorResponse,
  isOperationalError
};