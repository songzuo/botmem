/**
 * ============================================================================
 * API Documentation System - Tests
 * ============================================================================
 */

const request = require('supertest');
const app = require('./server');

const API_BASE = '/api';

describe('Health & Version Endpoints', () => {
    test('GET /api/health should return service status', async () => {
        const res = await request(app).get(`${API_BASE}/health`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('version');
        expect(res.body).toHaveProperty('uptime');
    });

    test('GET /api/version should return API version info', async () => {
        const res = await request(app).get(`${API_BASE}/version`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('version');
        expect(res.body).toHaveProperty('api_name');
        expect(res.body).toHaveProperty('environment');
    });
});

describe('Authentication Endpoints', () => {
    test('POST /api/auth/login should return 400 if missing credentials', async () => {
        const res = await request(app)
            .post(`${API_BASE}/auth/login`)
            .send({ email: 'test@example.com' });
        expect(res.status).toBe(400);
    });

    test('POST /api/auth/login should return token with valid credentials', async () => {
        const res = await request(app)
            .post(`${API_BASE}/auth/login`)
            .send({ email: 'test@example.com', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('access_token');
    });

    test('POST /api/auth/logout should succeed', async () => {
        const res = await request(app).post(`${API_BASE}/auth/logout`);
        expect(res.status).toBe(200);
    });
});

describe('Users Endpoints', () => {
    test('GET /api/users should return paginated users', async () => {
        const res = await request(app).get(`${API_BASE}/users`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
    });

    test('GET /api/users should support pagination params', async () => {
        const res = await request(app).get(`${API_BASE}/users?page=2&limit=10`);
        expect(res.status).toBe(200);
        expect(res.body.pagination.page).toBe(2);
        expect(res.body.pagination.limit).toBe(10);
    });

    test('POST /api/users should create new user', async () => {
        const res = await request(app)
            .post(`${API_BASE}/users`)
            .send({ 
                email: 'newuser@example.com', 
                password: 'password123', 
                name: 'New User' 
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    test('GET /api/users/:userId should return user by ID', async () => {
        const res = await request(app).get(`${API_BASE}/users/123`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
    });
});

describe('Documents Endpoints', () => {
    test('GET /api/documents should return paginated documents', async () => {
        const res = await request(app).get(`${API_BASE}/documents`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
    });

    test('POST /api/documents should create new document', async () => {
        const res = await request(app)
            .post(`${API_BASE}/documents`)
            .send({ 
                title: 'Test Document', 
                content: 'Test content here' 
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });
});

describe('Error Handling', () => {
    test('Unknown route should return 404', async () => {
        const res = await request(app).get('/unknown-route');
        expect(res.status).toBe(404);
    });
});
