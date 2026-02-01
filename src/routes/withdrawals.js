/**
 * Withdrawal Routes
 * 
 * Defines HTTP routes for withdrawal operations.
 * 
 * Routes:
 *   POST   /api/v1/withdrawals          - Create withdrawal
 *   GET    /api/v1/withdrawals/:id      - Get withdrawal by ID
 *   GET    /api/v1/withdrawals/user/:userId - Get user withdrawals
 */

const express = require('express');
const WithdrawalController = require('../controllers/WithdrawalController');
const { withdrawalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post(
  '/',
  withdrawalLimiter,
  WithdrawalController.createWithdrawal.bind(WithdrawalController)
);

router.get(
  '/:withdrawalId',
  WithdrawalController.getWithdrawal.bind(WithdrawalController)
);

router.get(
  '/user/:userId',
  WithdrawalController.getUserWithdrawals.bind(WithdrawalController)
);

module.exports = router;
