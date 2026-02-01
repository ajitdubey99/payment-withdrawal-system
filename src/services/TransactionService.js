/**
 * Transaction Service
 * 
 * Business logic layer for transaction operations.
 * Provides transaction history and analytics.
 * 
 * Usage:
 *   const TransactionService = require('./services/TransactionService');
 *   const history = await TransactionService.getTransactionHistory(userId);
 */

const TransactionLogRepository = require('../repositories/TransactionLogRepository');
const UserRepository = require('../repositories/UserRepository');
const logger = require('../utils/logger');

class TransactionService {
  /**
   * Get transaction history for user
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated transaction history
   */
  async getTransactionHistory(userId, options = {}) {
    try {
      await UserRepository.findById(userId);
      
      const result = await TransactionLogRepository.findByUserId(userId, options);
      
      logger.info('Transaction history retrieved', {
        userId,
        count: result.transactions.length
      });
      
      return result;
    } catch (error) {
      logger.error('Error getting transaction history', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get transaction statistics for user
   * 
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Transaction statistics
   */
  async getStatistics(userId, startDate = null, endDate = null) {
    try {
      await UserRepository.findById(userId);
      
      const stats = await TransactionLogRepository.getStatistics(
        userId,
        startDate,
        endDate
      );
      
      logger.info('Transaction statistics retrieved', { userId });
      
      return stats;
    } catch (error) {
      logger.error('Error getting transaction statistics', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get transactions by reference ID
   * 
   * @param {string} referenceId - Reference ID (withdrawal ID, etc.)
   * @returns {Promise<Array>} Array of transaction logs
   */
  async getByReferenceId(referenceId) {
    try {
      const transactions = await TransactionLogRepository.findByReferenceId(referenceId);
      
      logger.info('Transactions by reference retrieved', {
        referenceId,
        count: transactions.length
      });
      
      return transactions;
    } catch (error) {
      logger.error('Error getting transactions by reference', {
        referenceId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new TransactionService();
