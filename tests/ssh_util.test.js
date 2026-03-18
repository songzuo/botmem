/**
 * ssh_util.test.js - Unit tests for SSH utility module
 *
 * @version 1.0.0
 * @description Comprehensive tests for SSH connection pooling, command execution, and utility functions
 */

const {
  execCommand,
  execCommands,
  execCommandsParallel,
  createConnection,
  connectionPool,
  ConnectionPool,
  defaultServerConfig,
  loadConfig,
  printHeader,
  printSection,
  printError,
  printSuccess,
  printWarning,
  printInfo,
  setColorOutput,
  isColorOutputEnabled,
  colorize
} = require('../commander/utils/ssh_util');

// Mock the ssh2 module
jest.mock('ssh2', () => {
  const MockClient = jest.fn();
  MockClient.prototype.exec = jest.fn();
  MockClient.prototype.on = jest.fn();
  MockClient.prototype.connect = jest.fn();
  MockClient.prototype.end = jest.fn();
  return { Client: MockClient };
});

const { Client } = require('ssh2');

describe('ssh_util.js - Unit Tests', () => {
  let mockConn;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Create mock connection
    mockConn = new Client();

    // Reset connection pool
    connectionPool.pools.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================================
  // Connection Pool Tests
  // ============================================================================

  describe('ConnectionPool', () => {
    let pool;

    beforeEach(() => {
      pool = new ConnectionPool();
    });

    afterEach(() => {
      pool.closeAll();
    });

    describe('getKey()', () => {
      test('should generate unique key for connection', () => {
        const config1 = { host: 'test.com', port: 22, username: 'user' };
        const config2 = { host: 'test.com', port: 2222, username: 'user' };
        const key1 = pool.getKey(config1);
        const key2 = pool.getKey(config2);

        expect(key1).toBe('test.com:22:user');
        expect(key2).toBe('test.com:2222:user');
        expect(key1).not.toBe(key2);
      });
    });

    describe('isConnectionValid()', () => {
      test('should validate connection within age limit', () => {
        const entry = {
          conn: mockConn,
          lastUsed: Date.now(),
          createdAt: Date.now() - 10000 // 10 seconds old
        };
        const config = { poolMaxAge: 300000, poolIdleTimeout: 60000 };

        expect(pool.isConnectionValid(entry, config)).toBe(true);
      });

      test('should invalidate connection exceeding age limit', () => {
        const entry = {
          conn: mockConn,
          lastUsed: Date.now(),
          createdAt: Date.now() - 400000 // 400 seconds old
        };
        const config = { poolMaxAge: 300000, poolIdleTimeout: 60000 };

        expect(pool.isConnectionValid(entry, config)).toBe(false);
      });

      test('should invalidate connection exceeding idle timeout', () => {
        const entry = {
          conn: mockConn,
          lastUsed: Date.now() - 90000, // 90 seconds idle
          createdAt: Date.now() - 10000
        };
        const config = { poolMaxAge: 300000, poolIdleTimeout: 60000 };

        expect(pool.isConnectionValid(entry, config)).toBe(false);
      });
    });

    describe('cleanup()', () => {
      test('should remove idle connections', () => {
        const config = { host: 'test.com', port: 22, username: 'user', enablePool: true };
        const key = pool.getKey(config);
        pool.pools.set(key, []);

        const oldEntry = {
          conn: { end: jest.fn() },
          lastUsed: Date.now() - 90000,
          createdAt: Date.now() - 100000,
          busy: false
        };

        const activeEntry = {
          conn: mockConn,
          lastUsed: Date.now(),
          createdAt: Date.now() - 10000,
          busy: false
        };

        pool.pools.get(key).push(oldEntry, activeEntry);

        pool.cleanup();

        expect(pool.pools.get(key).length).toBe(1);
        expect(pool.pools.get(key)[0]).toBe(activeEntry);
        expect(oldEntry.conn.end).toHaveBeenCalled();
      });

      test('should remove empty pools', () => {
        const config = { host: 'test.com', port: 22, username: 'user', enablePool: true };
        const key = pool.getKey(config);
        pool.pools.set(key, []);

        pool.cleanup();

        expect(pool.pools.has(key)).toBe(false);
      });
    });

    describe('closeAll()', () => {
      test('should close all connections and clear pools', () => {
        const config1 = { host: 'test1.com', port: 22, username: 'user', enablePool: true };
        const config2 = { host: 'test2.com', port: 22, username: 'user', enablePool: true };

        const entry1 = { conn: { end: jest.fn() }, lastUsed: Date.now(), createdAt: Date.now(), busy: false };
        const entry2 = { conn: { end: jest.fn() }, lastUsed: Date.now(), createdAt: Date.now(), busy: false };

        pool.pools.set(pool.getKey(config1), [entry1]);
        pool.pools.set(pool.getKey(config2), [entry2]);

        pool.closeAll();

        expect(pool.pools.size).toBe(0);
        expect(entry1.conn.end).toHaveBeenCalled();
        expect(entry2.conn.end).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // Command Execution Tests
  // ============================================================================

  describe('execCommand()', () => {
    test('should execute command successfully', (done) => {
      let streamCallback = null;
      let dataHandler = null;
      let closeHandler = null;

      mockConn.exec.mockImplementation((cmd, callback) => {
        streamCallback = callback;
        return mockConn;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          // Save error handler
        }
        return mockConn;
      });

      execCommand('echo test', (err, result) => {
        expect(err).toBeNull();
        expect(result.output).toBe('test\n');
        expect(result.exitCode).toBe(0);
        done();
      });

      // Simulate stream creation
      const mockStream = {
        on: jest.fn((event, handler) => {
          if (event === 'data') dataHandler = handler;
          if (event === 'close') closeHandler = handler;
          return mockStream;
        }),
        stderr: {
          on: jest.fn()
        }
      };

      streamCallback(null, mockStream);

      // Simulate data and close
      setImmediate(() => {
        if (dataHandler) dataHandler(Buffer.from('test\n'));
        if (closeHandler) closeHandler(0, null);
      });
    });

    test('should handle command error with exit code', (done) => {
      let streamCallback = null;
      let dataHandler = null;
      let closeHandler = null;

      mockConn.exec.mockImplementation((cmd, callback) => {
        streamCallback = callback;
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      execCommand('ls /nonexistent', (err, result) => {
        expect(result.exitCode).toBe(1);
        expect(result.error).toBeDefined();
        done();
      });

      const mockStream = {
        on: jest.fn((event, handler) => {
          if (event === 'data') dataHandler = handler;
          if (event === 'close') closeHandler = handler;
          return mockStream;
        }),
        stderr: {
          on: jest.fn()
        }
      };

      streamCallback(null, mockStream);

      setImmediate(() => {
        if (dataHandler) dataHandler(Buffer.from(''));
        if (closeHandler) closeHandler(1, null);
      });
    });

    test('should handle stderr output', (done) => {
      let streamCallback = null;
      let dataHandler = null;
      let stderrHandler = null;
      let closeHandler = null;

      mockConn.exec.mockImplementation((cmd, callback) => {
        streamCallback = callback;
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      execCommand('command', (err, result) => {
        expect(result.errorOutput).toBe('error message\n');
        done();
      });

      const mockStream = {
        on: jest.fn((event, handler) => {
          if (event === 'data') dataHandler = handler;
          if (event === 'close') closeHandler = handler;
          return mockStream;
        }),
        stderr: {
          on: jest.fn((event, handler) => {
            if (event === 'data') stderrHandler = handler;
            return mockStream.stderr;
          })
        }
      };

      streamCallback(null, mockStream);

      setImmediate(() => {
        if (dataHandler) dataHandler(Buffer.from(''));
        if (stderrHandler) stderrHandler(Buffer.from('error message\n'));
        if (closeHandler) closeHandler(0, null);
      });
    });

    test('should handle command timeout', (done) => {
      jest.useFakeTimers();

      let streamCallback = null;

      mockConn.exec.mockImplementation((cmd, callback) => {
        streamCallback = callback;
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      const customConfig = { ...defaultServerConfig, execTimeout: 1000 };

      execCommand('sleep 100', (err, result) => {
        expect(err).toBeDefined();
        expect(err.code).toBe('TIMEOUT');
        expect(err.message).toContain('timeout');
        jest.useRealTimers();
        done();
      }, customConfig);

      const mockStream = {
        on: jest.fn(() => mockStream),
        stderr: { on: jest.fn() }
      };

      streamCallback(null, mockStream);

      // Advance timer past timeout
      jest.advanceTimersByTime(1000);
    });

    test('should handle connection errors', (done) => {
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(new Error('Connection failed'), null);
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      execCommand('test', (err, result) => {
        expect(err).toBeDefined();
        expect(err.details).toBeDefined();
        expect(err.details.phase).toBe('connection');
        done();
      });
    });

    test('should use custom config', (done) => {
      let streamCallback = null;
      let closeHandler = null;

      mockConn.exec.mockImplementation((cmd, callback) => {
        streamCallback = callback;
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      const customConfig = {
        host: 'custom-host.com',
        port: 2222,
        username: 'custom-user',
        password: 'custom-pass'
      };

      execCommand('test', (err, result) => {
        expect(err).toBeNull();
        done();
      }, customConfig);

      const mockStream = {
        on: jest.fn((event, handler) => {
          if (event === 'close') closeHandler = handler;
          return mockStream;
        }),
        stderr: { on: jest.fn() }
      };

      streamCallback(null, mockStream);

      setImmediate(() => {
        if (closeHandler) closeHandler(0, null);
      });
    });
  });

  // ============================================================================
  // Sequential Commands Tests
  // ============================================================================

  describe('execCommands()', () => {
    test('should execute commands sequentially', (done) => {
      const commands = ['echo test1', 'echo test2', 'echo test3'];
      let commandIndex = 0;

      mockConn.exec.mockImplementation((cmd, callback) => {
        const mockStream = {
          on: jest.fn((event, handler) => {
            if (event === 'data') {
              setImmediate(() => handler(Buffer.from(`output${commandIndex}\n`)));
            } else if (event === 'close') {
              setImmediate(() => handler(0, null));
            }
            return mockStream;
          }),
          stderr: { on: jest.fn() }
        };

        setImmediate(() => callback(null, mockStream));
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      execCommands(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results.length).toBe(3);
        expect(results[0].result.output).toBe('output0\n');
        expect(results[1].result.output).toBe('output1\n');
        expect(results[2].result.output).toBe('output2\n');
        done();
      });
    });

    test('should handle errors in sequential commands', (done) => {
      const commands = ['echo test1', 'invalid-command', 'echo test3'];
      let commandIndex = 0;

      mockConn.exec.mockImplementation((cmd, callback) => {
        const mockStream = {
          on: jest.fn((event, handler) => {
            if (event === 'close') {
              setImmediate(() => {
                if (cmd === 'invalid-command') {
                  handler(1, null);
                } else {
                  handler(0, null);
                }
              });
            }
            return mockStream;
          }),
          stderr: { on: jest.fn() }
        };

        setImmediate(() => callback(null, mockStream));
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      execCommands(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results.length).toBe(3);
        expect(results[1].result.exitCode).toBe(1);
        expect(results[2].result.exitCode).toBe(0);
        done();
      });
    });
  });

  // ============================================================================
  // Parallel Commands Tests
  // ============================================================================

  describe('execCommandsParallel()', () => {
    test('should execute commands in parallel', (done) => {
      const commands = ['echo test1', 'echo test2', 'echo test3'];

      mockConn.exec.mockImplementation((cmd, callback) => {
        const mockStream = {
          on: jest.fn((event, handler) => {
            if (event === 'data') {
              setImmediate(() => handler(Buffer.from(`${cmd}\n`)));
            } else if (event === 'close') {
              setImmediate(() => handler(0, null));
            }
            return mockStream;
          }),
          stderr: { on: jest.fn() }
        };

        setImmediate(() => callback(null, mockStream));
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      execCommandsParallel(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results.length).toBe(3);
        expect(results[0].result.output).toBe('echo test1\n');
        expect(results[1].result.output).toBe('echo test2\n');
        expect(results[2].result.output).toBe('echo test3\n');
        done();
      });
    });

    test('should handle partial failures in parallel execution', (done) => {
      const commands = ['echo test1', 'invalid-command', 'echo test3'];

      mockConn.exec.mockImplementation((cmd, callback) => {
        const mockStream = {
          on: jest.fn((event, handler) => {
            if (event === 'close') {
              setImmediate(() => {
                if (cmd === 'invalid-command') {
                  handler(1, null);
                } else {
                  handler(0, null);
                }
              });
            }
            return mockStream;
          }),
          stderr: { on: jest.fn() }
        };

        setImmediate(() => callback(null, mockStream));
        return mockConn;
      });

      mockConn.on.mockImplementation(() => mockConn);

      execCommandsParallel(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results.length).toBe(3);
        expect(results[1].result.exitCode).toBe(1);
        done();
      });
    });
  });

  // ============================================================================
  // Connection Creation Tests
  // ============================================================================

  describe('createConnection()', () => {
    test('should create connection with pool enabled by default', async () => {
      const config = { host: 'test.com', username: 'user', password: 'pass', enablePool: true };

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          setImmediate(() => handler());
        }
        return mockConn;
      });

      mockConn.connect.mockReturnValue(mockConn);

      const conn = await createConnection(config);

      expect(conn).toBeInstanceOf(Client);
    });

    test('should create direct connection when pool disabled', async () => {
      const config = { host: 'test.com', username: 'user', password: 'pass', enablePool: false };

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          setImmediate(() => handler());
        }
        return mockConn;
      });

      mockConn.connect.mockReturnValue(mockConn);

      const conn = await createConnection(config, false);

      expect(conn).toBeInstanceOf(Client);
      expect(mockConn.connect).toHaveBeenCalledWith(config);
    });

    test('should retry connection on failure', async () => {
      const config = {
        host: 'test.com',
        username: 'user',
        password: 'pass',
        maxRetries: 2,
        retryBaseDelay: 100
      };

      let attempts = 0;
      mockConn.on.mockImplementation((event, handler) => {
        attempts++;
        if (event === 'ready' && attempts === 2) {
          setImmediate(() => handler());
        } else if (event === 'error' && attempts === 1) {
          setImmediate(() => handler(new Error('Connection failed')));
        }
        return mockConn;
      });

      mockConn.connect.mockReturnValue(mockConn);

      const conn = await createConnection(config);

      expect(conn).toBeInstanceOf(Client);
      expect(attempts).toBe(2);
    });

    test('should fail after max retries', async () => {
      const config = {
        host: 'test.com',
        username: 'user',
        password: 'pass',
        maxRetries: 2,
        retryBaseDelay: 10
      };

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          setImmediate(() => handler(new Error('Connection failed')));
        }
        return mockConn;
      });

      mockConn.connect.mockReturnValue(mockConn);

      await expect(createConnection(config)).rejects.toThrow('Connection failed');
    });
  });

  // ============================================================================
  // Utility Function Tests
  // ============================================================================

  describe('Color and Output Functions', () => {
    describe('colorize()', () => {
      test('should apply color to text', () => {
        const result = colorize('test', 'red');
        expect(result).toContain('\x1b[31m');
        expect(result).toContain('test');
        expect(result).toContain('\x1b[0m');
      });

      test('should return plain text when color output disabled', () => {
        setColorOutput(false);
        const result = colorize('test', 'red');
        expect(result).toBe('test');
        setColorOutput(true);
      });

      test('should handle invalid color names', () => {
        const result = colorize('test', 'invalid');
        expect(result).toContain('test');
      });
    });

    describe('setColorOutput() and isColorOutputEnabled()', () => {
      test('should enable and disable color output', () => {
        setColorOutput(false);
        expect(isColorOutputEnabled()).toBe(false);

        setColorOutput(true);
        expect(isColorOutputEnabled()).toBe(true);
      });

      test('should respect TTY availability', () => {
        const originalTTY = process.stdout.isTTY;
        process.stdout.isTTY = false;

        expect(isColorOutputEnabled()).toBe(false);

        process.stdout.isTTY = originalTTY;
      });
    });
  });

  describe('Print Functions', () => {
    let consoleLogSpy;
    let consoleErrorSpy;
    let consoleWarnSpy;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    test('printHeader() should print formatted header', () => {
      printHeader('Test Header');

      expect(consoleLogSpy).toHaveBeenCalled();
      const firstCall = consoleLogSpy.mock.calls[0][0];
      expect(firstCall).toContain('Test Header');
    });

    test('printSection() should print section title', () => {
      printSection('Test Section');

      expect(consoleLogSpy).toHaveBeenCalled();
      const firstCall = consoleLogSpy.mock.calls[0][0];
      expect(firstCall).toContain('Test Section');
    });

    test('printError() should print error message', () => {
      printError('Test error', new Error('Error details'));

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('printError() should print error details when available', () => {
      const error = new Error('Test error');
      error.details = {
        message: 'Detailed error',
        suggestion: 'Try again',
        host: 'test.com',
        port: 22
      };

      printError('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Detailed error'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Try again'));
    });

    test('printSuccess() should print success message', () => {
      printSuccess('Test success');

      expect(consoleLogSpy).toHaveBeenCalled();
      const firstCall = consoleLogSpy.mock.calls[0][0];
      expect(firstCall).toContain('✓');
      expect(firstCall).toContain('Test success');
    });

    test('printWarning() should print warning message', () => {
      printWarning('Test warning');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const firstCall = consoleWarnSpy.mock.calls[0][0];
      expect(firstCall).toContain('⚠');
      expect(firstCall).toContain('Test warning');
    });

    test('printInfo() should print info message', () => {
      printInfo('Test info');

      expect(consoleLogSpy).toHaveBeenCalled();
      const firstCall = consoleLogSpy.mock.calls[0][0];
      expect(firstCall).toContain('ℹ');
      expect(firstCall).toContain('Test info');
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  describe('Configuration', () => {
    test('defaultServerConfig should have correct defaults', () => {
      expect(defaultServerConfig.host).toBe('7zi.com');
      expect(defaultServerConfig.port).toBe(22);
      expect(defaultServerConfig.username).toBe('root');
      expect(defaultServerConfig.readyTimeout).toBe(30000);
      expect(defaultServerConfig.maxRetries).toBe(3);
      expect(defaultServerConfig.execTimeout).toBe(60000);
      expect(defaultServerConfig.enablePool).toBe(true);
    });

    test('loadConfig() should return default config when file not found', () => {
      const config = loadConfig();
      expect(config).toEqual(defaultServerConfig);
    });

    test('loadConfig() should merge with default config', () => {
      const config = loadConfig();
      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('username');
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    test('should execute multiple commands with connection pooling', (done) => {
      const commands = ['echo test1', 'echo test2'];

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') setImmediate(() => handler());
        return mockConn;
      });

      mockConn.connect.mockReturnValue(mockConn);

      mockConn.exec.mockImplementation((cmd, callback) => {
        const mockStream = {
          on: jest.fn((event, handler) => {
            if (event === 'data') {
              setImmediate(() => handler(Buffer.from(`${cmd}\n`)));
            } else if (event === 'close') {
              setImmediate(() => handler(0, null));
            }
            return mockStream;
          }),
          stderr: { on: jest.fn() }
        };

        setImmediate(() => callback(null, mockStream));
        return mockConn;
      });

      execCommands(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results.length).toBe(2);
        done();
      }, { enablePool: true });
    });

    test('should handle timeout and error scenarios gracefully', (done) => {
      jest.useFakeTimers();

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') setImmediate(() => handler());
        return mockConn;
      });

      mockConn.connect.mockReturnValue(mockConn);

      mockConn.exec.mockImplementation((cmd, callback) => {
        // Don't call callback - simulate hanging command
        return mockConn;
      });

      const customConfig = { ...defaultServerConfig, execTimeout: 1000 };

      execCommand('sleep', (err, result) => {
        expect(err).toBeDefined();
        expect(err.code).toBe('TIMEOUT');
        jest.useRealTimers();
        done();
      }, customConfig);

      jest.advanceTimersByTime(1000);
    });
  });
});
