// Unified error handling middleware

const { logError } = require('./logger');

/**
 * Custom API Error class
 * Extends Error to include HTTP status code and additional details
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  /**
   * Create a 422 Unprocessable Entity error
   */
  static unprocessableEntity(message, details = null) {
    return new ApiError(422, message, details);
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message = 'Too many requests, please try again later', retryAfter = null) {
    const error = new ApiError(429, message);
    error.retryAfter = retryAfter;
    return error;
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

/**
 * Convert error to JSON format for API response
 * @param {Error|ApiError} error - Error to convert
 * @param {boolean} includeStack - Whether to include stack trace
 * @returns {object} - Error response object
 */
function errorToResponse(error, includeStack = false) {
  const response = {
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    statusCode: error.statusCode || 500
  };

  if (error.details) {
    response.details = error.details;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Global error handling middleware
 * Must be registered last in the middleware chain
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logError(req.requestId || 'unknown', err, req);

  // Handle known API errors
  if (err instanceof ApiError) {
    const response = errorToResponse(
      err,
      process.env.NODE_ENV !== 'production'
    );
    
    // Add Retry-After header for rate limit errors
    if (err.retryAfter) {
      res.setHeader('Retry-After', err.retryAfter);
    }
    
    return res.status(err.statusCode).json(response);
  }

  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON in request body',
      statusCode: 400
    });
  }

  // Handle payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request body is too large',
      statusCode: 413
    });
  }

  // Handle unexpected errors
  console.error('[UNHANDLED ERROR]', err);
  
  const response = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    statusCode: 500
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  return res.status(500).json(response);
}

/**
 * 404 Not Found handler for unmatched routes
 */
function notFoundHandler(req, res, next) {
  const error = ApiError.notFound(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {function} fn - Async route handler function
 * @returns {function} - Wrapped function that catches errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  errorToResponse
};
