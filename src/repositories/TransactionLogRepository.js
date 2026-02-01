/**
 * TransactionLog Repository
 * 
 * Data access layer for TransactionLog model.
 * Handles immutable transaction logging for audit trail.
 * 
 * Usage:
 *   const TransactionLogRepository = require('./repositories/TransactionLogRepository');
 *   await TransactionLogRepository.create(logData);
 */

const TransactionLog = require('../models/TransactionLog');
const logger = require('../utils/logger');
const { default: mongoose } = require('mongoose');

class TransactionLogRepository {
  /**
   * Create transaction log entry
   * Transaction logs are immutable once created
   * 
   * @param {Object} data - Transaction log data
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Created transaction log document
   */
  async create(data, session = null) {
    try {
      const transactionLog = new TransactionLog(data);

      if (session) {
        await transactionLog.save({ session });
      } else {
        await transactionLog.save();
      }

      logger.info('Transaction log created', {
        logId: transactionLog._id,
        userId: transactionLog.userId,
        type: transactionLog.transactionType,
        amount: transactionLog.getAmount()
      });

      return transactionLog;
    } catch (error) {
      logger.error('Error creating transaction log', {
        data,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find transaction logs by user ID with pagination
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default 1)
   * @param {number} options.limit - Items per page (default 20)
   * @param {string} options.transactionType - Filter by transaction type
   * @param {Date} options.startDate - Start date filter
   * @param {Date} options.endDate - End date filter
   * @returns {Promise<Object>} Paginated transaction logs
   */
  async findByUserId(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        transactionType,
        startDate,
        endDate
      } = options;

      const skip = (page - 1) * limit;

      const filter = { userId };

      if (transactionType) {
        filter.transactionType = transactionType;
      }

      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }

      const [transactions, total] = await Promise.all([
        TransactionLog.find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        TransactionLog.countDocuments(filter)
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding transaction logs by user ID', {
        userId,
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find transaction log by reference ID
   * 
   * @param {string} referenceId - Reference ID (withdrawal ID, etc.)
   * @returns {Promise<Array>} Array of transaction logs
   */
  async findByReferenceId(referenceId) {
    try {
      return await TransactionLog.find({ referenceId })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
      logger.error('Error finding transaction logs by reference ID', {
        referenceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find transaction logs by type
   * 
   * @param {string} transactionType - Transaction type
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated transaction logs
   */
  async findByType(transactionType, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        TransactionLog.find({ transactionType })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        TransactionLog.countDocuments({ transactionType })
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding transaction logs by type', {
        transactionType,
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
      const match = { userId: new mongoose.Types.ObjectId(userId) };

      if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) match.timestamp.$gte = new Date(startDate);
        if (endDate) match.timestamp.$lte = new Date(endDate);
      }
      const stats = await TransactionLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$transactionType',
            count: { $sum: 1 },
            totalAmount: { $sum: { $toDouble: '$amount' } }
          }
        }
      ]);

      return stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
        return acc;
      }, {});
    } catch (error) {
      logger.error('Error getting transaction statistics', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Count transactions by user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<number>} Total count
   */
  async countByUserId(userId) {
    try {
      return await TransactionLog.countDocuments({ userId });
    } catch (error) {
      logger.error('Error counting transactions', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recent transactions
   * 
   * @param {number} limit - Number of transactions to return
   * @returns {Promise<Array>} Array of recent transactions
   */
  async getRecent(limit = 10) {
    try {
      return await TransactionLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      logger.error('Error getting recent transactions', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new TransactionLogRepository();
