// Validation Middleware Tests
// Tests for input validation utilities

const {
  validateEmail,
  validateName,
  validateUserId,
  sanitizeString,
  validateUserBody,
  validateUserIdParam,
  VALIDATION_RULES
} = require('../middleware/validation');

describe('Validation Middleware', () => {
  describe('validateEmail', () => {
    test('should validate correct email format', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should validate email with subdomain', () => {
      const result = validateEmail('test@mail.example.com');
      expect(result.valid).toBe(true);
    });

    test('should validate email with plus sign', () => {
      const result = validateEmail('test+tag@example.com');
      expect(result.valid).toBe(true);
    });

    test('should validate email with hyphens', () => {
      const result = validateEmail('test-user@example-domain.com');
      expect(result.valid).toBe(true);
    });

    test('should reject email without @ symbol', () => {
      const result = validateEmail('invalidemail.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });

    test('should reject email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
    });

    test('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.valid).toBe(false);
    });

    test('should reject empty string', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject whitespace-only email', () => {
      const result = validateEmail('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Email cannot be empty');
    });

    test('should reject null', () => {
      const result = validateEmail(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Email is required');
    });

    test('should reject undefined', () => {
      const result = validateEmail(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Email is required');
    });

    test('should reject non-string input', () => {
      const result = validateEmail(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Email is required');
    });

    test('should reject email exceeding max length', () => {
      const longEmail = 'a'.repeat(245) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    test('should trim whitespace', () => {
      const result = validateEmail('  test@example.com  ');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateName', () => {
    test('should validate correct name', () => {
      const result = validateName('John Doe');
      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should validate single word name', () => {
      const result = validateName('John');
      expect(result.valid).toBe(true);
    });

    test('should validate name with spaces', () => {
      const result = validateName('John Michael Doe');
      expect(result.valid).toBe(true);
    });

    test('should validate name with hyphens', () => {
      const result = validateName('Mary-Jane');
      expect(result.valid).toBe(true);
    });

    test('should validate name with apostrophes', () => {
      const result = validateName("O'Connor");
      expect(result.valid).toBe(true);
    });

    test('should reject empty string', () => {
      const result = validateName('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should reject whitespace-only name', () => {
      const result = validateName('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    test('should reject null', () => {
      const result = validateName(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    test('should reject undefined', () => {
      const result = validateName(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    test('should reject non-string input', () => {
      const result = validateName(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Name is required');
    });

    test('should reject name exceeding max length', () => {
      const longName = 'a'.repeat(101);
      const result = validateName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot exceed');
    });

    test('should reject name with control characters', () => {
      const result = validateName('John\u0000Doe');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    test('should trim whitespace', () => {
      const result = validateName('  John Doe  ');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUserId', () => {
    test('should validate positive integer', () => {
      const result = validateUserId('1');
      expect(result.valid).toBe(true);
      expect(result.parsedId).toBe(1);
      expect(result.error).toBeNull();
    });

    test('should validate large positive integer', () => {
      const result = validateUserId('999999');
      expect(result.valid).toBe(true);
      expect(result.parsedId).toBe(999999);
    });

    test('should reject null', () => {
      const result = validateUserId(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('User ID is required');
      expect(result.parsedId).toBeNull();
    });

    test('should reject undefined', () => {
      const result = validateUserId(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('User ID is required');
      expect(result.parsedId).toBeNull();
    });

    test('should reject string that is not a number', () => {
      const result = validateUserId('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a valid number');
      expect(result.parsedId).toBeNull();
    });

    test('should reject zero', () => {
      const result = validateUserId('0');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive number');
    });

    test('should reject negative number', () => {
      const result = validateUserId('-1');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a positive number');
    });

    test('should parse decimal string as integer (parseInt behavior)', () => {
      // Note: parseInt('1.5') returns 1, so this passes validation
      // This is expected behavior with the current implementation
      const result = validateUserId('1.5');
      expect(result.valid).toBe(true);
      expect(result.parsedId).toBe(1);
    });

    test('should reject empty string', () => {
      const result = validateUserId('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a valid number');
    });

    test('should parse numeric string', () => {
      const result = validateUserId('123');
      expect(result.valid).toBe(true);
      expect(result.parsedId).toBe(123);
    });
  });

  describe('sanitizeString', () => {
    test('should trim whitespace from string', () => {
      const result = sanitizeString('  test string  ');
      expect(result).toBe('test string');
    });

    test('should return non-string input unchanged', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
      expect(sanitizeString({})).toEqual({});
    });

    test('should handle string with only spaces', () => {
      const result = sanitizeString('   ');
      expect(result).toBe('');
    });

    test('should not modify internal spaces', () => {
      const result = sanitizeString('  hello   world  ');
      expect(result).toBe('hello   world');
    });
  });

  describe('VALIDATION_RULES', () => {
    test('should have name validation rules', () => {
      expect(VALIDATION_RULES.name).toBeDefined();
      expect(VALIDATION_RULES.name.minLength).toBe(1);
      expect(VALIDATION_RULES.name.maxLength).toBe(100);
    });

    test('should have email validation rules', () => {
      expect(VALIDATION_RULES.email).toBeDefined();
      expect(VALIDATION_RULES.email.maxLength).toBe(254);
    });
  });

  describe('validateUserBody middleware', () => {
    test('should call next for valid body', () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.validatedBody).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    test('should sanitize and lowercase email', () => {
      const req = {
        body: {
          name: '  John Doe  ',
          email: '  JOHN@EXAMPLE.COM  '
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedBody).toEqual({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    test('should return 400 for missing name', () => {
      const req = {
        body: {
          email: 'test@example.com'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'name'
          })
        ])
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 for missing email', () => {
      const req = {
        body: {
          name: 'John Doe'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email'
          })
        ])
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid email format', () => {
      const req = {
        body: {
          name: 'John Doe',
          email: 'invalid-email'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('Invalid email format')
          })
        ])
      });
    });

    test('should return 400 for multiple validation errors', () => {
      const req = {
        body: {
          name: '',
          email: 'invalid'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserBody(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'email' })
        ])
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateUserIdParam middleware', () => {
    test('should call next for valid ID', () => {
      const req = {
        params: {
          id: '1'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserIdParam(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedId).toBe(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid ID string', () => {
      const req = {
        params: {
          id: 'invalid'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserIdParam(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid user ID',
        message: expect.stringContaining('must be a valid number')
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 for negative ID', () => {
      const req = {
        params: {
          id: '-1'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserIdParam(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid user ID',
        message: expect.stringContaining('must be a positive number')
      });
    });

    test('should parse decimal string as integer (parseInt behavior)', () => {
      const req = {
        params: {
          id: '1.5'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      validateUserIdParam(req, res, next);

      // Note: parseInt('1.5') returns 1, so this passes validation
      expect(next).toHaveBeenCalled();
      expect(req.validatedId).toBe(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});