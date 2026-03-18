/**
 * check_helpers_v2.test.js - Unit tests for check_helpers.js
 *
 * @version 1.0.0
 * @description Comprehensive unit tests with mocked SSH connections
 */

const {
  checkService,
  checkProcess,
  checkLoad,
  checkDiskUsage,
  execCommand,
  execCommands,
  checkPorts,
  createConnection,
  validateConfig,
  escapeGrepPattern,
  getOutputString,
  safeParseJSON,
  simpleCheck,
  checkPM2,
  formatPM2List,
  chain,
  quickCheck,
  defaultServerConfig
} = require('../commander/utils/check_helpers');

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

// Helper function to create a mock stream
function createMockStream(stdoutOutput, exitCode = 0) {
  let dataHandler = null;
  let closeHandler = null;
  let stderrHandler = null;

  const mockStream = {
    on: jest.fn((event, handler) => {
      if (event === 'data') {
        dataHandler = handler;
      } else if (event === 'close') {
        closeHandler = handler;
      }
      return mockStream;
    }),
    stderr: {
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          stderrHandler = handler;
        }
        return mockStream.stderr;
      })
    },
    destroy: jest.fn(),
    _emitData: () => {
      if (dataHandler && stdoutOutput) {
        dataHandler(Buffer.from(stdoutOutput));
      }
    },
    _emitStderr: (data) => {
      if (stderrHandler) {
        stderrHandler(Buffer.from(data));
      }
    },
    _emitClose: () => {
      if (closeHandler) {
        closeHandler(exitCode);
      }
    }
  };

  return mockStream;
}

describe('check_helpers.js - Unit Tests', () => {
  let mockConn;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Create mock connection
    mockConn = new Client();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validateConfig()', () => {
    test('should validate correct config', () => {
      const config = {
        host: 'example.com',
        username: 'user',
        password: 'pass'
      };
      expect(() => validateConfig(config)).not.toThrow();
    });

    test('should throw error when host is missing', () => {
      const config = {
        username: 'user',
        password: 'pass'
      };
      expect(() => validateConfig(config)).toThrow('SSH host is required');
    });

    test('should throw error when username is missing', () => {
      const config = {
        host: 'example.com',
        password: 'pass'
      };
      expect(() => validateConfig(config)).toThrow('SSH username is required');
    });

    test('should throw error when both password and privateKey are missing', () => {
      const config = {
        host: 'example.com',
        username: 'user'
      };
      expect(() => validateConfig(config)).toThrow('SSH password or privateKey is required');
    });

    test('should validate config with privateKey', () => {
      const config = {
        host: 'example.com',
        username: 'user',
        privateKey: 'key-content'
      };
      expect(() => validateConfig(config)).not.toThrow();
    });
  });

  describe('escapeGrepPattern()', () => {
    test('should escape special regex characters', () => {
      expect(escapeGrepPattern('test.com')).toBe('test\\.com');
      expect(escapeGrepPattern('test*')).toBe('test\\*');
      expect(escapeGrepPattern('test+')).toBe('test\\+');
      expect(escapeGrepPattern('test?')).toBe('test\\?');
      expect(escapeGrepPattern('test^')).toBe('test\\^');
      expect(escapeGrepPattern('test$')).toBe('test\\$');
      expect(escapeGrepPattern('test.')).toBe('test\\.');
    });

    test('should handle array of patterns', () => {
      const result = escapeGrepPattern(['pattern1', 'pattern2*']);
      expect(result).toBe('pattern1|pattern2\\*');
    });

    test('should handle empty string', () => {
      expect(escapeGrepPattern('')).toBe('');
    });

    test('should handle special characters in array', () => {
      const result = escapeGrepPattern(['test.com', 'service-name', 'node_123']);
      // Note: escapeGrepPattern only escapes ., *, +, ?, ^, $, |, (), [], {}
      // It does NOT escape hyphens in the middle of strings
      expect(result).toBe('test\\.com|service-name|node_123');
    });
  });

  describe('getOutputString()', () => {
    test('should return string when input is string', () => {
      expect(getOutputString('test output')).toBe('test output');
    });

    test('should return stdout when result has stdout', () => {
      const result = { stdout: 'success', stderr: 'error', exitCode: 0 };
      expect(getOutputString(result)).toBe('success');
    });

    test('should return stderr when result has no stdout but has stderr', () => {
      const result = { stderr: 'error output', exitCode: 1 };
      expect(getOutputString(result)).toBe('error output');
    });

    test('should return empty string for empty result object', () => {
      expect(getOutputString({})).toBe('');
    });

    test('should return empty string for null', () => {
      expect(getOutputString(null)).toBe('');
    });
  });

  describe('safeParseJSON()', () => {
    test('should parse valid JSON string', () => {
      const result = safeParseJSON('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    test('should return fallback for invalid JSON', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = safeParseJSON('invalid json', []);
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    test('should parse JSON from result object', () => {
      const result = { stdout: '[1, 2, 3]', exitCode: 0 };
      const parsed = safeParseJSON(result);
      expect(parsed).toEqual([1, 2, 3]);
    });

    test('should return fallback for empty string', () => {
      const result = safeParseJSON('   ', { default: true });
      expect(result).toEqual({ default: true });
    });

    test('should return default fallback when not specified', () => {
      const result = safeParseJSON('');
      expect(result).toEqual([]);
    });
  });

  describe('execCommand()', () => {
    test('should execute command and return result', async () => {
      const mockStream = createMockStream('test output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await execCommand(mockConn, 'echo test');
      expect(result.stdout).toBe('test output\n');
      expect(result.exitCode).toBe(0);
    });

    test('should merge stderr to stdout when mergeStderr is true', async () => {
      const mockStream = createMockStream('', 1);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitStderr('error message\n');
          mockStream._emitClose();
        });
      });

      const result = await execCommand(mockConn, 'ls /nonexistent', { mergeStderr: true });
      expect(result.stdout).toContain('error message\n');
      expect(result.exitCode).toBe(1);
    });

    test('should not merge stderr when mergeStderr is false', async () => {
      const mockStream = createMockStream('', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitStderr('stderr output\n');
          mockStream._emitClose();
        });
      });

      const result = await execCommand(mockConn, 'test', { mergeStderr: false });
      expect(result.stderr).toBe('stderr output\n');
      expect(result.stdout).toBe('');
    });

    test('should reject on stream error', async () => {
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(new Error('Connection failed'), null);
      });

      await expect(execCommand(mockConn, 'test')).rejects.toThrow('Command exec failed');
    });

    test('should handle timeout', async () => {
      jest.useFakeTimers();

      const mockStream = createMockStream('', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
      });

      const promise = execCommand(mockConn, 'sleep 100', { timeout: 1000 });

      // Advance timer past timeout
      jest.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow('Command timeout after 1000ms');

      jest.useRealTimers();
    });

    test('should handle no timeout (timeout: 0)', async () => {
      const mockStream = createMockStream('test\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await execCommand(mockConn, 'echo test', { timeout: 0 });
      expect(result.stdout).toBe('test\n');
    });
  });

  describe('checkService()', () => {
    test('should return running: true for active service', async () => {
      const mockStream = createMockStream('active\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkService(mockConn, 'nginx');
      expect(result.running).toBe(true);
      expect(result.status).toBe('active');
    });

    test('should return running: false for inactive service', async () => {
      const mockStream = createMockStream('inactive\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkService(mockConn, 'nginx');
      expect(result.running).toBe(false);
      expect(result.status).toBe('inactive');
    });

    test('should escape service name with special characters', async () => {
      const mockStream = createMockStream('active\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkService(mockConn, 'service-name.com');
      expect(result.running).toBe(true);
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('service-name\\.com'),
        expect.any(Function)
      );
    });

    test('should handle failed service status', async () => {
      const mockStream = createMockStream('failed\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkService(mockConn, 'nginx');
      expect(result.running).toBe(false);
      expect(result.status).toBe('failed');
    });
  });

  describe('checkProcess()', () => {
    test('should check process by pattern', async () => {
      const mockStream = createMockStream('root 1234 1.0 2.3 123456 ? Ssl 10:00 0:00 node server.js\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkProcess(mockConn, 'node');
      expect(result.raw).toContain('node server.js');
      expect(result.count).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    test('should use custom ps format', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkProcess(mockConn, 'nginx', { psFormat: 'ef' });
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('ps ef'),
        expect.any(Function)
      );
    });

    test('should escape process pattern', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkProcess(mockConn, 'process*.js');
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('process\\*\\.js'),
        expect.any(Function)
      );
    });

    test('should include grep -v grep in command', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkProcess(mockConn, 'node');
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('grep -v grep'),
        expect.any(Function)
      );
    });
  });

  describe('checkLoad()', () => {
    test('should get system load', async () => {
      const mockStream = createMockStream(' 10:00:00 up 1 day, 2:30, 2 users, load average: 0.5, 0.6, 0.7\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkLoad(mockConn);
      expect(result.stdout).toContain('load average');
    });

    test('should call simpleCheck with uptime command', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkLoad(mockConn);
      expect(mockConn.exec).toHaveBeenCalledWith('uptime', expect.any(Function));
    });

    test('should handle empty load output', async () => {
      const mockStream = createMockStream('\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkLoad(mockConn);
      expect(result.stdout).toBe('\n');
    });
  });

  describe('checkDiskUsage()', () => {
    test('should check disk usage for default path', async () => {
      const mockStream = createMockStream('/dev/sda1 100G 50G 45G 53% /\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkDiskUsage(mockConn);
      expect(result.stdout).toContain('50G');
    });

    test('should check disk usage for custom path', async () => {
      const mockStream = createMockStream('/dev/sda2 200G 100G 90G 53% /var\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkDiskUsage(mockConn, '/var');
      expect(result.stdout).toContain('/var');
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('df -h /var'),
        expect.any(Function)
      );
    });

    test('should escape path with special characters', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkDiskUsage(mockConn, '/path.with-spaces');
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('/path\\.with-spaces'),
        expect.any(Function)
      );
    });

    test('should use tail -n 1 to get last line', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkDiskUsage(mockConn);
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('tail -n 1'),
        expect.any(Function)
      );
    });
  });

  describe('checkPorts()', () => {
    test('should check single port with ss command', async () => {
      const mockStream = createMockStream('tcp LISTEN 0 128 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=1234,fd=6))\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkPorts(mockConn, 80);
      expect(result.raw).toContain(':80');
      expect(result.ports).toEqual([80]);
      expect(result.mode).toBe('quick');
      expect(result.timestamp).toBeDefined();
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('ss --tln'),
        expect.any(Function)
      );
    });

    test('should check multiple ports', async () => {
      const mockStream = createMockStream('tcp LISTEN 0 128 0.0.0.0:80 0.0.0.0:*\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkPorts(mockConn, [80, 443]);
      expect(result.raw).toContain(':80');
      expect(result.ports).toEqual([80, 443]);
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('80|443'),
        expect.any(Function)
      );
    });

    test('should use netstat when useSs is false', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkPorts(mockConn, 80, { useSs: false });
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('netstat --tln'),
        expect.any(Function)
      );
    });

    test('should filter by protocol udp', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkPorts(mockConn, 53, { protocol: 'udp' });
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('ss --uln'),
        expect.any(Function)
      );
    });

    test('should not filter protocol when protocol is all', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkPorts(mockConn, 80, { protocol: 'all' });
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringMatching(/ss\s+-ln/),
        expect.any(Function)
      );
    });

    test('should escape port numbers in pattern', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await checkPorts(mockConn, [8080, 9090]);
      expect(mockConn.exec).toHaveBeenCalledWith(
        expect.stringContaining('8080|9090'),
        expect.any(Function)
      );
    });
  });

  describe('simpleCheck()', () => {
    test('should execute simple command', async () => {
      const mockStream = createMockStream('file1.txt\nfile2.txt\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await simpleCheck(mockConn, 'ls -la');
      expect(result.stdout).toContain('file1.txt');
    });

    test('should pass options to execCommand', async () => {
      const mockStream = createMockStream('output\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      await simpleCheck(mockConn, 'test', { timeout: 5000 });
      expect(mockConn.exec).toHaveBeenCalled();
    });
  });

  describe('checkPM2()', () => {
    test('should parse PM2 JSON output', async () => {
      const pm2List = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node server.js',
            pm_uptime: Date.now() - 60000
          },
          monit: {
            memory: 104857600
          }
        }
      ];

      const mockStream = createMockStream(JSON.stringify(pm2List), 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkPM2(mockConn);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('app1');
    });

    test('should return empty array on invalid JSON', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockStream = createMockStream('invalid json', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkPM2(mockConn);
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });

    test('should return empty array on empty output', async () => {
      const mockStream = createMockStream('   ', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkPM2(mockConn);
      expect(result).toEqual([]);
    });
  });

  describe('formatPM2List()', () => {
    test('should format PM2 list with basic info', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node server.js'
          }
        },
        {
          name: 'app2',
          pm2_env: {
            status: 'stopped',
            exec_command: 'node worker.js'
          }
        }
      ];

      const result = formatPM2List(list);
      expect(result).toContain('=== PM2 进程列表 ===');
      expect(result).toContain('app1: online');
      expect(result).toContain('app2: stopped');
    });

    test('should show uptime when showUptime is true', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node server.js',
            pm_uptime: Date.now() - 120000
          }
        }
      ];

      const result = formatPM2List(list, { showUptime: true });
      expect(result).toContain('Uptime:');
    });

    test('should show memory when showMemory is true', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node server.js'
          },
          monit: {
            memory: 104857600
          }
        }
      ];

      const result = formatPM2List(list, { showMemory: true });
      expect(result).toContain('Memory:');
    });

    test('should handle empty list', () => {
      const result = formatPM2List([]);
      expect(result).toContain('(无进程)');
    });

    test('should handle list with invalid items', () => {
      const list = [
        { invalid: 'item' },
        {
          name: 'valid',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js'
          }
        }
      ];

      const result = formatPM2List(list);
      expect(result).toContain('valid: online');
    });
  });

  describe('createConnection()', () => {
    test('should create connection with password', () => {
      const { conn, config } = createConnection({
        host: 'test.com',
        username: 'user',
        password: 'pass'
      });
      expect(conn).toBeInstanceOf(Client);
      expect(config.host).toBe('test.com');
      expect(config.username).toBe('user');
      expect(config.password).toBe('pass');
    });

    test('should merge custom config with defaults', () => {
      const customConfig = {
        host: 'custom-host.com',
        port: 2222,
        username: 'custom-user',
        password: 'pass'
      };

      const { conn, config } = createConnection(customConfig);
      expect(config.host).toBe('custom-host.com');
      expect(config.port).toBe(2222);
      expect(config.username).toBe('custom-user');
      expect(config.keepaliveInterval).toBe(defaultServerConfig.keepaliveInterval);
    });

    test('should throw error for invalid config', () => {
      expect(() => createConnection({ host: 'test.com' })).toThrow('Invalid SSH config');
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle checkLoad with connection error', async () => {
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(new Error('Connection lost'), null);
      });

      await expect(checkLoad(mockConn)).rejects.toThrow('Command exec failed');
    });

    test('should handle checkDiskUsage with non-existent path', async () => {
      const mockStream = createMockStream('', 1);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitClose();
        });
      });

      const result = await checkDiskUsage(mockConn, '/nonexistent');
      expect(result.exitCode).toBe(1);
    });

    test('should handle checkPorts with no matching ports', async () => {
      const mockStream = createMockStream('', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitClose();
        });
      });

      const result = await checkPorts(mockConn, 9999);
      expect(result.raw).toBe('');
      expect(result.parsed).toEqual([]);
    });

    test('should handle checkProcess with no matching processes', async () => {
      const mockStream = createMockStream('', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitClose();
        });
      });

      const result = await checkProcess(mockConn, 'nonexistent-process');
      expect(result.raw).toBe('');
      expect(result.count).toBe(0);
      expect(result.parsed).toEqual([]);
    });

    test('should handle checkService with unknown service', async () => {
      const mockStream = createMockStream('unknown\n', 0);
      mockConn.exec.mockImplementation((cmd, callback) => {
        callback(null, mockStream);
        setImmediate(() => {
          mockStream._emitData();
          mockStream._emitClose();
        });
      });

      const result = await checkService(mockConn, 'nonexistent-service');
      expect(result.running).toBe(false);
      expect(result.status).toBe('unknown');
    });
  });
});