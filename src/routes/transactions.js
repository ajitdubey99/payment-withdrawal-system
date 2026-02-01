/**
 * Transaction Routes
 * 
 * This file defines all transaction related endpoints.
 * It maps URLs to controller methods.
 * 
 * Routes:
 *   GET /api/v1/transactions            -> Get transaction history
 *   GET /api/v1/transactions/statistics -> Get transaction summary
 */

const express = require('express');
const TransactionController = require('../controllers/TransactionController');

const router = express.Router();

// Get full transaction history
router.get('/', TransactionController.getTransactionHistory.bind(TransactionController));

// Get transaction statistics
router.get('/statistics', TransactionController.getStatistics.bind(TransactionController));

module.exports = router;