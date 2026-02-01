/**
 * Transaction Service
 * 
 * This service works like a bank statement system.
 * It fetches past transactions for a user.
 * 
 * Example:
 *   const TransactionService = require('./services/TransactionService');
 *   const history = await TransactionService.getTransactionHistory(userId);
 */

const TransactionLogRepository = require('../repositories/TransactionLogRepository');
const UserRepository = require('../repositories/UserRepository');
const logger = require('../utils/logger');

class TransactionService {
  /**
   * Returns transaction history for a user
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      // Check if user exists
      await UserRepository.findById(userId);

      // Get logs from repository
      const result = await TransactionLogRepository.findByUserId(
        userId,
        options
      );

      logger.info('Transaction history fetched', {
        userId,
        count: result.transactions.length
      });

      return result;
    } catch (error) {
      logger.error('Error fetching transaction history', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns transaction summary for a user
   */
  async getStatistics(userId, startDate = null, endDate = null) {
    try {
      // Check if user exists
      await UserRepository.findById(userId);

      const stats = await TransactionLogRepository.getStatistics(
        userId,
        startDate,
        endDate
      );

      logger.info('Transaction statistics fetched', { userId });

      return stats;
    } catch (error) {
      logger.error('Error fetching transaction statistics', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns transactions by reference ID
   */
  async getByReferenceId(referenceId) {
    try {
      const transactions =
        await TransactionLogRepository.findByReferenceId(referenceId);

      logger.info('Transactions by reference fetched', {
        referenceId,
        count: transactions.length
      });

      return transactions;
    } catch (error) {
      logger.error('Error fetching by reference', {
        referenceId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new TransactionService();