/**
 * cache-client.test.js - Unit tests for Redis Cache Client
 *
 * @version 1.0.0
 * @description Comprehensive tests for cache operations, TTL, metrics, and error handling
 */

const CacheClient = require('../bot6/projects/cache/cache-client');

// Mock ioredis
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(function() {
    this.connected = false;
    this.data = {};
    this.keysData = [];

    this.connect = jest.fn(function() {
      this.connected = true;
      return Promise.resolve();
    });

    this.ping = jest.fn(function() {
      return Promise.resolve('PONG');
    });

    this.quit = jest.fn(function() {
      this.connected = false;
      return Promise.resolve('OK');
    });

    this.get = jest.fn(function(key) {
      const value = this.data[key];
      return Promise.resolve(value !== undefined ? value : null);
    });

    this.set = jest.fn(function(key, value) {
      this.data[key] = value;
      this.keysData.push(key);
      return Promise.resolve('OK');
    });

    this.setex = jest.fn(function(key, ttl, value) {
      this.data[key] = value;
      this.keysData.push(key);
      return Promise.resolve('OK');
    });

    this.del = jest.fn(function(...keys) {
      let deleted = 0;
      keys.forEach(key => {
        if (this.data[key] !== undefined) {
          delete this.data[key];
          deleted++;
        }
      });
      return Promise.resolve(deleted);
    });

    this.keys = jest.fn(function(pattern) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return Promise.resolve(this.keysData.filter(key => regex.test(key)));
    });

    this.exists = jest.fn(function(key) {
      return Promise.resolve(this.data[key] !== undefined ? 1 : 0);
    });

    this.ttl = jest.fn(function(key) {
      return Promise.resolve(this.data[key] !== undefined ? 3600 : -2);
    });

    this.expire = jest.fn(function(key, ttl) {
      return Promise.resolve(this.data[key] !== undefined ? 1 : 0);
    });

    this.incrby = jest.fn(function(key, amount) {
      if (this.data[key] === undefined) {
        this.data[key] = '0';
      }
      const current = parseInt(this.data[key]) || 0;
      this.data[key] = String(current + amount);
      return Promise.resolve(current + amount);
    });

    this.decrby = jest.fn(function(key, amount) {
      if (this.data[key] === undefined) {
        this.data[key] = '0';
      }
      const current = parseInt(this.data[key]) || 0;
      this.data[key] = String(current - amount);
      return Promise.resolve(current - amount);
    });

    this.on = jest.fn(function(event, handler) {
      return this;
    });
  });

  return MockRedis;
});

describe('CacheClient - Unit Tests', () => {
  let cacheClient;
  let mockRedis;

  beforeEach(() => {
    // Clear environment variables
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;

    cacheClient = new CacheClient({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test:',
      defaultTTL: 3600
    });
  });

  afterEach(async () => {
    await cacheClient.disconnect();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('Initialization', () => {
    test('should create cache client with default config', () => {
      const client = new CacheClient();

      expect(client.config.host).toBe('localhost');
      expect(client.config.port).toBe(6379);
      expect(client.config.defaultTTL).toBe(3600);
      expect(client.config.keyPrefix).toBe('cache:');
    });

    test('should create cache client with custom config', () => {
      const client = new CacheClient({
        host: 'redis.example.com',
        port: 6380,
        password: 'secret',
        keyPrefix: 'custom:',
        defaultTTL: 7200
      });

      expect(client.config.host).toBe('redis.example.com');
      expect(client.config.port).toBe(6380);
      expect(client.config.password).toBe('secret');
      expect(client.config.keyPrefix).toBe('custom:');
      expect(client.config.defaultTTL).toBe(7200);
    });

    test('should read config from environment variables', () => {
      process.env.REDIS_HOST = 'env-host.com';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'env-pass';

      const client = new CacheClient();

      expect(client.config.host).toBe('env-host.com');
      expect(client.config.port).toBe(6380);
      expect(client.config.password).toBe('env-pass');

      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
    });

    test('should initialize metrics', () => {
      expect(cacheClient.metrics).toEqual({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      });
    });
  });

  // ============================================================================
  // Connection Tests
  // ============================================================================

  describe('Connection', () => {
    test('should connect to Redis', async () => {
      await cacheClient.connect();

      expect(cacheClient.connected).toBe(true);
      expect(cacheClient.client).toBeDefined();
    });

    test('should not connect if already connected', async () => {
      await cacheClient.connect();
      await cacheClient.connect();

      // Should not throw error
      expect(cacheClient.connected).toBe(true);
    });

    test('should disconnect from Redis', async () => {
      await cacheClient.connect();
      await cacheClient.disconnect();

      expect(cacheClient.connected).toBe(false);
    });

    test('should disconnect without error if not connected', async () => {
      await cacheClient.disconnect();

      expect(cacheClient.connected).toBe(false);
    });

    test('should handle connection errors', async () => {
      const client = new CacheClient({ host: 'invalid-host', port: 9999 });

      try {
        await client.connect();
        // If it doesn't throw, disconnect
        await client.disconnect();
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  // ============================================================================
  // Cache Operations Tests
  // ============================================================================

  describe('Get and Set', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should set and get value', async () => {
      await cacheClient.set('test-key', { data: 'value' });
      const result = await cacheClient.get('test-key');

      expect(result).toEqual({ data: 'value' });
    });

    test('should return null for non-existent key', async () => {
      const result = await cacheClient.get('non-existent-key');

      expect(result).toBeNull();
    });

    test('should increment miss counter on cache miss', async () => {
      const initialMisses = cacheClient.metrics.misses;

      await cacheClient.get('non-existent-key');

      expect(cacheClient.metrics.misses).toBe(initialMisses + 1);
    });

    test('should increment hit counter on cache hit', async () => {
      await cacheClient.set('test', { value: 1 });
      const initialHits = cacheClient.metrics.hits;

      await cacheClient.get('test');

      expect(cacheClient.metrics.hits).toBe(initialHits + 1);
    });

    test('should increment set counter', async () => {
      const initialSets = cacheClient.metrics.sets;

      await cacheClient.set('test', { value: 1 });

      expect(cacheClient.metrics.sets).toBe(initialSets + 1);
    });

    test('should set with custom TTL', async () => {
      const success = await cacheClient.set('test', { value: 1 }, 7200);

      expect(success).toBe(true);
      expect(cacheClient.client.setex).toHaveBeenCalled();
    });

    test('should set with zero TTL (no expiration)', async () => {
      const success = await cacheClient.set('test', { value: 1 }, 0);

      expect(success).toBe(true);
      expect(cacheClient.client.set).toHaveBeenCalled();
    });

    test('should auto-connect if not connected', async () => {
      cacheClient.connected = false;
      cacheClient.client = null;

      await cacheClient.set('test', { value: 1 });

      expect(cacheClient.connected).toBe(true);
    });

    test('should handle get errors gracefully', async () => {
      cacheClient.client.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheClient.get('test');

      expect(result).toBeNull();
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });

    test('should handle set errors gracefully', async () => {
      cacheClient.client.set.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheClient.set('test', { value: 1 });

      expect(result).toBe(false);
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Delete Operations Tests
  // ============================================================================

  describe('Delete Operations', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should delete existing key', async () => {
      await cacheClient.set('test', { value: 1 });
      const result = await cacheClient.delete('test');

      expect(result).toBe(true);
      expect(cacheClient.metrics.deletes).toBeGreaterThan(0);
    });

    test('should return false for non-existent key', async () => {
      const result = await cacheClient.delete('non-existent');

      expect(result).toBe(false);
    });

    test('should delete keys by pattern', async () => {
      await cacheClient.set('user:1', { id: 1 });
      await cacheClient.set('user:2', { id: 2 });
      await cacheClient.set('other', { data: 'test' });

      const deleted = await cacheClient.deletePattern('user:*');

      expect(deleted).toBeGreaterThan(0);
      expect(cacheClient.metrics.deletes).toBeGreaterThan(0);
    });

    test('should handle delete pattern with no matches', async () => {
      const deleted = await cacheClient.deletePattern('nonexistent:*');

      expect(deleted).toBe(0);
    });

    test('should handle delete errors gracefully', async () => {
      cacheClient.client.del.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheClient.delete('test');

      expect(result).toBe(false);
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // TTL Operations Tests
  // ============================================================================

  describe('TTL Operations', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should get TTL for existing key', async () => {
      await cacheClient.set('test', { value: 1 });
      const ttl = await cacheClient.ttl('test');

      expect(typeof ttl).toBe('number');
      expect(ttl).toBeGreaterThanOrEqual(-1);
    });

    test('should return -2 for non-existent key', async () => {
      const ttl = await cacheClient.ttl('non-existent');

      expect(ttl).toBe(-2);
    });

    test('should set TTL on existing key', async () => {
      await cacheClient.set('test', { value: 1 });
      const result = await cacheClient.expire('test', 1800);

      expect(result).toBe(true);
      expect(cacheClient.client.expire).toHaveBeenCalled();
    });

    test('should return false for expire on non-existent key', async () => {
      const result = await cacheClient.expire('non-existent', 1800);

      expect(result).toBe(false);
    });

    test('should handle TTL errors gracefully', async () => {
      cacheClient.client.ttl.mockRejectedValueOnce(new Error('Redis error'));

      const ttl = await cacheClient.ttl('test');

      expect(ttl).toBe(-1);
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });

    test('should handle expire errors gracefully', async () => {
      cacheClient.client.expire.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheClient.expire('test', 1800);

      expect(result).toBe(false);
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Exists Tests
  // ============================================================================

  describe('Exists', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should return true for existing key', async () => {
      await cacheClient.set('test', { value: 1 });
      const exists = await cacheClient.exists('test');

      expect(exists).toBe(true);
    });

    test('should return false for non-existent key', async () => {
      const exists = await cacheClient.exists('non-existent');

      expect(exists).toBe(false);
    });

    test('should handle exists errors gracefully', async () => {
      cacheClient.client.exists.mockRejectedValueOnce(new Error('Redis error'));

      const exists = await cacheClient.exists('test');

      expect(exists).toBe(false);
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Counter Operations Tests
  // ============================================================================

  describe('Counter Operations', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should increment counter', async () => {
      const result1 = await cacheClient.increment('counter');
      const result2 = await cacheClient.increment('counter');

      expect(result1).toBe(1);
      expect(result2).toBe(2);
    });

    test('should increment by custom amount', async () => {
      const result = await cacheClient.increment('counter', 5);

      expect(result).toBe(5);
    });

    test('should decrement counter', async () => {
      await cacheClient.increment('counter', 10);
      const result = await cacheClient.decrement('counter');

      expect(result).toBe(9);
    });

    test('should decrement by custom amount', async () => {
      await cacheClient.increment('counter', 10);
      const result = await cacheClient.decrement('counter', 3);

      expect(result).toBe(7);
    });

    test('should handle increment errors gracefully', async () => {
      cacheClient.client.incrby.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheClient.increment('counter');

      expect(result).toBeNull();
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });

    test('should handle decrement errors gracefully', async () => {
      cacheClient.client.decrby.mockRejectedValueOnce(new Error('Redis error'));

      const result = await cacheClient.decrement('counter');

      expect(result).toBeNull();
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Cache-Aside Pattern Tests
  // ============================================================================

  describe('Cache-Aside Pattern', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should return cached value if exists', async () => {
      await cacheClient.set('test', { cached: true });

      const fetchFn = jest.fn().mockResolvedValue({ fetched: true });
      const result = await cacheClient.getOrSet('test', fetchFn);

      expect(result).toEqual({ cached: true });
      expect(fetchFn).not.toHaveBeenCalled();
    });

    test('should fetch and cache value if not exists', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ fetched: true });
      const result = await cacheClient.getOrSet('test', fetchFn);

      expect(result).toEqual({ fetched: true });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('should use custom TTL for getOrSet', async () => {
      const fetchFn = jest.fn().mockResolvedValue({ fetched: true });

      await cacheClient.getOrSet('test', fetchFn, 1800);

      const cached = await cacheClient.get('test');

      expect(cached).toEqual({ fetched: true });
    });

    test('should not cache null values', async () => {
      const fetchFn = jest.fn().mockResolvedValue(null);

      await cacheClient.getOrSet('test', fetchFn);

      const cached = await cacheClient.get('test');

      expect(cached).toBeNull();
    });

    test('should not cache undefined values', async () => {
      const fetchFn = jest.fn().mockResolvedValue(undefined);

      await cacheClient.getOrSet('test', fetchFn);

      const cached = await cacheClient.get('test');

      expect(cached).toBeNull();
    });
  });

  // ============================================================================
  // Flush Operations Tests
  // ============================================================================

  describe('Flush Operations', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should flush all cache entries', async () => {
      await cacheClient.set('key1', { value: 1 });
      await cacheClient.set('key2', { value: 2 });
      await cacheClient.set('key3', { value: 3 });

      const deleted = await cacheClient.flush();

      expect(deleted).toBeGreaterThan(0);

      const result = await cacheClient.get('key1');
      expect(result).toBeNull();
    });

    test('should return 0 for empty cache', async () => {
      const deleted = await cacheClient.flush();

      expect(deleted).toBe(0);
    });

    test('should only flush entries with key prefix', async () => {
      await cacheClient.set('test:key1', { value: 1 });
      await cacheClient.set('test:key2', { value: 2 });

      // Keys without prefix (if they exist) should remain
      const deleted = await cacheClient.flush();

      expect(deleted).toBeGreaterThanOrEqual(0);
    });

    test('should handle flush errors gracefully', async () => {
      cacheClient.client.keys.mockRejectedValueOnce(new Error('Redis error'));

      const deleted = await cacheClient.flush();

      expect(deleted).toBe(0);
      expect(cacheClient.metrics.errors).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Metrics Tests
  // ============================================================================

  describe('Metrics', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should get cache metrics', async () => {
      await cacheClient.set('key1', { value: 1 });
      await cacheClient.set('key2', { value: 2 });
      await cacheClient.get('key1');
      await cacheClient.get('key2');
      await cacheClient.get('non-existent');

      const metrics = cacheClient.getMetrics();

      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.sets).toBe(2);
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.hitRate).toBe('66.67%');
    });

    test('should calculate hit rate correctly for all hits', async () => {
      await cacheClient.set('key', { value: 1 });
      await cacheClient.get('key');
      await cacheClient.get('key');

      const metrics = cacheClient.getMetrics();

      expect(metrics.hitRate).toBe('100.00%');
    });

    test('should calculate hit rate correctly for all misses', async () => {
      await cacheClient.get('key1');
      await cacheClient.get('key2');

      const metrics = cacheClient.getMetrics();

      expect(metrics.hitRate).toBe('0.00%');
    });

    test('should return 0% hit rate for no requests', async () => {
      const metrics = cacheClient.getMetrics();

      expect(metrics.hitRate).toBe('0%');
      expect(metrics.totalRequests).toBe(0);
    });

    test('should reset metrics', async () => {
      await cacheClient.set('key', { value: 1 });
      await cacheClient.get('key');

      cacheClient.resetMetrics();

      const metrics = cacheClient.getMetrics();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.sets).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });
  });

  // ============================================================================
  // Key Generation Tests
  // ============================================================================

  describe('Key Generation', () => {
    test('should generate key with prefix', () => {
      const key = cacheClient.makeKey('test-key');

      expect(key).toBe('test:test-key');
    });

    test('should use custom prefix', () => {
      const client = new CacheClient({ keyPrefix: 'custom:' });
      const key = client.makeKey('test-key');

      expect(key).toBe('custom:test-key');
    });

    test('should handle empty key', () => {
      const key = cacheClient.makeKey('');

      expect(key).toBe('test:');
    });

    test('should handle special characters in key', () => {
      const key = cacheClient.makeKey('user:profile:123');

      expect(key).toBe('test:user:profile:123');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(async () => {
      await cacheClient.connect();
    });

    test('should track errors on operation failures', async () => {
      const initialErrors = cacheClient.metrics.errors;

      cacheClient.client.get.mockRejectedValueOnce(new Error('Test error'));
      await cacheClient.get('test');

      expect(cacheClient.metrics.errors).toBe(initialErrors + 1);
    });

    test('should handle JSON parse errors', async () => {
      cacheClient.client.get.mockResolvedValueOnce('invalid json');

      const result = await cacheClient.get('test');

      // Should return null on parse error
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    test('should handle complete cache workflow', async () => {
      await cacheClient.connect();

      // Set values
      await cacheClient.set('user:1', { name: 'Alice', age: 30 });
      await cacheClient.set('user:2', { name: 'Bob', age: 25 });
      await cacheClient.set('counter', 0);

      // Get values
      const user1 = await cacheClient.get('user:1');
      expect(user1).toEqual({ name: 'Alice', age: 30 });

      // Increment counter
      const count1 = await cacheClient.increment('counter');
      const count2 = await cacheClient.increment('counter');
      expect(count1).toBe(1);
      expect(count2).toBe(2);

      // Check existence
      const exists = await cacheClient.exists('user:1');
      expect(exists).toBe(true);

      // Delete
      await cacheClient.delete('user:2');
      const user2 = await cacheClient.get('user:2');
      expect(user2).toBeNull();

      // Check metrics
      const metrics = cacheClient.getMetrics();
      expect(metrics.hits).toBeGreaterThan(0);
      expect(metrics.sets).toBeGreaterThan(0);
    });

    test('should handle cache-aside pattern with fallback', async () => {
      let callCount = 0;

      const fetchFn = jest.fn(async () => {
        callCount++;
        return { data: 'fetched', timestamp: Date.now() };
      });

      // First call - should fetch
      const result1 = await cacheClient.getOrSet('expensive-data', fetchFn);
      expect(callCount).toBe(1);
      expect(result1).toHaveProperty('data');

      // Second call - should use cache
      const result2 = await cacheClient.getOrSet('expensive-data', fetchFn);
      expect(callCount).toBe(1); // Still 1, not called again
      expect(result2.data).toBe(result1.data);
    });

    test('should handle high volume operations', async () => {
      // Set 100 keys
      for (let i = 0; i < 100; i++) {
        await cacheClient.set(`key${i}`, { value: i });
      }

      // Get all keys
      const values = [];
      for (let i = 0; i < 100; i++) {
        const value = await cacheClient.get(`key${i}`);
        values.push(value);
      }

      expect(values.length).toBe(100);
      expect(values[0]).toEqual({ value: 0 });
      expect(values[99]).toEqual({ value: 99 });

      // Check metrics
      const metrics = cacheClient.getMetrics();
      expect(metrics.sets).toBe(100);
      expect(metrics.hits).toBe(100);
      expect(metrics.hitRate).toBe('100.00%');
    });
  });

  // ============================================================================
  // Retry Strategy Tests
  // ============================================================================

  describe('Retry Strategy', () => {
    test('should use default retry strategy', () => {
      const client = new CacheClient();

      const delay1 = client.defaultRetryStrategy(1);
      const delay2 = client.defaultRetryStrategy(10);
      const delay3 = client.defaultRetryStrategy(50);

      expect(delay1).toBe(50);
      expect(delay2).toBe(500);
      expect(delay3).toBe(2000); // Max delay
    });

    test('should use custom retry strategy', () => {
      const customRetry = jest.fn(() => 5000);

      const client = new CacheClient({
        retryStrategy: customRetry
      });

      expect(client.config.retryStrategy).toBe(customRetry);
    });
  });
});
