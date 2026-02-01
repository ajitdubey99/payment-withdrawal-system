/**
 * Wallet Controller
 * 
 * This controller handles wallet related APIs.
 * Mainly used for fetching wallet details and balance.
 * 
 * Example:
 *   Routes call these methods when user checks wallet info.
 */

const WalletService = require('../services/WalletService');
const { validateSchema, getWalletSchema } = require('../validators');
const { HTTP_STATUS } = require('../constants');
const logger = require('../utils/logger');
const { formatErrorResponse } = require('../utils/errors');

class WalletController {
  /**
   * Returns wallet details for a user
   * Endpoint: GET /api/v1/wallets/:userId
   */
  async getWallet(req, res) {
    try {
      // Validate route parameters
      const validatedData = validateSchema(
        getWalletSchema,
        req.params
      );

      // Fetch wallet from service layer
      const wallet = await WalletService.getWallet(
        validatedData.userId
      );

      // Send only required wallet fields
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          userId: wallet.userId,
          balance: wallet.getBalance(), // Calculated balance
          currency: wallet.currency,
          version: wallet.version,
          updatedAt: wallet.updatedAt
        }
      });
    } catch (error) {
      // Log error for debugging
      logger.error('Error in getWallet controller', {
        error: error.message,
        userId: req.params.userId
      });

      // Format and send error response
      const errorResponse = formatErrorResponse(error);
      const statusCode =
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json(errorResponse);
    }
  }
}

module.exports = new WalletController();
