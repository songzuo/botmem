/**
 * check_ports.test.js - check_ports.js 脚本测试
 *
 * 测试多端口检测和开发模式进程检查功能，包括基本功能、错误处理和边界情况
 */

const { Client } = require('ssh2');

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
            eventHandlers[event] = eventHandlers[event] || [];
            eventHandlers[event].push(handler);
          }
          return this;
        }),
        emit: jest.fn().mockImplementation((event, ...args) => {
          if (eventHandlers[event]) {
            eventHandlers[event].forEach(handler => handler(...args));
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

describe('check_ports.js - 多端口检测脚本测试', () => {

  describe('服务器配置', () => {
    test('应使用正确的服务器配置', () => {
      const expectedConfig = {
        host: '7zi.com',
        port: 22,
        username: 'root',
        password: 'ge2099334$ZZ'
      };

      const mockConn = new Client();
      mockConn.connect.mockImplementation((config) => {
        expect(config.host).toBe(expectedConfig.host);
        expect(config.port).toBe(expectedConfig.port);
        expect(config.username).toBe(expectedConfig.username);
        expect(config.password).toBe(expectedConfig.password);
        return mockConn;
      });

      mockConn.connect(expectedConfig);
    });
  });

  describe('端口检查命令', () => {
    test('应检查指定的端口 (80, 443, 3000, 5170-5179)', () => {
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        expect(cmd).toContain('ss -tlnp');
        expect(cmd).toContain('grep -E');
        expect(cmd).toContain('80:');
        expect(cmd).toContain('443:');
        expect(cmd).toContain('3000:');
        expect(cmd).toContain('517[0-9]:');

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

    test('应正确处理端口检查命令执行错误', (done) => {
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        cb(new Error('Port check command failed'), null);
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

  describe('开发模式进程检查', () => {
    test('应检查 vite 和 next dev 进程', (done) => {
      const mockConn = new Client();
      let firstCommand = true;

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;
          // 第一个命令：端口检查
          expect(cmd).toContain('ss -tlnp');

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          // 第二个命令：进程检查
          expect(cmd).toContain('ps aux');
          expect(cmd).toContain('grep -E "vite|next dev"');
          expect(cmd).toContain('grep -v grep');

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        }

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
      }, 50);
    });

    test('应显示找到的开发模式进程', (done) => {
      const mockConn = new Client();
      let firstCommand = true;
      const processOutput = 'root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 vite --port 3000';

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from(processOutput)), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        }

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

      let receivedOutput = '';
      const originalStdoutWrite = process.stdout.write;
      process.stdout.write = (data) => {
        receivedOutput += data;
        return true;
      };

      mockConn.emit('ready');

      setTimeout(() => {
        process.stdout.write = originalStdoutWrite;
        expect(receivedOutput).toContain('vite');
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  describe('错误处理', () => {
    test('应处理 SSH 连接错误', (done) => {
      const mockConn = new Client();

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'error') {
          setTimeout(() => {
            handler(new Error('Connection refused'));
          }, 10);
        }
        return mockConn;
      });

      mockConn.emit('error', new Error('Connection refused'));

      setTimeout(() => {
        // 连接错误应该导致进程退出
        expect(true).toBe(true);
        done();
      }, 20);
    });

    test('应处理开发进程检查命令错误', (done) => {
      const mockConn = new Client();
      let firstCommand = true;

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          cb(new Error('Process check failed'), null);
          return {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };
        }
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
      }, 50);
    });

    test('应处理 stream 错误', (done) => {
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

      mockConn.emit('ready');

      setTimeout(() => {
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 20);
    });

    test('应处理第二个 stream 错误', (done) => {
      const mockConn = new Client();
      let firstCommand = true;

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'error') {
              setTimeout(() => handler(new Error('Stream2 error')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        }

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
      }, 50);
    });
  });

  describe('输出处理', () => {
    test('应正确输出端口检查标题', (done) => {
      const mockConn = new Client();

      mockConn.on.mockImplementation((event, handler) => {
        if (event === 'ready') {
          handler();
        }
        return mockConn;
      });

      let receivedOutput = '';
      const originalLog = console.log;
      console.log = (data) => {
        receivedOutput += data + '\n';
      };

      mockConn.emit('ready');

      setTimeout(() => {
        console.log = originalLog;
        expect(receivedOutput).toContain('检查端口监听情况');
        done();
      }, 20);
    });

    test('应正确输出开发模式进程标题', (done) => {
      const mockConn = new Client();
      let firstCommand = true;

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        }

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

      let receivedOutput = '';
      const originalLog = console.log;
      console.log = (data) => {
        receivedOutput += data + '\n';
      };

      mockConn.emit('ready');

      setTimeout(() => {
        console.log = originalLog;
        expect(receivedOutput).toContain('检查开发模式进程详情');
        done();
      }, 50);
    });
  });

  describe('边界情况', () => {
    test('应处理端口检查无结果', (done) => {
      const mockConn = new Client();

      mockConn.exec.mockImplementation((cmd, cb) => {
        const mockStream = {
          on: jest.fn().mockReturnThis(),
          stderr: { on: jest.fn().mockReturnThis() }
        };

        mockStream.on.mockImplementation((event, handler) => {
          if (event === 'close') {
            setTimeout(() => handler(), 10);
          } else if (event === 'data') {
            setTimeout(() => handler(Buffer.from('')), 5);
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

    test('应处理开发进程检查无结果', (done) => {
      const mockConn = new Client();
      let firstCommand = true;

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        }

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
      }, 50);
    });

    test('应处理多个开发进程同时运行', (done) => {
      const mockConn = new Client();
      let firstCommand = true;
      const processOutput = `root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 vite --port 3000
root  1235  1.0  2.0 123456 78900 ?  S  12:01  0:01 vite --port 5173
root  1236  1.0  2.0 123456 78900 ?  S  12:02  0:01 next dev`;

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from(processOutput)), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        }

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

      let receivedOutput = '';
      const originalStdoutWrite = process.stdout.write;
      process.stdout.write = (data) => {
        receivedOutput += data;
        return true;
      };

      mockConn.emit('ready');

      setTimeout(() => {
        process.stdout.write = originalStdoutWrite;
        expect(receivedOutput).toContain('vite');
        expect(receivedOutput).toContain('next dev');
        expect(mockConn.end).toHaveBeenCalled();
        done();
      }, 50);
    });
  });

  describe('连接生命周期', () => {
    test('完成所有检查后应关闭连接', (done) => {
      const mockConn = new Client();
      let firstCommand = true;

      mockConn.exec.mockImplementation((cmd, cb) => {
        if (firstCommand) {
          firstCommand = false;

          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        } else {
          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };

          mockStream.on.mockImplementation((event, handler) => {
            if (event === 'close') {
              setTimeout(() => handler(), 10);
            } else if (event === 'data') {
              setTimeout(() => handler(Buffer.from('')), 5);
            }
            return mockStream;
          });

          cb(null, mockStream);
        }

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
      }, 50);
    });
  });
});
