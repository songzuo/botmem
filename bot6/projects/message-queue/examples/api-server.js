/**
 * API Server with DLQ Support
 * Provides HTTP endpoints for queue management and dead letter queue operations
 */

const express = require('express');
const MessageQueue = require('../index');

async function startServer(port = 3000) {
  const app = express();
  app.use(express.json());

  // Initialize message queue
  const queue = new MessageQueue({
    type: process.env.QUEUE_TYPE || 'memory',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      db: parseInt(process.env.REDIS_DB) || 0
    },
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000
  });

  await queue.initialize();

  // Register sample handlers
  queue.registerHandler('send-email', async (payload) => {
    console.log(`Sending email to ${payload.to}`);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate occasional failures
    if (Math.random() < 0.3) {
      throw new Error('SMTP server error');
    }

    return { success: true, messageId: `msg-${Date.now()}` };
  });

  queue.registerHandler('process-payment', async (payload) => {
    console.log(`Processing payment for order ${payload.orderId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate occasional failures
    if (Math.random() < 0.2) {
      throw new Error('Payment gateway timeout');
    }

    return { success: true, transactionId: `txn-${Date.now()}` };
  });

  queue.registerHandler('generate-report', async (payload) => {
    console.log(`Generating report: ${payload.reportType}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    return { success: true, reportUrl: `/reports/${payload.reportType}-${Date.now()}.pdf` };
  });

  // Start queue processing
  queue.startProcessing();

  // ==================== API Endpoints ====================

  /**
   * Health check
   */
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * Get queue statistics
   */
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await queue.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get task history
   */
  app.get('/api/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await queue.getHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Get dead lettered messages (DLQ)
   */
  app.get('/api/dlq', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const dlqMessages = await queue.getDeadLetterMessages(limit);
      res.json(dlqMessages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Reprocess a dead lettered message
   */
  app.post('/api/dlq/:taskId/reprocess', async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = await queue.reprocessDeadLetterMessage(taskId);
      res.json({
        success: true,
        message: `Task ${taskId} reprocessing initiated`,
        task
      });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });

  /**
   * Add a new task to the queue
   */
  app.post('/api/tasks', async (req, res) => {
    try {
      const { type, payload, options } = req.body;

      if (!type || !payload) {
        return res.status(400).json({ error: 'Missing required fields: type, payload' });
      }

      const taskId = await queue.add(type, payload, options || {});
      res.json({ success: true, taskId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Clear the queue
   */
  app.post('/api/clear', async (req, res) => {
    try {
      await queue.clear();
      res.json({ success: true, message: 'Queue cleared' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * Stop the queue
   */
  app.post('/api/stop', async (req, res) => {
    try {
      queue.stop();
      res.json({ success: true, message: 'Queue stopped' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start the server
  app.listen(port, () => {
    console.log(`\n🚀 Message Queue API Server running on http://localhost:${port}`);
    console.log(`📋 Queue type: ${queue.type}`);
    console.log(`🔄 Max retries: ${queue.maxRetries}`);
    console.log(`⏱️  Retry delay: ${queue.retryDelay}ms\n`);
    console.log('Available endpoints:');
    console.log('  GET  /health                - Health check');
    console.log('  GET  /api/stats            - Queue statistics');
    console.log('  GET  /api/history          - Task history');
    console.log('  GET  /api/dlq              - Dead Letter Queue messages');
    console.log('  POST /api/dlq/:id/reprocess - Reprocess dead lettered message');
    console.log('  POST /api/tasks            - Add new task');
    console.log('  POST /api/clear            - Clear queue');
    console.log('  POST /api/stop             - Stop queue\n');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down...');
    await queue.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down...');
    await queue.close();
    process.exit(0);
  });
}

// Start the server
const port = parseInt(process.env.PORT) || 3000;
startServer(port).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
