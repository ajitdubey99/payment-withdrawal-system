/**
 * Withdrawal Model
 * 
 * Represents a withdrawal request with status tracking and integrity verification.
 * Implements idempotency through unique idempotency keys.
 * 
 * Schema Fields:
 *   - userId: Reference to User who initiated withdrawal
 *   - amount: Withdrawal amount (Decimal128 for precision)
 *   - destination: Payment destination details (account info)
 *   - status: Current withdrawal status
 *   - idempotencyKey: Unique key to prevent duplicate requests
 *   - integrityHash: Hash for tamper detection
 *   - failureReason: Reason if withdrawal failed
 *   - processedAt: Timestamp when processing completed
 *   - createdAt: Timestamp of request creation
 *   - updatedAt: Timestamp of last update
 * 
 * Usage:
 *   const Withdrawal = require('./models/Withdrawal');
 *   const withdrawal = await Withdrawal.create({ userId, amount, destination });
 */

const mongoose = require('mongoose');
const { WITHDRAWAL_STATUS } = require('../constants');

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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, 'Amount is required'],
    validate: {
      validator: function(value) {
        const numValue = parseFloat(value.toString());
        return numValue > 0;
      },
      message: 'Amount must be greater than zero'
    }
  },
  
  destination: {
    type: destinationSchema,
    required: [true, 'Destination is required']
  },
  
  status: {
    type: String,
    enum: Object.values(WITHDRAWAL_STATUS),
    default: WITHDRAWAL_STATUS.PENDING,
    required: true,
    index: true
  },
  
  idempotencyKey: {
    type: String,
    required: [true, 'Idempotency key is required'],
    unique: true,
    index: true
  },
  
  integrityHash: {
    type: String,
    required: true
  },
  
  failureReason: {
    type: String,
    trim: true
  },
  
  processedAt: {
    type: Date
  }
}, {
  timestamps: true,
  versionKey: false
});

withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ idempotencyKey: 1 });

/**
 * Get amount as number
 * Converts Decimal128 to float for calculations
 * 
 * @returns {number} Amount as floating point number
 */
withdrawalSchema.methods.getAmount = function() {
  return parseFloat(this.amount.toString());
};

/**
 * Check if withdrawal is pending
 * @returns {boolean} True if status is pending
 */
withdrawalSchema.methods.isPending = function() {
  return this.status === WITHDRAWAL_STATUS.PENDING;
};

/**
 * Check if withdrawal is processing
 * @returns {boolean} True if status is processing
 */
withdrawalSchema.methods.isProcessing = function() {
  return this.status === WITHDRAWAL_STATUS.PROCESSING;
};

/**
 * Check if withdrawal is successful
 * @returns {boolean} True if status is success
 */
withdrawalSchema.methods.isSuccess = function() {
  return this.status === WITHDRAWAL_STATUS.SUCCESS;
};

/**
 * Check if withdrawal has failed
 * @returns {boolean} True if status is failed
 */
withdrawalSchema.methods.isFailed = function() {
  return this.status === WITHDRAWAL_STATUS.FAILED;
};

/**
 * Check if withdrawal is in terminal state
 * @returns {boolean} True if status is success or failed
 */
withdrawalSchema.methods.isTerminal = function() {
  return this.isSuccess() || this.isFailed();
};

/**
 * Update status to processing
 */
withdrawalSchema.methods.markAsProcessing = function() {
  this.status = WITHDRAWAL_STATUS.PROCESSING;
};

/**
 * Update status to success
 */
withdrawalSchema.methods.markAsSuccess = function() {
  this.status = WITHDRAWAL_STATUS.SUCCESS;
  this.processedAt = new Date();
};

/**
 * Update status to failed
 * @param {string} reason - Failure reason
 */
withdrawalSchema.methods.markAsFailed = function(reason) {
  this.status = WITHDRAWAL_STATUS.FAILED;
  this.failureReason = reason;
  this.processedAt = new Date();
};

/**
 * Transform withdrawal object for JSON response
 * Converts Decimal128 to number for API responses
 */
withdrawalSchema.methods.toJSON = function() {
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
