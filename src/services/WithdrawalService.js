/**
 * Withdrawal Service
 * 
 * Business logic layer for withdrawal operations.
 * Handles withdrawal processing with transaction safety and concurrency control.
 * 
 * Usage:
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
  MAX_RETRY_ATTEMPTS
} = require('../constants');
const config = require('../config');
const logger = require('../utils/logger');

class WithdrawalService {
  /**
   * Create and process withdrawal request
   * Implements atomic transaction with optimistic locking
   * 
   * @param {Object} data - Withdrawal data
   * @param {string} data.userId - User ID
   * @param {number} data.amount - Withdrawal amount
   * @param {Object} data.destination - Destination account details
   * @param {string} idempotencyKey - Unique request identifier
   * @returns {Promise<Object>} Created withdrawal document
   */
  async createWithdrawal(data, idempotencyKey) {
    const { userId, amount, destination } = data;

    logger.info('Creating withdrawal request', { userId, amount, idempotencyKey });

    try {
      const existingWithdrawal = await WithdrawalRepository.findByIdempotencyKey(
        idempotencyKey
      );

      if (existingWithdrawal) {
        logger.warn('Duplicate withdrawal request detected', {
          idempotencyKey,
          existingId: existingWithdrawal._id
        });
        throw new DuplicateRequestError({ idempotencyKey });
      }

      this.validateAmount(amount);

      const user = await UserRepository.findById(userId);
      this.validateUserStatus(user);

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

      const withdrawal = await WithdrawalRepository.create(withdrawalData);

      logger.info('Withdrawal request created successfully', {
        withdrawalId: withdrawal._id,
        userId,
        amount
      });

      return withdrawal;
    } catch (error) {
      logger.error('Error creating withdrawal request', {
        userId,
        amount,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process withdrawal with atomic transaction
   * Deducts balance and creates transaction log atomically
   * 
   * @param {string} withdrawalId - Withdrawal ID
   * @returns {Promise<Object>} Processed withdrawal document
   */
  async processWithdrawal(withdrawalId) {
    const session = await mongoose.startSession();

    let retryCount = 0;

    while (retryCount < MAX_RETRY_ATTEMPTS) {
      session.startTransaction();

      try {
        const withdrawal = await WithdrawalRepository.findById(withdrawalId, session);

        if (!withdrawal.isPending()) {
          await session.abortTransaction();
          logger.info('Withdrawal already processed', {
            withdrawalId,
            status: withdrawal.status
          });
          return withdrawal;
        }

        this.verifyIntegrity(withdrawal);

        await WithdrawalRepository.updateStatus(
          withdrawalId,
          WITHDRAWAL_STATUS.PROCESSING,
          {},
          session
        );

        const wallet = await WalletRepository.findByUserId(withdrawal.userId, session);

        if (!wallet.hasSufficientBalance(withdrawal.getAmount())) {
          throw new InsufficientBalanceError({
            required: withdrawal.getAmount(),
            available: wallet.getBalance()
          });
        }

        const balanceBefore = wallet.getBalance();

        const updatedWallet = await WalletRepository.deductBalance(
          wallet,
          withdrawal.getAmount(),
          session
        );

        const balanceAfter = updatedWallet.getBalance();

        await TransactionLogRepository.create(
          {
            userId: withdrawal.userId,
            transactionType: TRANSACTION_TYPE.WITHDRAWAL,
            referenceId: withdrawal._id,
            amount: withdrawal.amount,
            balanceBefore: balanceBefore.toString(),
            balanceAfter: balanceAfter.toString(),
            status: TRANSACTION_STATUS.COMPLETED,
            metadata: {
              destination: withdrawal.destination,
              idempotencyKey: withdrawal.idempotencyKey
            }
          },
          session
        );

        await this.executePaymentGateway(withdrawal);

        const processedWithdrawal = await WithdrawalRepository.updateStatus(
          withdrawalId,
          WITHDRAWAL_STATUS.SUCCESS,
          { processedAt: new Date() },
          session
        );

        await session.commitTransaction();

        logger.info('Withdrawal processed successfully', {
          withdrawalId,
          userId: withdrawal.userId,
          amount: withdrawal.getAmount(),
          balanceBefore,
          balanceAfter
        });

        return processedWithdrawal;
      } catch (error) {
        await session.abortTransaction();

        if (error instanceof ConcurrencyError && retryCount < MAX_RETRY_ATTEMPTS - 1) {
          retryCount++;
          logger.warn('Concurrency error, retrying', {
            withdrawalId,
            retryCount,
            error: error.message
          });

          await new Promise(resolve =>
            setTimeout(resolve, config.transaction.retryDelayMs * retryCount)
          );
          continue;
        }

        await this.handleProcessingFailure(withdrawalId, error);
        throw error;
      } finally {
        session.endSession();
      }
    }

    throw new TransactionError('Maximum retry attempts exceeded');
  }

  /**
   * Validate withdrawal amount is within allowed range
   * 
   * @param {number} amount - Amount to validate
   * @throws {AmountOutOfRangeError} If amount is out of range
   * @private
   */
  validateAmount(amount) {
    if (amount < config.withdrawal.minAmount || amount > config.withdrawal.maxAmount) {
      throw new AmountOutOfRangeError(
        config.withdrawal.minAmount,
        config.withdrawal.maxAmount,
        { amount }
      );
    }
  }

  /**
   * Validate user account status
   * 
   * @param {Object} user - User document
   * @throws {UserSuspendedError|UserBlockedError} If user is not active
   * @private
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
   * Verify withdrawal data integrity
   * 
   * @param {Object} withdrawal - Withdrawal document
   * @throws {IntegrityError} If integrity check fails
   * @private
   */
  verifyIntegrity(withdrawal) {
    const integrityData = {
      userId: withdrawal.userId.toString(),
      amount: withdrawal.getAmount(),
      destination: withdrawal.destination.toObject ? withdrawal.destination.toObject() : withdrawal.destination
    };

    const isValid = verifyIntegrityHash(integrityData, withdrawal.integrityHash);

    if (!isValid) {
      throw new IntegrityError({
        withdrawalId: withdrawal._id,
        message: 'Withdrawal data tampering detected'
      });
    }
  }

  /**
   * Execute payment gateway integration
   * Currently mocked, replace with real gateway implementation
   * 
   * @param {Object} withdrawal - Withdrawal document
   * @returns {Promise<Object>} Payment gateway response
   * @private
   */
  async executePaymentGateway(withdrawal) {
    logger.info('Executing payment gateway (mocked)', {
      withdrawalId: withdrawal._id,
      amount: withdrawal.getAmount(),
      destination: withdrawal.destination
    });

    await new Promise(resolve =>
      setTimeout(resolve, config.withdrawal.processingDelayMs)
    );

    return {
      success: true,
      transactionId: `TXN_${Date.now()}`,
      timestamp: new Date()
    };
  }

  /**
   * Handle withdrawal processing failure
   * Updates withdrawal status to failed
   * 
   * @param {string} withdrawalId - Withdrawal ID
   * @param {Error} error - Error that caused failure
   * @private
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

      logger.error('Withdrawal processing failed', {
        withdrawalId,
        error: error.message
      });
    } catch (updateError) {
      logger.error('Error updating withdrawal failure status', {
        withdrawalId,
        error: updateError.message
      });
    }
  }

  /**
   * Get withdrawal by ID
   * 
   * @param {string} withdrawalId - Withdrawal ID
   * @returns {Promise<Object>} Withdrawal document
   */
  async getWithdrawal(withdrawalId) {
    return await WithdrawalRepository.findById(withdrawalId);
  }

  /**
   * Get user withdrawals with pagination
   * 
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated withdrawals
   */
  async getUserWithdrawals(userId, page, limit) {
    return await WithdrawalRepository.findByUserId(userId, page, limit);
  }
}

module.exports = new WithdrawalService();
