# API Documentation System

A RESTful API documentation system built with Express.js, featuring OpenAPI/Swagger integration, comprehensive endpoints, and production-ready middleware.

## Table of Contents

- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
  - [Health & Version](#health--version)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Documents](#documents)
  - [OpenAPI Spec](#openapi-spec)
- [Pagination](#-pagination)
- [Error Handling](#-error-handling)
- [Features](#-features)
- [Environment Variables](#-environment-variables)

---

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
cd /path/to/docs

# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

The server runs on `http://localhost:3000` by default.

---

## 📡 API Endpoints

### Health & Version

#### GET /api/health

Service health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600.5
}
```

#### GET /api/version

API version information.

**Response:**
```json
{
  "version": "1.0.0",
  "api_name": "API Documentation System",
  "environment": "development",
  "node_version": "v22.22.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Authentication

#### POST /api/auth/login

User login endpoint.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Email and password are required |
| 401 | `INVALID_CREDENTIALS` | Password must be at least 8 characters |

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "mypassword123"}'
```

---

#### POST /api/auth/logout

User logout endpoint.

**Success Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### POST /api/auth/refresh

Refresh access token.

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `INVALID_TOKEN` | Refresh token is required |

---

### Users

#### GET /api/users

List all users with pagination.

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number |
| `limit` | integer | 20 | 100 | Items per page |
| `sort` | string | `created_at` | - | Sort field |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user1@example.com",
      "name": "User 1",
      "role": "admin",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/users?page=1&limit=10&sort=created_at"
```

---

#### POST /api/users

Create a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "New User",
  "role": "user"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `email` | Yes | User email address |
| `password` | Yes | Password (min 8 characters) |
| `name` | Yes | User display name |
| `role` | No | User role (default: `user`) |

**Success Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Missing required fields or password too short |

**Example:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "password": "mypassword123", "name": "New User"}'
```

---

#### GET /api/users/:userId

Get a specific user by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User UUID |

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

---

#### PUT /api/users/:userId

Update a user.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User UUID |

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | No | Updated display name |
| `role` | No | Updated role |

**Success Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "Updated Name",
  "role": "admin",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
```

---

#### DELETE /api/users/:userId

Delete a user.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User UUID |

**Success Response:** `204 No Content`

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/users/550e8400-e29b-41d4-a716-446655440000
```

---

### Documents

#### GET /api/documents

List all documents with pagination and search.

**Query Parameters:**

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Page number |
| `limit` | integer | 20 | 100 | Items per page |
| `search` | string | - | - | Search keyword |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "doc_1000",
      "title": "Document 1",
      "content": "This is the content of document 1...",
      "author_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "published",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/documents?page=1&limit=10&search=api"
```

---

#### POST /api/documents

Create a new document.

**Request Body:**
```json
{
  "title": "My Document",
  "content": "Document content here...",
  "status": "draft"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Document title |
| `content` | Yes | Document content |
| `status` | No | Document status (`draft` or `published`, default: `draft`) |

**Success Response (201):**
```json
{
  "id": "doc_1705315800000",
  "title": "My Document",
  "content": "Document content here...",
  "author_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "draft",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Title and content are required |

**Example:**
```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title": "My Doc", "content": "Content here"}'
```

---

#### GET /api/documents/:documentId

Get a specific document by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `documentId` | string | Document ID |

**Success Response (200):**
```json
{
  "id": "doc_1000",
  "title": "API Documentation",
  "content": "This is the complete API documentation content...",
  "author_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "published",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:3000/api/documents/doc_1000
```

---

### OpenAPI Spec

#### GET /spec/openapi.yaml

Returns the OpenAPI specification in YAML format.

**Response:** `text/yaml`

**Example:**
```bash
curl http://localhost:3000/spec/openapi.yaml
```

---

#### GET /spec/openapi.json

Returns the OpenAPI specification in JSON format.

**Response:** `application/json`

**Example:**
```bash
curl http://localhost:3000/spec/openapi.json
```

---

## 📄 Pagination

All list endpoints support pagination with the following parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | - | Current page number (min: 1) |
| `limit` | integer | 20 | 100 | Items per page (min: 1, max: 100) |

### Pagination Response Format

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `page` | integer | Current page number |
| `limit` | integer | Items per page |
| `total` | integer | Total number of items |
| `total_pages` | integer | Total number of pages |

### Example Requests

```bash
# Get first page with 10 items
GET /api/users?page=1&limit=10

# Get second page
GET /api/users?page=2&limit=10

# Get all documents (max 100)
GET /api/documents?limit=100
```

---

## ⚠️ Error Handling

All error responses follow a consistent format:

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Missing or invalid request parameters |
| 400 | `INVALID_JSON` | Malformed JSON in request body |
| 401 | `INVALID_CREDENTIALS` | Invalid login credentials |
| 401 | `INVALID_TOKEN` | Invalid or missing authentication token |
| 401 | `UNAUTHORIZED` | Authentication required |
| 404 | `NOT_FOUND` | Requested resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Internal server error |

### Example Error Responses

**Validation Error (400):**
```json
{
  "error": "Validation Error",
  "message": "Missing required fields: email, password",
  "code": "VALIDATION_ERROR"
}
```

**Not Found (404):**
```json
{
  "error": "Not Found",
  "message": "The requested resource GET /api/unknown was not found",
  "code": "NOT_FOUND"
}
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## 📦 Features

| Feature | Description |
|---------|-------------|
| 🔒 **Security** | Helmet.js security headers |
| ⏱️ **Rate Limiting** | 100 requests per 15 minutes per IP |
| 🗜️ **Compression** | Gzip response compression |
| 🔍 **Request Tracking** | Unique request ID (`X-Request-ID` header) |
| 📝 **Logging** | Request duration and status logging |
| 📄 **Pagination** | Consistent pagination across all list endpoints |
| ⚠️ **Error Handling** | Structured error responses with codes |
| 🌐 **CORS** | Cross-origin resource sharing support |
| 🛡️ **Graceful Shutdown** | SIGTERM/SIGINT handling for clean server shutdown |

---

## 🌍 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`) |
| `CORS_ORIGIN` | `*` | CORS allowed origin |

### Example .env File

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

---

## 📝 Response Headers

Every response includes the following headers:

| Header | Description |
|--------|-------------|
| `X-Request-ID` | Unique identifier for request tracking |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-XSS-Protection` | `0` |
| `Content-Type` | `application/json; charset=utf-8` |

---

## 📄 License

MIT
