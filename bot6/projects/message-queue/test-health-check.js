/**
 * Test health check endpoints
 */

const MessageQueue = require('./index');

async function testHealthChecks() {
  console.log('Testing MessageQueue Health Check Endpoints...\n');

  // Create and initialize queue
  const queue = new MessageQueue({
    type: 'memory',
    maxRetries: 3,
    retryDelay: 500
  });

  await queue.initialize();

  // Register a sample handler
  queue.registerHandler('test-task', async (payload) => {
    console.log(`Processing test task: ${payload.message}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: true };
  });

  // Start queue processing
  queue.startProcessing();

  // Start HTTP server with health checks
  await queue.startHttpServer(3000);

  // Add some test tasks
  console.log('Adding test tasks...\n');
  await queue.add('test-task', { message: 'Task 1' });
  await queue.add('test-task', { message: 'Task 2' });
  await queue.add('test-task', { message: 'Task 3' });

  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n=== Health Check Endpoints ===');
  console.log('Server is running on port 3000');
  console.log('Test the endpoints with:');
  console.log('  curl http://localhost:3000/health');
  console.log('  curl http://localhost:3000/metrics');
  console.log('  curl http://localhost:3000/ping');
  console.log('\nPress Ctrl+C to stop\n');

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await queue.close();
    process.exit(0);
  });
}

testHealthChecks().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
