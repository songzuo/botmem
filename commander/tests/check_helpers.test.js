/**
 * check_helpers.test.js - check_helpers 模块测试
 * 
 * 测试 SSH 连接工具模块的核心功能
 */

const { 
  createConnection, 
  execCommand, 
  execCommands,
  checkPorts,
  checkProcess,
  formatPM2List,
  defaultServerConfig
} = require('./utils/check_helpers');

// 模拟 SSH2 Client
jest.mock('ssh2', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn().mockReturnThis(),
        connect: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation((cmd, cb) => {
          const mockStream = {
            on: jest.fn().mockReturnThis(),
            stderr: { on: jest.fn().mockReturnThis() }
          };
          cb(null, mockStream);
          // 模拟异步返回数据
          setTimeout(() => {
            mockStream.on.mock.calls.forEach(call => {
              if (call[0] === 'data' && call[1]) {
                call[1](Buffer.from('mock output'));
              }
            });
            mockStream.on.mock.calls.forEach(call => {
              if (call[0] === 'close' && call[1]) {
                call[1]();
              }
            });
          }, 10);
          return mockStream;
        }),
        end: jest.fn()
      };
    })
  };
});

describe('check_helpers 模块测试', () => {
  
  describe('createConnection', () => {
    test('应返回默认配置连接', () => {
      const { conn, config } = createConnection();
      expect(conn).toBeDefined();
      expect(config.host).toBe('7zi.com');
      expect(config.port).toBe(22);
    });

    test('应合并自定义配置', () => {
      const customConfig = { host: 'custom.com', port: 2222 };
      const { config } = createConnection(customConfig);
      expect(config.host).toBe('custom.com');
      expect(config.port).toBe(2222);
      expect(config.username).toBe('root'); // 默认值保留
    });
  });

  describe('execCommands', () => {
    test('应导出 execCommands 函数', () => {
      expect(typeof execCommands).toBe('function');
    });
  });

  describe('checkPorts', () => {
    test('应导出 checkPorts 函数', () => {
      expect(typeof checkPorts).toBe('function');
    });
  });

  describe('checkProcess', () => {
    test('应导出 checkProcess 函数', () => {
      expect(typeof checkProcess).toBe('function');
    });
  });

  describe('formatPM2List', () => {
    test('应正确格式化 PM2 进程列表', () => {
      const mockList = [
        {
          name: 'bot1',
          pm2_env: { status: 'online', exec_command: 'node app.js' }
        },
        {
          name: 'bot2', 
          pm2_env: { status: 'stopped', exec_command: 'node server.js' }
        }
      ];
      
      const output = formatPM2List(mockList);
      expect(output).toContain('=== PM2 进程列表 ===');
      expect(output).toContain('bot1: online');
      expect(output).toContain('bot2: stopped');
    });

    test('应处理空列表', () => {
      const output = formatPM2List([]);
      expect(output).toContain('=== PM2 进程列表 ===');
    });
  });

  describe('defaultServerConfig', () => {
    test('应包含必要的默认配置', () => {
      expect(defaultServerConfig.host).toBe('7zi.com');
      expect(defaultServerConfig.port).toBe(22);
      expect(defaultServerConfig.username).toBe('root');
      expect(defaultServerConfig.readyTimeout).toBe(30000);
    });
  });
});

// 运行测试: node --experimental-vm-modules node_modules/.bin/jest tests/check_helpers.test.js
// 或使用: node tests/check_helpers.test.js (需要 jest)
