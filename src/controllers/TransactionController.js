/**
 * Transaction Controller
 * 
 * HTTP request handler for transaction history endpoints.
 * 
 * Usage:
 *   Routes use these controller methods to handle transaction requests
 */

const TransactionService = require('../services/TransactionService');
const { validateSchema, transactionHistorySchema } = require('../validators');
const { HTTP_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { formatErrorResponse } = require('../utils/errors');

class TransactionController {
  /**
   * Get transaction history
   * GET /api/v1/transactions
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTransactionHistory(req, res) {
    try {
      const validatedData = validateSchema(transactionHistorySchema, req.query);
      
      const result = await TransactionService.getTransactionHistory(
        validatedData.userId,
        validatedData
      );
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in getTransactionHistory controller', {
        error: error.message,
        query: req.query
      });
      
      const errorResponse = formatErrorResponse(error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Get transaction statistics
   * GET /api/v1/transactions/statistics
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStatistics(req, res) {
    try {
      const { userId, startDate, endDate } = req.query;
      
      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId is required'
          }
        });
      }
      
      const stats = await TransactionService.getStatistics(
        userId,
        startDate,
        endDate
      );
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getStatistics controller', {
        error: error.message,
        query: req.query
      });
      
      const errorResponse = formatErrorResponse(error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new TransactionController();
