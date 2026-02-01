/**
 * Wallet Routes
 * 
 * This file defines wallet related endpoints.
 * It connects URLs to controller functions.
 * 
 * Routes:
 *   GET /api/v1/wallets/:userId -> Get wallet details
 */

const express = require('express');
const WalletController = require('../controllers/WalletController');

const router = express.Router();

// Get wallet by user ID
router.get('/:userId', WalletController.getWallet.bind(WalletController));

module.exports = router;