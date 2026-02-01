/**
 * User Repository
 * 
 * This file handles all DB operations for users.
 * Service layer should use this instead of calling models directly.
 * 
 * Example:
 *   const UserRepository = require('./repositories/UserRepository');
 *   const user = await UserRepository.findById(userId);
 */

const User = require('../models/User');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

class UserRepository {
  /**
   * Returns user by ID
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

      logger.error('Error finding user by ID', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns user by email
   */
  async findByEmail(email) {
    try {
      return await User.findOne({
        email: email.toLowerCase()
      });
    } catch (error) {
      logger.error('Error finding user by email', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Creates a new user
   */
  async create(userData) {
    try {
      const user = new User(userData);
      await user.save();

      logger.info('User created', {
        userId: user._id,
        email: user.email
      });

      return user;
    } catch (error) {
      logger.error('Error creating user', {
        userData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Updates user data
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

      logger.error('Error updating user', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Checks if user exists
   */
  async exists(userId) {
    try {
      const count = await User.countDocuments({ _id: userId });
      return count > 0;
    } catch (error) {
      logger.error('Error checking user existence', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns users by status
   */
  async findByStatus(status) {
    try {
      return await User.find({ status });
    } catch (error) {
      logger.error('Error finding users by status', {
        status,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Deletes user (mainly for testing)
   */
  async delete(userId) {
    try {
      await User.findByIdAndDelete(userId);
      logger.info('User deleted', { userId });
    } catch (error) {
      logger.error('Error deleting user', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new UserRepository();