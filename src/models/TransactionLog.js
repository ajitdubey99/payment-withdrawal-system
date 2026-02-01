/**
 * TransactionLog Model
 * 
 * This model stores permanent transaction records.
 * These logs are never changed or deleted.
 * Used for audit, debugging, and balance tracking.
 * 
 * Example:
 *   const TransactionLog = require('./models/TransactionLog');
 *   await TransactionLog.create({ userId, transactionType, amount, ... });
 */

const mongoose = require('mongoose');
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require('../constants');

const transactionLogSchema = new mongoose.Schema({
  // User who performed the transaction
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    immutable: true
  },

  // Type of transaction (withdrawal, deposit, etc.)
  transactionType: {
    type: String,
    enum: Object.values(TRANSACTION_TYPE),
    required: true,
    immutable: true
  },

  // Reference to related document (like withdrawal ID)
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true
  },

  // Transaction amount
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    immutable: true
  },

  // Balance before transaction
  balanceBefore: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    immutable: true
  },

  // Balance after transaction
  balanceAfter: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    immutable: true
  },

  // Current transaction status
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    required: true,
    immutable: true
  },

  // Extra information if needed
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    immutable: true
  },

  // When the transaction happened
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
    immutable: true
  }
}, {
  timestamps: false,
  versionKey: false
});

// Indexes for faster queries
transactionLogSchema.index({ userId: 1, timestamp: -1 });
transactionLogSchema.index({ referenceId: 1 });
transactionLogSchema.index({ transactionType: 1, timestamp: -1 });
transactionLogSchema.index({ userId: 1, transactionType: 1, timestamp: -1 });

/**
 * Block updates to existing records
 */
transactionLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Transaction logs cannot be modified'));
  }
  next();
});

/**
 * Block deletion of logs
 */
transactionLogSchema.pre('deleteOne', function (next) {
  next(new Error('Transaction logs cannot be deleted'));
});

transactionLogSchema.pre('deleteMany', function (next) {
  next(new Error('Transaction logs cannot be deleted'));
});

/**
 * Returns amount as number
 */
transactionLogSchema.methods.getAmount = function () {
  return parseFloat(this.amount.toString());
};

/**
 * Returns balance before as number
 */
transactionLogSchema.methods.getBalanceBefore = function () {
  return parseFloat(this.balanceBefore.toString());
};

/**
 * Returns balance after as number
 */
transactionLogSchema.methods.getBalanceAfter = function () {
  return parseFloat(this.balanceAfter.toString());
};

/**
 * Custom JSON response
 * Converts Decimal128 to normal numbers
 */
transactionLogSchema.methods.toJSON = function () {
  const obj = this.toObject();

  return {
    id: obj._id,
    userId: obj.userId,
    transactionType: obj.transactionType,
    referenceId: obj.referenceId,
    amount: parseFloat(obj.amount.toString()),
    balanceBefore: parseFloat(obj.balanceBefore.toString()),
    balanceAfter: parseFloat(obj.balanceAfter.toString()),
    status: obj.status,
    metadata: obj.metadata,
    timestamp: obj.timestamp
  };
};

const TransactionLog = mongoose.model(
  'TransactionLog',
  transactionLogSchema
);

module.exports = TransactionLog;