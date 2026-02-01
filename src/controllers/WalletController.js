/**
 * Wallet Controller
 * 
 * HTTP request handler for wallet endpoints.
 * 
 * Usage:
 *   Routes use these controller methods to handle wallet requests
 */

const WalletService = require('../services/WalletService');
const { validateSchema, getWalletSchema } = require('../validators');
const { HTTP_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { formatErrorResponse } = require('../utils/errors');

class WalletController {
  /**
   * Get wallet by user ID
   * GET /api/v1/wallets/:userId
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWallet(req, res) {
    try {
      const validatedData = validateSchema(getWalletSchema, req.params);
      
      const wallet = await WalletService.getWallet(validatedData.userId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          userId: wallet.userId,
          balance: wallet.getBalance(),
          currency: wallet.currency,
          version: wallet.version,
          updatedAt: wallet.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error in getWallet controller', {
        error: error.message,
        userId: req.params.userId
      });
      
      const errorResponse = formatErrorResponse(error);
      const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new WalletController();
