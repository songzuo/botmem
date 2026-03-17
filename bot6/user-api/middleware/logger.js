// Request logging middleware

/**
 * Generate a unique request ID
 * @returns {string} - Unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for logging
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return date.toISOString();
}

/**
 * Get client IP address from request
 * @param {object} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Mask sensitive data in request body
 * @param {object} body - Request body
 * @returns {object} - Masked body
 */
function maskSensitiveData(body) {
  if (!body || typeof body !== 'object') return body;
  
  const masked = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  }
  
  return masked;
}

/**
 * Request logging middleware
 * Logs incoming requests with method, path, status, and duration
 */
function requestLogger(req, res, next) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Attach request ID to request object
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-Id', requestId);
  
  // Log incoming request
  const requestLog = {
    requestId,
    timestamp: formatDate(new Date()),
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || 'unknown'
  };
  
  // Only log body for non-GET requests and if it exists
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    requestLog.body = maskSensitiveData(req.body);
  }
  
  console.log('[REQUEST]', JSON.stringify(requestLog));
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override res.end to log response
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    
    const responseLog = {
      requestId,
      timestamp: formatDate(new Date()),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    // Determine log level based on status code
    if (res.statusCode >= 500) {
      console.error('[RESPONSE ERROR]', JSON.stringify(responseLog));
    } else if (res.statusCode >= 400) {
      console.warn('[RESPONSE WARN]', JSON.stringify(responseLog));
    } else {
      console.log('[RESPONSE]', JSON.stringify(responseLog));
    }
    
    // Call original end function
    return originalEnd.apply(res, args);
  };
  
  next();
}

/**
 * Error logging helper
 * @param {string} requestId - Request ID
 * @param {Error} error - Error object
 * @param {object} req - Express request object
 */
function logError(requestId, error, req) {
  const errorLog = {
    requestId,
    timestamp: formatDate(new Date()),
    method: req.method,
    path: req.path,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }
  };
  
  console.error('[ERROR]', JSON.stringify(errorLog));
}

module.exports = {
  requestLogger,
  logError,
  generateRequestId,
  getClientIp,
  maskSensitiveData
};
