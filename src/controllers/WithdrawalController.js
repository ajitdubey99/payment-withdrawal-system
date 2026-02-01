/**
 * Withdrawal Controller
 * 
 * HTTP request handler for withdrawal endpoints.
 * Validates input and delegates to WithdrawalService.
 * 
 * Usage:
 *   Routes use these controller methods to handle requests
 */

const WithdrawalService = require('../services/WithdrawalService');
const { validateSchema, createWithdrawalSchema, getWithdrawalSchema } = require('../validators');
const { HTTP_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { formatErrorResponse } = require('../utils/errors');

class WithdrawalController {
  /**
   * Create new withdrawal request
   * POST /api/v1/withdrawals
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createWithdrawal(req, res) {
    try {
      const validatedData = validateSchema(createWithdrawalSchema, req.body);
      
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
      
      const withdrawal = await WithdrawalService.createWithdrawal(
        validatedData,
        idempotencyKey
      );
      
      setImmediate(() => {
        WithdrawalService.processWithdrawal(withdrawal._id).catch(error => {
          logger.error('Background withdrawal processing failed', {
            withdrawalId: withdrawal._id,
            error: error.message
          });
        });
      });
      
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
      logger.error('Error in createWithdrawal controller', {
        error: error.message,
        stack: error.stack
      });
      
      const errorResponse = formatErrorResponse(error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Get withdrawal by ID
   * GET /api/v1/withdrawals/:withdrawalId
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWithdrawal(req, res) {
    try {
      const validatedData = validateSchema(getWithdrawalSchema, req.params);
      
      const withdrawal = await WithdrawalService.getWithdrawal(
        validatedData.withdrawalId
      );
      
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
      logger.error('Error in getWithdrawal controller', {
        error: error.message,
        withdrawalId: req.params.withdrawalId
      });
      
      const errorResponse = formatErrorResponse(error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Get user withdrawals
   * GET /api/v1/withdrawals/user/:userId
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserWithdrawals(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      
      const result = await WithdrawalService.getUserWithdrawals(userId, page, limit);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getUserWithdrawals controller', {
        error: error.message,
        userId: req.params.userId
      });
      
      const errorResponse = formatErrorResponse(error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new WithdrawalController();
