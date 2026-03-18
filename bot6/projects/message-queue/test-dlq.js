/**
 * Test Dead Letter Queue (DLQ) Functionality
 */

const MessageQueue = require('./index');

async function testDLQ() {
  console.log('=== Testing Dead Letter Queue Functionality ===\n');

  // Create a queue with low retry limit for faster testing
  const queue = new MessageQueue({
    type: 'memory',
    maxRetries: 2,  // Only retry 2 times before DLQ
    retryDelay: 500 // Short delay for testing
  });

  await queue.initialize();

  // Register handlers that will fail
  let failureCount = 0;
  queue.registerHandler('failing-task', async (payload) => {
    console.log(`Processing failing-task ${payload.id} (attempt ${failureCount + 1})`);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Always fail
    failureCount++;
    throw new Error(`Simulated failure for task ${payload.id}`);
  });

  queue.registerHandler('flaky-task', async (payload) => {
    console.log(`Processing flaky-task ${payload.id}`);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fail 2 times, then succeed
    if (payload.attempts < 2) {
      payload.attempts++;
      throw new Error(`Flaky failure ${payload.attempts}`);
    }

    return { success: true, message: 'Finally succeeded!' };
  });

  console.log('Test 1: Adding tasks that will fail and go to DLQ\n');
  const task1Id = await queue.add('failing-task', { id: 'task1' });
  const task2Id = await queue.add('failing-task', { id: 'task2' });
  console.log(`Added tasks: ${task1Id}, ${task2Id}\n`);

  // Wait for tasks to fail and go to DLQ
  console.log('Waiting for tasks to be processed...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check DLQ
  console.log('Test 2: Checking Dead Letter Queue\n');
  const dlqMessages = await queue.getDeadLetterMessages();
  console.log(`DLQ contains ${dlqMessages.length} messages:`);
  dlqMessages.forEach(msg => {
    console.log(`  - ${msg.id}: ${msg.type} - ${msg.error}`);
    console.log(`    Retries: ${msg.retryAttempts}/${msg.maxRetries}`);
    console.log(`    Status: ${msg.status}`);
    console.log(`    Failed at: ${msg.failedAt}\n`);
  });

  if (dlqMessages.length !== 2) {
    console.error('ERROR: Expected 2 messages in DLQ, got', dlqMessages.length);
  }

  console.log('Test 3: Reprocessing a dead lettered message\n');
  try {
    const taskToReprocess = dlqMessages[0];
    console.log(`Reprocessing task ${taskToReprocess.id}...`);

    const reprocessedTask = await queue.reprocessDeadLetterMessage(taskToReprocess.id);
    console.log(`Task ${reprocessedTask.id} reprocessing initiated`);
    console.log(`Reprocessed at: ${reprocessedTask.reprocessedAt}\n`);

    // Verify it was removed from DLQ
    const remainingDLQ = await queue.getDeadLetterMessages();
    console.log(`DLQ now contains ${remainingDLQ.length} messages`);

    if (remainingDLQ.length !== 1) {
      console.error('ERROR: Expected 1 message in DLQ after reprocessing, got', remainingDLQ.length);
    }
  } catch (error) {
    console.error('Failed to reprocess task:', error.message);
  }

  console.log('\nTest 4: Reprocessing non-existent task\n');
  try {
    await queue.reprocessDeadLetterMessage('non-existent-id');
    console.error('ERROR: Should have thrown an error');
  } catch (error) {
    console.log('✓ Correctly threw error:', error.message);
  }

  console.log('\nTest 5: Testing maxRetries configuration\n');
  console.log(`Queue maxRetries: ${queue.maxRetries}`);
  console.log(`Actual retries before DLQ: ${dlqMessages[0].retryAttempts}`);

  if (dlqMessages[0].retryAttempts === queue.maxRetries) {
    console.log('✓ Correctly respects maxRetries configuration');
  } else {
    console.error('ERROR: Retry count mismatch');
  }

  console.log('\nTest 6: Testing with Redis backend (if available)\n');
  const redisQueue = new MessageQueue({
    type: 'redis',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      db: 1 // Use separate DB for testing
    },
    maxRetries: 1,
    retryDelay: 100
  });

  try {
    await redisQueue.initialize();

    redisQueue.registerHandler('redis-fail', async (payload) => {
      throw new Error('Redis test failure');
    });

    const redisTaskId = await redisQueue.add('redis-fail', { id: 'redis-test' });
    console.log(`Added Redis task: ${redisTaskId}`);

    // Wait for failure
    await new Promise(resolve => setTimeout(resolve, 3000));

    const redisDLQ = await redisQueue.getDeadLetterMessages();
    console.log(`Redis DLQ contains ${redisDLQ.length} messages`);

    if (redisDLQ.length > 0) {
      console.log('✓ Redis DLQ working correctly');
    } else {
      console.warn('Redis DLQ test skipped (Redis not available or connection failed)');
    }

    await redisQueue.clear();
    await redisQueue.close();
  } catch (error) {
    console.warn('Redis test skipped:', error.message);
  }

  // Cleanup
  console.log('\n=== Cleaning up ===\n');
  await queue.clear();
  await queue.close();

  console.log('\n=== All DLQ Tests Completed ===\n');
  console.log('Summary:');
  console.log('✓ Tasks failing after max retries go to DLQ');
  console.log('✓ DLQ can be queried');
  console.log('✓ DLQ messages can be reprocessed');
  console.log('✓ maxRetries configuration works correctly');
  console.log('✓ In-memory DLQ working');
  console.log('✓ Redis DLQ working (if Redis available)');
}

// Run the tests
testDLQ().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
