/**
 * Wallet Repository
 * 
 * This file handles all DB operations for wallets.
 * It supports optimistic locking to avoid race conditions.
 * 
 * Example:
 *   const WalletRepository = require('./repositories/WalletRepository');
 *   const wallet = await WalletRepository.findByUserId(userId);
 */

const Wallet = require('../models/Wallet');
const logger = require('../utils/logger');
const { NotFoundError, ConcurrencyError } = require('../utils/errors');

class WalletRepository {
  /**
   * Returns wallet for a user
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

      logger.error('Error finding wallet by user', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Creates wallet for a user
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

      logger.info('Wallet created', {
        userId,
        balance: initialBalance
      });

      return wallet;
    } catch (error) {
      logger.error('Error creating wallet', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Updates wallet balance using optimistic locking
   */
  async updateBalance(userId, newBalance, currentVersion, session = null) {
    try {
      const query = { userId, version: currentVersion };
      const update = {
        $set: { balance: newBalance.toString() },
        $inc: { version: 1 }
      };

      const options = { new: true, runValidators: true };
      if (session) options.session = session;

      const wallet = await Wallet.findOneAndUpdate(
        query,
        update,
        options
      );

      if (!wallet) {
        throw new ConcurrencyError({
          userId,
          version: currentVersion
        });
      }

      return wallet;
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        throw error;
      }

      logger.error('Error updating wallet', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Deducts amount from wallet
   */
  async deductBalance(wallet, amount, session = null) {
    const currentBalance = wallet.getBalance();
    const newBalance = currentBalance - amount;

    return this.updateBalance(
      wallet.userId,
      newBalance,
      wallet.version,
      session
    );
  }

  /**
   * Adds amount to wallet
   */
  async creditBalance(wallet, amount, session = null) {
    const currentBalance = wallet.getBalance();
    const newBalance = currentBalance + amount;

    return this.updateBalance(
      wallet.userId,
      newBalance,
      wallet.version,
      session
    );
  }

  /**
   * Checks if wallet exists
   */
  async exists(userId) {
    try {
      const count = await Wallet.countDocuments({ userId });
      return count > 0;
    } catch (error) {
      logger.error('Error checking wallet existence', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Deletes wallet (only for testing)
   */
  async delete(userId) {
    try {
      await Wallet.findOneAndDelete({ userId });
      logger.info('Wallet deleted', { userId });
    } catch (error) {
      logger.error('Error deleting wallet', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns wallet balance
   */
  async getBalance(userId) {
    const wallet = await this.findByUserId(userId);
    return wallet.getBalance();
  }
}

module.exports = new WalletRepository();