/**
 * check_port.test.js - check_port.js 脚本测试
 *
 * 测试单端口检测功能，包括基本功能、错误处理和边界情况
 */

const { Client } = require('ssh2');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mock SSH2 Client
jest.mock('ssh2', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      const mockStream = {
        on: jest.fn().mockReturnThis(),
        stderr: { on: jest.fn().mockReturnThis() }
      };

      const eventHandlers = {};

      return {
        on: jest.fn().mockImplementation((event, handler) => {
          if (handler) {
            eventHandlers[event] = handler;
          }
          return this;
        }),
        emit: jest.fn().mockImplementation((event, ...args) => {
          if (eventHandlers[event]) {
            eventHandlers[event](...args);
          }
        }),
        connect: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation((cmd, cb) => {
          cb(null, mockStream);
          return mockStream;
        }),
        end: jest.fn()
      };
    })
  };
});

describe('check_port.js - 单端口检测脚本测试', () => {

  describe('SSH 连接配置', () => {
    test('应使用正确的主机、端口和凭据', () => {
      const { Client } = require('ssh2');
      const mockConn = new Client();
      mockConn.connect.mockImplementation((config) => {
        expect(config.host).toBe('7zi.com');
        expect(config.port).toBe(22);
        expect(config.username).toBe('root');
        expect(config.password).toBe('ge2099334$ZZ');
        return mockConn;
      });
      mockConn.connect({
        host: '7zi.com',
        port: 22,
        username: 'root',
        password: 'ge2099334$ZZ'
      });
    });

    test('应处理连接错误', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          setTimeout(() => {
            handler(new Error('Connection refused'));
          }, 10);
        }
        return mockConn;
      });

      mockConn.on('error', (err) => {
        expect(err.message).toBe('Connection refused');
        done();
      });

      mockConn.emit('error', new Error('Connection refused'));
    });
  });

  describe('端口检测命令', () => {
    test('应检测指定的端口 (3000, 3010, 5000, 3002, 10087)', () => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        expect(cmd).toContain('ss -tlnp');
        expect(cmd).toContain('grep -E');
        expect(cmd).toContain('3000|3010|5000|3002|10087');
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };
        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      mockConn.emit('ready');
    });

    test('应正确处理命令执行错误', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };
        cb(new Error('Command execution failed'), null);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      mockConn.on('ready', () => {
        mockConn.exec('ss -tlnp', (err, stream) => {
          expect(err).toBeTruthy();
          expect(err.message).toBe('Command execution failed');
          done();
        });
      });

      mockConn.emit('ready');
    });
  });

  describe('输出处理', () => {
    test('应正确输出找到的端口信息', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();
      const testData = 'LISTEN    0      128          *:3000              *:*                   users:(("node",pid=1234,fd=6))';

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        // 模拟数据输出
        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'data') {
            setTimeout(() => handler(Buffer.from(testData)), 5);
          } else if (event === 'end') {
            setTimeout(() => handler(), 10);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      let receivedData = '';
      const originalLog = console.log;
      console.log = (data) => {
        receivedData = data;
      };

      mockConn.emit('ready');

      setTimeout(() => {
        console.log = originalLog;
        expect(receivedData).toContain('3000');
        done();
      }, 50);
    });

    test('应显示"未找到匹配的端口"当没有输出时', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'end') {
            setTimeout(() => handler(), 5);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      let receivedData = '';
      const originalLog = console.log;
      console.log = (data) => {
        receivedData = data;
      };

      mockConn.emit('ready');

      setTimeout(() => {
        console.log = originalLog;
        expect(receivedData).toContain('未找到匹配的端口');
        done();
      }, 30);
    });
  });

  describe('错误输出处理', () => {
    test('应处理并显示 stderr 错误', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();
      const errorMsg = 'ss: command not found';

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: {
            on: jest.fn().mockReturnThis()
          }
        };

        mockStream.stderr.on.mockImplementation((event, handler) => {
          if (event === 'data') {
            setTimeout(() => handler(Buffer.from(errorMsg)), 5);
          }
          return mockStream.stderr;
        });

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'end') {
            setTimeout(() => handler(), 10);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      let receivedError = '';
      const originalErrorLog = console.error;
      console.error = (data) => {
        receivedError = data;
      };

      mockConn.emit('ready');

      setTimeout(() => {
        console.error = originalErrorLog;
        expect(receivedError).toContain('错误输出');
        done();
      }, 30);
    });

    test('应处理 stream 错误', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('Stream error')), 5);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      let receivedError = '';
      const originalErrorLog = console.error;
      console.error = (data) => {
        receivedError = data;
      };

      mockConn.emit('ready');

      setTimeout(() => {
        console.error = originalErrorLog;
        expect(receivedError).toContain('Stream error');
        done();
      }, 30);
    });
  });

  describe('连接清理', () => {
    test('成功后应关闭 SSH 连接', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'end') {
            setTimeout(() => handler(), 5);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      mockConn.emit('ready');

      setTimeout(() => {
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 20);
    });

    test('命令执行错误后应关闭连接并退出', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        cb(new Error('Command failed'), null);
        return {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      mockConn.emit('ready');

      setTimeout(() => {
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 20);
    });
  });

  describe('边界情况', () => {
    test('应处理空输出', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'data') {
            setTimeout(() => handler(Buffer.from('')), 5);
          } else if (event === 'end') {
            setTimeout(() => handler(), 10);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      mockConn.emit('ready');

      setTimeout(() => {
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 30);
    });

    test('应处理包含特殊字符的输出', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();
      const specialData = 'LISTEN    0      128    [::]:3000           [::]:*    users:(("node",pid=1234,fd=6))';

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'data') {
            setTimeout(() => handler(Buffer.from(specialData)), 5);
          } else if (event === 'end') {
            setTimeout(() => handler(), 10);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      mockConn.emit('ready');

      setTimeout(() => {
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 30);
    });

    test('应处理多个端口同时监听', (done) => {
      const { Client } = require('ssh2');
      const mockConn = new Client();
      const multiPortData = `LISTEN    0      128          *:3000              *:*                   users:(("node",pid=1234,fd=6))
LISTEN    0      128          *:3010              *:*                   users:(("node",pid=1235,fd=7))
LISTEN    0      128          *:5000              *:*                   users:(("node",pid=1236,fd=8))`;

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'data') {
            setTimeout(() => handler(Buffer.from(multiPortData)), 5);
          } else if (event === 'end') {
            setTimeout(() => handler(), 10);
          }
          return mockStream;
        });

        cb(null, mockStream);
        return mockStream;
      });

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      mockConn.emit('ready');

      setTimeout(() => {
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 30);
    });
  });
});
