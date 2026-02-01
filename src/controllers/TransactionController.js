/**
 * Transaction Controller
 * 
 * This controller handles all transaction related APIs.
 * Mainly used for fetching transaction history and stats.
 * 
 * Example:
 *   Routes call these methods when user requests transaction data.
 */

const TransactionService = require('../services/TransactionService');
const { validateSchema, transactionHistorySchema } = require('../validators');
const { HTTP_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { formatErrorResponse } = require('../utils/errors');

class TransactionController {
  /**
   * Returns transaction history (bank statement)
   * Endpoint: GET /api/v1/transactions
   */
  async getTransactionHistory(req, res) {
    try {
      // Validate query parameters
      const validatedData = validateSchema(
        transactionHistorySchema,
        req.query
      );

      // Fetch data from service layer
      const result = await TransactionService.getTransactionHistory(
        validatedData.userId,
        validatedData
      );

      // Send success response
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result
      });
    } catch (error) {
      // Log error for debugging
      logger.error('Error in getTransactionHistory controller', {
        error: error.message,
        query: req.query
      });

      // Send formatted error response
      const errorResponse = formatErrorResponse(error);
      const statusCode =
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json(errorResponse);
    }
  }

  /**
   * Returns transaction statistics for a user
   * Endpoint: GET /api/v1/transactions/statistics
   */
  async getStatistics(req, res) {
    try {
      const { userId, startDate, endDate } = req.query;

      // userId is mandatory
      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId is required'
          }
        });
      }

      // Get stats from service layer
      const stats = await TransactionService.getStatistics(
        userId,
        startDate,
        endDate
      );

      // Send success response
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: stats
      });
    } catch (error) {
      // Log error
      logger.error('Error in getStatistics controller', {
        error: error.message,
        query: req.query
      });

      // Send formatted error
      const errorResponse = formatErrorResponse(error);
      const statusCode =
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new TransactionController();
