// User API Tests

const assert = require('assert');

// Mock the users router for testing
const { router, users, resetUsers } = require('./routes/users');

// Simple test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    resetUsers();
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Test: GET /users returns all users
test('GET /users returns all users', () => {
  const mockReq = {};
  const mockRes = {
    json: function(data) {
      assert.strictEqual(data.length, 2);
    }
  };
  router.stack[0].route.stack[0].handle(mockReq, mockRes);
});

// Test: POST /users creates new user
test('POST /users creates new user', () => {
  const mockReq = { body: { name: 'Test User', email: 'test@example.com' } };
  const mockRes = {
    status: function(code) {
      assert.strictEqual(code, 201);
      return this;
    },
    json: function(data) {
      assert.strictEqual(data.name, 'Test User');
      assert.strictEqual(data.email, 'test@example.com');
    }
  };
  router.stack[2].route.stack[0].handle(mockReq, mockRes);
});

// Test: POST /users validates required fields
test('POST /users validates required fields', () => {
  const mockReq = { body: { name: 'Test' } };
  const mockRes = {
    status: function(code) {
      assert.strictEqual(code, 400);
      return this;
    },
    json: function(data) {
      assert.strictEqual(data.error, 'Name and email are required');
    }
  };
  router.stack[2].route.stack[0].handle(mockReq, mockRes);
});

// Test: POST /users validates unique email
test('POST /users validates unique email', () => {
  const mockReq = { body: { name: 'Test', email: 'john@example.com' } };
  const mockRes = {
    status: function(code) {
      assert.strictEqual(code, 400);
      return this;
    },
    json: function(data) {
      assert.strictEqual(data.error, 'Email already exists');
    }
  };
  router.stack[2].route.stack[0].handle(mockReq, mockRes);
});

// Test: GET /users/:id returns user by id
test('GET /users/:id returns user by id', () => {
  const mockReq = { params: { id: '1' } };
  const mockRes = {
    json: function(data) {
      assert.strictEqual(data.name, 'John Doe');
    }
  };
  router.stack[1].route.stack[0].handle(mockReq, mockRes);
});

// Test: GET /users/:id returns 404 for non-existent user
test('GET /users/:id returns 404 for non-existent user', () => {
  const mockReq = { params: { id: '999' } };
  const mockRes = {
    status: function(code) {
      assert.strictEqual(code, 404);
      return this;
    },
    json: function(data) {
      assert.strictEqual(data.error, 'User not found');
    }
  };
  router.stack[1].route.stack[0].handle(mockReq, mockRes);
});

// Test: PUT /users/:id updates user
test('PUT /users/:id updates user', () => {
  const mockReq = { params: { id: '1' }, body: { name: 'Updated Name', email: 'updated@example.com' } };
  const mockRes = {
    json: function(data) {
      assert.strictEqual(data.name, 'Updated Name');
      assert.strictEqual(data.email, 'updated@example.com');
    }
  };
  router.stack[3].route.stack[0].handle(mockReq, mockRes);
});

// Test: DELETE /users/:id deletes user
test('DELETE /users/:id deletes user', () => {
  const mockReq = { params: { id: '1' } };
  const mockRes = {
    json: function(data) {
      assert.strictEqual(data.name, 'John Doe');
      assert.strictEqual(users.length, 1);
    }
  };
  router.stack[4].route.stack[0].handle(mockReq, mockRes);
});

// Summary
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
