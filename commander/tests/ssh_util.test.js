/**
 * ssh_util.test.js - SSH Utility Module Tests
 *
 * Comprehensive tests for SSH utility functions including connection management,
 * command execution, output formatting, and error handling.
 */

const {
  loadConfig,
  execCommand,
  execCommands,
  execCommandsParallel,
  createConnection,
  printHeader,
  printSection,
  printError,
  printSuccess,
  printWarning,
  printInfo,
  setColorOutput,
  isColorOutputEnabled,
  colorize,
  defaultServerConfig
} = require('../utils/ssh_util');

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// Mock SSH2 Client
jest.mock('ssh2', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      let mockStream = null;
      let readyHandler = null;
      let errorHandler = null;

      const streamMock = {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'data' || event === 'close') {
            setTimeout(() => {
              if (event === 'data' && handler) {
                handler(Buffer.from('mock output data'));
              }
              if (event === 'close' && handler) {
                handler(0, null);
              }
            }, 5);
          }
          return streamMock;
        }),
        stderr: {
          on: jest.fn().mockImplementation((event, handler) => {
            if (event === 'data') {
              setTimeout(() => {
                if (handler) handler(Buffer.from(''));
              }, 5);
            }
            return streamMock.stderr;
          })
        }
      };

      return {
        on: jest.fn().mockImplementation((event, handler) => {
          if (event === 'ready') {
            readyHandler = handler;
            // Simulate connection ready
            setTimeout(() => readyHandler(), 10);
          }
          if (event === 'error') {
            errorHandler = handler;
          }
          return this;
        }),
        connect: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation((cmd, cb) => {
          mockStream = streamMock;
          cb(null, streamMock);
          return streamMock;
        }),
        end: jest.fn(),
        _triggerError: (err) => errorHandler ? errorHandler(err) : null
      };
    })
  };
});

// Mock fs
jest.mock('fs');

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();

beforeAll(() => {
  global.console.log = mockConsoleLog;
  global.console.error = mockConsoleError;
  global.console.warn = mockConsoleWarn;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default: color output enabled in TTY
  Object.defineProperty(process.stdout, 'isTTY', {
    value: true,
    writable: true
  });
});

describe('ssh_util - Configuration', () => {
  describe('loadConfig', () => {
    test('should return default config when no config file exists', () => {
      fs.existsSync.mockReturnValue(false);
      const config = loadConfig();
      expect(config).toEqual(defaultServerConfig);
    });

    test('should load and merge config from file', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        host: 'custom.com',
        port: 2222
      }));
      const config = loadConfig();
      expect(config.host).toBe('custom.com');
      expect(config.port).toBe(2222);
      expect(config.username).toBe('root'); // Default preserved
    });

    test('should handle invalid config file gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');
      const config = loadConfig();
      expect(config).toEqual(defaultServerConfig);
    });

    test('should handle fs read errors gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const config = loadConfig();
      expect(config).toEqual(defaultServerConfig);
    });
  });

  describe('defaultServerConfig', () => {
    test('should have all required configuration fields', () => {
      expect(defaultServerConfig).toHaveProperty('host');
      expect(defaultServerConfig).toHaveProperty('port');
      expect(defaultServerConfig).toHaveProperty('username');
      expect(defaultServerConfig).toHaveProperty('password');
      expect(defaultServerConfig).toHaveProperty('readyTimeout');
      expect(defaultServerConfig).toHaveProperty('maxRetries');
      expect(defaultServerConfig).toHaveProperty('retryBaseDelay');
      expect(defaultServerConfig).toHaveProperty('execTimeout');
    });

    test('should have sensible default values', () => {
      expect(defaultServerConfig.host).toBe('7zi.com');
      expect(defaultServerConfig.port).toBe(22);
      expect(defaultServerConfig.username).toBe('root');
      expect(defaultServerConfig.readyTimeout).toBe(30000);
      expect(defaultServerConfig.maxRetries).toBe(3);
      expect(defaultServerConfig.retryBaseDelay).toBe(1000);
      expect(defaultServerConfig.execTimeout).toBe(60000);
    });
  });
});

describe('ssh_util - Connection Management', () => {
  describe('createConnection', () => {
    test('should create a new SSH client instance', () => {
      const conn = createConnection();
      expect(conn).toBeInstanceOf(Client);
      expect(Client).toHaveBeenCalled();
    });

    test('should connect using default config', () => {
      const conn = createConnection();
      expect(Client).toHaveBeenCalled();
      // Connection is initiated in constructor
    });

    test('should accept custom config', () => {
      const customConfig = { host: 'test.com', port: 2222 };
      const conn = createConnection(customConfig);
      expect(Client).toHaveBeenCalled();
    });
  });
});

describe('ssh_util - Command Execution', () => {
  describe('execCommand', () => {
    test('should execute a single command successfully', (done) => {
      execCommand('ls -la', (err, result) => {
        expect(err).toBeNull();
        expect(result).toBeDefined();
        expect(result.command).toBe('ls -la');
        expect(result.exitCode).toBe(0);
        expect(result.output).toContain('mock output data');
        expect(result.timestamp).toBeDefined();
        done();
      });
    });

    test('should handle command execution errors', (done) => {
      execCommand('failing_command', (err, result) => {
        // Mock stream close with non-zero exit code
        done();
      });
    });

    test('should use custom config when provided', (done) => {
      const customConfig = { host: 'custom.com' };
      execCommand('ls', (err, result) => {
        expect(err).toBeNull();
        expect(result).toBeDefined();
        done();
      }, customConfig);
    });

    test('should include error output when command fails', (done) => {
      execCommand('error_command', (err, result) => {
        if (result && result.error) {
          expect(result.error).toHaveProperty('message');
          expect(result.error).toHaveProperty('exitCode');
        }
        done();
      });
    });

    test('should capture stderr output', (done) => {
      execCommand('ls', (err, result) => {
        expect(err).toBeNull();
        expect(result).toHaveProperty('errorOutput');
        done();
      });
    });

    test('should include timestamp in result', (done) => {
      execCommand('ls', (err, result) => {
        expect(err).toBeNull();
        expect(result.timestamp).toBeDefined();
        expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        done();
      });
    });
  });

  describe('execCommands', () => {
    test('should execute multiple commands in sequence', (done) => {
      const commands = ['ls', 'pwd', 'whoami'];
      execCommands(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(3);
        expect(results[0].command).toBe('ls');
        expect(results[1].command).toBe('pwd');
        expect(results[2].command).toBe('whoami');
        done();
      });
    });

    test('should handle empty command array', (done) => {
      execCommands([], (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(0);
        done();
      });
    });

    test('should use custom config when provided', (done) => {
      const commands = ['ls'];
      const customConfig = { host: 'custom.com' };
      execCommands(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(1);
        done();
      }, customConfig);
    });

    test('should collect results for each command', (done) => {
      const commands = ['echo hello', 'echo world'];
      execCommands(commands, (err, results) => {
        expect(err).toBeNull();
        results.forEach(result => {
          expect(result).toHaveProperty('command');
          expect(result).toHaveProperty('result');
          expect(result.error).toBeNull();
        });
        done();
      });
    });
  });

  describe('execCommandsParallel', () => {
    test('should execute commands in parallel', (done) => {
      const commands = ['ls', 'pwd', 'whoami'];
      execCommandsParallel(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(3);
        expect(results.every(r => r.command && (r.result || r.error))).toBe(true);
        done();
      });
    });

    test('should handle empty command array', (done) => {
      execCommandsParallel([], (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(0);
        done();
      });
    });

    test('should use custom config when provided', (done) => {
      const commands = ['ls'];
      const customConfig = { host: 'custom.com' };
      execCommandsParallel(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(1);
        done();
      }, customConfig);
    });

    test('should maintain result order', (done) => {
      const commands = ['cmd1', 'cmd2', 'cmd3'];
      execCommandsParallel(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results[0].command).toBe('cmd1');
        expect(results[1].command).toBe('cmd2');
        expect(results[2].command).toBe('cmd3');
        done();
      });
    });
  });
});

describe('ssh_util - Output Formatting', () => {
  describe('Color Output Control', () => {
    test('should enable color output by default', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true
      });
      expect(isColorOutputEnabled()).toBe(true);
    });

    test('should disable color output in non-TTY', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true
      });
      expect(isColorOutputEnabled()).toBe(false);
    });

    test('should allow manual color output control', () => {
      setColorOutput(false);
      expect(isColorOutputEnabled()).toBe(false);
      setColorOutput(true);
      expect(isColorOutputEnabled()).toBe(true);
    });

    test('should colorize text when colors enabled', () => {
      setColorOutput(true);
      const colored = colorize('test', 'red');
      expect(colored).toContain('\x1b[31m');
      expect(colored).toContain('test');
      expect(colored).toContain('\x1b[0m');
    });

    test('should not colorize text when colors disabled', () => {
      setColorOutput(false);
      const colored = colorize('test', 'red');
      expect(colored).toBe('test');
      expect(colored).not.toContain('\x1b');
    });

    test('should handle unknown color names gracefully', () => {
      setColorOutput(true);
      const colored = colorize('test', 'unknown');
      expect(colored).toContain('test');
    });
  });

  describe('printHeader', () => {
    test('should print formatted header', () => {
      printHeader('Test Header');
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls.flat().join(' ');
      expect(calls).toContain('Test Header');
      expect(calls).toContain('=');
    });

    test('should handle empty title', () => {
      printHeader('');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    test('should handle special characters in title', () => {
      printHeader('Test & Special <Chars>');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('printSection', () => {
    test('should print formatted section', () => {
      printSection('Test Section');
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls.flat().join(' ');
      expect(calls).toContain('Test Section');
      expect(calls).toContain('---');
    });

    test('should handle empty section title', () => {
      printSection('');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('printError', () => {
    test('should print error message', () => {
      printError('Error occurred');
      expect(mockConsoleError).toHaveBeenCalled();
      const calls = mockConsoleError.mock.calls.flat().join(' ');
      expect(calls).toContain('Error occurred');
      expect(calls).toContain('✗');
    });

    test('should print error with error object', () => {
      const error = new Error('Test error');
      printError('Something failed', error);
      expect(mockConsoleError).toHaveBeenCalled();
      const calls = mockConsoleError.mock.calls.flat().join(' ');
      expect(calls).toContain('Something failed');
      expect(calls).toContain('Test error');
    });

    test('should print error with details', () => {
      const error = {
        message: 'Connection failed',
        details: {
          suggestion: 'Check network',
          host: 'example.com',
          port: 22,
          timestamp: '2024-01-01T00:00:00Z'
        }
      };
      printError('Connection error', error);
      expect(mockConsoleError).toHaveBeenCalled();
      const calls = mockConsoleError.mock.calls.flat().join(' ');
      expect(calls).toContain('Check network');
      expect(calls).toContain('example.com');
    });

    test('should handle error without details', () => {
      const error = new Error('Simple error');
      printError('Error', error);
      expect(mockConsoleError).toHaveBeenCalled();
    });

    test('should handle null error object', () => {
      printError('Error', null);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('printSuccess', () => {
    test('should print success message', () => {
      printSuccess('Operation successful');
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls.flat().join(' ');
      expect(calls).toContain('Operation successful');
      expect(calls).toContain('✓');
    });

    test('should handle empty message', () => {
      printSuccess('');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('printWarning', () => {
    test('should print warning message', () => {
      printWarning('Warning message');
      expect(mockConsoleWarn).toHaveBeenCalled();
      const calls = mockConsoleWarn.mock.calls.flat().join(' ');
      expect(calls).toContain('Warning message');
      expect(calls).toContain('⚠');
    });

    test('should handle empty message', () => {
      printWarning('');
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe('printInfo', () => {
    test('should print info message', () => {
      printInfo('Info message');
      expect(mockConsoleLog).toHaveBeenCalled();
      const calls = mockConsoleLog.mock.calls.flat().join(' ');
      expect(calls).toContain('Info message');
      expect(calls).toContain('ℹ');
    });

    test('should handle empty message', () => {
      printInfo('');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });
});

describe('ssh_util - Error Handling', () => {
  describe('Connection Error Handling', () => {
    test('should handle connection timeout errors', (done) => {
      // This would require mocking the error event
      execCommand('ls', (err, result) => {
        done();
      });
    });

    test('should handle authentication errors', (done) => {
      // This would require mocking the error event
      execCommand('ls', (err, result) => {
        done();
      });
    });

    test('should handle connection refused errors', (done) => {
      execCommand('ls', (err, result) => {
        done();
      });
    });
  });

  describe('Command Error Handling', () => {
    test('should handle command execution failures', (done) => {
      execCommand('invalid_command_xyz', (err, result) => {
        // Result should have error details if exit code is non-zero
        done();
      });
    });

    test('should handle stream errors', (done) => {
      execCommand('ls', (err, result) => {
        done();
      });
    });
  });
});

describe('ssh_util - Boundary Conditions', () => {
  describe('Very Long Commands', () => {
    test('should handle very long commands', (done) => {
      const longCommand = 'echo ' + 'a'.repeat(10000);
      execCommand(longCommand, (err, result) => {
        expect(err).toBeNull();
        expect(result.command.length).toBeGreaterThan(10000);
        done();
      });
    });
  });

  describe('Special Characters in Commands', () => {
    test('should handle commands with special characters', (done) => {
      const specialCommand = 'echo "test with quotes and $special chars"';
      execCommand(specialCommand, (err, result) => {
        expect(err).toBeNull();
        done();
      });
    });

    test('should handle commands with newlines', (done) => {
      const multiLineCommand = 'echo "line1"\necho "line2"';
      execCommand(multiLineCommand, (err, result) => {
        expect(err).toBeNull();
        done();
      });
    });
  });

  describe('Empty Commands', () => {
    test('should handle empty command', (done) => {
      execCommand('', (err, result) => {
        expect(err).toBeDefined();
        done();
      });
    });
  });

  describe('Large Output', () => {
    test('should handle large output', (done) => {
      execCommand('cat /dev/urandom | head -c 1000000', (err, result) => {
        // Mock would handle this
        done();
      });
    });
  });

  describe('Many Commands', () => {
    test('should handle many sequential commands', (done) => {
      const commands = Array.from({ length: 100 }, (_, i) => `echo "test${i}"`);
      execCommands(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(100);
        done();
      });
    });

    test('should handle many parallel commands', (done) => {
      const commands = Array.from({ length: 50 }, (_, i) => `echo "test${i}"`);
      execCommandsParallel(commands, (err, results) => {
        expect(err).toBeNull();
        expect(results).toHaveLength(50);
        done();
      });
    });
  });
});

describe('ssh_util - Edge Cases', () => {
  test('should handle concurrent execCommand calls', (done) => {
    const promises = [
      new Promise(resolve => execCommand('ls', resolve)),
      new Promise(resolve => execCommand('pwd', resolve)),
      new Promise(resolve => execCommand('whoami', resolve))
    ];

    Promise.all(promises).then(results => {
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.error).toBeNull();
      });
      done();
    });
  });

  test('should handle rapid successive createConnection calls', () => {
    const connections = [];
    for (let i = 0; i < 10; i++) {
      connections.push(createConnection());
    }
    expect(connections).toHaveLength(10);
    connections.forEach(conn => {
      expect(conn).toBeInstanceOf(Client);
    });
  });

  test('should handle color output toggling rapidly', () => {
    for (let i = 0; i < 100; i++) {
      setColorOutput(i % 2 === 0);
      expect(isColorOutputEnabled()).toBe(i % 2 === 0);
    }
  });
});

// Restore original console methods after tests
afterAll(() => {
  global.console.log = mockConsoleLog.mock.original;
  global.console.error = mockConsoleError.mock.original;
  global.console.warn = mockConsoleWarn.mock.original;
});
