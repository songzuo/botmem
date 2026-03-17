// Middleware index - exports all middleware components

const validation = require('./validation');
const logger = require('./logger');
const errorHandler = require('./errorHandler');
const rateLimiter = require('./rateLimiter');

module.exports = {
  // Validation
  validation,
  
  // Logger
  requestLogger: logger.requestLogger,
  logError: logger.logError,
  
  // Error handling
  ApiError: errorHandler.ApiError,
  errorHandler: errorHandler.errorHandler,
  notFoundHandler: errorHandler.notFoundHandler,
  asyncHandler: errorHandler.asyncHandler,
  
  // Rate limiting
  createRateLimiter: rateLimiter.createRateLimiter,
  generalLimiter: rateLimiter.generalLimiter,
  strictLimiter: rateLimiter.strictLimiter,
  createUserLimiter: rateLimiter.createUserLimiter,
  healthCheckLimiter: rateLimiter.healthCheckLimiter
};
