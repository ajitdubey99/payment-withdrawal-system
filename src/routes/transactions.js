/**
 * Transaction Routes
 * 
 * Defines HTTP routes for transaction operations.
 * 
 * Routes:
 *   GET /api/v1/transactions           - Get transaction history
 *   GET /api/v1/transactions/statistics - Get transaction statistics
 */

const express = require('express');
const TransactionController = require('../controllers/TransactionController');

const router = express.Router();

router.get(
  '/',
  TransactionController.getTransactionHistory.bind(TransactionController)
);

router.get(
  '/statistics',
  TransactionController.getStatistics.bind(TransactionController)
);

module.exports = router;
