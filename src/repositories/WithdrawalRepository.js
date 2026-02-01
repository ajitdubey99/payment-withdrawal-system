/**
 * Withdrawal Repository
 * 
 * This file talks directly to the database for withdrawals.
 * It only handles CRUD operations, no business logic.
 * 
 * Example:
 *   const WithdrawalRepository = require('./repositories/WithdrawalRepository');
 *   const withdrawal = await WithdrawalRepository.create(data);
 */

const Withdrawal = require('../models/Withdrawal');
const logger = require('../utils/logger');
const { NotFoundError, DuplicateRequestError } = require('../utils/errors');
const { WITHDRAWAL_STATUS } = require('../constants');

class WithdrawalRepository {
  /**
   * Creates a new withdrawal record
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
      // Handle duplicate idempotency key
      if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
        throw new DuplicateRequestError({
          idempotencyKey: data.idempotencyKey
        });
      }

      logger.error('Error creating withdrawal', {
        data,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns withdrawal by ID
   */
  async findById(withdrawalId, session = null) {
    try {
      const query = Withdrawal.findById(withdrawalId);
      if (session) query.session(session);

      const withdrawal = await query;

      if (!withdrawal) {
        throw new NotFoundError('Withdrawal');
      }

      return withdrawal;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Error finding withdrawal', {
        withdrawalId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns withdrawal using idempotency key
   */
  async findByIdempotencyKey(idempotencyKey) {
    try {
      return await Withdrawal.findOne({ idempotencyKey });
    } catch (error) {
      logger.error('Error finding by idempotency key', {
        idempotencyKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns withdrawals for a user (paginated)
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
      logger.error('Error finding user withdrawals', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Updates withdrawal status
   */
  async updateStatus(withdrawalId, status, additionalData = {}, session = null) {
    try {
      const update = {
        $set: { status, ...additionalData }
      };

      const options = { new: true, runValidators: true };
      if (session) options.session = session;

      const withdrawal = await Withdrawal.findByIdAndUpdate(
        withdrawalId,
        update,
        options
      );

      if (!withdrawal) {
        throw new NotFoundError('Withdrawal');
      }

      logger.info('Withdrawal updated', {
        withdrawalId,
        status
      });

      return withdrawal;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error('Error updating withdrawal', {
        withdrawalId,
        status,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns pending withdrawals (used by worker)
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
   * Returns withdrawals by status
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
   * Deletes withdrawal (only for testing)
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