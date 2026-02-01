/**
 * Custom Error Classes
 * 
 * Provides specialized error types for different error scenarios.
 * Enables proper error handling and appropriate HTTP status codes.
 * 
 * Usage:
 *   const { ValidationError, NotFoundError } = require('./utils/errors');
 *   throw new ValidationError('Invalid input');
 */

const { ERROR_CODES, HTTP_STATUS } = require('../constants');

/**
 * Base application error class
 * All custom errors extend from this class
 */
class AppError extends Error {
  /**
   * Creates an application error
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Application error code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode, errorCode, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for invalid input
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
 * Resource not found error
 */
class NotFoundError extends AppError {
  constructor(resource, details = {}) {
    super(
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES[`${resource.toUpperCase().replace(' ', '_')}_NOT_FOUND`] || ERROR_CODES.NOT_FOUND,
      details
    );
  }
}

/**
 * Insufficient balance error
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
 * User account suspended error
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
 * User account blocked error
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
 * Duplicate request error (idempotency violation)
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
 * Amount out of range error
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
 * Transaction processing error
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
 * Concurrency conflict error (optimistic locking failure)
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
 * Data integrity check failed error
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
 * 
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
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
 * Checks if error is operational (expected error)
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if operational error
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
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
