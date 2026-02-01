/**
 * Routes Index
 * 
 * This file combines all route modules.
 * It acts as the main entry point for all APIs.
 * 
 * Example:
 *   app.use('/api/v1', routes);
 */

const express = require('express');
const withdrawalRoutes = require('./withdrawals');
const walletRoutes = require('./wallets');
const transactionRoutes = require('./transactions');

const router = express.Router();

// Withdrawal related APIs
router.use('/withdrawals', withdrawalRoutes);

// Wallet related APIs
router.use('/wallets', walletRoutes);

// Transaction related APIs
router.use('/transactions', transactionRoutes);

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;