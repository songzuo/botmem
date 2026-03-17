// User API Routes - RESTful endpoints for user management

const express = require('express');
const router = express.Router();

// Import middleware
const {
  validation,
  ApiError,
  asyncHandler,
  createUserLimiter,
  strictLimiter
} = require('../middleware');

// In-memory storage for users (in a real app, this would be a database)
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

let nextId = 3;

// Helper function to find user by ID
function findUserById(id) {
  return users.find(u => u.id === id);
}

// Helper function to check email uniqueness
function isEmailUnique(email, excludeId = null) {
  return !users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId);
}

// GET /users - Retrieve all users
router.get('/', (req, res) => {
  res.json({
    count: users.length,
    data: users
  });
});

// GET /users/:id - Retrieve a specific user by ID
router.get('/:id', validation.validateUserIdParam, (req, res, next) => {
  const user = findUserById(req.validatedId);
  
  if (!user) {
    return next(ApiError.notFound('User not found'));
  }
  
  res.json(user);
});

// POST /users - Create a new user
router.post('/', 
  createUserLimiter, // Apply stricter rate limiting for user creation
  validation.validateUserBody,
  asyncHandler(async (req, res, next) => {
    const { name, email } = req.validatedBody;
    
    // Check if email already exists
    if (!isEmailUnique(email)) {
      return next(ApiError.conflict('Email already exists', {
        field: 'email',
        value: email
      }));
    }
    
    const newUser = {
      id: nextId++,
      name,
      email
    };
    
    users.push(newUser);
    
    res.status(201).json({
      message: 'User created successfully',
      data: newUser
    });
  })
);

// PUT /users/:id - Update an existing user
router.put('/:id',
  strictLimiter, // Apply strict rate limiting for updates
  validation.validateUserIdParam,
  validation.validateUserBody,
  asyncHandler(async (req, res, next) => {
    const id = req.validatedId;
    const { name, email } = req.validatedBody;
    
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return next(ApiError.notFound('User not found'));
    }
    
    // Check if email already exists (excluding current user)
    if (!isEmailUnique(email, id)) {
      return next(ApiError.conflict('Email already exists', {
        field: 'email',
        value: email
      }));
    }
    
    users[userIndex] = { id, name, email };
    
    res.json({
      message: 'User updated successfully',
      data: users[userIndex]
    });
  })
);

// DELETE /users/:id - Delete a user
router.delete('/:id',
  strictLimiter, // Apply strict rate limiting for deletions
  validation.validateUserIdParam,
  asyncHandler(async (req, res, next) => {
    const id = req.validatedId;
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return next(ApiError.notFound('User not found'));
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    res.json({
      message: 'User deleted successfully',
      data: deletedUser
    });
  })
);

// Export for testing
module.exports = router;

// Export additional utilities for testing
module.exports.getUsers = () => users;
module.exports.resetUsers = () => {
  users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  nextId = 3;
};
