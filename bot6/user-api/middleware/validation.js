// Input validation middleware and utilities

/**
 * Email validation regex pattern
 * RFC 5322 compliant email validation
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Validation constraints
const VALIDATION_RULES = {
  name: {
    minLength: 1,
    maxLength: 100
  },
  email: {
    maxLength: 254
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} - { valid: boolean, error: string|null }
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const trimmedEmail = email.trim();
  
  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmedEmail.length > VALIDATION_RULES.email.maxLength) {
    return { valid: false, error: `Email cannot exceed ${VALIDATION_RULES.email.maxLength} characters` };
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, error: null };
}

/**
 * Validate name format
 * @param {string} name - Name to validate
 * @returns {object} - { valid: boolean, error: string|null }
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required and must be a string' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_RULES.name.minLength) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (trimmedName.length > VALIDATION_RULES.name.maxLength) {
    return { valid: false, error: `Name cannot exceed ${VALIDATION_RULES.name.maxLength} characters` };
  }

  // Check for control characters
  if (/[\x00-\x1F\x7F]/.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true, error: null };
}

/**
 * Validate user ID
 * @param {string} id - ID to validate
 * @returns {object} - { valid: boolean, error: string|null, parsedId: number|null }
 */
function validateUserId(id) {
  if (id === undefined || id === null) {
    return { valid: false, error: 'User ID is required', parsedId: null };
  }

  const parsedId = parseInt(id, 10);
  
  if (isNaN(parsedId)) {
    return { valid: false, error: 'User ID must be a valid number', parsedId: null };
  }

  if (parsedId <= 0) {
    return { valid: false, error: 'User ID must be a positive number', parsedId: null };
  }

  if (!Number.isInteger(parsedId)) {
    return { valid: false, error: 'User ID must be an integer', parsedId: null };
  }

  return { valid: true, error: null, parsedId };
}

/**
 * Sanitize string input by trimming whitespace
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim();
}

/**
 * Middleware to validate user creation/update request body
 */
function validateUserBody(req, res, next) {
  const { name, email } = req.body;
  
  const errors = [];

  // Validate name
  const nameResult = validateName(name);
  if (!nameResult.valid) {
    errors.push({ field: 'name', message: nameResult.error });
  }

  // Validate email
  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.push({ field: 'email', message: emailResult.error });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  // Sanitize and attach to request
  req.validatedBody = {
    name: sanitizeString(name),
    email: sanitizeString(email).toLowerCase()
  };

  next();
}

/**
 * Middleware to validate user ID parameter
 */
function validateUserIdParam(req, res, next) {
  const { id } = req.params;
  
  const result = validateUserId(id);
  if (!result.valid) {
    return res.status(400).json({
      error: 'Invalid user ID',
      message: result.error
    });
  }

  req.validatedId = result.parsedId;
  next();
}

module.exports = {
  validateEmail,
  validateName,
  validateUserId,
  sanitizeString,
  validateUserBody,
  validateUserIdParam,
  VALIDATION_RULES
};
