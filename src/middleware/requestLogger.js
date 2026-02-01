/**
 * Request Logger Middleware
 * 
 * This middleware logs every incoming request.
 * It also adds a unique ID so logs can be traced easily.
 * 
 * Example:
 *   app.use(requestLogger);
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Logs request and response details
 */
function requestLogger(req, res, next) {
  // Use existing correlation ID or generate new one
  const correlationId =
    req.headers['x-correlation-id'] || uuidv4();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  const startTime = Date.now();

  // Capture response body
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    res.locals.responseBody = data;
    return res.send(data);
  };

  // Log after response is finished
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

  // Log when request comes in
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