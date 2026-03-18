# Message Queue Module for bot6

A flexible message queue integration module that supports both in-memory and Redis backends for bot6's AI team management platform.

## Features

- 🚀 **Dual Backend Support**: In-memory (for development) and Redis (for production)
- 🎯 **Task Priority System**: High, Normal, and Low priority task queues
- 🔄 **Automatic Retry**: Configurable retry logic with exponential backoff
- 💀 **Dead Letter Queue (DLQ)**: Failed tasks are automatically moved to DLQ after max retries
- 📊 **Statistics & Monitoring**: Real-time queue statistics and task history
- 🔁 **DLQ Reprocessing**: Ability to reprocess failed messages from DLQ
- ⚡ **Worker Support**: Multiple worker processes can share the same queue
- 🔌 **Easy Integration**: Simple API for adding tasks and registering handlers

## Installation

```bash
cd /root/.openclaw/workspace/bot6/projects/message-queue
npm install
```

## Quick Start

### In-Memory Queue (Simple)

```javascript
const MessageQueue = require('./index');

async function main() {
  // Create queue with in-memory storage
  const queue = new MessageQueue({ type: 'memory' });
  await queue.initialize();

  // Register a task handler
  queue.registerHandler('send-email', async (payload) => {
    console.log(`Sending email to ${payload.to}`);
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  });

  // Add task to queue
  await queue.add('send-email', {
    to: 'user@example.com',
    subject: 'Welcome!'
  });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Cleanup
  await queue.close();
}

main();
```

### Redis Queue (Production)

```javascript
const MessageQueue = require('./index');

async function main() {
  // Create queue with Redis backend
  const queue = new MessageQueue({
    type: 'redis',
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0
    }
  });
  await queue.initialize();

  // Register handlers and add tasks...
  
  await queue.close();
}
```

## API Reference

### Constructor Options

```javascript
const queue = new MessageQueue({
  type: 'memory',           // 'memory' or 'redis'
  maxRetries: 3,            // Maximum retry attempts
  retryDelay: 1000,         // Delay between retries (ms)
  redis: {                  // Redis configuration (only if type='redis')
    host: 'localhost',
    port: 6379,
    db: 0
  }
});
```

### Methods

#### `initialize()`

Initialize the queue and establish connections.

```javascript
await queue.initialize();
```

#### `registerHandler(taskType, handler)`

Register a handler function for a specific task type.

```javascript
queue.registerHandler('send-email', async (payload) => {
  // Process the task
  const result = await sendEmail(payload.to, payload.subject, payload.body);
  return { success: true, messageId: result.id };
});
```

**Parameters:**
- `taskType` (string): Unique identifier for the task type
- `handler` (function): Async function that processes the task payload

**Returns:** void

#### `add(type, payload, options)`

Add a task to the queue.

```javascript
const taskId = await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome!'
}, {
  priority: 'high',      // 'low', 'normal', or 'high' (default: 'normal')
  maxRetries: 2          // Override default retry count
});
```

**Parameters:**
- `type` (string): Task type (must have a registered handler)
- `payload` (object): Task data
- `options` (object): Optional settings
  - `priority` (string): Task priority
  - `maxRetries` (number): Maximum retry attempts

**Returns:** Promise\<string\> - Task ID

#### `startProcessing()`

Start processing tasks from the queue. Automatically called when first task is added.

```javascript
await queue.startProcessing();
```

#### `stop()`

Stop processing tasks.

```javascript
queue.stop();
```

#### `getStats()`

Get current queue statistics.

```javascript
const stats = await queue.getStats();
console.log(stats);
// {
//   type: 'memory',
//   totalQueued: 5,
//   byPriority: { high: 2, normal: 2, low: 1 }
// }
```

**Returns:** Promise\<object\> - Queue statistics

#### `getHistory(limit)`

Get recent task history.

```javascript
const history = await queue.getHistory(50);
console.log(history);
// [
//   {
//     id: '1710654321000-abc123',
//     type: 'send-email',
//     status: 'completed',
//     createdAt: '2024-03-17T10:00:00.000Z',
//     completedAt: '2024-03-17T10:00:01.000Z',
//     result: { success: true, messageId: 'msg-123' }
//   }
// ]
```

**Parameters:**
- `limit` (number): Maximum number of history items to return (default: 50)

**Returns:** Promise\<array\> - Task history

#### `getDeadLetterMessages(limit)`

Get dead lettered messages from the Dead Letter Queue.

```javascript
const dlqMessages = await queue.getDeadLetterMessages();
console.log(dlqMessages);
// [
//   {
//     id: '1710654321000-xyz789',
//     type: 'send-email',
//     status: 'dead-lettered',
//     error: 'SMTP server error',
//     retries: 3,
//     maxRetries: 3,
//     createdAt: '2024-03-17T10:00:00.000Z',
//     failedAt: '2024-03-17T10:00:05.000Z',
//     payload: { to: 'user@example.com', subject: 'Hello' }
//   }
// ]
```

**Parameters:**
- `limit` (number): Maximum number of DLQ messages to return (default: 50)

**Returns:** Promise\<array\> - Dead lettered messages

#### `reprocessDeadLetterMessage(taskId)`

Reprocess a specific task from the Dead Letter Queue.

```javascript
try {
  const task = await queue.reprocessDeadLetterMessage('1710654321000-xyz789');
  console.log(`Task ${task.id} reprocessing initiated`);
} catch (error) {
  console.error('Failed to reprocess task:', error.message);
}
```

**Parameters:**
- `taskId` (string): ID of the task to reprocess

**Returns:** Promise\<object\> - The reprocessed task

**Throws:** Error if task not found in DLQ

#### `clear()`

Clear all tasks from the queue.

```javascript
await queue.clear();
```

#### `close()`

Close the queue and clean up resources.

```javascript
await queue.close();
```

#### `startHttpServer(port)`

Start an HTTP server with health check endpoints for monitoring and load balancer integration.

```javascript
await queue.startHttpServer(3000);
```

**Parameters:**
- `port` (number): Port number for the HTTP server (default: 3000)

**Returns:** Promise\<void\>

#### `stopHttpServer()`

Stop the HTTP server.

```javascript
await queue.stopHttpServer();
```

**Returns:** Promise\<void\>

## Health Check Endpoints

The MessageQueue module provides built-in HTTP health check endpoints when you start the HTTP server:

### Starting the HTTP Server

```javascript
const queue = new MessageQueue({ type: 'memory' });
await queue.initialize();

// Start processing and HTTP server
queue.startProcessing();
await queue.startHttpServer(3000);
```

### GET `/health`

Basic health check endpoint for monitoring systems.

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-17T10:00:00.000Z",
  "uptime": "1h 23m 45s",
  "uptimeMs": 5025000
}
```

### GET `/metrics`

Comprehensive queue statistics endpoint for monitoring dashboards.

```bash
curl http://localhost:3000/metrics
```

**Response:**
```json
{
  "queue": {
    "type": "memory",
    "totalQueued": 5,
    "byPriority": {
      "high": 2,
      "normal": 3,
      "low": 0
    }
  },
  "deadLetterQueue": {
    "count": 1
  },
  "history": {
    "count": 100
  },
  "tasks": {
    "processed": 500,
    "failed": 2,
    "retried": 5,
    "deadLettered": 1
  },
  "performance": {
    "avgProcessingTimeMs": 150,
    "processingRatePerSec": 12.5,
    "uptime": "1h 23m 45s",
    "uptimeMs": 5025000
  },
  "config": {
    "type": "memory",
    "maxRetries": 3,
    "retryDelay": 1000
  }
}
```

### GET `/ping`

Simple PONG response for load balancer health checks.

```bash
curl http://localhost:3000/ping
```

**Response:**
```
PONG
```

### Using with Load Balancers

The `/ping` endpoint is optimized for load balancer health checks:

```bash
# Configure your load balancer to poll this endpoint
curl -I http://localhost:3000/ping
```

The endpoint returns HTTP 200 with a simple "PONG" response, making it perfect for frequent health check polling without overhead.

### Example: Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:3000/ping || exit 1
```

### Example: Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /ping
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Monitoring with Prometheus

You can use the `/metrics` endpoint with Prometheus exporters:

```javascript
const { createGauge } = require('prom-client');

const queueSizeGauge = createGauge({
  name: 'message_queue_size',
  help: 'Number of tasks in queue'
});

// Periodically poll /metrics and update gauges
setInterval(async () => {
  const metrics = await fetch('http://localhost:3000/metrics').then(r => r.json());
  queueSizeGauge.set(metrics.queue.totalQueued);
}, 5000);
```

## Task Lifecycle

1. **Created**: Task is created with a unique ID
2. **Queued**: Task is added to the queue with priority
3. **Processing**: Task is being processed by a handler
4. **Completed**: Task finished successfully
5. **Retrying**: Task failed and is being retried
6. **Dead-Lettered**: Task failed after all retry attempts and moved to DLQ

## Priority System

Tasks are processed based on priority:

1. **High** - Processed first
2. **Normal** - Processed after high priority tasks
3. **Low** - Processed last

## Error Handling & Retries

Tasks that fail are automatically retried:

```javascript
const queue = new MessageQueue({
  maxRetries: 3,        // Retry up to 3 times
  retryDelay: 1000      // Wait 1 second between retries
});
```

Handler errors are caught and logged. After max retries, the task is marked as failed and moved to the Dead Letter Queue.

## Dead Letter Queue (DLQ)

The Dead Letter Queue captures tasks that have failed after all retry attempts. This allows you to:

1. **Monitor Failed Tasks**: Review and analyze why tasks failed
2. **Debug Issues**: Investigate error patterns and root causes
3. **Reprocess Tasks**: Fix underlying issues and reprocess failed messages

### Configuration

```javascript
const queue = new MessageQueue({
  maxRetries: 3,        // Maximum retry attempts before DLQ
  retryDelay: 1000      // Delay between retries (ms)
});
```

### Getting Dead Letter Messages

```javascript
// Get all dead lettered messages
const dlqMessages = await queue.getDeadLetterMessages();
console.log(dlqMessages);
// [
//   {
//     id: '1710654321000-xyz789',
//     type: 'send-email',
//     status: 'dead-lettered',
//     error: 'SMTP server error',
//     retries: 3,
//     maxRetries: 3,
//     createdAt: '2024-03-17T10:00:00.000Z',
//     failedAt: '2024-03-17T10:00:05.000Z',
//     retryAttempts: 3,
//     payload: { to: 'user@example.com', subject: 'Hello' }
//   }
// ]

// Get limited number of messages
const recentFailures = await queue.getDeadLetterMessages(10);
```

### Reprocessing Dead Letter Messages

```javascript
// Reprocess a single task from DLQ
try {
  const task = await queue.reprocessDeadLetterMessage('1710654321000-xyz789');
  console.log(`Task ${task.id} reprocessing initiated`);
} catch (error) {
  console.error('Failed to reprocess task:', error.message);
}
```

When a task is reprocessed:
- It's removed from the DLQ
- Retry counter is reset to 0
- Task status is reset to 'queued'
- Task is added back to the main queue with original priority
- A `reprocessedAt` timestamp is added

### DLQ Task Structure

```javascript
{
  id: '1710654321000-abc123',
  type: 'send-email',
  payload: { /* original task data */ },
  priority: 'normal',
  status: 'dead-lettered',        // Indicates it's in DLQ
  error: 'SMTP connection error', // Last error message
  retries: 3,                     // Number of retry attempts
  maxRetries: 3,                  // Configured max retries
  retryAttempts: 3,               // Same as retries
  createdAt: '2024-03-17T10:00:00.000Z',
  failedAt: '2024-03-17T10:00:05.000Z'   // When it entered DLQ
}
```

### Using the API Server

The included API server provides HTTP endpoints for DLQ operations:

```javascript
// Start the API server
QUEUE_TYPE=memory node examples/api-server.js
```

**Available endpoints:**

```bash
# Get dead lettered messages
GET /api/dlq?limit=50

# Reprocess a specific task
POST /api/dlq/:taskId/reprocess

# Add a new task (will go to DLQ if it fails)
POST /api/tasks
{
  "type": "send-email",
  "payload": { "to": "user@example.com", "subject": "Hello" },
  "options": { "priority": "high" }
}
```

**Example:**

```bash
# Get all DLQ messages
curl http://localhost:3000/api/dlq

# Reprocess a failed task
curl -X POST http://localhost:3000/api/dlq/1710654321000-abc123/reprocess

# Add a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"type":"send-email","payload":{"to":"user@example.com"}}'
```

### Best Practices for DLQ

1. **Monitor DLQ Size**: Set up alerts if DLQ grows too large
   ```javascript
   setInterval(async () => {
     const dlq = await queue.getDeadLetterMessages();
     if (dlq.length > 100) {
       console.warn(`DLQ has ${dlq.length} messages - investigate!`);
     }
   }, 60000);
   ```

2. **Analyze Failure Patterns**: Look for common error types
   ```javascript
   const dlq = await queue.getDeadLetterMessages();
   const errorTypes = dlq.reduce((acc, task) => {
     acc[task.error] = (acc[task.error] || 0) + 1;
     return acc;
   }, {});
   console.log('Error distribution:', errorTypes);
   ```

3. **Reprocess in Batches**: Handle large DLQs carefully
   ```javascript
   const dlq = await queue.getDeadLetterMessages();
   for (const task of dlq) {
     try {
       await queue.reprocessDeadLetterMessage(task.id);
       await new Promise(r => setTimeout(r, 1000)); // Throttle
     } catch (error) {
       console.error(`Failed to reprocess ${task.id}:`, error);
     }
   }
   ```

4. **Set Appropriate Retry Limits**: Balance between resilience and resource usage
   - **Transient errors** (network timeouts): Higher retry count (3-5)
   - **Permanent errors** (invalid data): Lower retry count (1-2)
   - **Resource-intensive tasks**: Lower retry count to avoid waste

## Use Cases

### 1. Email Notifications

```javascript
queue.registerHandler('send-email', async (payload) => {
  const { to, subject, body } = payload;
  const result = await emailService.send(to, subject, body);
  return { success: true, messageId: result.id };
});

await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome to bot6!',
  body: 'Hello from the AI team!'
}, { priority: 'normal' });
```

### 2. Image Processing

```javascript
queue.registerHandler('process-image', async (payload) => {
  const { filename, operations } = payload;
  let image = await loadImage(filename);
  
  for (const op of operations) {
    image = await applyOperation(image, op);
  }
  
  const resultPath = await saveImage(image);
  return { success: true, path: resultPath };
});

await queue.add('process-image', {
  filename: 'avatar.png',
  operations: ['resize', 'compress', 'optimize']
}, { priority: 'low' });
```

### 3. Data Synchronization

```javascript
queue.registerHandler('sync-data', async (payload) => {
  const { source, destination, records } = payload;
  
  for (const record of records) {
    await syncRecord(record, destination);
  }
  
  return { success: true, synced: records.length };
});

await queue.add('sync-data', {
  source: 'database',
  destination: 'cache',
  records: userData
}, { priority: 'high' });
```

## Worker Processes

Run multiple worker processes to handle tasks in parallel:

```bash
# Worker 1
QUEUE_TYPE=redis node examples/worker.js 1

# Worker 2
QUEUE_TYPE=redis node examples/worker.js 2

# Worker 3
QUEUE_TYPE=redis node examples/worker.js 3
```

Each worker will:
- Connect to the same Redis queue
- Process tasks independently
- Handle errors and retries automatically

## Testing

Run the test suite:

```bash
npm test
```

Run specific examples:

```bash
# In-memory example
npm run example:in-memory

# Redis example (requires Redis server)
npm run example:redis

# Worker example
npm run example:worker
```

## Best Practices

### 1. Use Redis for Production

Redis provides:
- Persistent storage across restarts
- Distributed processing
- Better performance for high volumes

### 2. Set Appropriate Priorities

- **High**: User-facing tasks (emails, notifications)
- **Normal**: Background processing (data sync, reports)
- **Low**: Non-urgent tasks (logs, cleanup)

### 3. Handle Errors Gracefully

```javascript
queue.registerHandler('risky-task', async (payload) => {
  try {
    const result = await performRiskyOperation(payload);
    return { success: true, result };
  } catch (error) {
    // Log detailed error for debugging
    console.error('Task failed:', error);
    
    // Throw to trigger retry logic
    throw error;
  }
});
```

### 4. Monitor Queue Health

```javascript
// Periodically check queue stats
setInterval(async () => {
  const stats = await queue.getStats();
  console.log('Queue status:', stats);
  
  // Alert if queue is backing up
  if (stats.totalQueued > 100) {
    console.warn('Queue backlog detected!');
    // Send alert or scale workers
  }
}, 60000); // Check every minute
```

### 5. Use Environment Variables

```javascript
const queue = new MessageQueue({
  type: process.env.QUEUE_TYPE || 'memory',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});
```

## Integration with bot6

### Add to user-api

1. Copy the message-queue module to your project:

```bash
cp -r /root/.openclaw/workspace/bot6/projects/message-queue /root/.openclaw/workspace/bot6/user-api/
```

2. Import and use in your API:

```javascript
// user-api/server.js
const MessageQueue = require('./message-queue/index');

// Initialize queue
const taskQueue = new MessageQueue({
  type: process.env.QUEUE_TYPE || 'memory',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});

// Register handlers
taskQueue.registerHandler('user-welcome-email', async (payload) => {
  const { email, name } = payload;
  await sendWelcomeEmail(email, name);
  return { success: true };
});

// Start queue
await taskQueue.initialize();

// Use in API routes
app.post('/users', async (req, res) => {
  const user = await createUser(req.body);
  
  // Queue welcome email instead of sending directly
  await taskQueue.add('user-welcome-email', {
    email: user.email,
    name: user.name
  }, { priority: 'normal' });
  
  res.status(201).json(user);
});
```

3. Update package.json:

```json
{
  "dependencies": {
    "redis": "^4.6.12"
  }
}
```

## Troubleshooting

### Redis Connection Issues

```javascript
try {
  await queue.initialize();
} catch (error) {
  if (error.message.includes('ECONNREFUSED')) {
    console.error('Redis server not running. Start with: redis-server');
  }
}
```

### Tasks Not Processing

1. Check if handlers are registered
2. Verify task types match handler names
3. Check queue processing is active
4. Review error logs

### Memory Issues (In-Memory Queue)

If the in-memory queue grows too large:
- Switch to Redis backend
- Implement task limiting
- Add batch processing

## Performance Tips

1. **Batch Similar Tasks**: Process multiple items in one task
2. **Use Connection Pooling**: For Redis, use connection pools
3. **Monitor Queue Depth**: Scale workers based on backlog
4. **Set Timeouts**: Prevent hanging tasks

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit pull requests or open issues.

---

Made with ❤️ for bot6 - The AI Team Management Platform