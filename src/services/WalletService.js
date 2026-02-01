/**
 * Wallet Service
 * 
 * Business logic layer for wallet operations.
 * 
 * Usage:
 *   const WalletService = require('./services/WalletService');
 *   const wallet = await WalletService.getWallet(userId);
 */

const WalletRepository = require('../repositories/WalletRepository');
const UserRepository = require('../repositories/UserRepository');
const logger = require('../utils/logger');

class WalletService {
  /**
   * Get wallet by user ID
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Wallet document
   */
  async getWallet(userId) {
    try {
      await UserRepository.findById(userId);
      
      const wallet = await WalletRepository.findByUserId(userId);
      
      logger.info('Wallet retrieved', { userId, balance: wallet.getBalance() });
      
      return wallet;
    } catch (error) {
      logger.error('Error getting wallet', { userId, error: error.message });
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
      const wallet = await this.getWallet(userId);
      return wallet.getBalance();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create wallet for user
   * 
   * @param {string} userId - User ID
   * @param {number} initialBalance - Initial balance (default 0)
   * @param {string} currency - Currency code (default INR)
   * @returns {Promise<Object>} Created wallet document
   */
  async createWallet(userId, initialBalance = 0, currency = 'INR') {
    try {
      await UserRepository.findById(userId);
      
      const wallet = await WalletRepository.create(userId, initialBalance, currency);
      
      logger.info('Wallet created', { userId, initialBalance, currency });
      
      return wallet;
    } catch (error) {
      logger.error('Error creating wallet', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new WalletService();
