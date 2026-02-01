/**
 * User Model
 * 
 * Represents a user in the system with authentication and status information.
 * 
 * Schema Fields:
 *   - email: Unique user email address
 *   - name: User's full name
 *   - status: Account status (active/suspended/blocked)
 *   - createdAt: Timestamp of account creation
 *   - updatedAt: Timestamp of last update
 * 
 * Usage:
 *   const User = require('./models/User');
 *   const user = await User.findOne({ email: 'user@example.com' });
 */

const mongoose = require('mongoose');
const { USER_STATUS } = require('../constants');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
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

userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

/**
 * Check if user is active
 * @returns {boolean} True if user status is active
 */
userSchema.methods.isActive = function() {
  return this.status === USER_STATUS.ACTIVE;
};

/**
 * Check if user is suspended
 * @returns {boolean} True if user status is suspended
 */
userSchema.methods.isSuspended = function() {
  return this.status === USER_STATUS.SUSPENDED;
};

/**
 * Check if user is blocked
 * @returns {boolean} True if user status is blocked
 */
userSchema.methods.isBlocked = function() {
  return this.status === USER_STATUS.BLOCKED;
};

/**
 * Transform user object for JSON response
 * Removes sensitive fields and formats output
 */
userSchema.methods.toJSON = function() {
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
