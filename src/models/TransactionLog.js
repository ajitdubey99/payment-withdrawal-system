/**
 * TransactionLog Model
 * 
 * Immutable audit log for all balance-affecting operations.
 * Provides complete transaction history for reconciliation and debugging.
 * 
 * Schema Fields:
 *   - userId: Reference to User
 *   - transactionType: Type of transaction (withdrawal, deposit, etc.)
 *   - referenceId: Reference to related document (withdrawal ID, etc.)
 *   - amount: Transaction amount
 *   - balanceBefore: Balance before transaction
 *   - balanceAfter: Balance after transaction
 *   - status: Transaction status
 *   - metadata: Additional transaction details
 *   - timestamp: Transaction timestamp
 * 
 * Usage:
 *   const TransactionLog = require('./models/TransactionLog');
 *   await TransactionLog.create({ userId, transactionType, amount, ... });
 */

const mongoose = require('mongoose');
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require('../constants');

const transactionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
    immutable: true
  },
  
  transactionType: {
    type: String,
    enum: Object.values(TRANSACTION_TYPE),
    required: [true, 'Transaction type is required'],
    immutable: true
  },
  
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Reference ID is required'],
    immutable: true
  },
  
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, 'Amount is required'],
    immutable: true
  },
  
  balanceBefore: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, 'Balance before is required'],
    immutable: true
  },
  
  balanceAfter: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, 'Balance after is required'],
    immutable: true
  },
  
  status: {
    type: String,
    enum: Object.values(TRANSACTION_STATUS),
    required: [true, 'Status is required'],
    immutable: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    immutable: true
  },
  
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

transactionLogSchema.index({ userId: 1, timestamp: -1 });
transactionLogSchema.index({ referenceId: 1 });
transactionLogSchema.index({ transactionType: 1, timestamp: -1 });
transactionLogSchema.index({ userId: 1, transactionType: 1, timestamp: -1 });

/**
 * Prevent updates to transaction logs
 * Transaction logs are immutable once created
 */
transactionLogSchema.pre('save', function(next) {
  if (!this.isNew) {
    return next(new Error('Transaction logs cannot be modified'));
  }
  next();
});

/**
 * Prevent deletion of transaction logs
 */
transactionLogSchema.pre('deleteOne', function(next) {
  next(new Error('Transaction logs cannot be deleted'));
});

transactionLogSchema.pre('deleteMany', function(next) {
  next(new Error('Transaction logs cannot be deleted'));
});

/**
 * Get amount as number
 * @returns {number} Amount as floating point number
 */
transactionLogSchema.methods.getAmount = function() {
  return parseFloat(this.amount.toString());
};

/**
 * Get balance before as number
 * @returns {number} Balance before as floating point number
 */
transactionLogSchema.methods.getBalanceBefore = function() {
  return parseFloat(this.balanceBefore.toString());
};

/**
 * Get balance after as number
 * @returns {number} Balance after as floating point number
 */
transactionLogSchema.methods.getBalanceAfter = function() {
  return parseFloat(this.balanceAfter.toString());
};

/**
 * Transform transaction log for JSON response
 * Converts Decimal128 values to numbers
 */
transactionLogSchema.methods.toJSON = function() {
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

const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);

module.exports = TransactionLog;
