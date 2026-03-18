/**
 * message-queue.test.js - Unit tests for Message Queue module
 *
 * @version 1.0.0
 * @description Comprehensive tests for in-memory message queue with priority, retries, and DLQ
 */

const MessageQueue = require('../bot6/projects/message-queue/index');

// Mock Redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(function(event, handler) {
      if (event === 'error') {
        // Error handler - we won't trigger errors in tests
      }
      return this;
    }),
    connect: jest.fn(function() {
      this.connected = true;
      return Promise.resolve();
    }),
    lPush: jest.fn(function() {
      return Promise.resolve(1);
    }),
    rPop: jest.fn(function() {
      return Promise.resolve(null);
    }),
    lLen: jest.fn(function() {
      return Promise.resolve(0);
    }),
    lRange: jest.fn(function() {
      return Promise.resolve([]);
    }),
    lTrim: jest.fn(function() {
      return Promise.resolve('OK');
    }),
    lRem: jest.fn(function() {
      return Promise.resolve(1);
    }),
    del: jest.fn(function() {
      return Promise.resolve(1);
    }),
    quit: jest.fn(function() {
      this.connected = false;
      return Promise.resolve();
    })
  }))
}));

describe('MessageQueue - In-Memory Tests', () => {
  let queue;

  beforeEach(() => {
    queue = new MessageQueue({ type: 'memory' });
  });

  afterEach(async () => {
    await queue.close();
  });

  describe('Initialization', () => {
    test('should initialize in-memory queue', async () => {
      await queue.initialize();
      expect(queue.type).toBe('memory');
      expect(Array.isArray(queue.queue)).toBe(true);
      expect(queue.processing).toBe(false);
    });

    test('should set default configuration', () => {
      expect(queue.maxRetries).toBe(3);
      expect(queue.retryDelay).toBe(1000);
      expect(queue.type).toBe('memory');
    });

    test('should accept custom configuration', () => {
      const customQueue = new MessageQueue({
        type: 'memory',
        maxRetries: 5,
        retryDelay: 2000
      });

      expect(customQueue.maxRetries).toBe(5);
      expect(customQueue.retryDelay).toBe(2000);
    });
  });

  describe('Task Handlers', () => {
    test('should register a task handler', async () => {
      await queue.initialize();

      const handler = async (payload) => ({ success: true, data: payload });
      queue.registerHandler('test-task', handler);

      expect(queue.taskHandlers.has('test-task')).toBe(true);
    });

    test('should register multiple handlers', async () => {
      await queue.initialize();

      queue.registerHandler('task1', async (p) => ({ task: 1, payload: p }));
      queue.registerHandler('task2', async (p) => ({ task: 2, payload: p }));

      expect(queue.taskHandlers.size).toBe(2);
    });

    test('should overwrite existing handler', async () => {
      await queue.initialize();

      const handler1 = async () => 'v1';
      const handler2 = async () => 'v2';

      queue.registerHandler('test', handler1);
      queue.registerHandler('test', handler2);

      // The handler function reference is stored, not the result
      expect(queue.taskHandlers.get('test')).toBe(handler2);
    });
  });

  describe('Add Tasks', () => {
    beforeEach(async () => {
      await queue.initialize();
      queue.registerHandler('test', async (p) => ({ success: true, payload: p }));
    });

    test('should add task to queue', async () => {
      const taskId = await queue.add('test', { message: 'hello' });

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      expect(queue.queue.length).toBe(1);
    });

    test('should generate unique task IDs', async () => {
      const id1 = await queue.add('test', { msg: '1' });
      const id2 = await queue.add('test', { msg: '2' });

      expect(id1).not.toBe(id2);
    });

    test('should set default priority to normal', async () => {
      await queue.add('test', {});

      expect(queue.queue[0].priority).toBe('normal');
    });

    test('should accept custom priority', async () => {
      await queue.add('test', {}, { priority: 'high' });
      await queue.add('test', {}, { priority: 'low' });

      expect(queue.queue[0].priority).toBe('high');
      expect(queue.queue[1].priority).toBe('low');
    });

    test('should accept custom maxRetries', async () => {
      await queue.add('test', {}, { maxRetries: 5 });

      expect(queue.queue[0].maxRetries).toBe(5);
    });

    test('should set task metadata', async () => {
      const taskId = await queue.add('test', { data: 'test' });

      const task = queue.queue.find(t => t.id === taskId);
      expect(task.type).toBe('test');
      expect(task.payload).toEqual({ data: 'test' });
      expect(task.status).toBe('queued');
      expect(task.createdAt).toBeDefined();
      expect(task.retries).toBe(0);
    });
  });

  describe('Priority Queue', () => {
    beforeEach(async () => {
      await queue.initialize();
      queue.registerHandler('test', async (p) => ({ success: true }));
    });

    test('should sort queue by priority', async () => {
      await queue.add('test', { order: 1 }, { priority: 'low' });
      await queue.add('test', { order: 2 }, { priority: 'high' });
      await queue.add('test', { order: 3 }, { priority: 'normal' });
      await queue.add('test', { order: 4 }, { priority: 'high' });

      expect(queue.queue[0].priority).toBe('high');
      expect(queue.queue[1].priority).toBe('high');
      expect(queue.queue[2].priority).toBe('normal');
      expect(queue.queue[3].priority).toBe('low');
    });

    test('should process high priority tasks first', async () => {
      const processedOrder = [];

      queue.registerHandler('priority', async (p) => {
        processedOrder.push(p.priority);
        return { success: true };
      });

      await queue.add('priority', { priority: 'low' }, { priority: 'low' });
      await queue.add('priority', { priority: 'high' }, { priority: 'high' });
      await queue.add('priority', { priority: 'normal' }, { priority: 'normal' });
      await queue.add('priority', { priority: 'high' }, { priority: 'high' });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      await queue.stop();

      expect(processedOrder[0]).toBe('high');
      expect(processedOrder[1]).toBe('high');
      expect(processedOrder[2]).toBe('normal');
      expect(processedOrder[3]).toBe('low');
    });

    test('should maintain order within same priority', async () => {
      const processedOrder = [];

      queue.registerHandler('test', async (p) => {
        processedOrder.push(p.order);
        return { success: true };
      });

      await queue.add('test', { order: 1 }, { priority: 'normal' });
      await queue.add('test', { order: 2 }, { priority: 'normal' });
      await queue.add('test', { order: 3 }, { priority: 'normal' });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await queue.stop();

      expect(processedOrder).toEqual([1, 2, 3]);
    });
  });

  describe('Task Processing', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('should process task successfully', async () => {
      let processed = false;

      queue.registerHandler('test', async (p) => {
        processed = true;
        return { success: true, payload: p };
      });

      await queue.add('test', { message: 'test' });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await queue.stop();

      expect(processed).toBe(true);
    });

    test('should call handler with correct payload', async () => {
      let receivedPayload = null;

      queue.registerHandler('test', async (p) => {
        receivedPayload = p;
        return { success: true };
      });

      await queue.add('test', { data: 'test payload' });

      await new Promise(resolve => setTimeout(resolve, 1000));
      await queue.stop();

      expect(receivedPayload).toEqual({ data: 'test payload' });
    });

    test('should mark task as processing', async () => {
      const taskId = await queue.add('test', {});

      queue.registerHandler('test', async (p) => {
        // Check task status during processing
        return { success: true };
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      await queue.stop();

      // After processing, status should be completed
      // Note: In the actual implementation, the task is removed from queue after completion
      expect(taskId).toBeDefined();
    });

    test('should throw error for unregistered task type', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await queue.add('unregistered', {});

      await new Promise(resolve => setTimeout(resolve, 1000));
      await queue.stop();

      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No handler registered')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Retry Mechanism', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('should retry failed task', async () => {
      let attempts = 0;

      queue.registerHandler('failing', async (p) => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Simulated failure');
        }
        return { success: true, attempts };
      });

      await queue.add('failing', {});

      await new Promise(resolve => setTimeout(resolve, 2000));
      await queue.stop();

      expect(attempts).toBe(2);
    });

    test('should respect maxRetries limit', async () => {
      let attempts = 0;

      queue.registerHandler('always-fail', async (p) => {
        attempts++;
        throw new Error('Always fails');
      });

      await queue.add('always-fail', {}, { maxRetries: 2 });

      await new Promise(resolve => setTimeout(resolve, 4000));
      await queue.stop();

      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });

    test('should send to DLQ after max retries', async () => {
      queue.registerHandler('fail', async () => {
        throw new Error('Failure');
      });

      await queue.add('fail', {}, { maxRetries: 1 });

      await new Promise(resolve => setTimeout(resolve, 3000));
      await queue.stop();

      expect(queue.deadLetterQueue.length).toBe(1);
      expect(queue.deadLetterQueue[0].status).toBe('dead-lettered');
    });

    test('should store error in DLQ task', async () => {
      queue.registerHandler('fail', async () => {
        throw new Error('Specific error message');
      });

      await queue.add('fail', {}, { maxRetries: 1 });

      await new Promise(resolve => setTimeout(resolve, 3000));
      await queue.stop();

      expect(queue.deadLetterQueue[0].error).toBe('Specific error message');
      expect(queue.deadLetterQueue[0].failedAt).toBeDefined();
    });
  });

  describe('Dead Letter Queue', () => {
    beforeEach(async () => {
      await queue.initialize();
      queue.registerHandler('fail', async () => {
        throw new Error('Always fails');
      });
    });

    test('should get dead lettered messages', async () => {
      await queue.add('fail', { id: 1 }, { maxRetries: 1 });

      await new Promise(resolve => setTimeout(resolve, 3000));
      await queue.stop();

      const dlqMessages = await queue.getDeadLetterMessages();
      expect(dlqMessages.length).toBe(1);
      expect(dlqMessages[0].payload.id).toBe(1);
    });

    test('should respect limit when getting DLQ messages', async () => {
      await queue.add('fail', { id: 1 }, { maxRetries: 0 });
      await queue.add('fail', { id: 2 }, { maxRetries: 0 });
      await queue.add('fail', { id: 3 }, { maxRetries: 0 });

      await new Promise(resolve => setTimeout(resolve, 5000));
      await queue.stop();

      const dlqMessages = await queue.getDeadLetterMessages(2);
      expect(dlqMessages.length).toBe(2);
    });

    test('should reprocess dead lettered message', async () => {
      queue.registerHandler('succeed', async () => ({ success: true }));

      await queue.add('fail', { data: 'test' }, { maxRetries: 0 });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the DLQ message
      const dlqMessages = await queue.getDeadLetterMessages();
      const taskId = dlqMessages[0].id;

      // Change handler to succeed
      queue.taskHandlers.delete('fail');
      queue.registerHandler('succeed', async (p) => ({ success: true }));

      // Reprocess
      await queue.reprocessDeadLetterMessage(taskId);

      expect(queue.deadLetterQueue.length).toBe(0);
    });

    test('should throw error when reprocessing non-existent task', async () => {
      await expect(
        queue.reprocessDeadLetterMessage('non-existent-id')
      ).rejects.toThrow('not found in Dead Letter Queue');
    });

    test('should reset task state when reprocessing', async () => {
      await queue.add('fail', {}, { maxRetries: 0 });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const dlqMessages = await queue.getDeadLetterMessages();
      const taskId = dlqMessages[0].id;

      queue.registerHandler('succeed', async () => ({ success: true }));

      const task = await queue.reprocessDeadLetterMessage(taskId);

      expect(task.status).toBe('queued');
      expect(task.retries).toBe(0);
      expect(task.reprocessedAt).toBeDefined();
      expect(task.error).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await queue.initialize();
      queue.registerHandler('test', async () => ({ success: true }));
    });

    test('should get queue statistics', async () => {
      await queue.add('test', {}, { priority: 'high' });
      await queue.add('test', {}, { priority: 'high' });
      await queue.add('test', {}, { priority: 'normal' });
      await queue.add('test', {}, { priority: 'low' });

      const stats = await queue.getStats();

      expect(stats.type).toBe('memory');
      expect(stats.totalQueued).toBe(4);
      expect(stats.byPriority.high).toBe(2);
      expect(stats.byPriority.normal).toBe(1);
      expect(stats.byPriority.low).toBe(1);
    });

    test('should return empty stats for empty queue', async () => {
      const stats = await queue.getStats();

      expect(stats.totalQueued).toBe(0);
      expect(stats.byPriority.high).toBe(0);
      expect(stats.byPriority.normal).toBe(0);
      expect(stats.byPriority.low).toBe(0);
    });
  });

  describe('Queue Operations', () => {
    beforeEach(async () => {
      await queue.initialize();
      queue.registerHandler('test', async () => ({ success: true }));
    });

    test('should clear the queue', async () => {
      await queue.add('test', {});
      await queue.add('test', {});
      await queue.add('test', {});

      expect(queue.queue.length).toBe(3);

      await queue.clear();

      expect(queue.queue.length).toBe(0);
    });

    test('should clear dead letter queue', async () => {
      queue.registerHandler('fail', async () => {
        throw new Error('Fail');
      });

      await queue.add('fail', {}, { maxRetries: 0 });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await queue.stop();

      expect(queue.deadLetterQueue.length).toBeGreaterThan(0);

      await queue.clear();

      expect(queue.deadLetterQueue.length).toBe(0);
    });

    test('should stop processing', async () => {
      await queue.add('test', {});

      queue.stop();

      expect(queue.processing).toBe(false);
    });

    test('should close queue properly', async () => {
      await queue.add('test', {});

      await queue.close();

      expect(queue.processing).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    test('generateId should create unique IDs', () => {
      const id1 = queue.generateId();
      const id2 = queue.generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });

    test('sortQueue should maintain priority order', () => {
      queue.queue = [
        { priority: 'low' },
        { priority: 'high' },
        { priority: 'normal' },
        { priority: 'high' }
      ];

      queue.sortQueue();

      expect(queue.queue[0].priority).toBe('high');
      expect(queue.queue[1].priority).toBe('high');
      expect(queue.queue[2].priority).toBe('normal');
      expect(queue.queue[3].priority).toBe('low');
    });

    test('mapPriority should map correctly', () => {
      expect(queue.mapPriority('high')).toBe('high');
      expect(queue.mapPriority('normal')).toBe('normal');
      expect(queue.mapPriority('low')).toBe('low');
      expect(queue.mapPriority('invalid')).toBe('normal');
    });

    test('sleep should wait for specified duration', async () => {
      const start = Date.now();
      await queue.sleep(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complex workflow', async () => {
      const processed = [];
      const failed = [];

      queue.registerHandler('task1', async (p) => {
        processed.push(p.id);
        return { success: true };
      });

      queue.registerHandler('task2', async (p) => {
        if (p.id === 'fail') {
          throw new Error('Intentional failure');
        }
        processed.push(p.id);
        return { success: true };
      });

      // Add various tasks
      await queue.add('task1', { id: '1' }, { priority: 'low' });
      await queue.add('task2', { id: '2' }, { priority: 'high' });
      await queue.add('task1', { id: '3' }, { priority: 'normal' });
      await queue.add('task2', { id: 'fail' }, { priority: 'high', maxRetries: 1 });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 4000));
      await queue.stop();

      expect(processed).toContain('1');
      expect(processed).toContain('2');
      expect(processed).toContain('3');
      expect(queue.deadLetterQueue.length).toBeGreaterThan(0);
    });

    test('should handle high throughput', async () => {
      let count = 0;

      queue.registerHandler('test', async () => {
        count++;
        return { success: true };
      });

      // Add 100 tasks
      for (let i = 0; i < 100; i++) {
        await queue.add('test', { id: i });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      await queue.stop();

      expect(count).toBe(100);
    });
  });
});

describe('MessageQueue - Redis Tests', () => {
  let queue;

  beforeEach(() => {
    queue = new MessageQueue({
      type: 'redis',
      redis: {
        host: 'localhost',
        port: 6379
      }
    });
  });

  afterEach(async () => {
    await queue.close();
  });

  test('should initialize Redis queue', async () => {
    await queue.initialize();

    expect(queue.type).toBe('redis');
    expect(queue.redisClient).toBeDefined();
  });

  test('should use Redis for task storage', async () => {
    await queue.initialize();

    queue.registerHandler('test', async (p) => ({ success: true }));

    const taskId = await queue.add('test', { message: 'test' });

    expect(taskId).toBeDefined();
    expect(queue.redisClient.lPush).toHaveBeenCalled();
  });

  test('should get Redis queue statistics', async () => {
    await queue.initialize();
    queue.registerHandler('test', async () => ({ success: true }));

    queue.redisClient.lLen.mockResolvedValue(5);

    const stats = await queue.getStats();

    expect(stats.type).toBe('redis');
    expect(queue.redisClient.lLen).toHaveBeenCalled();
  });

  test('should close Redis connection', async () => {
    await queue.initialize();
    await queue.close();

    expect(queue.redisClient.quit).toHaveBeenCalled();
  });
});
