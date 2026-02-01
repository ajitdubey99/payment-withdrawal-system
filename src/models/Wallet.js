/**
 * Wallet Model
 * 
 * Represents a user's wallet with balance management and concurrency control.
 * Uses optimistic locking via version field to prevent race conditions.
 * 
 * Schema Fields:
 *   - userId: Reference to User document
 *   - balance: Current wallet balance (Decimal128 for precision)
 *   - currency: Currency code (INR, USD, etc.)
 *   - version: Version number for optimistic locking
 *   - createdAt: Timestamp of wallet creation
 *   - updatedAt: Timestamp of last update
 * 
 * Usage:
 *   const Wallet = require('./models/Wallet');
 *   const wallet = await Wallet.findOne({ userId });
 */

const mongoose = require('mongoose');
const { CURRENCY } = require('../constants');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    default: 0,
    validate: {
      validator: function(value) {
        const numValue = parseFloat(value.toString());
        return numValue >= 0;
      },
      message: 'Balance cannot be negative'
    }
  },
  
  currency: {
    type: String,
    enum: Object.values(CURRENCY),
    default: CURRENCY.INR,
    required: true
  },
  
  version: {
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

walletSchema.index({ userId: 1 });
walletSchema.index({ userId: 1, version: 1 });

/**
 * Pre-save hook to increment version number
 * Ensures version is updated on every modification for optimistic locking
 */
walletSchema.pre('save', function(next) {
  if (this.isModified('balance')) {
    this.version += 1;
  }
  next();
});

/**
 * Get balance as number
 * Converts Decimal128 to float for calculations
 * 
 * @returns {number} Balance as floating point number
 */
walletSchema.methods.getBalance = function() {
  return parseFloat(this.balance.toString());
};

/**
 * Check if wallet has sufficient balance
 * 
 * @param {number} amount - Amount to check
 * @returns {boolean} True if balance is sufficient
 */
walletSchema.methods.hasSufficientBalance = function(amount) {
  return this.getBalance() >= amount;
};

/**
 * Deduct amount from wallet balance
 * Does not save, only modifies the document
 * 
 * @param {number} amount - Amount to deduct
 * @throws {Error} If insufficient balance
 */
walletSchema.methods.deduct = function(amount) {
  const currentBalance = this.getBalance();
  if (currentBalance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance = (currentBalance - amount).toString();
};

/**
 * Add amount to wallet balance
 * Does not save, only modifies the document
 * 
 * @param {number} amount - Amount to add
 */
walletSchema.methods.credit = function(amount) {
  const currentBalance = this.getBalance();
  this.balance = (currentBalance + amount).toString();
};

/**
 * Transform wallet object for JSON response
 * Converts Decimal128 to number for API responses
 */
walletSchema.methods.toJSON = function() {
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
