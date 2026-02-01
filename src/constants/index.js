/**
 * App Constants
 * 
 * This file keeps all fixed values in one place.
 * It helps avoid hard-coded strings and magic numbers.
 * 
 * Example:
 *   const { USER_STATUS } = require('./constants');
 *   if (user.status === USER_STATUS.ACTIVE) { ... }
 */

/**
 * Different states of a user account
 */
const USER_STATUS = {
  ACTIVE: 'active',        // User can use the system
  SUSPENDED: 'suspended',  // User is temporarily disabled
  BLOCKED: 'blocked'       // User is permanently blocked
};

/**
 * Status flow for withdrawal requests
 * pending -> processing -> success / failed
 */
const WITHDRAWAL_STATUS = {
  PENDING: 'pending',        // Request created
  PROCESSING: 'processing',  // Being processed
  SUCCESS: 'success',        // Completed successfully
  FAILED: 'failed'           // Failed due to error
};

/**
 * Types of transactions used in logs
 */
const TRANSACTION_TYPE = {
  WITHDRAWAL: 'withdrawal',
  DEPOSIT: 'deposit',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment'
};

/**
 * Status of a transaction entry
 */
const TRANSACTION_STATUS = {
  INITIATED: 'initiated',  // Started
  COMPLETED: 'completed',  // Done
  FAILED: 'failed',        // Failed
  REVERSED: 'reversed'     // Rolled back
};

/**
 * Supported currencies
 */
const CURRENCY = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR'
};

/**
 * Common error codes used in API responses
 * These are sent to frontend for better error handling
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WITHDRAWAL_NOT_FOUND: 'WITHDRAWAL_NOT_FOUND',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_BLOCKED: 'USER_BLOCKED',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  AMOUNT_OUT_OF_RANGE: 'AMOUNT_OUT_OF_RANGE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  CONCURRENCY_ERROR: 'CONCURRENCY_ERROR',
  INTEGRITY_CHECK_FAILED: 'INTEGRITY_CHECK_FAILED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

/**
 * HTTP status codes used in responses
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Default values for pagination
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,    // First page
  DEFAULT_LIMIT: 20,  // Items per page
  MAX_LIMIT: 100     // Maximum allowed limit
};

module.exports = {
  USER_STATUS,
  WITHDRAWAL_STATUS,
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
  CURRENCY,
  ERROR_CODES,
  HTTP_STATUS,
  PAGINATION
};
