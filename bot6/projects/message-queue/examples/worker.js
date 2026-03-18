/**
 * Worker Process Example
 * Demonstrates running a dedicated worker process that listens to the queue
 */

const MessageQueue = require('../index');

async function startWorker(workerId) {
  console.log(`=== Worker ${workerId} Started ===\n`);

  // Create a message queue instance (can be memory or redis)
  const queue = new MessageQueue({
    type: process.env.QUEUE_TYPE || 'memory',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      db: parseInt(process.env.REDIS_DB) || 0
    },
    maxRetries: 3,
    retryDelay: 1000
  });

  // Initialize the queue
  await queue.initialize();

  // Register task handlers for this worker
  queue.registerHandler('heavy-computation', async (payload) => {
    console.log(`Worker ${workerId}: Starting heavy computation for ${payload.dataId}`);
    
    // Simulate heavy CPU work
    const result = await performHeavyComputation(payload.data);
    
    console.log(`Worker ${workerId}: Completed computation for ${payload.dataId}`);
    return { success: true, result };
  });

  queue.registerHandler('data-sync', async (payload) => {
    console.log(`Worker ${workerId}: Syncing data to ${payload.destination}`);
    
    // Simulate data synchronization
    await new Promise(resolve => setTimeout(resolve, payload.size * 100));
    
    console.log(`Worker ${workerId}: Synced ${payload.size} records to ${payload.destination}`);
    return { success: true, synced: payload.size };
  });

  queue.registerHandler('cleanup', async (payload) => {
    console.log(`Worker ${workerId}: Cleaning up ${payload.resource}`);
    
    // Simulate cleanup operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate occasional errors
    if (Math.random() < 0.2) {
      throw new Error(`Cleanup failed for ${payload.resource}`);
    }
    
    console.log(`Worker ${workerId}: Cleanup completed for ${payload.resource}`);
    return { success: true };
  });

  // Start processing
  console.log(`Worker ${workerId}: Ready to process tasks\n`);
  await queue.startProcessing();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log(`Worker ${workerId}: Received SIGTERM, shutting down...`);
    await queue.stop();
    await queue.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log(`Worker ${workerId}: Received SIGINT, shutting down...`);
    await queue.stop();
    await queue.close();
    process.exit(0);
  });
}

// Simulate heavy computation
async function performHeavyComputation(data) {
  const result = data.map(n => {
    // Simulate CPU-intensive work
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += Math.sqrt(n) * Math.log(i + 1);
    }
    return Math.round(sum);
  });
  
  return result;
}

// Get worker ID from command line args
const workerId = process.argv[2] || '1';
console.log(`Starting worker ${workerId}...`);

// Start the worker
startWorker(workerId).catch(error => {
  console.error(`Worker ${workerId} error:`, error);
  process.exit(1);
});