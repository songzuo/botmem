/**
 * ============================================================================
 * API Documentation System - Tests
 * ============================================================================
 */

const request = require('supertest');
const app = require('../server');

const API_BASE = '/api';

describe('Health Endpoint', () => {
    test('GET /api/health should return service status', async () => {
        const res = await request(app).get(`${API_BASE}/health`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('version', '1.0.0');
    });
});

describe('Authentication Endpoints', () => {
    describe('POST /api/auth/login', () => {
        test('should return 400 if email or password is missing', async () => {
            const res1 = await request(app)
                .post(`${API_BASE}/auth/login`)
                .send({ email: 'test@example.com' });
            expect(res1.status).toBe(400);
            expect(res1.body).toHaveProperty('error', 'Validation Error');
            expect(res1.body).toHaveProperty('code', 'VALIDATION_ERROR');

            const res2 = await request(app)
                .post(`${API_BASE}/auth/login`)
                .send({ password: 'password123' });
            expect(res2.status).toBe(400);
        });

        test('should return 401 if password is too short', async () => {
            const res = await request(app)
                .post(`${API_BASE}/auth/login`)
                .send({ email: 'test@example.com', password: 'short' });
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid credentials');
            expect(res.body).toHaveProperty('code', 'INVALID_CREDENTIALS');
        });

        test('should return token with valid credentials', async () => {
            const res = await request(app)
                .post(`${API_BASE}/auth/login`)
                .send({ email: 'test@example.com', password: 'password123' });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('access_token');
            expect(res.body).toHaveProperty('token_type', 'Bearer');
            expect(res.body).toHaveProperty('expires_in', 3600);
        });
    });

    test('POST /api/auth/logout should succeed', async () => {
        const res = await request(app).post(`${API_BASE}/auth/logout`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Successfully logged out');
    });

    test('POST /api/auth/refresh should return 401 without token', async () => {
        const res = await request(app)
            .post(`${API_BASE}/auth/refresh`)
            .send({});
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid refresh token');
    });

    test('POST /api/auth/refresh should return token with valid refresh token', async () => {
        const res = await request(app)
            .post(`${API_BASE}/auth/refresh`)
            .send({ refresh_token: 'valid-refresh-token' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('token_type', 'Bearer');
        expect(res.body).toHaveProperty('expires_in', 3600);
    });
});

describe('Users Endpoints', () => {
    test('GET /api/users should return paginated users', async () => {
        const res = await request(app).get(`${API_BASE}/users`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body).toHaveProperty('pagination');
        expect(res.body.pagination).toHaveProperty('page');
        expect(res.body.pagination).toHaveProperty('limit');
        expect(res.body.pagination).toHaveProperty('total');
        expect(res.body.pagination).toHaveProperty('total_pages');
    });

    test('GET /api/users should support pagination params', async () => {
        const res = await request(app).get(`${API_BASE}/users?page=2&limit=10`);
        expect(res.status).toBe(200);
        expect(res.body.pagination.page).toBe(2);
        expect(res.body.pagination.limit).toBe(10);
        expect(res.body.data.length).toBe(10);
    });

    test('GET /api/users should support sort parameter', async () => {
        const res = await request(app).get(`${API_BASE}/users?sort=email`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
    });

    test('POST /api/users should return 400 for missing required fields', async () => {
        const res1 = await request(app)
            .post(`${API_BASE}/users`)
            .send({ email: 'test@example.com', name: 'Test User' });
        expect(res1.status).toBe(400);
        expect(res1.body).toHaveProperty('code', 'VALIDATION_ERROR');

        const res2 = await request(app)
            .post(`${API_BASE}/users`)
            .send({ password: 'password123', name: 'Test User' });
        expect(res2.status).toBe(400);

        const res3 = await request(app)
            .post(`${API_BASE}/users`)
            .send({ email: 'test@example.com', password: 'password123' });
        expect(res3.status).toBe(400);
    });

    test('POST /api/users should return 400 for short password', async () => {
        const res = await request(app)
            .post(`${API_BASE}/users`)
            .send({
                email: 'test@example.com',
                password: 'short',
                name: 'Test User'
            });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(res.body.message).toContain('8 characters');
    });

    test('POST /api/users should create new user with valid data', async () => {
        const res = await request(app)
            .post(`${API_BASE}/users`)
            .send({
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
                role: 'admin'
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email', 'newuser@example.com');
        expect(res.body).toHaveProperty('name', 'New User');
        expect(res.body).toHaveProperty('role', 'admin');
        expect(res.body).toHaveProperty('created_at');
        expect(res.body).toHaveProperty('updated_at');
    });

    test('POST /api/users should default role to user', async () => {
        const res = await request(app)
            .post(`${API_BASE}/users`)
            .send({
                email: 'defaultuser@example.com',
                password: 'password123',
                name: 'Default User'
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('role', 'user');
    });

    test('GET /api/users/:userId should return user by ID', async () => {
        const userId = '550e8400-e29b-41d4-a716-446655440001';
        const res = await request(app).get(`${API_BASE}/users/${userId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', userId);
        expect(res.body).toHaveProperty('email');
        expect(res.body).toHaveProperty('name');
        expect(res.body).toHaveProperty('role');
        expect(res.body).toHaveProperty('created_at');
        expect(res.body).toHaveProperty('updated_at');
    });

    test('PUT /api/users/:userId should update user', async () => {
        const userId = '550e8400-e29b-41d4-a716-446655440001';
        const res = await request(app)
            .put(`${API_BASE}/users/${userId}`)
            .send({
                name: 'Updated Name',
                role: 'admin'
            });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', userId);
        expect(res.body).toHaveProperty('name', 'Updated Name');
        expect(res.body).toHaveProperty('role', 'admin');
        expect(res.body).toHaveProperty('updated_at');
    });

    test('DELETE /api/users/:userId should return 204', async () => {
        const userId = '550e8400-e29b-41d4-a716-446655440001';
        const res = await request(app).delete(`${API_BASE}/users/${userId}`);
        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
    });
});

describe('Error Handling', () => {
    test('Unknown route should return 404 with error details', async () => {
        const res = await request(app).get('/unknown-route');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not Found');
        expect(res.body).toHaveProperty('code', 'NOT_FOUND');
        expect(res.body).toHaveProperty('message');
    });

    test('Non-existent API endpoint should return 404', async () => {
        const res = await request(app).get(`${API_BASE}/nonexistent`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not Found');
    });
});

describe('OpenAPI Spec Endpoints', () => {
    test('GET /spec/openapi.json should return OpenAPI spec as JSON', async () => {
        const res = await request(app).get('/spec/openapi.json');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/json');
        expect(res.body).toBeInstanceOf(Object);
    });
});