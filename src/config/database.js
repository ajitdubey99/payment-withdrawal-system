/**
 * Database Manager
 * 
 * This file is responsible for connecting and disconnecting MongoDB.
 * It also listens to database events like connect, disconnect, and errors.
 * 
 * Example:
 *   const database = require('./config/database');
 *   await database.connect();
 */

const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    // Stores the active database connection
    this.connection = null;
  }

  /**
   * Connects the application to MongoDB.
   * It uses the connection details from config file.
   * If connection fails, it throws an error.
   */
  async connect() {
    try {
      // Disable strict mode for queries
      mongoose.set('strictQuery', false);

      // Create connection with MongoDB
      this.connection = await mongoose.connect(
        config.mongodb.uri,
        config.mongodb.options
      );

      // Setup listeners for connection events
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
   * Listens to MongoDB connection events.
   * Helps in logging when DB connects, disconnects, or throws errors.
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

    // Close DB connection when app is stopped (Ctrl + C)
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Closes the MongoDB connection safely.
   * This should be called when the app is shutting down.
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed successfully');
    } catch (error) {
      logger.error('Error while closing MongoDB connection', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Returns the current database connection.
   */
  getConnection() {
    return mongoose.connection;
  }

  /**
   * Checks whether MongoDB is connected or not.
   * Returns true if connected, otherwise false.
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();
