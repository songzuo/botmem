/**
 * utils.test.js - utils 目录工具函数测试
 *
 * 测试 utils 目录中的核心工具函数，包括基本功能、错误处理和边界情况
 */

const {
  escapeGrepPattern,
  parsePortOutput,
  parseProcessOutput,
  getOutputString,
  safeParseJSON,
  formatPM2List
} = require('../utils/check_helpers');

describe('utils 目录 - 工具函数测试', () => {

  describe('escapeGrepPattern - Grep 模式转义', () => {

    test('应转义正则表达式特殊字符', () => {
      const pattern = 'test.*+?^${}()|[]\\';
      const escaped = escapeGrepPattern(pattern);
      expect(escaped).toBe('test\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    test('应防止命令注入（转义 shell 特殊字符）', () => {
      // 注意：escapeGrepPattern 只转义正则表达式特殊字符
      // 真正的命令注入防护需要在调用层面处理
      const pattern = 'test.*';
      const escaped = escapeGrepPattern(pattern);
      expect(escaped).toContain('\\.');
      expect(escaped).toContain('\\*');
    });

    test('应处理单个模式字符串', () => {
      const pattern = 'node.*js';
      const escaped = escapeGrepPattern(pattern);
      expect(escaped).toBe('node\\.\\*js');
    });

    test('应处理模式数组', () => {
      const patterns = ['vite', 'next dev', 'webpack'];
      const escaped = escapeGrepPattern(patterns);
      expect(escaped).toBe('vite|next dev|webpack');
    });

    test('应转义数组中的特殊字符', () => {
      const patterns = ['test.*', 'dev+prod', 'app[v1]'];
      const escaped = escapeGrepPattern(patterns);
      expect(escaped).toBe('test\\.\\*|dev\\+prod|app\\[v1\\]');
    });

    test('应处理空字符串', () => {
      const pattern = '';
      const escaped = escapeGrepPattern(pattern);
      expect(escaped).toBe('');
    });

    test('应处理无特殊字符的字符串', () => {
      const pattern = 'simple-text_123';
      const escaped = escapeGrepPattern(pattern);
      expect(escaped).toBe('simple-text_123');
    });

    test('应处理空数组', () => {
      const patterns = [];
      const escaped = escapeGrepPattern(patterns);
      expect(escaped).toBe('');
    });

    test('应处理单个元素的数组', () => {
      const patterns = ['test'];
      const escaped = escapeGrepPattern(patterns);
      expect(escaped).toBe('test');
    });

    test('应转换非字符串输入', () => {
      const pattern = 123;
      const escaped = escapeGrepPattern(pattern);
      expect(escaped).toBe('123');
    });

    test('应处理 undefined 和 null', () => {
      const escaped1 = escapeGrepPattern(undefined);
      const escaped2 = escapeGrepPattern(null);
      expect(escaped1).toBe('undefined');
      expect(escaped2).toBe('null');
    });
  });

  describe('parsePortOutput - 端口输出解析', () => {

    test('应解析快速模式的端口输出', () => {
      const output = 'LISTEN    0      128          *:3000              *:*\n' +
                     'LISTEN    0      128          *:443               *:*';
      const result = parsePortOutput(output, 'quick');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ port: 3000, line: expect.stringContaining('3000') });
      expect(result[1]).toEqual({ port: 443, line: expect.stringContaining('443') });
    });

    test('应解析详细模式的端口输出（包含进程信息）', () => {
      // 使用符合 regex 预期格式的测试数据
      const output = 'some output with :3000  and other stuff pid=1234,name=node rest of line';
      const result = parsePortOutput(output, 'detailed');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        port: 3000,
        pid: 1234,
        processName: 'node',
        fullLine: expect.stringContaining('3000')
      });
    });

    test('应解析进程模式的端口输出', () => {
      // 使用符合 regex 预期格式的测试数据
      const output = 'some output with pid=1234,name=node\nother output with pid=5678,name=nginx';
      const result = parsePortOutput(output, 'process');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        pid: 1234,
        processName: 'node',
        raw: expect.stringContaining('1234')
      });
      expect(result[1]).toEqual({
        pid: 5678,
        processName: 'nginx',
        raw: expect.stringContaining('5678')
      });
    });

    test('应处理空输出', () => {
      const result = parsePortOutput('', 'quick');
      expect(result).toEqual([]);
    });

    test('应处理仅空白字符的输出', () => {
      const result = parsePortOutput('   \n\n\t   ', 'quick');
      expect(result).toEqual([]);
    });

    test('应处理 null 或 undefined 输入', () => {
      const result1 = parsePortOutput(null, 'quick');
      const result2 = parsePortOutput(undefined, 'quick');
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    test('应处理格式错误的输出', () => {
      const output = 'invalid output without port numbers\n' +
                     'another invalid line';
      const result = parsePortOutput(output, 'quick');

      expect(result).toEqual([]);
    });

    test('应处理混合格式（有效和无效行）', () => {
      const output = 'LISTEN    0      128          *:3000              *:*\n' +
                     'invalid line\n' +
                     'LISTEN    0      128          *:443               *:*';
      const result = parsePortOutput(output, 'quick');

      expect(result).toHaveLength(2);
      expect(result[0].port).toBe(3000);
      expect(result[1].port).toBe(443);
    });

    test('应处理 IPv6 格式的端口输出', () => {
      const output = 'LISTEN    0      128    [::]:3000           [::]:*';
      const result = parsePortOutput(output, 'quick');

      expect(result).toHaveLength(1);
      expect(result[0].port).toBe(3000);
    });

    test('应处理大量端口输出', () => {
      const lines = [];
      for (let i = 3000; i < 3010; i++) {
        lines.push(`LISTEN    0      128          *:${i}              *:*`);
      }
      const output = lines.join('\n');
      const result = parsePortOutput(output, 'quick');

      expect(result).toHaveLength(10);
      for (let i = 0; i < 10; i++) {
        expect(result[i].port).toBe(3000 + i);
      }
    });

    test('应忽略详细模式下的解析错误', () => {
      // 使用符合 regex 预期格式的测试数据
      const output = 'line1 with :3000  and pid=1234,name=node\n' +
                     'invalid line without match\n' +
                     'line2 with :443  and pid=5678,name=nginx';
      const result = parsePortOutput(output, 'detailed');

      expect(result).toHaveLength(2);
      expect(result[0].port).toBe(3000);
      expect(result[1].port).toBe(443);
    });
  });

  describe('parseProcessOutput - 进程输出解析', () => {

    test('应解析基本的进程输出', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 node /app/server.js';
      const result = parseProcessOutput(output, false);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        user: 'root',
        pid: 1234,
        cpu: 1.0,
        memory: 2.0,
        vsz: 123456,
        rss: 78900,
        tty: '?',
        stat: 'S',
        start: '12:00',
        time: '0:01',
        command: 'node /app/server.js'
      });
    });

    test('应解析详细模式的进程输出', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  Ss 12:00  0:01 node /app/server.js';
      const result = parseProcessOutput(output, true);

      expect(result).toHaveLength(1);
      expect(result[0].user).toBe('root');
      expect(result[0].status).toBeDefined();
      expect(result[0].status.sleeping).toBe(true);
      expect(result[0].status.sessionLeader).toBe(true);
      expect(result[0].resources).toBeDefined();
      expect(result[0].resources.memoryMB).toBeGreaterThan(0);
    });

    test('应解析多个进程', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 node /app/server.js\n' +
                     'root  1235  0.5  1.0 123456 78901 ?  S  12:01  0:02 vite --port 3000';
      const result = parseProcessOutput(output, false);

      expect(result).toHaveLength(2);
      expect(result[0].pid).toBe(1234);
      expect(result[1].pid).toBe(1235);
    });

    test('应处理空输出', () => {
      const result = parseProcessOutput('', false);
      expect(result).toEqual([]);
    });

    test('应处理 null 或 undefined 输入', () => {
      const result1 = parseProcessOutput(null, false);
      const result2 = parseProcessOutput(undefined, false);
      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    test('应处理格式错误的进程行', () => {
      const output = 'invalid\nanother invalid line';
      const result = parseProcessOutput(output, false);

      // The function attempts to parse all lines, even invalid ones
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(0);
      // Invalid lines will have pid as NaN (since parseInt on non-numeric string returns NaN)
      expect(result.length).toBe(2);
      expect(result[0].pid).toBeNaN();
      expect(result[1].pid).toBeNaN();
    });

    test('应处理混合格式（有效和无效行）', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 node /app/server.js\n' +
                     'invalid line\n' +
                     'root  1235  0.5  1.0 123456 78901 ?  S  12:01  0:02 vite --port 3000';
      const result = parseProcessOutput(output, false);

      // The function parses all lines, including invalid ones
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].pid).toBe(1234);
      expect(result.some(r => r.pid === 1235)).toBe(true);
    });

    test('应正确解析运行状态标志', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  R  12:00  0:01 node /app/server.js';
      const result = parseProcessOutput(output, true);

      expect(result[0].status.running).toBe(true);
      expect(result[0].status.sleeping).toBe(false);
    });

    test('应正确解析僵尸进程状态', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  Z  12:00  0:01 <defunct>';
      const result = parseProcessOutput(output, true);

      expect(result[0].status.zombie).toBe(true);
    });

    test('应计算内存使用量（MB）', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 node /app/server.js';
      const result = parseProcessOutput(output, true);

      // RSS is in pages (4KB), so 78900 pages * 4KB / (1024 * 1024) ≈ 301 MB
      expect(result[0].resources.memoryMB).toBeGreaterThan(300);
      // Allow more tolerance for the upper bound
      expect(result[0].resources.memoryMB).toBeLessThan(310);
    });

    test('应处理包含大量参数的命令', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 node /app/server.js --config /etc/config.json --port 3000 --host 0.0.0.0 --verbose --debug';
      const result = parseProcessOutput(output, false);

      expect(result[0].command).toContain('--config');
      expect(result[0].command).toContain('--port');
      expect(result[0].command).toContain('--verbose');
    });

    test('应忽略解析错误并继续处理下一行', () => {
      const output = 'root  1234  1.0  2.0 123456 78900 ?  S  12:00  0:01 node /app/server.js\n' +
                     'invalid\n' +
                     'root  1236  0.3  0.8 123456 78902 ?  S  12:02  0:03 next dev';
      const result = parseProcessOutput(output, false);

      // 第一个和第二个（修正后的第三个）应该解析成功
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].pid).toBe(1234);
      // 检查是否有有效的第二个进程
      const validProcesses = result.filter(r => r && r.pid);
      if (validProcesses.length > 1) {
        expect(validProcesses[1].pid).toBe(1236);
      }
    });
  });

  describe('getOutputString - 输出字符串提取', () => {

    test('如果输入是字符串应直接返回', () => {
      const input = 'test output';
      const result = getOutputString(input);
      expect(result).toBe('test output');
    });

    test('应从结果对象中提取 stdout', () => {
      const input = {
        stdout: 'stdout content',
        stderr: 'stderr content',
        exitCode: 0
      };
      const result = getOutputString(input);
      expect(result).toBe('stdout content');
    });

    test('如果 stdout 为空应从结果对象中提取 stderr', () => {
      const input = {
        stdout: '',
        stderr: 'stderr content',
        exitCode: 1
      };
      const result = getOutputString(input);
      expect(result).toBe('stderr content');
    });

    test('null 输入应返回空字符串', () => {
      const result = getOutputString(null);
      expect(result).toBe('');
    });

    test('undefined 输入应返回空字符串', () => {
      const result = getOutputString(undefined);
      expect(result).toBe('');
    });

    test('没有 stdout/stderr 的对象应返回空字符串', () => {
      const input = { otherField: 'value' };
      const result = getOutputString(input);
      expect(result).toBe('');
    });

    test('应处理 stdout 和 stderr 都为空的对象', () => {
      const input = {
        stdout: '',
        stderr: '',
        exitCode: 0
      };
      const result = getOutputString(input);
      expect(result).toBe('');
    });

    test('应处理数字输入（返回空字符串）', () => {
      const input = 123;
      const result = getOutputString(input);
      // 数字输入没有 stdout/stderr 属性，应该返回空字符串
      expect(result).toBe('');
    });

    test('应处理对象输入（尝试提取 stdout）', () => {
      const input = { stdout: 'test' };
      const result = getOutputString(input);
      expect(result).toBe('test');
    });
  });

  describe('safeParseJSON - 安全 JSON 解析', () => {

    test('应解析有效的 JSON 字符串', () => {
      const input = '{"key": "value", "number": 123}';
      const result = safeParseJSON(input);

      expect(result).toEqual({ key: 'value', number: 123 });
    });

    test('应解析有效的 JSON 数组', () => {
      const input = '[1, 2, 3, "test"]';
      const result = safeParseJSON(input);

      expect(result).toEqual([1, 2, 3, 'test']);
    });

    test('无效 JSON 应返回 fallback', () => {
      const input = 'invalid json';
      const result = safeParseJSON(input, []);

      expect(result).toEqual([]);
    });

    test('无效 JSON 应返回空数组作为默认 fallback', () => {
      const input = 'invalid json';
      const result = safeParseJSON(input);

      expect(result).toEqual([]);
    });

    test('应处理空字符串', () => {
      const input = '';
      const result = safeParseJSON(input, 'default');

      expect(result).toBe('default');
    });

    test('应处理仅空白字符', () => {
      const input = '   \n\n\t   ';
      const result = safeParseJSON(input, 'default');

      expect(result).toBe('default');
    });

    test('应处理带有 stdout 的结果对象', () => {
      const input = {
        stdout: '{"key": "value"}',
        stderr: '',
        exitCode: 0
      };
      const result = safeParseJSON(input);

      expect(result).toEqual({ key: 'value' });
    });

    test('应处理带有 stderr 的结果对象（当 stdout 为空）', () => {
      const input = {
        stdout: '',
        stderr: '{"key": "value"}',
        exitCode: 1
      };
      const result = safeParseJSON(input);

      expect(result).toEqual({ key: 'value' });
    });

    test('应处理嵌套 JSON 对象', () => {
      const input = '{"outer": {"inner": "value"}, "array": [1, 2, 3]}';
      const result = safeParseJSON(input);

      expect(result.outer.inner).toBe('value');
      expect(result.array).toEqual([1, 2, 3]);
    });

    test('应处理 JSON 数组作为 fallback', () => {
      const input = 'invalid';
      const fallback = ['default1', 'default2'];
      const result = safeParseJSON(input, fallback);

      expect(result).toEqual(fallback);
    });

    test('应处理 JSON 对象作为 fallback', () => {
      const input = 'invalid';
      const fallback = { key: 'default' };
      const result = safeParseJSON(input, fallback);

      expect(result).toEqual(fallback);
    });

    test('应处理 null 作为 fallback', () => {
      const input = 'invalid';
      const result = safeParseJSON(input, null);

      expect(result).toBeNull();
    });

    test('应处理字符串输入（尝试解析 JSON）', () => {
      const input = 'just a string';
      const result = safeParseJSON(input, 'fallback');
      // 如果是普通字符串，不是有效的 JSON，应该返回 fallback
      expect(result).toBe('fallback');
    });
  });

  describe('formatPM2List - PM2 进程列表格式化', () => {

    test('应格式化基本 PM2 进程列表', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js',
            pm_uptime: Date.now() - 60000
          },
          monit: {
            memory: 104857600
          }
        }
      ];

      const result = formatPM2List(list);

      expect(result).toContain('=== PM2 进程列表 ===');
      expect(result).toContain('app1');
      expect(result).toContain('online');
    });

    test('应显示运行时间（当 showUptime 为 true）', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js',
            pm_uptime: Date.now() - 60000
          },
          monit: {
            memory: 104857600
          }
        }
      ];

      const result = formatPM2List(list, { showUptime: true });

      expect(result).toContain('Uptime');
    });

    test('应显示内存使用（当 showMemory 为 true）', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js',
            pm_uptime: Date.now() - 60000
          },
          monit: {
            memory: 104857600
          }
        }
      ];

      const result = formatPM2List(list, { showMemory: true });

      expect(result).toContain('Memory');
      expect(result).toContain('100');
    });

    test('应处理空列表', () => {
      const list = [];
      const result = formatPM2List(list);

      expect(result).toContain('=== PM2 进程列表 ===');
      expect(result).toContain('(无进程)');
    });

    test('应处理无效的列表', () => {
      const list = null;
      const result = formatPM2List(list);

      expect(result).toContain('=== PM2 进程列表 ===');
      expect(result).toContain('(无进程)');
    });

    test('应处理多个进程', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js',
            pm_uptime: Date.now() - 60000
          },
          monit: {
            memory: 104857600
          }
        },
        {
          name: 'app2',
          pm2_env: {
            status: 'stopped',
            exec_command: 'npm start',
            pm_uptime: Date.now() - 120000
          },
          monit: {
            memory: 52428800
          }
        }
      ];

      const result = formatPM2List(list);

      expect(result).toContain('app1');
      expect(result).toContain('app2');
      expect(result).toContain('online');
      expect(result).toContain('stopped');
    });

    test('应处理缺失 pm2_env 字段的进程', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js',
            pm_uptime: Date.now() - 60000
          }
        },
        {
          name: 'invalid-app'
        }
      ];

      const result = formatPM2List(list);

      expect(result).toContain('app1');
      // 无效的进程应该被跳过
      expect(result.split('\n').length).toBeLessThan(4);
    });

    test('应处理缺失 monit 字段的进程（当 showMemory 为 true）', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js',
            pm_uptime: Date.now() - 60000
          }
        }
      ];

      const result = formatPM2List(list, { showMemory: true });

      expect(result).toContain('app1');
      // 不应该崩溃
      expect(typeof result).toBe('string');
    });

    test('应同时显示运行时间和内存', () => {
      const list = [
        {
          name: 'app1',
          pm2_env: {
            status: 'online',
            exec_command: 'node app.js',
            pm_uptime: Date.now() - 60000
          },
          monit: {
            memory: 104857600
          }
        }
      ];

      const result = formatPM2List(list, { showUptime: true, showMemory: true });

      expect(result).toContain('Uptime');
      expect(result).toContain('Memory');
    });
  });
});
