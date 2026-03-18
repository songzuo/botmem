/**
 * ============================================================================
 * Documents Endpoint Tests
 * ============================================================================
 */

const request = require('supertest');
const app = require('../server');

const API_BASE = '/api';

describe('Documents Endpoints', () => {
    describe('GET /api/documents', () => {
        test('should return paginated documents list', async () => {
            const res = await request(app).get(`${API_BASE}/documents`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.pagination).toHaveProperty('page');
            expect(res.body.pagination).toHaveProperty('limit');
            expect(res.body.pagination).toHaveProperty('total');
            expect(res.body.pagination).toHaveProperty('total_pages');
        });

        test('should return documents with correct structure', async () => {
            const res = await request(app).get(`${API_BASE}/documents`);
            expect(res.status).toBe(200);
            
            const firstDoc = res.body.data[0];
            expect(firstDoc).toHaveProperty('id');
            expect(firstDoc).toHaveProperty('title');
            expect(firstDoc).toHaveProperty('content');
            expect(firstDoc).toHaveProperty('author_id');
            expect(firstDoc).toHaveProperty('status');
            expect(firstDoc).toHaveProperty('created_at');
            expect(firstDoc).toHaveProperty('updated_at');
        });

        test('should support pagination parameters', async () => {
            const res = await request(app)
                .get(`${API_BASE}/documents?page=2&limit=10`);
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(2);
            expect(res.body.pagination.limit).toBe(10);
            expect(res.body.data.length).toBe(10);
        });

        test('should support search parameter', async () => {
            const res = await request(app)
                .get(`${API_BASE}/documents?search=api`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            
            // Check that documents contain search term in title
            const hasSearchTerm = res.body.data.some(doc => 
                doc.title.toLowerCase().includes('api')
            );
            expect(hasSearchTerm).toBe(true);
        });

        test('should default pagination when params not provided', async () => {
            const res = await request(app).get(`${API_BASE}/documents`);
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(20);
        });

        test('should return total count in pagination', async () => {
            const res = await request(app).get(`${API_BASE}/documents`);
            expect(res.status).toBe(200);
            expect(res.body.pagination.total).toBe(50);
            expect(res.body.pagination.total_pages).toBeGreaterThanOrEqual(1);
        });
    });

    describe('POST /api/documents', () => {
        test('should return 400 for missing title', async () => {
            const res = await request(app)
                .post(`${API_BASE}/documents`)
                .send({
                    content: 'This is content'
                });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Validation Error');
            expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
        });

        test('should return 400 for missing content', async () => {
            const res = await request(app)
                .post(`${API_BASE}/documents`)
                .send({
                    title: 'Test Document'
                });
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Validation Error');
            expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
        });

        test('should create new document with valid data', async () => {
            const res = await request(app)
                .post(`${API_BASE}/documents`)
                .send({
                    title: 'Test Document',
                    content: 'This is test content',
                    status: 'draft'
                });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('title', 'Test Document');
            expect(res.body).toHaveProperty('content', 'This is test content');
            expect(res.body).toHaveProperty('author_id');
            expect(res.body).toHaveProperty('status', 'draft');
            expect(res.body).toHaveProperty('created_at');
            expect(res.body).toHaveProperty('updated_at');
        });

        test('should default status to draft when not provided', async () => {
            const res = await request(app)
                .post(`${API_BASE}/documents`)
                .send({
                    title: 'Untitled Document',
                    content: 'Content goes here'
                });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('status', 'draft');
        });

        test('should accept published status', async () => {
            const res = await request(app)
                .post(`${API_BASE}/documents`)
                .send({
                    title: 'Published Document',
                    content: 'Published content',
                    status: 'published'
                });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('status', 'published');
        });
    });

    describe('GET /api/documents/:documentId', () => {
        test('should return document by ID', async () => {
            const documentId = 'doc_test_123';
            const res = await request(app).get(`${API_BASE}/documents/${documentId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id', documentId);
            expect(res.body).toHaveProperty('title');
            expect(res.body).toHaveProperty('content');
            expect(res.body).toHaveProperty('author_id');
            expect(res.body).toHaveProperty('status');
            expect(res.body).toHaveProperty('created_at');
            expect(res.body).toHaveProperty('updated_at');
        });

        test('should return valid document structure', async () => {
            const res = await request(app).get(`${API_BASE}/documents/doc_1`);
            expect(res.status).toBe(200);
            expect(typeof res.body.title).toBe('string');
            expect(typeof res.body.content).toBe('string');
            expect(typeof res.body.status).toBe('string');
        });
    });
});
