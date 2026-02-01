/**
 * Routes Index
 * 
 * Central router combining all route modules.
 * 
 * Usage:
 *   app.use('/api/v1', routes);
 */

const express = require('express');
const withdrawalRoutes = require('./withdrawals');
const walletRoutes = require('./wallets');
const transactionRoutes = require('./transactions');

const router = express.Router();

router.use('/withdrawals', withdrawalRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);

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
