/**
 * Application Constants
 * 
 * Centralized constant values used throughout the application.
 * Provides type safety and single source of truth for enums and fixed values.
 * 
 * Usage:
 *   const { USER_STATUS, WITHDRAWAL_STATUS } = require('./constants');
 *   if (user.status === USER_STATUS.ACTIVE) { ... }
 */

/**
 * User account status values
 */
const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked'
};

/**
 * Withdrawal request status values
 * Follows state machine: pending -> processing -> success/failed
 */
const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed'
};

/**
 * Transaction types for audit logging
 */
const TRANSACTION_TYPE = {
  WITHDRAWAL: 'withdrawal',
  DEPOSIT: 'deposit',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment'
};

/**
 * Transaction log status values
 */
const TRANSACTION_STATUS = {
  INITIATED: 'initiated',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REVERSED: 'reversed'
};

/**
 * Supported currency codes
 */
const CURRENCY = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR'
};

/**
 * Error codes for API responses
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
 * HTTP status codes
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
 * Decimal precision for monetary values
 */
const DECIMAL_PRECISION = 2;

/**
 * Maximum retry attempts for failed operations
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Default pagination values
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

module.exports = {
  USER_STATUS,
  WITHDRAWAL_STATUS,
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
  CURRENCY,
  ERROR_CODES,
  HTTP_STATUS,
  DECIMAL_PRECISION,
  MAX_RETRY_ATTEMPTS,
  PAGINATION
};
