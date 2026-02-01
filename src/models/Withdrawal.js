/**
 * Withdrawal Model
 * 
 * This model represents a withdrawal request.
 * Every time a user withdraws money, one record is created here.
 * 
 * Example:
 *   const Withdrawal = require('./models/Withdrawal');
 *   const withdrawal = await Withdrawal.create({ userId, amount, destination });
 */

const mongoose = require('mongoose');
const { WITHDRAWAL_STATUS } = require('../constants');

/**
 * Bank / destination details
 */
const destinationSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },

  ifscCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  accountHolderName: {
    type: String,
    required: true,
    trim: true
  },

  bankName: {
    type: String,
    trim: true
  }
}, { _id: false });

const withdrawalSchema = new mongoose.Schema({
  // User who requested withdrawal
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Withdrawal amount
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
    validate: {
      validator: function (value) {
        const numValue = parseFloat(value.toString());
        return numValue > 0;
      },
      message: 'Amount must be greater than zero'
    }
  },

  // Bank / wallet destination
  destination: {
    type: destinationSchema,
    required: true
  },

  // Current status
  status: {
    type: String,
    enum: Object.values(WITHDRAWAL_STATUS),
    default: WITHDRAWAL_STATUS.PENDING,
    required: true,
    index: true
  },

  // Prevents duplicate requests
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Used to detect data tampering
  integrityHash: {
    type: String,
    required: true
  },

  // Reason in case of failure
  failureReason: {
    type: String,
    trim: true
  },

  // When processing finished
  processedAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for faster queries
withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ idempotencyKey: 1 });

/**
 * Returns amount as number
 */
withdrawalSchema.methods.getAmount = function () {
  return parseFloat(this.amount.toString());
};

/**
 * Status helpers
 */
withdrawalSchema.methods.isPending = function () {
  return this.status === WITHDRAWAL_STATUS.PENDING;
};

withdrawalSchema.methods.isProcessing = function () {
  return this.status === WITHDRAWAL_STATUS.PROCESSING;
};

withdrawalSchema.methods.isSuccess = function () {
  return this.status === WITHDRAWAL_STATUS.SUCCESS;
};

withdrawalSchema.methods.isFailed = function () {
  return this.status === WITHDRAWAL_STATUS.FAILED;
};

withdrawalSchema.methods.isTerminal = function () {
  return this.isSuccess() || this.isFailed();
};

/**
 * Status update methods
 */
withdrawalSchema.methods.markAsProcessing = function () {
  this.status = WITHDRAWAL_STATUS.PROCESSING;
};

withdrawalSchema.methods.markAsSuccess = function () {
  this.status = WITHDRAWAL_STATUS.SUCCESS;
  this.processedAt = new Date();
};

withdrawalSchema.methods.markAsFailed = function (reason) {
  this.status = WITHDRAWAL_STATUS.FAILED;
  this.failureReason = reason;
  this.processedAt = new Date();
};

/**
 * Custom JSON response
 * Converts Decimal128 to normal number
 */
withdrawalSchema.methods.toJSON = function () {
  const obj = this.toObject();

  return {
    id: obj._id,
    userId: obj.userId,
    amount: parseFloat(obj.amount.toString()),
    destination: obj.destination,
    status: obj.status,
    failureReason: obj.failureReason,
    processedAt: obj.processedAt,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;