/**
 * Database Connection Manager
 * 
 * Handles MongoDB connection lifecycle including connection, disconnection,
 * and connection event handling.
 * 
 * Usage:
 *   const database = require('./config/database');
 *   await database.connect();
 */

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Establishes connection to MongoDB database
   * Sets up event listeners for connection monitoring
   * 
   * @returns {Promise<void>}
   * @throws {Error} If connection fails
   */
  async connect() {
    try {
      mongoose.set('strictQuery', false);

      this.connection = await mongoose.connect(config.mongodb.uri, config.mongodb.options);

      this.setupEventListeners();

      logger.info('MongoDB connected successfully', {
        host: this.connection.connection.host,
        db: this.connection.connection.name
      });
    } catch (error) {
      logger.error('MongoDB connection error', { error: error.message });
      throw error;
    }
  }

  /**
   * Sets up MongoDB connection event listeners
   * Monitors connection state changes and errors
   * 
   * @private
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Gracefully closes MongoDB connection
   * Should be called during application shutdown
   * 
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
    } catch (error) {
      logger.error('Error closing MongoDB connection', { error: error.message });
      throw error;
    }
  }

  /**
   * Gets the current mongoose connection instance
   * 
   * @returns {mongoose.Connection} Mongoose connection object
   */
  getConnection() {
    return mongoose.connection;
  }

  /**
   * Checks if database is connected
   * 
   * @returns {boolean} True if connected
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();
