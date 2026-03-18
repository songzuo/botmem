/**
 * Message Queue Module for bot6
 * Supports both in-memory and Redis backends
 */

class MessageQueue {
  constructor(options = {}) {
    this.type = options.type || 'memory'; // 'memory' or 'redis'
    this.queue = [];
    this.processing = false;
    this.workers = [];
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.deadLetterQueue = []; // DLQ for in-memory storage

    // Redis configuration
    if (this.type === 'redis') {
      this.redisConfig = options.redis || {
        host: options.host || 'localhost',
        port: options.port || 6379,
        db: options.db || 0
      };
    }

    // Task handlers map
    this.taskHandlers = new Map();

    // HTTP server for health checks
    this.httpServer = null;
    this.startTime = Date.now();

    // Statistics tracking
    this.stats = {
      tasksProcessed: 0,
      tasksFailed: 0,
      tasksRetried: 0,
      tasksDeadLettered: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Initialize the queue
   */
  async initialize() {
    if (this.type === 'redis') {
      const { createClient } = require('redis');
      this.redisClient = await createClient(this.redisConfig)
        .on('error', (err) => console.error('Redis Client Error:', err))
        .connect();
      console.log('Redis message queue initialized');
    } else {
      console.log('In-memory message queue initialized');
    }
  }

  /**
   * Start HTTP server with health check endpoints
   * @param {number} port - Port number for the HTTP server
   */
  async startHttpServer(port = 3000) {
    try {
      const express = require('express');
      const app = express();

      // Health check endpoint - returns status, timestamp, and uptime
      app.get('/health', (req, res) => {
        const uptime = Date.now() - this.startTime;
        const uptimeFormatted = this.formatUptime(uptime);

        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: uptimeFormatted,
          uptimeMs: uptime
        });
      });

      // Metrics endpoint - returns queue statistics
      app.get('/metrics', async (req, res) => {
        try {
          const queueStats = await this.getStats();
          const dlqCount = this.type === 'redis'
            ? await this.redisClient.lLen('queue:dlq')
            : this.deadLetterQueue.length;

          const historyCount = this.type === 'redis'
            ? await this.redisClient.lLen('queue:history')
            : 0;

          const uptime = Date.now() - this.startTime;
          const avgProcessingTime = this.stats.tasksProcessed > 0
            ? Math.round(this.stats.totalProcessingTime / this.stats.tasksProcessed)
            : 0;

          const processingRate = uptime > 0
            ? Math.round((this.stats.tasksProcessed / (uptime / 1000)) * 100) / 100
            : 0;

          res.json({
            queue: queueStats,
            deadLetterQueue: {
              count: dlqCount
            },
            history: {
              count: historyCount
            },
            tasks: {
              processed: this.stats.tasksProcessed,
              failed: this.stats.tasksFailed,
              retried: this.stats.tasksRetried,
              deadLettered: this.stats.tasksDeadLettered
            },
            performance: {
              avgProcessingTimeMs: avgProcessingTime,
              processingRatePerSec: processingRate,
              uptime: this.formatUptime(uptime),
              uptimeMs: uptime
            },
            config: {
              type: this.type,
              maxRetries: this.maxRetries,
              retryDelay: this.retryDelay
            }
          });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });

      // PING endpoint - simple response for load balancer health checks
      app.get('/ping', (req, res) => {
        res.status(200).send('PONG');
      });

      // Start the server
      this.httpServer = app.listen(port, () => {
        console.log(`Health check HTTP server started on port ${port}`);
        console.log(`  GET  /health  - Health check endpoint`);
        console.log(`  GET  /metrics - Queue statistics endpoint`);
        console.log(`  GET  /ping    - Load balancer health check`);
      });
    } catch (error) {
      console.error('Failed to start HTTP server:', error);
      throw error;
    }
  }

  /**
   * Stop HTTP server
   */
  async stopHttpServer() {
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          console.log('HTTP server stopped');
          this.httpServer = null;
          resolve();
        });
      });
    }
  }

  /**
   * Register a task handler
   * @param {string} taskType - Task type identifier
   * @param {function} handler - Async handler function
   */
  registerHandler(taskType, handler) {
    this.taskHandlers.set(taskType, handler);
    console.log(`Handler registered for task type: ${taskType}`);
  }

  /**
   * Add a task to the queue
   * @param {string} type - Task type
   * @param {object} payload - Task payload
   * @param {object} options - Task options (priority, retries, etc.)
   */
  async add(type, payload, options = {}) {
    const task = {
      id: this.generateId(),
      type,
      payload,
      priority: options.priority || 'normal', // 'low', 'normal', 'high'
      retries: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      createdAt: new Date().toISOString(),
      status: 'queued'
    };

    if (this.type === 'redis') {
      // For Redis, use list with priority
      const queueName = `queue:${type}`;
      await this.redisClient.lPush(queueName, JSON.stringify(task));
      console.log(`Task ${task.id} added to Redis queue: ${type}`);
    } else {
      // For in-memory, add with priority sorting
      this.queue.push(task);
      this.sortQueue();
      console.log(`Task ${task.id} added to in-memory queue: ${type}`);
    }

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return task.id;
  }

  /**
   * Process tasks from the queue
   */
  async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    console.log('Starting queue processing...');

    while (this.processing) {
      const task = await this.getNextTask();

      if (!task) {
        // No tasks available, wait a bit
        await this.sleep(100);
        continue;
      }

      await this.processTask(task);
    }

    console.log('Queue processing stopped');
  }

  /**
   * Get the next task from the queue
   */
  async getNextTask() {
    if (this.type === 'redis') {
      // For Redis, we need to check all queue types
      const handlers = Array.from(this.taskHandlers.keys());
      
      for (const type of handlers) {
        const queueName = `queue:${type}`;
        const data = await this.redisClient.rPop(queueName);
        if (data) {
          return JSON.parse(data);
        }
      }
      return null;
    } else {
      // For in-memory, get highest priority task
      if (this.queue.length === 0) return null;
      return this.queue.shift();
    }
  }

  /**
   * Process a single task
   */
  async processTask(task) {
    console.log(`Processing task ${task.id} (${task.type})...`);

    task.status = 'processing';
    task.startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const handler = this.taskHandlers.get(task.type);

      if (!handler) {
        throw new Error(`No handler registered for task type: ${task.type}`);
      }

      // Execute the handler
      const result = await handler(task.payload);

      // Mark as completed
      const processingTime = Date.now() - startTime;
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.result = result;

      // Update statistics
      this.stats.tasksProcessed++;
      this.stats.totalProcessingTime += processingTime;

      console.log(`✅ Task ${task.id} completed successfully in ${processingTime}ms`);

    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error.message);

      // Update statistics
      this.stats.tasksFailed++;

      // Retry logic
      if (task.retries < task.maxRetries) {
        task.retries++;
        task.status = 'retrying';
        task.error = error.message;

        console.log(`Retrying task ${task.id} (attempt ${task.retries}/${task.maxRetries})...`);

        // Update statistics
        this.stats.tasksRetried++;

        // Add back to queue with delay, keeping the same task object
        await this.sleep(this.retryDelay);
        if (this.type === 'redis') {
          const queueName = `queue:${task.type}`;
          await this.redisClient.lPush(queueName, JSON.stringify(task));
        } else {
          this.queue.push(task);
          this.sortQueue();
        }
      } else {
        // Max retries exceeded - send to Dead Letter Queue
        task.status = 'dead-lettered';
        task.error = error.message;
        task.failedAt = new Date().toISOString();
        task.retryAttempts = task.retries;

        console.error(`❌ Task ${task.id} moved to Dead Letter Queue after ${task.maxRetries} retries`);

        // Update statistics
        this.stats.tasksDeadLettered++;

        // Add to DLQ
        await this.addToDeadLetterQueue(task);
      }
    }

    // Store task history (for Redis, use a separate list)
    if (this.type === 'redis') {
      await this.redisClient.lPush('queue:history', JSON.stringify(task));
      await this.redisClient.lTrim('queue:history', 0, 999); // Keep last 1000 tasks
    }
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    if (this.type === 'redis') {
      const stats = {
        type: 'redis',
        queues: {},
        history: 0
      };

      for (const type of this.taskHandlers.keys()) {
        const queueName = `queue:${type}`;
        stats.queues[type] = await this.redisClient.lLen(queueName);
      }

      stats.history = await this.redisClient.lLen('queue:history');
      return stats;
    } else {
      return {
        type: 'memory',
        totalQueued: this.queue.length,
        byPriority: {
          high: this.queue.filter(t => t.priority === 'high').length,
          normal: this.queue.filter(t => t.priority === 'normal').length,
          low: this.queue.filter(t => t.priority === 'low').length
        }
      };
    }
  }

  /**
   * Get task history
   */
  async getHistory(limit = 50) {
    if (this.type === 'redis') {
      const history = await this.redisClient.lRange('queue:history', 0, limit - 1);
      return history.map(t => JSON.parse(t));
    } else {
      // For in-memory, we'd need to track history separately
      // For now, return empty array
      return [];
    }
  }

  /**
   * Add task to Dead Letter Queue
   */
  async addToDeadLetterQueue(task) {
    if (this.type === 'redis') {
      await this.redisClient.lPush('queue:dlq', JSON.stringify(task));
    } else {
      this.deadLetterQueue.push(task);
    }
  }

  /**
   * Get dead lettered messages
   */
  async getDeadLetterMessages(limit = 50) {
    if (this.type === 'redis') {
      const dlqMessages = await this.redisClient.lRange('queue:dlq', 0, limit - 1);
      return dlqMessages.map(t => JSON.parse(t));
    } else {
      return this.deadLetterQueue.slice(0, limit);
    }
  }

  /**
   * Reprocess a dead lettered message
   */
  async reprocessDeadLetterMessage(taskId) {
    let task = null;

    if (this.type === 'redis') {
      // Search for the task in Redis DLQ
      const dlqLength = await this.redisClient.lLen('queue:dlq');
      const dlqMessages = await this.redisClient.lRange('queue:dlq', 0, dlqLength - 1);

      for (let i = 0; i < dlqMessages.length; i++) {
        const t = JSON.parse(dlqMessages[i]);
        if (t.id === taskId) {
          task = t;
          // Remove from DLQ
          await this.redisClient.lRem('queue:dlq', 1, dlqMessages[i]);
          break;
        }
      }
    } else {
      // Search in-memory DLQ
      const index = this.deadLetterQueue.findIndex(t => t.id === taskId);
      if (index !== -1) {
        task = this.deadLetterQueue.splice(index, 1)[0];
      }
    }

    if (!task) {
      throw new Error(`Task ${taskId} not found in Dead Letter Queue`);
    }

    console.log(`Reprocessing task ${taskId} from Dead Letter Queue`);

    // Reset task for reprocessing
    task.status = 'queued';
    task.retries = 0;
    task.reprocessedAt = new Date().toISOString();
    delete task.error;
    delete task.failedAt;

    // Add back to the main queue
    await this.add(task.type, task.payload, {
      priority: this.mapPriority(task.priority),
      maxRetries: task.maxRetries
    });

    return task;
  }

  /**
   * Stop processing
   */
  stop() {
    this.processing = false;
    console.log('Queue stopping...');
  }

  /**
   * Clear the queue
   */
  async clear() {
    if (this.type === 'redis') {
      for (const type of this.taskHandlers.keys()) {
        await this.redisClient.del(`queue:${type}`);
      }
      await this.redisClient.del('queue:history');
      await this.redisClient.del('queue:dlq');
    } else {
      this.queue = [];
      this.deadLetterQueue = [];
    }
    console.log('Queue cleared');
  }

  /**
   * Close the queue connection
   */
  async close() {
    this.stop();
    await this.stopHttpServer();
    if (this.type === 'redis' && this.redisClient) {
      await this.redisClient.quit();
      console.log('Redis connection closed');
    }
  }

  // Utility methods

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  sortQueue() {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.queue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  mapPriority(priority) {
    const map = { 'high': 'high', 'normal': 'normal', 'low': 'low' };
    return map[priority] || 'normal';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = MessageQueue;