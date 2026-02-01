/**
 * Server Entry Point
 * 
 * This file starts the application.
 * It connects to the database and then starts listening for requests.
 * 
 * Run using:
 *   node src/server.js
 */

const app = require('./app');
const config = require('./config');
const database = require('./config/database');
const logger = require('./utils/logger');

let server;

/**
 * Starts the server
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    logger.info('Database connected');

    // Start HTTP server
    server = app.listen(config.port, () => {
      logger.info('Server running', {
        port: config.port,
        env: config.env,
        node: process.version
      });

      logger.info(
        `API: http://localhost:${config.port}/api/${config.apiVersion}`
      );
    });

    // Handle server-level errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} already in use`);
      } else {
        logger.error('Server error', {
          error: error.message
        });
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Server startup failed', {
      error: error.message
    });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 * Closes server and DB safely
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await database.disconnect();
        logger.info('Database closed');
        process.exit(0);
      } catch (error) {
        logger.error('Shutdown error', {
          error: error.message
        });
        process.exit(1);
      }
    });

    // Force exit if not closed in time
    setTimeout(() => {
      logger.error('Force shutdown');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// System signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch crashes
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  gracefulShutdown('uncaughtException');
});

// Catch promise errors
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  gracefulShutdown('unhandledRejection');
});

// Start server
startServer();

module.exports = { server };