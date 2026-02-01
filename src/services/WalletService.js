/**
 * Wallet Service
 * 
 * This service handles wallet related logic.
 * It is used to fetch wallet data and manage balances.
 * 
 * Example:
 *   const WalletService = require('./services/WalletService');
 *   const wallet = await WalletService.getWallet(userId);
 */

const WalletRepository = require('../repositories/WalletRepository');
const UserRepository = require('../repositories/UserRepository');
const logger = require('../utils/logger');

class WalletService {
  /**
   * Returns wallet for a user
   */
  async getWallet(userId) {
    try {
      // Check if user exists
      await UserRepository.findById(userId);

      // Get wallet from DB
      const wallet = await WalletRepository.findByUserId(userId);

      logger.info('Wallet fetched', {
        userId,
        balance: wallet.getBalance()
      });

      return wallet;
    } catch (error) {
      logger.error('Error fetching wallet', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns wallet balance only
   */
  async getBalance(userId) {
    const wallet = await this.getWallet(userId);
    return wallet.getBalance();
  }

  /**
   * Creates new wallet for user
   */
  async createWallet(userId, initialBalance = 0, currency = 'INR') {
    try {
      // Check if user exists
      await UserRepository.findById(userId);

      const wallet = await WalletRepository.create(
        userId,
        initialBalance,
        currency
      );

      logger.info('Wallet created', {
        userId,
        initialBalance,
        currency
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
}

module.exports = new WalletService();