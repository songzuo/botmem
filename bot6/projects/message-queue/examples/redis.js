/**
 * Redis Message Queue Example
 * Demonstrates usage with Redis backend
 * Note: Requires Redis server running on localhost:6379
 */

const MessageQueue = require('../index');

async function main() {
  console.log('=== Redis Message Queue Example ===\n');

  // Create a message queue instance with Redis backend
  const queue = new MessageQueue({
    type: 'redis',
    redis: {
      host: 'localhost',
      port: 6379,
      db: 0
    },
    maxRetries: 3,
    retryDelay: 1000
  });

  try {
    // Initialize the queue
    await queue.initialize();

    // Register task handlers
    queue.registerHandler('send-notification', async (payload) => {
      console.log(`Sending notification to ${payload.userId}: ${payload.message}`);
      // Simulate notification sending
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Notification sent to ${payload.userId}`);
      return { success: true, timestamp: Date.now() };
    });

    queue.registerHandler('process-payment', async (payload) => {
      console.log(`Processing payment: ${payload.amount} for order ${payload.orderId}`);
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate occasional failures for testing retries
      if (Math.random() < 0.3) {
        throw new Error('Payment gateway timeout');
      }
      
      console.log(`Payment processed: ${payload.orderId}`);
      return { success: true, transactionId: `txn-${Date.now()}` };
    });

    queue.registerHandler('update-cache', async (payload) => {
      console.log(`Updating cache for key: ${payload.key}`);
      // Simulate cache update
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`Cache updated: ${payload.key}`);
      return { success: true };
    });

    // Add tasks
    console.log('\n--- Adding Tasks ---\n');

    const task1 = await queue.add('send-notification', {
      userId: 'user123',
      message: 'Your order has been confirmed!'
    }, { priority: 'high' });

    const task2 = await queue.add('process-payment', {
      orderId: 'ORD-001',
      amount: 99.99,
      currency: 'USD'
    }, { priority: 'high' });

    const task3 = await queue.add('update-cache', {
      key: 'user:123:profile',
      value: { name: 'John Doe', email: 'john@example.com' }
    }, { priority: 'low' });

    const task4 = await queue.add('process-payment', {
      orderId: 'ORD-002',
      amount: 49.99,
      currency: 'USD'
    }, { priority: 'normal' });

    const task5 = await queue.add('send-notification', {
      userId: 'admin',
      message: 'New order received: ORD-002'
    }, { priority: 'normal' });

    console.log('\nTasks added:', [task1, task2, task3, task4, task5]);

    // Wait for tasks to complete
    console.log('\n--- Processing Tasks ---\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Get queue statistics
    const stats = await queue.getStats();
    console.log('\n--- Queue Statistics ---\n');
    console.log(JSON.stringify(stats, null, 2));

    // Get task history
    const history = await queue.getHistory(10);
    console.log('\n--- Recent Tasks History ---\n');
    history.forEach((task, index) => {
      console.log(`${index + 1}. ${task.id} - ${task.type} - ${task.status} (${task.retries} retries)`);
    });

    // Clean up
    console.log('\n--- Shutting Down ---\n');
    await queue.clear();
    await queue.close();
    console.log('Example completed!');

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: Make sure Redis server is running on localhost:6379');
    console.log('Start Redis with: redis-server');
    await queue.close();
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);