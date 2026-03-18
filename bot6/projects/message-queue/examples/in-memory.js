/**
 * In-memory Message Queue Example
 * Demonstrates basic usage with in-memory storage
 */

const MessageQueue = require('../index');

async function main() {
  console.log('=== In-Memory Message Queue Example ===\n');

  // Create a message queue instance with in-memory storage
  const queue = new MessageQueue({
    type: 'memory',
    maxRetries: 2,
    retryDelay: 500
  });

  // Initialize the queue
  await queue.initialize();

  // Register task handlers
  queue.registerHandler('send-email', async (payload) => {
    console.log(`Sending email to ${payload.to}: ${payload.subject}`);
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Email sent to ${payload.to}`);
    return { success: true, messageId: `msg-${Date.now()}` };
  });

  queue.registerHandler('process-image', async (payload) => {
    console.log(`Processing image: ${payload.filename}`);
    // Simulate image processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Image processed: ${payload.filename}`);
    return { success: true, processedSize: '1024x1024' };
  });

  queue.registerHandler('generate-report', async (payload) => {
    console.log(`Generating report: ${payload.reportType}`);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Report generated: ${payload.reportType}`);
    return { success: true, reportUrl: '/reports/report.pdf' };
  });

  // Add tasks with different priorities
  console.log('\n--- Adding Tasks ---\n');

  const task1 = await queue.add('send-email', {
    to: 'user@example.com',
    subject: 'Welcome to bot6!',
    body: 'Hello from the message queue!'
  }, { priority: 'high' });

  const task2 = await queue.add('process-image', {
    filename: 'avatar.png',
    operations: ['resize', 'compress']
  }, { priority: 'normal' });

  const task3 = await queue.add('generate-report', {
    reportType: 'weekly',
    format: 'pdf'
  }, { priority: 'low' });

  const task4 = await queue.add('send-email', {
    to: 'admin@example.com',
    subject: 'System Alert',
    body: 'Task processing started'
  }, { priority: 'high' });

  console.log('\nTasks added:', [task1, task2, task3, task4]);

  // Wait for tasks to complete
  console.log('\n--- Processing Tasks ---\n');
  await new Promise(resolve => setTimeout(resolve, 8000));

  // Get queue statistics
  const stats = await queue.getStats();
  console.log('\n--- Queue Statistics ---\n');
  console.log(JSON.stringify(stats, null, 2));

  // Clean up
  console.log('\n--- Shutting Down ---\n');
  await queue.close();
  console.log('Example completed!');
}

// Run the example
main().catch(console.error);