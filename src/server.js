/**
 * Server Entry Point
 * 
 * Starts the HTTP server and initializes database connection.
 * 
 * Usage:
 *   node src/server.js
 */

const app = require('./app');
const config = require('./config');
const database = require('./config/database');
const logger = require('./utils/logger');

let server;

/**
 * Start the server
 * Connects to database and starts listening for requests
 */
async function startServer() {
  try {
    await database.connect();
    logger.info('Database connected successfully');
    
    server = app.listen(config.port, () => {
      logger.info(`Server started successfully`, {
        port: config.port,
        environment: config.env,
        nodeVersion: process.version
      });
      
      logger.info(`API available at http://localhost:${config.port}/api/${config.apiVersion}`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error('Server error', { error: error.message });
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * Closes server and database connections cleanly
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        await database.disconnect();
        logger.info('Database connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    });
    
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  gracefulShutdown('unhandledRejection');
});

startServer();

module.exports = { server };
