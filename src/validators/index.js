/**
 * Validation Schemas
 * 
 * Joi validation schemas for request validation.
 * Provides input sanitization and structure validation.
 * 
 * Usage:
 *   const { withdrawalSchema } = require('./validators');
 *   const { error, value } = withdrawalSchema.validate(req.body);
 */

const Joi = require('joi');
const config = require('../config');
const { ValidationError } = require('../utils/errors');

/**
 * Custom Joi validator for MongoDB ObjectId
 */
const objectIdValidator = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

/**
 * Destination account validation schema
 */
const destinationSchema = Joi.object({
  accountNumber: Joi.string()
    .trim()
    .min(8)
    .max(20)
    .required()
    .messages({
      'string.empty': 'Account number is required',
      'string.min': 'Account number must be at least 8 characters',
      'string.max': 'Account number cannot exceed 20 characters'
    }),
  
  ifscCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .required()
    .messages({
      'string.empty': 'IFSC code is required',
      'string.pattern.base': 'Invalid IFSC code format'
    }),
  
  accountHolderName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Account holder name is required',
      'string.min': 'Account holder name must be at least 2 characters',
      'string.max': 'Account holder name cannot exceed 100 characters'
    }),
  
  bankName: Joi.string()
    .trim()
    .max(100)
    .optional()
});

/**
 * Create withdrawal request validation schema
 */
const createWithdrawalSchema = Joi.object({
  userId: objectIdValidator.required().messages({
    'any.required': 'User ID is required'
  }),
  
  amount: Joi.number()
    .positive()
    .min(config.withdrawal.minAmount)
    .max(config.withdrawal.maxAmount)
    .precision(2)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'number.min': `Amount must be at least ${config.withdrawal.minAmount}`,
      'number.max': `Amount cannot exceed ${config.withdrawal.maxAmount}`,
      'any.required': 'Amount is required'
    }),
  
  destination: destinationSchema.required().messages({
    'any.required': 'Destination is required'
  })
}).options({ stripUnknown: true });

/**
 * Get withdrawal by ID validation schema
 */
const getWithdrawalSchema = Joi.object({
  withdrawalId: objectIdValidator.required().messages({
    'any.required': 'Withdrawal ID is required'
  })
});

/**
 * Get wallet validation schema
 */
const getWalletSchema = Joi.object({
  userId: objectIdValidator.required().messages({
    'any.required': 'User ID is required'
  })
});

/**
 * Transaction history query validation schema
 */
const transactionHistorySchema = Joi.object({
  userId: objectIdValidator.required().messages({
    'any.required': 'User ID is required'
  }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
  
  transactionType: Joi.string()
    .valid('withdrawal', 'deposit', 'refund', 'adjustment')
    .optional(),
  
  startDate: Joi.date()
    .iso()
    .optional(),
  
  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.min': 'End date must be after start date'
    })
}).options({ stripUnknown: true });

/**
 * Idempotency key header validation
 */
const idempotencyKeySchema = Joi.string()
  .uuid({ version: 'uuidv4' })
  .required()
  .messages({
    'string.guid': 'Idempotency key must be a valid UUID v4',
    'any.required': 'X-Idempotency-Key header is required'
  });

/**
 * Generic pagination schema
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

/**
 * Validates request data against schema
 * 
 * @param {Object} schema - Joi validation schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validated and sanitized data
 * @throws {ValidationError} If validation fails
 */
function validateSchema(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    throw new ValidationError('Validation failed', details);
  }
  
  return value;
}

module.exports = {
  createWithdrawalSchema,
  getWithdrawalSchema,
  getWalletSchema,
  transactionHistorySchema,
  idempotencyKeySchema,
  paginationSchema,
  validateSchema
};
