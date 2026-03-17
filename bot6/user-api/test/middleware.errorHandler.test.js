// Error Handler Middleware Tests
// Tests for error handling utilities and middleware

const {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  errorToResponse
} = require('../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      requestId: 'test-req-123',
      method: 'GET',
      path: '/test',
      body: {},
      headers: {}
    };

    mockRes = {
      statusCode: 200,
      headers: {},
      status: jest.fn(function(code) {
        this.statusCode = code;
        return this;
      }),
      setHeader: jest.fn(function(name, value) {
        this.headers[name] = value;
      }),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('ApiError class', () => {
    test('should create ApiError with status code and message', () => {
      const error = new ApiError(400, 'Bad request');
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.name).toBe('ApiError');
    });

    test('should include details in error', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new ApiError(400, 'Validation failed', details);
      expect(error.details).toEqual(details);
    });

    test('should capture stack trace', () => {
      const error = new ApiError(500, 'Server error');
      expect(error.stack).toBeDefined();
    });

    describe('ApiError.badRequest', () => {
      test('should create 400 Bad Request error', () => {
        const error = ApiError.badRequest('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Invalid input');
      });

      test('should include details', () => {
        const details = { field: 'name' };
        const error = ApiError.badRequest('Invalid input', details);
        expect(error.details).toEqual(details);
      });
    });

    describe('ApiError.notFound', () => {
      test('should create 404 Not Found error', () => {
        const error = ApiError.notFound('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
      });

      test('should have default message', () => {
        const error = ApiError.notFound();
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
      });
    });

    describe('ApiError.conflict', () => {
      test('should create 409 Conflict error', () => {
        const error = ApiError.conflict('Resource already exists');
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Resource already exists');
      });
    });

    describe('ApiError.unprocessableEntity', () => {
      test('should create 422 Unprocessable Entity error', () => {
        const error = ApiError.unprocessableEntity('Invalid data');
        expect(error.statusCode).toBe(422);
        expect(error.message).toBe('Invalid data');
      });
    });

    describe('ApiError.tooManyRequests', () => {
      test('should create 429 Too Many Requests error', () => {
        const error = ApiError.tooManyRequests('Rate limit exceeded');
        expect(error.statusCode).toBe(429);
        expect(error.message).toBe('Rate limit exceeded');
      });

      test('should include retryAfter value', () => {
        const error = ApiError.tooManyRequests('Rate limit exceeded', 60);
        expect(error.retryAfter).toBe(60);
      });

      test('should have default message', () => {
        const error = ApiError.tooManyRequests();
        expect(error.statusCode).toBe(429);
        expect(error.message).toBe('Too many requests, please try again later');
      });
    });

    describe('ApiError.internal', () => {
      test('should create 500 Internal Server Error', () => {
        const error = ApiError.internal('Something went wrong');
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Something went wrong');
      });

      test('should have default message', () => {
        const error = ApiError.internal();
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe('Internal server error');
      });
    });
  });

  describe('errorToResponse', () => {
    test('should convert ApiError to response format', () => {
      const error = new ApiError(404, 'Not found');
      const response = errorToResponse(error);

      expect(response).toEqual({
        error: 'ApiError',
        message: 'Not found',
        statusCode: 404
      });
    });

    test('should include details when present', () => {
      const error = ApiError.badRequest('Invalid input', { field: 'email' });
      const response = errorToResponse(error);

      expect(response.details).toEqual({ field: 'email' });
    });

    test('should include stack trace when requested', () => {
      const error = new ApiError(500, 'Server error');
      const response = errorToResponse(error, true);

      expect(response.stack).toBeDefined();
      expect(response.stack).toBe(error.stack);
    });

    test('should not include stack trace when not requested', () => {
      const error = new ApiError(500, 'Server error');
      const response = errorToResponse(error, false);

      expect(response.stack).toBeUndefined();
    });

    test('should handle generic Error objects', () => {
      const error = new Error('Generic error');
      const response = errorToResponse(error);

      expect(response).toEqual({
        error: 'Error',
        message: 'Generic error',
        statusCode: 500
      });
    });

    test('should handle error without message', () => {
      const error = new Error();
      const response = errorToResponse(error);

      expect(response.message).toBe('An unexpected error occurred');
    });
  });

  describe('errorHandler middleware', () => {
    test('should handle ApiError correctly', () => {
      const error = ApiError.notFound('User not found');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ApiError',
          message: 'User not found',
          statusCode: 404
        })
      );
    });

    test('should set Retry-After header for rate limit errors', () => {
      const error = ApiError.tooManyRequests('Too many requests', 30);

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', 30);
    });

    test('should handle JSON parse errors', () => {
      const error = {
        type: 'entity.parse.failed',
        message: 'Invalid JSON'
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Bad Request',
          message: 'Invalid JSON in request body',
          statusCode: 400
        })
      );
    });

    test('should handle payload too large errors', () => {
      const error = {
        type: 'entity.too.large',
        message: 'Payload too large'
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Payload Too Large',
          message: 'Request body is too large',
          statusCode: 413
        })
      );
    });

    test('should handle unexpected errors with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal Server Error',
          statusCode: 500
        })
      );
    });

    test('should include stack trace in non-production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Unexpected error');
      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: expect.any(String)
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    test('should hide stack trace in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Unexpected error');
      errorHandler(error, mockReq, mockRes, mockNext);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.stack).toBeUndefined();
      expect(response.message).toBe('An unexpected error occurred');

      process.env.NODE_ENV = originalEnv;
    });

    test('should handle error without explicit status code', () => {
      const error = new Error('Generic error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    test('should create 404 error for unmatched routes', () => {
      mockReq.method = 'GET';
      mockReq.path = '/nonexistent';

      notFoundHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: expect.stringContaining('GET /nonexistent')
        })
      );
    });

    test('should include method and path in error message', () => {
      mockReq.method = 'POST';
      mockReq.path = '/api/users';

      notFoundHandler(mockReq, mockRes, mockNext);

      const errorArg = mockNext.mock.calls[0][0];
      expect(errorArg.message).toContain('POST');
      expect(errorArg.message).toContain('/api/users');
    });
  });

  describe('asyncHandler', () => {
    test('should resolve and call next when promise resolves', async () => {
      const handler = jest.fn((req, res, next) => {
        return Promise.resolve('success');
      });

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    test('should catch errors and pass to next', async () => {
      const error = new Error('Async error');
      const handler = jest.fn(() => {
        return Promise.reject(error);
      });

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should handle ApiError rejections', async () => {
      const error = ApiError.badRequest('Bad request');
      const handler = jest.fn(() => {
        return Promise.reject(error);
      });

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('should wrap functions correctly', () => {
      const mockFn = jest.fn((req, res, next) => {
        res.json({ success: true });
        return Promise.resolve();
      });

      const wrapped = asyncHandler(mockFn);
      expect(typeof wrapped).toBe('function');
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete error flow from handler to response', () => {
      const error = ApiError.conflict('Email already exists', {
        field: 'email',
        value: 'test@example.com'
      });

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ApiError',
          message: 'Email already exists',
          statusCode: 409,
          details: {
            field: 'email',
            value: 'test@example.com'
          }
        })
      );
    });

    test('should handle notFoundHandler followed by errorHandler', () => {
      mockReq.method = 'DELETE';
      mockReq.path = '/api/users/999';

      notFoundHandler(mockReq, mockRes, (error) => {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.statusCode).toBe(404);

        errorHandler(error, mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(404);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'ApiError',
            statusCode: 404
          })
        );
      });
    });
  });
});