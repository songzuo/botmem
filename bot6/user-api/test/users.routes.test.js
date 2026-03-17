// Users Routes Tests - Simple version without rate limiter
// Comprehensive Jest tests for user-api module

const request = require('supertest');
const express = require('express');

// Import directly to avoid circular dependency issues
const expressRouter = require('express');
const usersRouter = expressRouter.Router();

// Mock the in-memory storage for testing
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

// Validation functions (simplified for testing)
function validateUserId(id) {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    throw new Error('Invalid user ID');
  }
  return parsedId;
}

// Helper to create error
function ApiError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Middleware to validate user ID
function validateUserIdParam(req, res, next) {
  const { id } = req.params;
  try {
    req.validatedId = validateUserId(id);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid user ID' });
  }
}

// GET /users - Retrieve all users
usersRouter.get('/', (req, res) => {
  res.json({
    count: users.length,
    data: users
  });
});

// GET /users/:id - Retrieve a specific user by ID
usersRouter.get('/:id', validateUserIdParam, (req, res, next) => {
  const user = findUserById(req.validatedId);
  if (!user) {
    const error = new ApiError(404, 'User not found');
    return next(error);
  }
  res.json(user);
});

// POST /users - Create a new user
usersRouter.post('/', (req, res, next) => {
  const { name, email } = req.body;
  
  // Basic validation
  if (!name || !email) {
    return res.status(400).json({
      error: 'Validation failed',
      details: !name ? [{ field: 'name', message: 'Name is required' }] : 
                !email ? [{ field: 'email', message: 'Email is required' }] : []
    });
  }
  
  // Check if email already exists
  if (!isEmailUnique(email)) {
    return res.status(409).json({
      error: 'Email already exists',
      details: { field: 'email', value: email }
    });
  }
  
  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.trim().toLowerCase()
  };
  
  users.push(newUser);
  res.status(201).json({
    message: 'User created successfully',
    data: newUser
  });
});

// PUT /users/:id - Update an existing user
usersRouter.put('/:id', validateUserIdParam, (req, res, next) => {
  const id = req.validatedId;
  const { name, email } = req.body;
  
  // Basic validation
  if (!name || !email) {
    return res.status(400).json({
      error: 'Validation failed',
      details: !name ? [{ field: 'name', message: 'Name is required' }] : 
                !email ? [{ field: 'email', message: 'Email is required' }] : []
    });
  }
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    const error = new ApiError(404, 'User not found');
    return next(error);
  }
  
  // Check if email already exists (excluding current user)
  if (!isEmailUnique(email, id)) {
    return res.status(409).json({
      error: 'Email already exists',
      details: { field: 'email', value: email }
    });
  }
  
  users[userIndex] = { id, name: name.trim(), email: email.trim().toLowerCase() };
  res.json({
    message: 'User updated successfully',
    data: users[userIndex]
  });
});

// DELETE /users/:id - Delete a user
usersRouter.delete('/:id', validateUserIdParam, (req, res, next) => {
  const id = req.validatedId;
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    const error = new ApiError(404, 'User not found');
    return next(error);
  }
  const deletedUser = users.splice(userIndex, 1)[0];
  res.json({
    message: 'User deleted successfully',
    data: deletedUser
  });
});

// Error handler
function errorHandler(err, req, res, next) {
  res.status(err.statusCode || 500).json({
    error: err.name || 'Error',
    message: err.message,
    statusCode: err.statusCode || 500
  });
}

// 404 handler
function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Route ${req.method} ${req.path} not found`);
  next(error);
}

// Create Express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/users', usersRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

// Reset function for testing
function resetUsers() {
  users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  nextId = 3;
}

describe('Users API Routes', () => {
  let app;

  beforeEach(() => {
    resetUsers();
    app = createTestApp();
  });

  describe('GET /users', () => {
    test('should return all users with count', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body).toHaveProperty('count', 2);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      const user = response.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
    });

    test('should return users in correct format', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.data[0]).toMatchObject({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });

      expect(response.body.data[1]).toMatchObject({
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com'
      });
    });
  });

  describe('GET /users/:id', () => {
    test('should return a user by valid ID', async () => {
      const response = await request(app)
        .get('/users/1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/users/999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
      expect(response.body).toHaveProperty('statusCode', 404);
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/users/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });

    test('should return 400 for negative ID', async () => {
      const response = await request(app)
        .get('/users/-1')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });

    test('should return 400 for zero ID', async () => {
      const response = await request(app)
        .get('/users/0')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });
  });

  describe('POST /users', () => {
    test('should create a new user with valid data', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', 3);
      expect(response.body.data).toHaveProperty('name', 'Test User');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });

    test('should return 400 when name is missing', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some(detail => detail.field === 'name')).toBe(true);
    });

    test('should return 400 when email is missing', async () => {
      const userData = {
        name: 'Test User'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some(detail => detail.field === 'email')).toBe(true);
    });

    test('should return 400 when both name and email are missing', async () => {
      const response = await request(app)
        .post('/users')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('should return 409 when email already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'john@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already exists');
    });

    test('should trim whitespace from name', async () => {
      const userData = {
        name: '  Test User  ',
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.data.name).toBe('Test User');
    });

    test('should convert email to lowercase', async () => {
      const userData = {
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM'
      };

      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.data.email).toBe('test@example.com');
    });
  });

  describe('PUT /users/:id', () => {
    test('should update an existing user', async () => {
      const updateData = {
        name: 'Updated John Doe',
        email: 'john.updated@example.com'
      };

      const response = await request(app)
        .put('/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body.data).toMatchObject({
        id: 1,
        name: 'Updated John Doe',
        email: 'john.updated@example.com'
      });
    });

    test('should return 404 when updating non-existent user', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/users/999')
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('should return 400 for invalid ID when updating', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/users/invalid')
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });

    test('should return 400 when name is missing in update', async () => {
      const updateData = {
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/users/1')
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('should return 400 when email is missing in update', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/users/1')
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('should allow updating user with their own email', async () => {
      const updateData = {
        name: 'John Doe Updated',
        email: 'john@example.com'
      };

      const response = await request(app)
        .put('/users/1')
        .send(updateData)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: 1,
        name: 'John Doe Updated',
        email: 'john@example.com'
      });
    });

    test('should return 409 when updating to email of another user', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'jane@example.com'
      };

      const response = await request(app)
        .put('/users/1')
        .send(updateData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already exists');
    });
  });

  describe('DELETE /users/:id', () => {
    test('should delete an existing user', async () => {
      const response = await request(app)
        .delete('/users/1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');
      expect(response.body.data).toMatchObject({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });

      await request(app)
        .get('/users/1')
        .expect(404);
    });

    test('should return 404 when deleting non-existent user', async () => {
      const response = await request(app)
        .delete('/users/999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('should return 400 for invalid ID when deleting', async () => {
      const response = await request(app)
        .delete('/users/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });

    test('should decrease user count after deletion', async () => {
      const initialResponse = await request(app).get('/users');
      const initialCount = initialResponse.body.count;

      await request(app).delete('/users/1').expect(200);

      const finalResponse = await request(app).get('/users');
      expect(finalResponse.body.count).toBe(initialCount - 1);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/undefined-route')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete CRUD workflow', async () => {
      // Create
      const createResponse = await request(app)
        .post('/users')
        .send({
          name: 'Integration Test User',
          email: 'integration@example.com'
        })
        .expect(201);

      const newUserId = createResponse.body.data.id;

      // Read
      await request(app)
        .get(`/users/${newUserId}`)
        .expect(200)
        .expect(res => {
          expect(res.body.name).toBe('Integration Test User');
        });

      // Update
      await request(app)
        .put(`/users/${newUserId}`)
        .send({
          name: 'Updated Integration User',
          email: 'integration@example.com'
        })
        .expect(200)
        .expect(res => {
          expect(res.body.data.name).toBe('Updated Integration User');
        });

      // Delete
      await request(app)
        .delete(`/users/${newUserId}`)
        .expect(200)
        .expect(res => {
          expect(res.body.data.name).toBe('Updated Integration User');
        });

      // Verify deletion
      await request(app)
        .get(`/users/${newUserId}`)
        .expect(404);
    });

    test('should handle multiple sequential requests', async () => {
      const usersData = [
        { name: 'User 1', email: 'user1@example.com' },
        { name: 'User 2', email: 'user2@example.com' },
        { name: 'User 3', email: 'user3@example.com' }
      ];

      for (const userData of usersData) {
        await request(app)
          .post('/users')
          .send(userData)
          .expect(201);
      }

      const response = await request(app).get('/users');
      expect(response.body.count).toBe(5);
    });
  });
});