/**
 * User Model
 * 
 * This model represents a user in the system.
 * It stores basic user info and account status.
 * 
 * Example:
 *   const User = require('./models/User');
 *   const user = await User.findOne({ email: 'user@example.com' });
 */

const mongoose = require('mongoose');
const { USER_STATUS } = require('../constants');

const userSchema = new mongoose.Schema({
  // User email (must be unique)
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },

  // User full name
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  // Account status
  status: {
    type: String,
    enum: Object.values(USER_STATUS),
    default: USER_STATUS.ACTIVE,
    required: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for faster search
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

/**
 * Returns true if user is active
 */
userSchema.methods.isActive = function () {
  return this.status === USER_STATUS.ACTIVE;
};

/**
 * Returns true if user is suspended
 */
userSchema.methods.isSuspended = function () {
  return this.status === USER_STATUS.SUSPENDED;
};

/**
 * Returns true if user is blocked
 */
userSchema.methods.isBlocked = function () {
  return this.status === USER_STATUS.BLOCKED;
};

/**
 * Custom JSON response
 * Hides internal fields
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  return {
    id: obj._id,
    email: obj.email,
    name: obj.name,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;