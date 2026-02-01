/**
 * Express Application Setup
 * 
 * This file creates and configures the Express app.
 * All middleware and routes are registered here.
 * 
 * Example:
 *   const app = require('./app');
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config');
const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: config.isProduction() ? [] : '*',
  credentials: true
}));

// Compress responses
app.use(compression());

// Parse JSON and form data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// Prevent MongoDB injection
app.use(mongoSanitize({
  replaceWith: '_'
}));

// Log all requests
app.use(requestLogger);

// Apply rate limiting
app.use(`/api/${config.apiVersion}`, apiLimiter);

// Root health endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payment Withdrawal System API',
    version: config.apiVersion,
    status: 'running'
  });
});

// API routes
app.use(`/api/${config.apiVersion}`, routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;