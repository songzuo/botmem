/**
 * check_helpers.js - SSH 远程检查共享工具模块
 *
 * 提供统一的 SSH 连接、命令执行、端口检查、进程检查等功能
 *
 * @version 2.1.0
 * @author Commander Team
 */

const { Client } = require('ssh2');

// 默认服务器配置（从环境变量读取敏感信息）
const defaultServerConfig = {
  host: process.env.SSH_HOST || '7zi.com',
  port: parseInt(process.env.SSH_PORT, 10) || 22,
  username: process.env.SSH_USER || 'root',
  password: process.env.SSH_PASSWORD,
  readyTimeout: parseInt(process.env.SSH_TIMEOUT, 10) || 30000,
  keepaliveInterval: 30000,
  keepaliveCountMax: 3
};

// 默认命令超时时间
const DEFAULT_CMD_TIMEOUT = 60000;

/**
 * 验证服务器配置
 * @param {Object} config - 服务器配置
 * @throws {Error} 如果缺少必要的配置项
 */
function validateConfig(config) {
  if (!config.host) {
    throw new Error('SSH host is required');
  }
  if (!config.username) {
    throw new Error('SSH username is required');
  }
  if (!config.password && !config.privateKey) {
    throw new Error('SSH password or privateKey is required');
  }
}

/**
 * 创建 SSH 连接
 * @param {Object} config - 可选的自定义配置（会与默认配置合并）
 * @returns {{conn: Client, config: Object}} 包含连接实例和配置的对象
 */
function createConnection(config = {}) {
  const conn = new Client();
  const finalConfig = { ...defaultServerConfig, ...config };

  try {
    validateConfig(finalConfig);
  } catch (err) {
    throw new Error(`Invalid SSH config: ${err.message}`);
  }

  return { conn, config: finalConfig };
}

/**
 * 执行单个 SSH 命令并返回结果
 * @param {Client} conn - SSH 连接实例
 * @param {string} command - 要执行的命令
 * @param {Object} options - 可选配置
 * @param {number} options.timeout - 命令执行超时时间（毫秒）
 * @param {boolean} options.mergeStderr - 是否将 stderr 合并到 stdout（默认 true）
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number|null}>} 命令执行结果
 */
function execCommand(conn, command, options = {}) {
  const { timeout = DEFAULT_CMD_TIMEOUT, mergeStderr = true } = options;

  return new Promise((resolve, reject) => {
    let timer = null;
    let stdout = '';
    let stderr = '';

    conn.exec(command, (err, stream) => {
      if (err) {
        reject(new Error(`Command exec failed: ${err.message}`));
        return;
      }

      // 设置超时定时器
      if (timeout > 0) {
        timer = setTimeout(() => {
          stream.destroy();
          reject(new Error(`Command timeout after ${timeout}ms: ${command}`));
        }, timeout);
      }

      // 收集标准输出
      stream.on('data', (data) => {
        stdout += data.toString();
      }).on('close', (code) => {
        if (timer) clearTimeout(timer);
        resolve({
          stdout,
          stderr: mergeStderr ? stdout : stderr,
          exitCode: code
        });
      }).stderr.on('data', (data) => {
        stderr += data.toString();
        if (mergeStderr) {
          stdout += data.toString();
        }
      });
    });
  });
}

/**
 * 提取命令输出的字符串（兼容旧版本）
 * @param {Object|string} result - execCommand 的返回值或字符串
 * @returns {string} 命令输出字符串
 */
function getOutputString(result) {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    return result.stdout || result.stderr || '';
  }
  return '';
}

/**
 * 安全解析 JSON 输出
 * @param {Object|string} result - execCommand 的返回值或字符串
 * @param {*} fallback - 解析失败时返回的默认值
 * @returns {*} 解析后的对象或默认值
 */
function safeParseJSON(result, fallback = []) {
  try {
    const output = getOutputString(result);
    if (!output.trim()) return fallback;
    return JSON.parse(output);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return fallback;
  }
}

/**
 * 执行多个 SSH 命令（顺序执行）
 * @param {Client} conn - SSH 连接实例
 * @param {string[]} commands - 命令数组
 * @param {Object} options - 可选配置
 * @param {Function} options.onProgress - 进度回调 (index, result)
 * @param {Function} options.onCommandStart - 命令开始回调 (index, command)
 * @param {boolean} options.stopOnError - 遇到错误是否停止（默认 false）
 * @returns {Promise<Array<{stdout: string, stderr: string, exitCode: number|null}>>} 每个命令的输出数组
 */
async function execCommands(conn, commands, options = {}) {
  const { onProgress, onCommandStart, stopOnError = false } = options;
  const results = [];

  for (let i = 0; i < commands.length; i++) {
    if (onCommandStart) {
      onCommandStart(i, commands[i]);
    }

    const result = await execCommand(conn, commands[i]);
    results.push(result);

    if (onProgress) {
      onProgress(i, result);
    }

    if (stopOnError && result.exitCode !== 0) {
      throw new Error(`Command failed at index ${i}: ${commands[i]}`);
    }
  }

  return results;
}

/**
 * 安全地构建 grep 模式（防止命令注入）
 * @param {string|string[]} patterns - 要转义的模式或模式数组
 * @returns {string} 转义后的模式字符串
 */
function escapeGrepPattern(patterns) {
  const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.isArray(patterns) ? patterns.map(escape).join('|') : escape(patterns);
}

/**
 * 检查端口监听状态
 * @param {Client} conn - SSH 连接实例
 * @param {number|string|number[]} ports - 端口号或端口数组
 * @param {Object} options - 可选配置
 * @param {boolean} options.useSs - 使用 ss 命令（默认）还是 netstat
 * @param {string} options.protocol - 协议过滤: 'tcp' (默认), 'udp', 'all'
 * @returns {Promise<string>} 端口监听信息
 */
function checkPorts(conn, ports, options = {}) {
  const { useSs = true, protocol = 'tcp' } = options;
  const portPattern = escapeGrepPattern(Array.isArray(ports) ? ports : [ports]);

  const protocolFilter = protocol === 'all' ? '' : (protocol === 'udp' ? '-u' : '-t');

  const command = useSs
    ? `ss -${protocolFilter}lnp 2>/dev/null | grep -E "${portPattern}"`
    : `netstat -${protocolFilter}lnp 2>/dev/null | grep -E "${portPattern}"`;

  return execCommand(conn, command);
}

/**
 * 检查进程状态
 * @param {Client} conn - SSH 连接实例
 * @param {string|RegExp} pattern - 进程匹配模式（用于 grep）
 * @param {Object} options - 可选配置
 * @param {string} options.psFormat - ps 命令格式（默认 'aux'）
 * @returns {Promise<string>} 进程列表
 */
function checkProcess(conn, pattern, options = {}) {
  const { psFormat = 'aux' } = options;
  const escapedPattern = escapeGrepPattern(pattern);
  const command = `ps ${psFormat} | grep -E "${escapedPattern}" | grep -v grep`;
  return execCommand(conn, command);
}

/**
 * 检查 PM2 进程列表
 * @param {Client} conn - SSH 连接实例
 * @returns {Promise<Array>} PM2 进程数组
 */
async function checkPM2(conn) {
  const result = await execCommand(conn, 'pm2 jlist');
  return safeParseJSON(result, []);
}

/**
 * 安全地检查服务状态
 * @param {Client} conn - SSH 连接实例
 * @param {string} serviceName - 服务名称
 * @returns {Promise<{running: boolean, status: string}>} 服务状态
 */
async function checkService(conn, serviceName) {
  const escapedName = escapeGrepPattern(serviceName);
  const result = await execCommand(conn, `systemctl is-active ${escapedName} 2>&1`);
  const status = getOutputString(result).trim();

  return {
    running: status === 'active',
    status
  };
}

/**
 * 通用简单检查函数（用于单命令检查）
 * @param {Client} conn - SSH 连接实例
 * @param {string} command - 要执行的命令
 * @param {Object} options - 可选配置（传递给 execCommand）
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number|null}>} 命令执行结果
 */
async function simpleCheck(conn, command, options = {}) {
  return execCommand(conn, command, options);
}

/**
 * 检查磁盘使用情况
 * @param {Client} conn - SSH 连接实例
 * @param {string} path - 要检查的路径（默认 '/'）
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number|null}>} 磁盘使用信息
 */
async function checkDiskUsage(conn, path = '/') {
  const escapedPath = escapeGrepPattern(path);
  return simpleCheck(conn, `df -h ${escapedPath} 2>/dev/null | tail -n 1`);
}

/**
 * 获取系统负载
 * @param {Client} conn - SSH 连接实例
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number|null}>} 系统负载信息
 */
async function checkLoad(conn) {
  return simpleCheck(conn, 'uptime');
}

/**
 * 快速 SSH 检查包装器
 * 自动处理连接、执行命令、关闭连接
 * @param {string|string[]} commands - 要执行的命令
 * @param {Object} options - 可选配置
 * @param {Object} options.config - 连接配置
 * @param {Function} options.onSuccess - 成功回调 (output|outputs, conn)
 * @param {Function} options.onError - 错误回调 (err)
 * @param {boolean} options.closeOnSuccess - 成功后是否自动关闭连接（默认 false）
 * @param {boolean} options.closeOnError - 错误后是否自动关闭连接（默认 true）
 * @returns {Promise<void>}
 */
function quickCheck(commands, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      config = {},
      onSuccess,
      onError,
      closeOnSuccess = false,
      closeOnError = true
    } = options;

    const { conn, config: finalConfig } = createConnection(config);

    /**
     * 统一错误处理函数
     * @param {Error} err - 错误对象
     */
    const handleError = (err) => {
      if (onError) {
        onError(err);
      } else {
        console.error('QuickCheck error:', err.message);
      }
      if (closeOnError) conn.end();
      reject(err);
    };

    conn.on('ready', async () => {
      try {
        // 根据命令类型执行
        const isArray = Array.isArray(commands);
        const result = isArray
          ? await execCommands(conn, commands)
          : await execCommand(conn, commands);

        // 调用成功回调
        if (onSuccess) await onSuccess(result, conn);

        // 关闭连接
        if (closeOnSuccess) conn.end();
        resolve();
      } catch (err) {
        handleError(err);
      }
    }).on('error', (err) => {
      handleError(err);
    }).connect(finalConfig);
  });
}

/**
 * 链式命令执行器（增强版）
 * 用于需要按顺序执行多个命令并分别处理的场景
 *
 * 用法:
 *   await chain(conn)
 *     .exec('echo hello', output => console.log('Output:', output.stdout))
 *     .exec('echo world', output => console.log('Output:', output.stdout))
 *     .end(() => conn.end())
 *
 * @param {Client} conn - SSH 连接实例
 * @returns {Object} 链式执行器 API
 */
function chain(conn) {
  const tasks = [];

  const api = {
    /**
     * 添加一个命令到执行队列
     * @param {string} command - 要执行的命令
     * @param {Function} handler - 结果处理函数 (output, result)
     * @returns {Object} 链式 API
     */
    exec: (command, handler) => {
      tasks.push({ command, handler });
      return api;
    },

    // 兼容旧版本的 then 方法
    then: (command, handler) => {
      return api.exec(command, handler);
    },

    /**
     * 执行所有命令队列
     * @param {Function} finalHandler - 所有命令执行完成后的回调
     * @returns {Promise<{completed: boolean, taskCount: number}>} 执行结果
     */
    end: (finalHandler) => {
      return (async () => {
        // 顺序执行所有任务
        for (const task of tasks) {
          const result = await execCommand(conn, task.command);
          if (task.handler) {
            const output = getOutputString(result);
            await task.handler(output, result);
          }
        }

        // 执行结束回调
        if (finalHandler) await finalHandler();

        return { completed: true, taskCount: tasks.length };
      })();
    }
  };

  return api;
}

/**
 * 格式化 PM2 进程信息
 * @param {Array} list - PM2 进程列表
 * @param {Object} options - 可选配置
 * @param {boolean} options.showUptime - 是否显示运行时间（默认 false）
 * @param {boolean} options.showMemory - 是否显示内存使用（默认 false）
 * @returns {string} 格式化后的字符串
 */
function formatPM2List(list, options = {}) {
  const { showUptime = false, showMemory = false } = options;
  const lines = ['=== PM2 进程列表 ==='];

  if (!Array.isArray(list) || list.length === 0) {
    lines.push('(无进程)');
    return lines.join('\n');
  }

  list.forEach(p => {
    if (p.name && p.pm2_env && p.pm2_env.status) {
      const status = p.pm2_env.status;
      const command = p.pm2_env.exec_command || 'N/A';
      const uptime = showUptime && p.pm2_env.pm_uptime
        ? ` | Uptime: ${Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000)}s`
        : '';
      const memory = showMemory && p.monit
        ? ` | Memory: ${Math.round(p.monit.memory / 1024 / 1024)}MB`
        : '';

      lines.push(`${p.name}: ${status} (${command})${uptime}${memory}`);
    }
  });

  return lines.join('\n');
}

module.exports = {
  // 配置
  defaultServerConfig,
  DEFAULT_CMD_TIMEOUT,

  // 连接
  createConnection,
  validateConfig,

  // 命令执行
  execCommand,
  execCommands,
  quickCheck,
  chain,
  simpleCheck,
  getOutputString,
  safeParseJSON,

  // 检查函数
  checkPorts,
  checkProcess,
  checkPM2,
  checkService,
  checkDiskUsage,
  checkLoad,

  // 工具函数
  escapeGrepPattern,
  formatPM2List
};
