/**
 * TransactionLog Repository
 * 
 * This file handles all DB operations for transaction logs.
 * It acts as a bridge between service layer and database.
 * 
 * Example:
 *   const TransactionLogRepository = require('./repositories/TransactionLogRepository');
 *   await TransactionLogRepository.create(logData);
 */

const TransactionLog = require('../models/TransactionLog');
const logger = require('../utils/logger');
const { default: mongoose } = require('mongoose');

class TransactionLogRepository {
  /**
   * Creates a new transaction log
   * Logs are permanent and should not be changed
   */
  async create(data, session = null) {
    try {
      const transactionLog = new TransactionLog(data);

      // Save inside transaction if session exists
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
   * Returns paginated logs for a user
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

      // Optional filters
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
      logger.error('Error finding transaction logs by user', {
        userId,
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns logs by reference ID
   * Example: all logs related to one withdrawal
   */
  async findByReferenceId(referenceId) {
    try {
      return await TransactionLog.find({ referenceId })
        .sort({ timestamp: -1 })
        .lean();
    } catch (error) {
      logger.error('Error finding logs by reference', {
        referenceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns logs filtered by transaction type
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
      logger.error('Error finding logs by type', {
        transactionType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns summary stats for a user
   */
  async getStatistics(userId, startDate = null, endDate = null) {
    try {
      const match = {
        userId: new mongoose.Types.ObjectId(userId)
      };

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
      logger.error('Error getting statistics', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns total transactions count for a user
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
   * Returns latest transactions
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