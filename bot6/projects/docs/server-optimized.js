const express = require('express');
const cors = require('cors');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ 中间件优化 ============

// CORS 配置优化
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ 请求日志优化 ============
const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    req.requestId = requestId;
    
    // 响应完成时记录
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logEntry = {
            requestId,
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            ip: req.ip || req.connection?.remoteAddress
        };
        
        // 彩色日志输出
        const statusColor = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m';
        console.log(
            `${statusColor}[${logEntry.status}]\x1b[0m ${logEntry.method} ${logEntry.url} - ${logEntry.duration} [${requestId}]`
        );
    });
    
    next();
};

app.use(requestLogger);

// ============ 缓存优化 ============
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

const cacheMiddleware = (req, res, next) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
        return next();
    }
    
    const cacheKey = req.originalUrl || req.url;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        return res.set('X-Cache', 'HIT').json(cached.data);
    }
    
    // 拦截 json 方法来缓存响应
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        res.set('X-Cache', 'MISS');
        return originalJson(data);
    };
    
    next();
};

// 缓存清理定时器
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        }
    }
    if (cache.size > 0) {
        console.log(`[CACHE] 清理完成, 当前缓存: ${cache.size} 条`);
    }
}, CACHE_TTL);

app.use(cacheMiddleware);

// ============ 加载 OpenAPI 规范 ============
const specPath = path.join(__dirname, 'spec', 'openapi.yaml');
const openapiSpec = YAML.load(specPath);

// API Routes
app.get('/spec/openapi.yaml', (req, res) => {
    res.sendFile(specPath);
});

app.get('/spec/openapi.json', (req, res) => {
    res.json(openapiSpec);
});

// Mock API endpoints
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

app.get('/api/version', (req, res) => {
    res.json({
        version: '1.0.0',
        api_name: 'API Documentation System',
        environment: process.env.NODE_ENV || 'development',
        node_version: process.version,
        timestamp: new Date().toISOString()
    });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Email and password are required',
            code: 'VALIDATION_ERROR'
        });
    }

    if (password.length < 8) {
        return res.status(401).json({
            error: 'Invalid credentials',
            message: 'Password must be at least 8 characters',
            code: 'INVALID_CREDENTIALS'
        });
    }

    res.json({
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        token_type: 'Bearer',
        expires_in: 3600
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Successfully logged out' });
});

app.post('/api/auth/refresh', (req, res) => {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
        return res.status(401).json({
            error: 'Invalid refresh token',
            message: 'Refresh token is required',
            code: 'INVALID_TOKEN'
        });
    }

    res.json({
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        token_type: 'Bearer',
        expires_in: 3600
    });
});

// Users endpoints
app.get('/api/users', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const sort = req.query.sort || 'created_at';

    const users = Array.from({ length: limit }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-4466554400${i.toString().padStart(2, '0')}`,
        email: `user${i + (page - 1) * limit + 1}@example.com`,
        name: `User ${i + (page - 1) * limit + 1}`,
        role: i % 3 === 0 ? 'admin' : 'user',
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date().toISOString()
    }));

    res.json({
        data: users,
        pagination: { page, limit, total: 150, total_pages: Math.ceil(150 / limit) }
    });
});

app.post('/api/users', (req, res) => {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Email, password, and name are required',
            code: 'VALIDATION_ERROR'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Password must be at least 8 characters',
            code: 'VALIDATION_ERROR'
        });
    }

    res.status(201).json({
        id: '550e8400-e29b-41d4-a716-446655440001',
        email, name,
        role: role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
});

app.get('/api/users/:userId', (req, res) => {
    res.json({
        id: req.params.userId,
        email: 'user@example.com',
        name: 'John Doe',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
});

app.put('/api/users/:userId', (req, res) => {
    const { name, role } = req.body;
    res.json({
        id: req.params.userId,
        email: 'user@example.com',
        name: name || 'John Doe',
        role: role || 'user',
        updated_at: new Date().toISOString()
    });
});

app.delete('/api/users/:userId', (req, res) => {
    res.status(204).send();
});

// Documents endpoints
app.get('/api/documents', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || '';

    const documents = Array.from({ length: limit }, (_, i) => ({
        id: `doc_${i + 1000}`,
        title: search ? `Document about ${search} ${i + 1}` : `Document ${i + 1}`,
        content: `This is the content of document ${i + 1}.`,
        author_id: '550e8400-e29b-41d4-a716-446655440001',
        status: i % 3 === 0 ? 'draft' : 'published',
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date().toISOString()
    }));

    res.json({
        data: documents,
        pagination: { page, limit, total: 50, total_pages: Math.ceil(50 / limit) }
    });
});

app.post('/api/documents', (req, res) => {
    const { title, content, status } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Title and content are required',
            code: 'VALIDATION_ERROR'
        });
    }

    res.status(201).json({
        id: `doc_${Date.now()}`,
        title, content,
        author_id: '550e8400-e29b-41d4-a716-446655440001',
        status: status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
});

app.get('/api/documents/:documentId', (req, res) => {
    res.json({
        id: req.params.documentId,
        title: 'API Documentation',
        content: 'This is the complete API documentation content...',
        author_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
});

// ============ 错误处理优化 ============
app.use((err, req, res, next) => {
    const requestId = req.requestId || 'unknown';
    console.error(`[ERROR] ${requestId}:`, err.stack);
    
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : err.message,
        code: err.code || 'INTERNAL_ERROR',
        requestId
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `The requested resource ${req.method} ${req.url} was not found`,
        code: 'NOT_FOUND'
    });
});

// ============ 优雅关闭 ============
const gracefulShutdown = (signal) => {
    console.log(`\n[${signal}] 收到关闭信号，开始优雅关闭...`);
    
    // 关闭缓存
    cache.clear();
    console.log('[CACHE] 缓存已清空');
    
    // 关闭服务器
    server.close(() => {
        console.log('[SERVER] 所有连接已关闭');
        process.exit(0);
    });
    
    // 强制退出超时
    setTimeout(() => {
        console.error('[FORCE] 强制退出');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                           ║
║   📘 API Documentation System (Optimized)               ║
║                                                           ║
║   Server running at: http://localhost:${PORT}             ║
║   Documentation:  http://localhost:${PORT}/               ║
║   OpenAPI Spec:    http://localhost:${PORT}/spec/openapi.yaml
║   Cache:           Enabled (TTL: 5min)                  ║
║                                                           ║
╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
