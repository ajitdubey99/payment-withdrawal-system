/**
 * User Repository
 * 
 * Data access layer for User model.
 * Encapsulates all database operations for users.
 * 
 * Usage:
 *   const UserRepository = require('./repositories/UserRepository');
 *   const user = await UserRepository.findById(userId);
 */

const User = require('../models/User');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

class UserRepository {
  /**
   * Find user by ID
   * 
   * @param {string} userId - User ID to find
   * @returns {Promise<Object>} User document
   * @throws {NotFoundError} If user not found
   */
  async findById(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User');
      }
      
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error finding user by ID', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Find user by email
   * 
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User document or null
   */
  async findByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      logger.error('Error finding user by email', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Create new user
   * 
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user document
   */
  async create(userData) {
    try {
      const user = new User(userData);
      await user.save();
      
      logger.info('User created', { userId: user._id, email: user.email });
      return user;
    } catch (error) {
      logger.error('Error creating user', { userData, error: error.message });
      throw error;
    }
  }

  /**
   * Update user by ID
   * 
   * @param {string} userId - User ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated user document
   * @throws {NotFoundError} If user not found
   */
  async update(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!user) {
        throw new NotFoundError('User');
      }
      
      logger.info('User updated', { userId });
      return user;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating user', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Check if user exists
   * 
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if user exists
   */
  async exists(userId) {
    try {
      const count = await User.countDocuments({ _id: userId });
      return count > 0;
    } catch (error) {
      logger.error('Error checking user existence', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Find users by status
   * 
   * @param {string} status - User status
   * @returns {Promise<Array>} Array of users
   */
  async findByStatus(status) {
    try {
      return await User.find({ status });
    } catch (error) {
      logger.error('Error finding users by status', { status, error: error.message });
      throw error;
    }
  }

  /**
   * Delete user by ID
   * For testing purposes only
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async delete(userId) {
    try {
      await User.findByIdAndDelete(userId);
      logger.info('User deleted', { userId });
    } catch (error) {
      logger.error('Error deleting user', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = new UserRepository();
