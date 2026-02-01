/**
 * Withdrawal Service
 * 
 * This service contains all business logic for withdrawals.
 * It makes sure money is deducted safely and all records are updated correctly.
 * 
 * Example:
 *   const WithdrawalService = require('./services/WithdrawalService');
 *   const withdrawal = await WithdrawalService.createWithdrawal(data);
 */

const mongoose = require('mongoose');
const UserRepository = require('../repositories/UserRepository');
const WalletRepository = require('../repositories/WalletRepository');
const WithdrawalRepository = require('../repositories/WithdrawalRepository');
const TransactionLogRepository = require('../repositories/TransactionLogRepository');
const {
  InsufficientBalanceError,
  UserSuspendedError,
  UserBlockedError,
  DuplicateRequestError,
  AmountOutOfRangeError,
  TransactionError,
  ConcurrencyError,
  IntegrityError
} = require('../utils/errors');
const { generateIntegrityHash, verifyIntegrityHash } = require('../utils/security');
const {
  WITHDRAWAL_STATUS,
  TRANSACTION_TYPE,
  TRANSACTION_STATUS,
} = require('../constants');
const config = require('../config');
const logger = require('../utils/logger');

class WithdrawalService {
  /**
   * Creates a new withdrawal request.
   * Only validates and saves the request, does not deduct money yet.
   */
  async createWithdrawal(data, idempotencyKey) {
    const { userId, amount, destination } = data;

    logger.info('Creating withdrawal request', {
      userId,
      amount,
      idempotencyKey
    });

    try {
      // Prevent duplicate requests
      const existingWithdrawal =
        await WithdrawalRepository.findByIdempotencyKey(idempotencyKey);

      if (existingWithdrawal) {
        throw new DuplicateRequestError({ idempotencyKey });
      }

      // Check amount limits
      this.validateAmount(amount);

      // Check user status
      const user = await UserRepository.findById(userId);
      this.validateUserStatus(user);

      // Generate integrity hash
      const integrityData = { userId, amount, destination };
      const integrityHash = generateIntegrityHash(integrityData);

      const withdrawalData = {
        userId,
        amount: amount.toString(),
        destination,
        status: WITHDRAWAL_STATUS.PENDING,
        idempotencyKey,
        integrityHash
      };

      const withdrawal =
        await WithdrawalRepository.create(withdrawalData);

      logger.info('Withdrawal request created', {
        withdrawalId: withdrawal._id
      });

      return withdrawal;
    } catch (error) {
      logger.error('Error creating withdrawal', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Processes the withdrawal.
   * This is where money is deducted and logs are created.
   */
  async processWithdrawal(withdrawalId) {
    const session = await mongoose.startSession();
    let retryCount = 0;

    while (retryCount < config.transaction.retryAttempts) {
      session.startTransaction();

      try {
        const withdrawal =
          await WithdrawalRepository.findById(withdrawalId, session);

        // If already processed, skip
        if (!withdrawal.isPending()) {
          await session.abortTransaction();
          return withdrawal;
        }

        // Check data integrity
        this.verifyIntegrity(withdrawal);

        // Mark as processing
        await WithdrawalRepository.updateStatus(
          withdrawalId,
          WITHDRAWAL_STATUS.PROCESSING,
          {},
          session
        );

        // Get wallet
        const wallet =
          await WalletRepository.findByUserId(
            withdrawal.userId,
            session
          );

        // Check balance
        if (!wallet.hasSufficientBalance(withdrawal.getAmount())) {
          throw new InsufficientBalanceError({
            required: withdrawal.getAmount(),
            available: wallet.getBalance()
          });
        }

        const balanceBefore = wallet.getBalance();

        // Deduct money
        const updatedWallet =
          await WalletRepository.deductBalance(
            wallet,
            withdrawal.getAmount(),
            session
          );

        const balanceAfter = updatedWallet.getBalance();

        // Create transaction log
        await TransactionLogRepository.create({
          userId: withdrawal.userId,
          transactionType: TRANSACTION_TYPE.WITHDRAWAL,
          referenceId: withdrawal._id,
          amount: withdrawal.amount,
          balanceBefore: balanceBefore.toString(),
          balanceAfter: balanceAfter.toString(),
          status: TRANSACTION_STATUS.COMPLETED,
          metadata: {
            destination: withdrawal.destination
          }
        }, session);

        // Call payment gateway (mock)
        await this.executePaymentGateway(withdrawal);

        // Mark as success
        const processedWithdrawal =
          await WithdrawalRepository.updateStatus(
            withdrawalId,
            WITHDRAWAL_STATUS.SUCCESS,
            { processedAt: new Date() },
            session
          );

        await session.commitTransaction();

        logger.info('Withdrawal processed', {
          withdrawalId,
          balanceBefore,
          balanceAfter
        });

        return processedWithdrawal;
      } catch (error) {
        await session.abortTransaction();

        // Retry on concurrency issue
        if (
          error instanceof ConcurrencyError &&
          retryCount < config.transaction.retryAttempts - 1
        ) {
          retryCount++;
          await new Promise(resolve =>
            setTimeout(resolve,
              config.transaction.retryDelayMs * retryCount)
          );
          continue;
        }

        await this.handleProcessingFailure(withdrawalId, error);
        throw error;
      } finally {
        session.endSession();
      }
    }

    throw new TransactionError('Maximum retries reached');
  }

  /**
   * Validates withdrawal amount
   */
  validateAmount(amount) {
    if (
      amount < config.withdrawal.minAmount ||
      amount > config.withdrawal.maxAmount
    ) {
      throw new AmountOutOfRangeError(
        config.withdrawal.minAmount,
        config.withdrawal.maxAmount,
        { amount }
      );
    }
  }

  /**
   * Validates user status
   */
  validateUserStatus(user) {
    if (user.isSuspended()) {
      throw new UserSuspendedError({ userId: user._id });
    }
    if (user.isBlocked()) {
      throw new UserBlockedError({ userId: user._id });
    }
  }

  /**
   * Checks data integrity
   */
  verifyIntegrity(withdrawal) {
    const integrityData = {
      userId: withdrawal.userId.toString(),
      amount: withdrawal.getAmount(),
      destination: withdrawal.destination.toObject ? withdrawal.destination.toObject() : withdrawal.destination
    };

    const isValid =
      verifyIntegrityHash(integrityData, withdrawal.integrityHash);

    if (!isValid) {
      throw new IntegrityError({
        withdrawalId: withdrawal._id
      });
    }
  }

  /**
   * Mock payment gateway
   */
  async executePaymentGateway(withdrawal) {
    await new Promise(resolve =>
      setTimeout(resolve,
        config.withdrawal.processingDelayMs)
    );

    return {
      success: true,
      transactionId: `TXN_${Date.now()}`
    };
  }

  /**
   * Updates withdrawal as failed
   */
  async handleProcessingFailure(withdrawalId, error) {
    try {
      await WithdrawalRepository.updateStatus(
        withdrawalId,
        WITHDRAWAL_STATUS.FAILED,
        {
          failureReason: error.message,
          processedAt: new Date()
        }
      );
    } catch (updateError) {
      logger.error('Failed to update withdrawal status', {
        withdrawalId,
        error: updateError.message
      });
    }
  }

  /**
   * Returns withdrawal by ID
   */
  async getWithdrawal(withdrawalId) {
    return WithdrawalRepository.findById(withdrawalId);
  }

  /**
   * Returns withdrawals for a user
   */
  async getUserWithdrawals(userId, page, limit) {
    return WithdrawalRepository.findByUserId(userId, page, limit);
  }
}

module.exports = new WithdrawalService();