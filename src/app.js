/**
 * Express Application Setup
 * 
 * Configures Express application with middleware and routes.
 * 
 * Usage:
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

app.use(helmet());

app.use(cors({
  origin: config.isProduction() ? [] : '*',
  credentials: true
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    console.warn(`Sanitized field: ${key}`);
  }
}));

app.use(requestLogger);

app.use(`/api/${config.apiVersion}`, apiLimiter);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Payment Withdrawal System API',
    version: config.apiVersion,
    status: 'running'
  });
});

app.use(`/api/${config.apiVersion}`, routes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
