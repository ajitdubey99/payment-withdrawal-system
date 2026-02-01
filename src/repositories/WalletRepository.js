/**
 * Wallet Repository
 * 
 * Data access layer for Wallet model.
 * Handles wallet operations with optimistic locking and transaction support.
 * 
 * Usage:
 *   const WalletRepository = require('./repositories/WalletRepository');
 *   const wallet = await WalletRepository.findByUserId(userId);
 */

const Wallet = require('../models/Wallet');
const logger = require('../utils/logger');
const { NotFoundError, ConcurrencyError } = require('../utils/errors');

class WalletRepository {
  /**
   * Find wallet by user ID
   * 
   * @param {string} userId - User ID
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Wallet document
   * @throws {NotFoundError} If wallet not found
   */
  async findByUserId(userId, session = null) {
    try {
      const query = Wallet.findOne({ userId });
      
      if (session) {
        query.session(session);
      }
      
      const wallet = await query;
      
      if (!wallet) {
        throw new NotFoundError('Wallet');
      }
      
      return wallet;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error finding wallet by user ID', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Create new wallet for user
   * 
   * @param {string} userId - User ID
   * @param {number} initialBalance - Initial balance (default 0)
   * @param {string} currency - Currency code (default INR)
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Created wallet document
   */
  async create(userId, initialBalance = 0, currency = 'INR', session = null) {
    try {
      const wallet = new Wallet({
        userId,
        balance: initialBalance.toString(),
        currency,
        version: 0
      });
      
      if (session) {
        await wallet.save({ session });
      } else {
        await wallet.save();
      }
      
      logger.info('Wallet created', { userId, balance: initialBalance });
      return wallet;
    } catch (error) {
      logger.error('Error creating wallet', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update wallet balance with optimistic locking
   * Prevents race conditions using version field
   * 
   * @param {string} userId - User ID
   * @param {number} newBalance - New balance value
   * @param {number} currentVersion - Current version for optimistic lock
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Updated wallet document
   * @throws {ConcurrencyError} If version mismatch (concurrent modification)
   */
  async updateBalance(userId, newBalance, currentVersion, session = null) {
    try {
      const query = {
        userId,
        version: currentVersion
      };
      
      const update = {
        $set: { balance: newBalance.toString() },
        $inc: { version: 1 }
      };
      
      const options = {
        new: true,
        runValidators: true
      };
      
      if (session) {
        options.session = session;
      }
      
      const wallet = await Wallet.findOneAndUpdate(query, update, options);
      
      if (!wallet) {
        throw new ConcurrencyError({ userId, version: currentVersion });
      }
      
      return wallet;
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        throw error;
      }
      logger.error('Error updating wallet balance', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Deduct amount from wallet with optimistic locking
   * 
   * @param {Object} wallet - Wallet document
   * @param {number} amount - Amount to deduct
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Updated wallet document
   * @throws {ConcurrencyError} If concurrent modification detected
   */
  async deductBalance(wallet, amount, session = null) {
    try {
      const currentBalance = wallet.getBalance();
      const newBalance = currentBalance - amount;
      
      return await this.updateBalance(
        wallet.userId,
        newBalance,
        wallet.version,
        session
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add amount to wallet with optimistic locking
   * 
   * @param {Object} wallet - Wallet document
   * @param {number} amount - Amount to add
   * @param {Object} session - MongoDB session for transactions
   * @returns {Promise<Object>} Updated wallet document
   * @throws {ConcurrencyError} If concurrent modification detected
   */
  async creditBalance(wallet, amount, session = null) {
    try {
      const currentBalance = wallet.getBalance();
      const newBalance = currentBalance + amount;
      
      return await this.updateBalance(
        wallet.userId,
        newBalance,
        wallet.version,
        session
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if wallet exists for user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if wallet exists
   */
  async exists(userId) {
    try {
      const count = await Wallet.countDocuments({ userId });
      return count > 0;
    } catch (error) {
      logger.error('Error checking wallet existence', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete wallet by user ID
   * For testing purposes only
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async delete(userId) {
    try {
      await Wallet.findOneAndDelete({ userId });
      logger.info('Wallet deleted', { userId });
    } catch (error) {
      logger.error('Error deleting wallet', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get wallet balance
   * 
   * @param {string} userId - User ID
   * @returns {Promise<number>} Current balance
   */
  async getBalance(userId) {
    try {
      const wallet = await this.findByUserId(userId);
      return wallet.getBalance();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WalletRepository();
