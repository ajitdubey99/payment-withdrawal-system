/**
 * Withdrawal Repository
 * 
 * Data access layer for Withdrawal model.
 * Handles withdrawal CRUD operations with idempotency support.
 * 
 * Usage:
 *   const WithdrawalRepository = require('./repositories/WithdrawalRepository');
 *   const withdrawal = await WithdrawalRepository.create(data);
 */

const Withdrawal = require('../models/Withdrawal');
const logger = require('../utils/logger');
const { NotFoundError, DuplicateRequestError } = require('../utils/errors');
const { WITHDRAWAL_STATUS } = require('../constants');

class WithdrawalRepository {
  /**
   * Create new withdrawal request
   * 
   * @param {Object} data - Withdrawal data
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Created withdrawal document
   * @throws {DuplicateRequestError} If idempotency key already exists
   */
  async create(data, session = null) {
    try {
      const withdrawal = new Withdrawal(data);
      
      if (session) {
        await withdrawal.save({ session });
      } else {
        await withdrawal.save();
      }
      
      logger.info('Withdrawal created', {
        withdrawalId: withdrawal._id,
        userId: withdrawal.userId,
        amount: withdrawal.getAmount()
      });
      
      return withdrawal;
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        throw new DuplicateRequestError({
          idempotencyKey: data.idempotencyKey
        });
      }
      logger.error('Error creating withdrawal', { data, error: error.message });
      throw error;
    }
  }

  /**
   * Find withdrawal by ID
   * 
   * @param {string} withdrawalId - Withdrawal ID
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Withdrawal document
   * @throws {NotFoundError} If withdrawal not found
   */
  async findById(withdrawalId, session = null) {
    try {
      const query = Withdrawal.findById(withdrawalId);
      
      if (session) {
        query.session(session);
      }
      
      const withdrawal = await query;
      
      if (!withdrawal) {
        throw new NotFoundError('Withdrawal');
      }
      
      return withdrawal;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error finding withdrawal by ID', {
        withdrawalId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find withdrawal by idempotency key
   * 
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<Object|null>} Withdrawal document or null
   */
  async findByIdempotencyKey(idempotencyKey) {
    try {
      return await Withdrawal.findOne({ idempotencyKey });
    } catch (error) {
      logger.error('Error finding withdrawal by idempotency key', {
        idempotencyKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find withdrawals by user ID with pagination
   * 
   * @param {string} userId - User ID
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Items per page (default 20)
   * @returns {Promise<Object>} Paginated withdrawals
   */
  async findByUserId(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const [withdrawals, total] = await Promise.all([
        Withdrawal.find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Withdrawal.countDocuments({ userId })
      ]);
      
      return {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding withdrawals by user ID', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update withdrawal status
   * 
   * @param {string} withdrawalId - Withdrawal ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional fields to update
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Updated withdrawal document
   */
  async updateStatus(withdrawalId, status, additionalData = {}, session = null) {
    try {
      const update = {
        $set: {
          status,
          ...additionalData
        }
      };
      
      const options = {
        new: true,
        runValidators: true
      };
      
      if (session) {
        options.session = session;
      }
      
      const withdrawal = await Withdrawal.findByIdAndUpdate(
        withdrawalId,
        update,
        options
      );
      
      if (!withdrawal) {
        throw new NotFoundError('Withdrawal');
      }
      
      logger.info('Withdrawal status updated', {
        withdrawalId,
        status
      });
      
      return withdrawal;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating withdrawal status', {
        withdrawalId,
        status,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find pending withdrawals
   * 
   * @param {number} limit - Maximum number of withdrawals to return
   * @returns {Promise<Array>} Array of pending withdrawals
   */
  async findPending(limit = 100) {
    try {
      return await Withdrawal.find({
        status: WITHDRAWAL_STATUS.PENDING
      })
        .sort({ createdAt: 1 })
        .limit(limit);
    } catch (error) {
      logger.error('Error finding pending withdrawals', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Find withdrawals by status
   * 
   * @param {string} status - Withdrawal status
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated withdrawals
   */
  async findByStatus(status, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const [withdrawals, total] = await Promise.all([
        Withdrawal.find({ status })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Withdrawal.countDocuments({ status })
      ]);
      
      return {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding withdrawals by status', {
        status,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Delete withdrawal by ID
   * For testing purposes only
   * 
   * @param {string} withdrawalId - Withdrawal ID
   * @returns {Promise<void>}
   */
  async delete(withdrawalId) {
    try {
      await Withdrawal.findByIdAndDelete(withdrawalId);
      logger.info('Withdrawal deleted', { withdrawalId });
    } catch (error) {
      logger.error('Error deleting withdrawal', {
        withdrawalId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new WithdrawalRepository();
