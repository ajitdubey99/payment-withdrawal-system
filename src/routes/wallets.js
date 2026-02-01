/**
 * Wallet Routes
 * 
 * Defines HTTP routes for wallet operations.
 * 
 * Routes:
 *   GET /api/v1/wallets/:userId - Get wallet by user ID
 */

const express = require('express');
const WalletController = require('../controllers/WalletController');

const router = express.Router();

router.get(
  '/:userId',
  WalletController.getWallet.bind(WalletController)
);

module.exports = router;
