/**
 * Withdrawal Routes
 * 
 * This file defines all withdrawal related endpoints.
 * It connects routes with controller methods.
 * 
 * Routes:
 *   POST /api/v1/withdrawals              -> Create withdrawal
 *   GET  /api/v1/withdrawals/:withdrawalId -> Get single withdrawal
 *   GET  /api/v1/withdrawals/user/:userId  -> Get user withdrawals
 */

const express = require('express');
const WithdrawalController = require('../controllers/WithdrawalController');
const { withdrawalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Create a new withdrawal (rate limited)
router.post('/', withdrawalLimiter, WithdrawalController.createWithdrawal.bind(WithdrawalController));

// Get withdrawal by ID
router.get('/:withdrawalId', WithdrawalController.getWithdrawal.bind(WithdrawalController));

// Get all withdrawals for a user
router.get('/user/:userId', WithdrawalController.getUserWithdrawals.bind(WithdrawalController));

module.exports = router;