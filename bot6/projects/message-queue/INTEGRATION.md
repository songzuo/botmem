# Message Queue Integration Guide for bot6

This guide explains how to integrate the message queue module into the existing bot6 user-api.

## Overview

The message queue module can help bot6:
- Handle asynchronous tasks (emails, notifications, reports)
- Process background jobs without blocking API responses
- Manage task priorities and retries
- Scale with multiple worker processes

## Step-by-Step Integration

### 1. Copy the Message Queue Module

```bash
cd /root/.openclaw/workspace/bot6/user-api
cp -r ../projects/message-queue .
```

### 2. Install Dependencies

```bash
cd /root/.openclaw/workspace/bot6/user-api
npm install redis
```

Or update `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "redis": "^4.6.12"
  }
}
```

### 3. Update server.js to Use the Queue

Here's how to modify `/root/.openclaw/workspace/bot6/user-api/server.js`:

```javascript
const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Message Queue
const MessageQueue = require('./message-queue/index');

// Configure queue (use Redis in production, memory for development)
const taskQueue = new MessageQueue({
  type: process.env.QUEUE_TYPE || 'memory', // Set 'redis' for production
  maxRetries: 3,
  retryDelay: 1000,
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    db: parseInt(process.env.REDIS_DB) || 0
  }
});

// In-memory storage for users
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

let nextId = 3;

// Register Task Handlers
taskQueue.registerHandler('user-welcome-email', async (payload) => {
  console.log(`Sending welcome email to ${payload.email}`);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Here you would integrate with your email service
  // const result = await emailService.sendWelcomeEmail(payload.email, payload.name);
  
  console.log(`Welcome email sent to ${payload.email}`);
  return { success: true, email: payload.email };
});

taskQueue.registerHandler('user-notification', async (payload) => {
  console.log(`Sending notification to ${payload.userId}: ${payload.message}`);
  
  // Simulate notification sending
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Here you would integrate with your notification service
  // await notificationService.send(payload.userId, payload.message);
  
  console.log(`Notification sent to user ${payload.userId}`);
  return { success: true, userId: payload.userId };
});

taskQueue.registerHandler('user-report', async (payload) => {
  console.log(`Generating user report: ${payload.reportType}`);
  
  // Simulate report generation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Here you would generate the actual report
  // const report = await reportService.generate(payload);
  
  console.log(`Report generated: ${payload.reportType}`);
  return { success: true, reportUrl: `/reports/${payload.reportType}.pdf` };
});

// Initialize queue on startup
let queueInitialized = false;
async function initializeQueue() {
  if (!queueInitialized) {
    try {
      await taskQueue.initialize();
      queueInitialized = true;
      console.log('✅ Message queue initialized');
    } catch (error) {
      console.error('❌ Failed to initialize message queue:', error.message);
      console.log('Continuing without queue (some features may be limited)');
    }
  }
}

// GET /users - Retrieve all users
app.get('/users', async (req, res) => {
  await initializeQueue();
  res.json(users);
});

// GET /users/:id - Retrieve a specific user by ID
app.get('/users/:id', async (req, res) => {
  await initializeQueue();
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// POST /users - Create a new user
app.post('/users', async (req, res) => {
  await initializeQueue();
  const { name, email } = req.body;
  
  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const newUser = {
    id: nextId++,
    name,
    email
  };
  
  users.push(newUser);
  
  // Queue welcome email (non-blocking)
  if (queueInitialized) {
    taskQueue.add('user-welcome-email', {
      email: newUser.email,
      name: newUser.name
    }, { priority: 'normal' }).catch(err => {
      console.error('Failed to queue welcome email:', err);
    });
  }
  
  res.status(201).json(newUser);
});

// PUT /users/:id - Update an existing user
app.put('/users/:id', async (req, res) => {
  await initializeQueue();
  const id = parseInt(req.params.id);
  const { name, email } = req.body;
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Basic validation
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  // Check if email already exists (excluding current user)
  if (users.some(u => u.email === email && u.id !== id)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const oldUser = users[userIndex];
  users[userIndex] = { id, name, email };
  
  // Queue notification if email changed
  if (queueInitialized && oldUser.email !== email) {
    taskQueue.add('user-notification', {
      userId: id,
      message: 'Your email address has been updated'
    }, { priority: 'normal' }).catch(err => {
      console.error('Failed to queue notification:', err);
    });
  }
  
  res.json(users[userIndex]);
});

// DELETE /users/:id - Delete a user
app.delete('/users/:id', async (req, res) => {
  await initializeQueue();
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  // Queue notification about deletion (for audit purposes)
  if (queueInitialized) {
    taskQueue.add('user-notification', {
      userId: id,
      message: 'Your account has been deleted'
    }, { priority: 'low' }).catch(err => {
      console.error('Failed to queue notification:', err);
    });
  }
  
  res.json(deletedUser);
});

// NEW: Queue Statistics Endpoint
app.get('/queue/stats', async (req, res) => {
  if (!queueInitialized) {
    return res.status(503).json({ error: 'Queue not initialized' });
  }
  
  const stats = await taskQueue.getStats();
  res.json(stats);
});

// NEW: Queue History Endpoint
app.get('/queue/history', async (req, res) => {
  if (!queueInitialized) {
    return res.status(503).json({ error: 'Queue not initialized' });
  }
  
  const limit = parseInt(req.query.limit) || 50;
  const history = await taskQueue.getHistory(limit);
  res.json(history);
});

// NEW: Trigger Report Generation
app.post('/queue/report', async (req, res) => {
  if (!queueInitialized) {
    return res.status(503).json({ error: 'Queue not initialized' });
  }
  
  const { reportType } = req.body;
  
  if (!reportType) {
    return res.status(400).json({ error: 'reportType is required' });
  }
  
  const taskId = await taskQueue.add('user-report', {
    reportType
  }, { priority: 'low' });
  
  res.status(202).json({
    message: 'Report generation queued',
    taskId
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (queueInitialized) {
    await taskQueue.stop();
    await taskQueue.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (queueInitialized) {
    await taskQueue.stop();
    await taskQueue.close();
  }
  process.exit(0);
});

// Start the server
app.listen(port, () => {
  console.log(`User management API running at http://localhost:${port}`);
  console.log('Message queue integration enabled');
});

module.exports = app;
```

### 4. Update package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "dev:with-redis": "QUEUE_TYPE=redis nodemon server.js"
  }
}
```

### 5. Create Environment Variables File

Create `.env` in `/root/.openclaw/workspace/bot6/user-api/`:

```env
# Queue Configuration
QUEUE_TYPE=memory  # Set to 'redis' for production

# Redis Configuration (if QUEUE_TYPE=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### 6. Test the Integration

Start the server:

```bash
cd /root/.openclaw/workspace/bot6/user-api
npm start
```

Test creating a user (will queue welcome email):

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com"}'
```

Check queue statistics:

```bash
curl http://localhost:3000/queue/stats
```

Generate a report:

```bash
curl -X POST http://localhost:3000/queue/report \
  -H "Content-Type: application/json" \
  -d '{"reportType": "user-activity"}'
```

## Production Deployment with Redis

### 1. Install Redis

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Configure for Redis

Update `.env`:

```env
QUEUE_TYPE=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### 3. Run Multiple Workers

For high-load scenarios, run multiple worker processes:

```bash
# Worker 1
QUEUE_TYPE=redis node ../projects/message-queue/examples/worker.js 1 &

# Worker 2
QUEUE_TYPE=redis node ../projects/message-queue/examples/worker.js 2 &

# Worker 3
QUEUE_TYPE=redis node ../projects/message-queue/examples/worker.js 3 &
```

## Monitoring

### Add Health Check Endpoint

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    queue: queueInitialized ? 'connected' : 'disconnected',
    uptime: process.uptime()
  };
  
  if (queueInitialized) {
    const stats = await taskQueue.getStats();
    health.queueStats = stats;
  }
  
  res.json(health);
});
```

### Monitor Queue Depth

Set up periodic monitoring:

```javascript
// Monitor queue every 60 seconds
setInterval(async () => {
  if (!queueInitialized) return;
  
  const stats = await taskQueue.getStats();
  
  if (stats.totalQueued > 100) {
    console.warn(`⚠️ Queue backlog: ${stats.totalQueued} tasks`);
    // Send alert or scale workers
  }
}, 60000);
```

## Common Use Cases

### 1. Welcome Emails

```javascript
// POST /users
const newUser = await createUser(req.body);
await taskQueue.add('user-welcome-email', {
  email: newUser.email,
  name: newUser.name
});
```

### 2. Password Reset Emails

```javascript
app.post('/users/reset-password', async (req, res) => {
  const { email } = req.body;
  const token = generateResetToken();
  
  await saveResetToken(email, token);
  
  // Queue email (high priority - user waiting)
  await taskQueue.add('user-password-reset', {
    email,
    token
  }, { priority: 'high' });
  
  res.json({ message: 'Password reset email sent' });
});
```

### 3. Data Export

```javascript
app.post('/export/users', async (req, res) => {
  const { format } = req.body;
  
  // Queue export task (low priority - background)
  const taskId = await taskQueue.add('export-users', {
    format,
    userId: req.user.id
  }, { priority: 'low' });
  
  res.status(202).json({
    message: 'Export queued',
    taskId
  });
});
```

### 4. Analytics Reports

```javascript
app.post('/reports/analytics', async (req, res) => {
  const { dateRange, metrics } = req.body;
  
  const taskId = await taskQueue.add('generate-analytics', {
    dateRange,
    metrics
  }, { priority: 'normal' });
  
  res.status(202).json({
    message: 'Report generation started',
    taskId
  });
});
```

## Troubleshooting

### Queue Not Initialized

If you see "Queue not initialized" errors:

1. Check Redis is running: `redis-cli ping`
2. Verify environment variables: `QUEUE_TYPE=redis`
3. Check connection: `redis-cli -h localhost -p 6379`

### Tasks Not Processing

1. Check if handlers are registered
2. Verify task types match handler names
3. Check queue processing is active
4. Review error logs

### High Queue Backlog

1. Scale workers (add more processes)
2. Increase task priority for urgent tasks
3. Optimize handler performance
4. Consider batching similar tasks

## Benefits

✅ **Non-blocking API**: Fast responses, background processing
✅ **Automatic Retries**: Handle transient failures gracefully
✅ **Priority System**: Important tasks first
✅ **Scalability**: Multiple workers, distributed processing
✅ **Monitoring**: Track queue health and performance
✅ **Reliability**: Persistent storage with Redis

## Next Steps

1. Implement the integration following this guide
2. Test with the provided examples
3. Add custom task handlers for your use cases
4. Set up monitoring and alerting
5. Deploy with Redis for production
6. Scale workers based on load

---

For more details, see the main README in `/root/.openclaw/workspace/bot6/projects/message-queue/README.md`