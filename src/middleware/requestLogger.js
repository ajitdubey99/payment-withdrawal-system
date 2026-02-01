/**
 * Request Logger Middleware
 * 
 * Logs all HTTP requests with correlation IDs for tracing.
 * 
 * Usage:
 *   app.use(requestLogger);
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Adds correlation ID and logs request/response details
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function requestLogger(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  const startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    res.locals.responseBody = data;
    return res.send(data);
  };
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    const logData = {
      correlationId,
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  logger.info('Incoming request', {
    correlationId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });
  
  next();
}

module.exports = requestLogger;
