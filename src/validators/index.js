/**
 * Validation Schemas
 * 
 * This file contains all request validation rules.
 * It makes sure incoming data is correct before reaching services.
 * 
 * Example:
 *   const { createWithdrawalSchema } = require('./validators');
 *   const data = validateSchema(createWithdrawalSchema, req.body);
 */

const Joi = require('joi');
const config = require('../config');
const { ValidationError } = require('../utils/errors');

/**
 * Reusable ObjectId validator
 */
const objectIdValidator = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message('Invalid ObjectId format');

/**
 * Bank destination validation
 */
const destinationSchema = Joi.object({
  accountNumber: Joi.string()
    .trim()
    .min(8)
    .max(20)
    .required(),

  ifscCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .required(),

  accountHolderName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  bankName: Joi.string()
    .trim()
    .max(100)
    .optional()
});

/**
 * Create withdrawal validation
 */
const createWithdrawalSchema = Joi.object({
  userId: objectIdValidator.required(),
  amount: Joi.number()
    .positive()
    .min(config.withdrawal.minAmount)
    .max(config.withdrawal.maxAmount)
    .precision(2)
    .required(),
  destination: destinationSchema.required()
});

/**
 * Get withdrawal validation
 */
const getWithdrawalSchema = Joi.object({
  withdrawalId: objectIdValidator.required()
});

/**
 * Get wallet validation
 */
const getWalletSchema = Joi.object({
  userId: objectIdValidator.required()
});

/**
 * Transaction history validation
 */
const transactionHistorySchema = Joi.object({
  userId: objectIdValidator.required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  transactionType: Joi.string()
    .valid('withdrawal', 'deposit', 'refund', 'adjustment')
    .optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
});

/**
 * Common validator helper
 */
function validateSchema(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message
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
  validateSchema
};