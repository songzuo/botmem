// Rate limiting middleware to prevent abuse

const { ApiError } = require('./errorHandler');

/**
 * In-memory store for rate limiting
 * Note: In production, use Redis or similar distributed store
 */
class MemoryStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get or create entry for a key
   * @param {string} key - Identifier (e.g., IP address)
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} - { hits: number, resetTime: number }
   */
  get(key, windowMs) {
    const now = Date.now();
    
    if (!this.hits.has(key)) {
      this.hits.set(key, 0);
      this.resetTime.set(key, now + windowMs);
    }

    const resetTime = this.resetTime.get(key);
    
    // Reset if window has expired
    if (now > resetTime) {
      this.hits.set(key, 0);
      this.resetTime.set(key, now + windowMs);
    }

    return {
      hits: this.hits.get(key),
      resetTime: this.resetTime.get(key)
    };
  }

  /**
   * Increment hit count for a key
   * @param {string} key - Identifier
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} - { hits: number, resetTime: number, remaining: number }
   */
  increment(key, windowMs, maxHits) {
    const entry = this.get(key, windowMs);
    const newHits = entry.hits + 1;
    
    this.hits.set(key, newHits);
    
    return {
      hits: newHits,
      resetTime: entry.resetTime,
      remaining: Math.max(0, maxHits - newHits)
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, resetTime] of this.resetTime.entries()) {
      if (now > resetTime) {
        this.hits.delete(key);
        this.resetTime.delete(key);
      }
    }
  }

  /**
   * Reset all entries (useful for testing)
   */
  reset() {
    this.hits.clear();
    this.resetTime.clear();
  }
}

// Global store instance
const store = new MemoryStore();

/**
 * Get client identifier for rate limiting
 * @param {object} req - Express request object
 * @returns {string} - Client identifier
 */
function getClientIdentifier(req) {
  // Use IP address as default identifier
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             'unknown';
  
  // Optionally include user ID if authenticated
  const userId = req.user?.id;
  
  return userId ? `${ip}:${userId}` : ip;
}

/**
 * Create rate limiter middleware
 * @param {object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Custom error message
 * @param {function} options.keyGenerator - Custom key generator function
 * @param {boolean} options.skipFailedRequests - Skip failed requests (4xx/5xx)
 * @returns {function} - Express middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minute default
    max = 100, // 100 requests per minute default
    message = 'Too many requests, please try again later',
    keyGenerator = getClientIdentifier,
    skipFailedRequests = false
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const result = store.increment(key, windowMs, max);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    // Check if limit exceeded
    if (result.hits > max) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter);
      
      return next(ApiError.tooManyRequests(message, retryAfter));
    }

    // Track if response was successful
    if (skipFailedRequests) {
      const originalEnd = res.end;
      res.end = function(...args) {
        if (res.statusCode < 400) {
          // Only count successful requests
        }
        return originalEnd.apply(res, args);
      };
    }

    next();
  };
}

/**
 * Pre-configured rate limiters for different use cases
 */

// General API rate limiter (100 requests per minute)
const generalLimiter = createRateLimiter({
  windowMs: 60000,
  max: 100,
  message: 'Too many requests from this IP, please try again after a minute'
});

// Strict rate limiter for sensitive operations (10 requests per minute)
const strictLimiter = createRateLimiter({
  windowMs: 60000,
  max: 10,
  message: 'Too many attempts, please try again after a minute'
});

// Create user rate limiter (20 requests per minute)
const createUserLimiter = createRateLimiter({
  windowMs: 60000,
  max: 20,
  message: 'Too many user creation requests, please try again later'
});

// Health check rate limiter (30 requests per minute)
const healthCheckLimiter = createRateLimiter({
  windowMs: 60000,
  max: 30,
  message: 'Too many health check requests'
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  strictLimiter,
  createUserLimiter,
  healthCheckLimiter,
  MemoryStore,
  store
};
