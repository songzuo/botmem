# Quick Start Guide

Get started with the message queue module in 5 minutes.

## Installation

```bash
cd /root/.openclaw/workspace/bot6/projects/message-queue
npm install
```

## Run Tests

```bash
npm test
```

## Try the Examples

### 1. In-Memory Queue (Simplest)
```bash
npm run example:in-memory
```

### 2. Redis Queue (Requires Redis)
```bash
# Make sure Redis is running
redis-server

# Run the example
npm run example:redis
```

### 3. Worker Process
```bash
# Terminal 1
QUEUE_TYPE=memory node examples/worker.js 1

# Terminal 2 (add tasks programmatically)
```

## Basic Usage

```javascript
const MessageQueue = require('./index');

async function main() {
  // Create queue
  const queue = new MessageQueue({ type: 'memory' });
  await queue.initialize();

  // Register handler
  queue.registerHandler('my-task', async (payload) => {
    console.log('Processing:', payload);
    return { success: true };
  });

  // Add task
  await queue.add('my-task', { data: 'hello' });

  // Wait and cleanup
  await new Promise(resolve => setTimeout(resolve, 2000));
  await queue.close();
}

main();
```

## API Endpoints (After Integration)

```bash
# Get queue stats
curl http://localhost:3000/queue/stats

# Get task history
curl http://localhost:3000/queue/history

# Trigger a report
curl -X POST http://localhost:3000/queue/report \
  -H "Content-Type: application/json" \
  -d '{"reportType": "daily"}'
```

## Next Steps

1. Read `README.md` for complete API documentation
2. Read `INTEGRATION.md` to integrate with bot6 user-api
3. Explore the examples in `examples/` directory

## Need Help?

- Check `README.md` for detailed API reference
- See `INTEGRATION.md` for bot6 integration guide
- Run `npm test` to verify installation