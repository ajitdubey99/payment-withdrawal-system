/**
 * Wallet Model
 * 
 * This model stores user wallet information.
 * It handles balance, currency, and versioning.
 * Version is used to avoid race conditions.
 * 
 * Example:
 *   const Wallet = require('./models/Wallet');
 *   const wallet = await Wallet.findOne({ userId });
 */

const mongoose = require('mongoose');
const { CURRENCY } = require('../constants');

const walletSchema = new mongoose.Schema({
  // User who owns this wallet
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Current wallet balance
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0,
    validate: {
      validator: function (value) {
        const numValue = parseFloat(value.toString());
        return numValue >= 0;
      },
      message: 'Balance cannot be negative'
    }
  },

  // Wallet currency
  currency: {
    type: String,
    enum: Object.values(CURRENCY),
    default: CURRENCY.INR,
    required: true
  },

  // Version used for optimistic locking
  version: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for faster queries
walletSchema.index({ userId: 1 });
walletSchema.index({ userId: 1, version: 1 });

/**
 * Increase version when balance changes
 */
walletSchema.pre('save', function (next) {
  if (this.isModified('balance')) {
    this.version += 1;
  }
  next();
});

/**
 * Returns balance as number
 */
walletSchema.methods.getBalance = function () {
  return parseFloat(this.balance.toString());
};

/**
 * Checks if wallet has enough balance
 */
walletSchema.methods.hasSufficientBalance = function (amount) {
  return this.getBalance() >= amount;
};

/**
 * Deducts amount from wallet
 * Only updates object, does not save to DB
 */
walletSchema.methods.deduct = function (amount) {
  const currentBalance = this.getBalance();
  if (currentBalance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance = (currentBalance - amount).toString();
};

/**
 * Adds amount to wallet
 * Only updates object, does not save to DB
 */
walletSchema.methods.credit = function (amount) {
  const currentBalance = this.getBalance();
  this.balance = (currentBalance + amount).toString();
};

/**
 * Custom JSON response
 * Converts Decimal128 to normal number
 */
walletSchema.methods.toJSON = function () {
  const obj = this.toObject();

  return {
    id: obj._id,
    userId: obj.userId,
    balance: parseFloat(obj.balance.toString()),
    currency: obj.currency,
    version: obj.version,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
