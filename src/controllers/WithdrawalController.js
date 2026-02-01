/**
 * Withdrawal Controller
 * 
 * This controller handles all withdrawal related APIs.
 * It receives the request, validates data, and calls service methods.
 */

const WithdrawalService = require('../services/WithdrawalService');
const { validateSchema, createWithdrawalSchema, getWithdrawalSchema } = require('../validators');
const { HTTP_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { formatErrorResponse } = require('../utils/errors');

class WithdrawalController {
  /**
   * Creates a new withdrawal request
   * Endpoint: POST /api/v1/withdrawals
   */
  async createWithdrawal(req, res) {
    try {
      // Validate request body
      const validatedData = validateSchema(
        createWithdrawalSchema,
        req.body
      );

      // Idempotency key is used to avoid duplicate requests
      const idempotencyKey = req.headers['x-idempotency-key'];

      if (!idempotencyKey) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'MISSING_IDEMPOTENCY_KEY',
            message: 'X-Idempotency-Key header is required'
          }
        });
      }

      // Create withdrawal entry
      const withdrawal = await WithdrawalService.createWithdrawal(
        validatedData,
        idempotencyKey
      );

      // Process withdrawal in background
      setImmediate(() => {
        WithdrawalService.processWithdrawal(
          withdrawal._id
        ).catch(error => {
          logger.error('Background withdrawal processing failed', {
            withdrawalId: withdrawal._id,
            error: error.message
          });
        });
      });

      // Send response to client
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          withdrawalId: withdrawal._id,
          userId: withdrawal.userId,
          amount: withdrawal.getAmount(),
          status: withdrawal.status,
          destination: withdrawal.destination,
          createdAt: withdrawal.createdAt
        }
      });
    } catch (error) {
      // Log error
      logger.error('Error in createWithdrawal controller', {
        error: error.message,
        stack: error.stack
      });

      // Send formatted error
      const errorResponse = formatErrorResponse(error);
      const statusCode =
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Returns single withdrawal by ID
   * Endpoint: GET /api/v1/withdrawals/:withdrawalId
   */
  async getWithdrawal(req, res) {
    try {
      // Validate route params
      const validatedData = validateSchema(
        getWithdrawalSchema,
        req.params
      );

      // Fetch withdrawal from service
      const withdrawal = await WithdrawalService.getWithdrawal(
        validatedData.withdrawalId
      );

      // Send response
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          withdrawalId: withdrawal._id,
          userId: withdrawal.userId,
          amount: withdrawal.getAmount(),
          status: withdrawal.status,
          destination: withdrawal.destination,
          failureReason: withdrawal.failureReason,
          processedAt: withdrawal.processedAt,
          createdAt: withdrawal.createdAt,
          updatedAt: withdrawal.updatedAt
        }
      });
    } catch (error) {
      // Log error
      logger.error('Error in getWithdrawal controller', {
        error: error.message,
        withdrawalId: req.params.withdrawalId
      });

      // Send formatted error
      const errorResponse = formatErrorResponse(error);
      const statusCode =
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Returns all withdrawals for a user
   * Endpoint: GET /api/v1/withdrawals/user/:userId
   */
  async getUserWithdrawals(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      // Fetch paginated withdrawals
      const result = await WithdrawalService.getUserWithdrawals(
        userId,
        page,
        limit
      );

      // Send response
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      // Log error
      logger.error('Error in getUserWithdrawals controller', {
        error: error.message,
        userId: req.params.userId
      });

      // Send formatted error
      const errorResponse = formatErrorResponse(error);
      const statusCode =
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new WithdrawalController();
