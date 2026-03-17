#!/usr/bin/env node
/**
 * health-check.js - xunshi-inspector 健康检查脚本
 * 
 * 功能:
 * 1. 检查 SSH 主机连通性
 * 2. 检查 picoclaw 进程是否运行
 * 3. 检查端口 18795 是否监听
 * 4. 输出 JSON 格式的健康报告
 * 
 * 用法:
 *   node health-check.js [--json] [--format=json|text]
 *   node health-check.js --json    # 输出 JSON 格式
 *   node health-check.js            # 输出文本格式 (默认)
 */

const { Client } = require('ssh2');
const net = require('net');

// ===== 配置模块 =====
const CONFIG = {
    // SSH 主机配置
    sshHosts: [
        { host: 'bot3.szspd.cn', port: 22, name: 'bot3 (Evolver/经理)' },
        { host: '7zi.com', port: 22, name: '7zi (协调经理)' },
    ],
    // 超时配置 (毫秒)
    timeouts: {
        sshConnection: 10000,
        sshCommand: 8000,
        portCheck: 5000
    },
    // 重试配置
    retry: {
        maxAttempts: 3,  // 最多重试3次 (首次尝试 + 2次重试)
        delay: 1000      // 重试延迟 (毫秒)
    }
};

// ===== 命令行参数解析 =====
function parseArgs(args) {
    const result = {
        format: 'text',
        retry: true,
        retryCount: 3
    };
    for (const arg of args) {
        if (arg === '--json' || arg === '--format=json') {
            result.format = 'json';
        } else if (arg === '--format=text') {
            result.format = 'text';
        } else if (arg === '--retry') {
            result.retry = true;
        } else if (arg === '--no-retry') {
            result.retry = false;
        } else if (arg.startsWith('--retry-count=')) {
            const count = parseInt(arg.split('=')[1], 10);
            if (!isNaN(count) && count > 0) {
                result.retryCount = count;
            }
        }
    }
    return result;
}

// ===== 重试机制模块 =====
/**
 * 带重试的异步函数执行器 (支持指数退避)
 * @param {Function} fn - 要执行的异步函数 (接收 attempt 和 retryHistory 作为参数)
 * @param {Object} options - 重试配置
 * @param {number} options.maxAttempts - 最大尝试次数
 * @param {number} options.baseDelay - 基础延迟时间(毫秒)
 * @param {boolean} options.enableRetry - 是否启用重试
 * @param {Function} options.shouldRetry - 判断是否应该重试的函数 (接收错误对象)
 * @param {boolean} options.logRetries - 是否记录重试日志
 * @returns {Promise} - 函数执行结果
 */
async function withRetry(fn, options = {}) {
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        enableRetry = true,
        shouldRetry = () => true,
        logRetries = true
    } = options;

    let lastError;
    const retryHistory = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const startTime = Date.now();
            const result = await fn(attempt, retryHistory);
            
            // 记录成功的尝试
            retryHistory.push({
                attempt: attempt,
                status: 'success',
                timestamp: new Date().toISOString(),
                duration: Date.now() - startTime
            });

            return result;

        } catch (error) {
            lastError = error;
            const attemptDuration = Date.now() - startTime || 0;
            
            // 记录失败的尝试
            const attemptRecord = {
                attempt: attempt,
                status: 'failed',
                timestamp: new Date().toISOString(),
                duration: attemptDuration,
                error: error.message,
                errorCode: error.code,
                errorType: error.code ? 'error-code' : 'generic'
            };
            retryHistory.push(attemptRecord);

            // 如果是最后一次尝试或不应该重试,直接抛出错误
            if (attempt === maxAttempts || !enableRetry || !shouldRetry(error)) {
                throw error;
            }

            // 计算指数退避延迟: baseDelay * (2^(attempt-1))
            // 例如: 1000ms, 2000ms, 4000ms, 8000ms...
            const delay = baseDelay * Math.pow(2, attempt - 1);

            if (logRetries) {
                console.error(`  ⚠️  第 ${attempt} 次尝试失败 (${error.code || error.message})，${delay}ms 后重试...`);
            }

            // 等待后重试
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * 延迟函数
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== SSH 连接模块 =====
/**
 * 检查 SSH 主机连通性
 * @param {Object} config - 主机配置
 * @param {Object} retryOptions - 重试选项
 * @returns {Promise<Object>} - 检查结果
 */
async function checkSSHHost(config, retryOptions = {}) {
    const result = {
        host: config.host,
        name: config.name,
        status: 'unknown',
        responseTime: null,
        error: null,
        errorCode: null,
        attempts: 0,
        retryHistory: []
    };

    const checkFn = async (attempt, retryHistory) => {
        result.attempts = attempt;
        result.retryHistory = retryHistory;
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const conn = new Client();

            const timeoutId = setTimeout(() => {
                conn.destroy();
                const error = new Error(`SSH连接超时 (${CONFIG.timeouts.sshConnection}ms)`);
                error.code = 'TIMEOUT';
                error.attempt = attempt;
                reject(error);
            }, CONFIG.timeouts.sshConnection);

            conn.on('ready', () => {
                clearTimeout(timeoutId);
                result.status = 'ok';
                result.responseTime = Date.now() - startTime;
                conn.end();
                resolve(result);
            });

            conn.on('error', (err) => {
                clearTimeout(timeoutId);
                const error = new Error(`SSH连接失败: ${err.message}`);
                error.code = err.code || 'SSH_ERROR';
                error.originalError = err;
                error.attempt = attempt;
                reject(error);
            });

            conn.connect({
                host: config.host,
                port: config.port,
                username: 'root',
                password: process.env.SSH_PASSWORD,
                readyTimeout: CONFIG.timeouts.sshConnection
            });
        });
    };

    // 定义可重试的错误类型
    const shouldRetry = (error) => {
        const retryableCodes = ['TIMEOUT', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
        return retryableCodes.includes(error.code);
    };

    try {
        return await withRetry(checkFn, {
            maxAttempts: retryOptions.retryCount || CONFIG.retry.maxAttempts,
            baseDelay: CONFIG.retry.delay,
            enableRetry: retryOptions.enableRetry !== false,
            shouldRetry,
            logRetries: retryOptions.logRetries !== false
        });
    } catch (error) {
        result.status = 'error';
        result.error = error.message;
        result.errorCode = error.code;
        return result;
    }
}

// ===== 远程检查模块 =====
/**
 * 通过 SSH 执行命令并获取输出
 * @param {Object} conn - SSH连接对象
 * @param {string} command - 要执行的命令
 * @param {number} timeout - 超时时间
 * @returns {Promise<string>} - 命令输出
 */
async function execSSHCommand(conn, command, timeout) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            const error = new Error(`命令执行超时 (${timeout}ms): ${command}`);
            error.code = 'CMD_TIMEOUT';
            reject(error);
        }, timeout);

        conn.exec(command, (err, stream) => {
            if (err) {
                clearTimeout(timeoutId);
                const error = new Error(`命令执行失败: ${err.message}`);
                error.code = err.code || 'CMD_ERROR';
                reject(error);
                return;
            }

            let output = '';
            stream.on('data', (data) => { output += data.toString(); });
            
            stream.on('close', (code) => {
                clearTimeout(timeoutId);
                // 命令返回非零退出码也可能是正常的(如 grep 未找到匹配)
                resolve(output);
            });

            stream.stderr.on('data', (data) => {
                // 某些命令会输出到 stderr 但仍需收集
                output += data.toString();
            });
        });
    });
}

/**
 * 通过 SSH 检查远程主机上的 picoclaw 进程和端口
 * @param {Object} config - 主机配置
 * @param {Object} retryOptions - 重试选项
 * @returns {Promise<Object>} - 检查结果
 */
async function checkRemotePicoclaw(config, retryOptions = {}) {
    const result = {
        host: config.host,
        name: config.name,
        picoclaw: { running: false, processes: [], attempts: 0, retryHistory: [] },
        port18795: { listening: false, info: null },
        error: null,
        errorCode: null,
        connectionStatus: 'unknown'
    };

    const checkFn = async (attempt, retryHistory) => {
        result.picoclaw.attempts = attempt;
        result.picoclaw.retryHistory = retryHistory;
        
        return new Promise((resolve, reject) => {
            const conn = new Client();
            const timeoutId = setTimeout(() => {
                conn.destroy();
                const error = new Error(`SSH连接超时 (${CONFIG.timeouts.sshConnection}ms)`);
                error.code = 'TIMEOUT';
                reject(error);
            }, CONFIG.timeouts.sshConnection);

            conn.on('ready', async () => {
                clearTimeout(timeoutId);
                result.connectionStatus = 'connected';

                try {
                    // 并行检查进程和端口
                    const [processOutput, portOutput] = await Promise.all([
                        execSSHCommand(conn, 'ps aux | grep -i picoclaw | grep -v grep || true', CONFIG.timeouts.sshCommand),
                        execSSHCommand(conn, 'netstat -tlnp 2>/dev/null | grep 18795 || ss -tlnp | grep 18795 || echo ""', CONFIG.timeouts.sshCommand)
                    ]);

                    // 解析进程输出
                    if (processOutput.trim()) {
                        result.picoclaw.running = true;
                        result.picoclaw.processes = processOutput.trim().split('\n');
                    }

                    // 解析端口输出
                    if (portOutput.trim()) {
                        result.port18795.listening = true;
                        result.port18795.info = portOutput.trim();
                    }

                    conn.end();
                    resolve(result);

                } catch (error) {
                    conn.end();
                    reject(error);
                }
            });

            conn.on('error', (err) => {
                clearTimeout(timeoutId);
                const error = new Error(`SSH连接失败: ${err.message}`);
                error.code = err.code || 'SSH_ERROR';
                error.originalError = err;
                reject(error);
            });

            conn.connect({
                host: config.host,
                port: config.port,
                username: 'root',
                password: process.env.SSH_PASSWORD,
                readyTimeout: CONFIG.timeouts.sshConnection
            });
        });
    };

    const shouldRetry = (error) => {
        const retryableCodes = ['TIMEOUT', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'CMD_TIMEOUT'];
        return retryableCodes.includes(error.code);
    };

    try {
        return await withRetry(checkFn, {
            maxAttempts: retryOptions.retryCount || CONFIG.retry.maxAttempts,
            baseDelay: CONFIG.retry.delay,
            enableRetry: retryOptions.enableRetry !== false,
            shouldRetry,
            logRetries: retryOptions.logRetries !== false
        });
    } catch (error) {
        result.error = error.message;
        result.errorCode = error.code;
        if (error.code === 'CMD_TIMEOUT') {
            result.connectionStatus = 'connected';
        } else {
            result.connectionStatus = 'failed';
        }
        return result;
    }
}

// ===== 本地检查模块 =====
/**
 * 检查本地端口是否监听
 * @param {number} port - 端口号
 * @param {Object} retryOptions - 重试选项
 * @returns {Promise<Object>} - 检查结果
 */
async function checkLocalPort(port, retryOptions = {}) {
    const result = {
        port: port,
        listening: false,
        error: null,
        errorCode: null,
        attempts: 0,
        retryHistory: []
    };

    const checkFn = async (attempt, retryHistory) => {
        result.attempts = attempt;
        result.retryHistory = retryHistory;
        
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const timeoutId = setTimeout(() => {
                socket.destroy();
                const error = new Error(`端口连接超时 (${CONFIG.timeouts.portCheck}ms)`);
                error.code = 'PORT_TIMEOUT';
                reject(error);
            }, CONFIG.timeouts.portCheck);

            socket.connect(port, '127.0.0.1', () => {
                clearTimeout(timeoutId);
                result.listening = true;
                socket.destroy();
                resolve(result);
            });

            socket.on('error', (err) => {
                clearTimeout(timeoutId);
                const error = new Error(`端口检查失败: ${err.message}`);
                error.code = err.code || 'PORT_ERROR';
                error.originalError = err;
                reject(error);
            });
        });
    };

    const shouldRetry = (error) => {
        // 本地端口检查通常不需要重试,但也支持某些可重试错误
        const retryableCodes = ['PORT_TIMEOUT', 'ECONNREFUSED'];
        return retryableCodes.includes(error.code);
    };

    try {
        return await withRetry(checkFn, {
            maxAttempts: retryOptions.retryCount || CONFIG.retry.maxAttempts,
            baseDelay: CONFIG.retry.delay,
            enableRetry: retryOptions.enableRetry !== false,
            shouldRetry,
            logRetries: retryOptions.logRetries !== false
        });
    } catch (error) {
        result.error = error.message;
        result.errorCode = error.code;
        return result;
    }
}

// ===== 主检查模块 =====
/**
 * 运行完整的健康检查
 * @param {Object} options - 配置选项
 * @param {boolean} options.enableRetry - 是否启用重试
 * @param {number} options.retryCount - 重试次数
 * @param {boolean} options.logRetries - 是否记录重试日志
 * @returns {Promise<Object>} - 健康检查报告
 */
async function runHealthCheck(options = {}) {
    const retryOptions = {
        enableRetry: options.enableRetry !== undefined ? options.enableRetry : true,
        retryCount: options.retryCount || CONFIG.retry.maxAttempts,
        logRetries: options.logRetries !== undefined ? options.logRetries : true
    };

    const report = {
        timestamp: new Date().toISOString(),
        sshHosts: [],
        remoteChecks: [],
        localPort18795: null,
        summary: {
            totalHosts: CONFIG.sshHosts.length,
            healthyHosts: 0,
            unhealthyHosts: 0,
            picoclawRunning: 0,
            portListening: 0
        },
        config: {
            timeout: CONFIG.timeouts,
            retry: {
                enabled: retryOptions.enableRetry,
                maxAttempts: retryOptions.retryCount,
                baseDelay: CONFIG.retry.delay
            }
        }
    };

    console.error('开始健康检查...');
    if (retryOptions.enableRetry) {
        console.error(`重试策略: 最多 ${retryOptions.retryCount} 次, 指数退避`);
    } else {
        console.error('重试已禁用');
    }

    // 1. 并行检查所有 SSH 主机连通性
    console.error(`检查 SSH 主机连通性 (${CONFIG.sshHosts.length}个主机)...`);
    const sshCheckPromises = CONFIG.sshHosts.map(host => checkSSHHost(host, retryOptions));
    report.sshHosts = await Promise.all(sshCheckPromises);

    // 更新摘要
    report.sshHosts.forEach(result => {
        if (result.status === 'ok') {
            report.summary.healthyHosts++;
        } else {
            report.summary.unhealthyHosts++;
        }
    });

    // 2. 并行检查所有远程主机上的 picoclaw 和端口
    console.error(`检查远程 picoclaw 状态 (${CONFIG.sshHosts.length}个主机)...`);
    const remoteCheckPromises = CONFIG.sshHosts.map(host => checkRemotePicoclaw(host, retryOptions));
    report.remoteChecks = await Promise.all(remoteCheckPromises);

    // 更新摘要
    report.remoteChecks.forEach(result => {
        if (result.picoclaw.running) {
            report.summary.picoclawRunning++;
        }
        if (result.port18795.listening) {
            report.summary.portListening++;
        }
    });

    // 3. 检查本地端口 18795
    console.error('检查本地端口 18795...');
    report.localPort18795 = await checkLocalPort(18795, retryOptions);

    console.error('健康检查完成');
    return report;
}

// ===== 格式化输出模块 =====
/**
 * 格式化报告为可读文本
 * @param {Object} report - 健康检查报告
 * @returns {string} - 格式化的文本
 */
function formatReportAsText(report) {
    let output = '';
    output += '='.repeat(60) + '\n';
    output += `健康检查报告 - ${report.timestamp}\n`;
    output += '='.repeat(60) + '\n\n';
    
    // SSH 主机状态
    output += '【SSH 主机连通性】\n';
    for (const host of report.sshHosts) {
        const statusIcon = host.status === 'ok' ? '✅' : '❌';
        output += `  ${statusIcon} ${host.name} (${host.host})\n`;
        output += `      状态: ${host.status}\n`;
        if (host.responseTime) {
            output += `      响应时间: ${host.responseTime}ms\n`;
        }
        if (host.attempts > 1) {
            output += `      尝试次数: ${host.attempts} (共${report.config.retry.maxAttempts}次)\n`;
        }
        if (host.error) {
            output += `      错误: ${host.error}`;
            if (host.errorCode) {
                output += ` [${host.errorCode}]`;
            }
            output += '\n';
        }
        output += '\n';
    }
    
    // 远程 picoclaw 检查
    output += '【远程 Picoclaw 状态】\n';
    for (const check of report.remoteChecks) {
        const connIcon = check.connectionStatus === 'connected' ? '✅' : '❌';
        output += `  ${connIcon} ${check.host} (${check.name})\n`;
        output += `      SSH连接: ${check.connectionStatus}\n`;
        
        const picoclawIcon = check.picoclaw.running ? '✅' : '❌';
        output += `      Picoclaw: ${picoclawIcon} ${check.picoclaw.running ? '运行中' : '未运行'}`;
        if (check.picoclaw.attempts > 1) {
            output += ` (尝试${check.picoclaw.attempts}次)`;
        }
        output += '\n';
        
        const portIcon = check.port18795.listening ? '✅' : '❌';
        output += `      端口 18795: ${portIcon} ${check.port18795.listening ? '监听中' : '未监听'}\n`;
        
        if (check.error) {
            output += `      错误: ${check.error}`;
            if (check.errorCode) {
                output += ` [${check.errorCode}]`;
            }
            output += '\n';
        }
        output += '\n';
    }
    
    // 本地端口检查
    output += '【本地端口 18795】\n';
    if (report.localPort18795) {
        const localIcon = report.localPort18795.listening ? '✅' : '❌';
        output += `  ${localIcon} ${report.localPort18795.listening ? '监听中' : '未监听'}\n`;
        if (report.localPort18795.error) {
            output += `  错误: ${report.localPort18795.error}`;
            if (report.localPort18795.errorCode) {
                output += ` [${report.localPort18795.errorCode}]`;
            }
            output += '\n';
        }
    }
    output += '\n';
    
    // 摘要
    output += '【摘要】\n';
    output += `  主机总数: ${report.summary.totalHosts}\n`;
    output += `  健康主机: ${report.summary.healthyHosts} (${report.summary.totalHosts > 0 ? Math.round(report.summary.healthyHosts / report.summary.totalHosts * 100) : 0}%)\n`;
    output += `  不健康主机: ${report.summary.unhealthyHosts}\n`;
    output += `  Picoclaw 运行中: ${report.summary.picoclawRunning}/${report.summary.totalHosts}\n`;
    output += `  端口监听: ${report.summary.portListening}/${report.summary.totalHosts}\n`;
    output += '\n';
    output += '【配置】\n';
    output += `  超时设置: SSH=${report.config.timeout.sshConnection}ms, 命令=${report.config.timeout.sshCommand}ms, 端口=${report.config.timeout.portCheck}ms\n`;
    output += `  重试策略: 最多${report.config.retry.maxAttempts}次, 延迟${report.config.retry.delay}ms\n`;
    output += '='.repeat(60) + '\n';
    
    return output;
}

/**
 * 格式化错误报告为文本
 * @param {Object} errorReport - 错误报告
 * @returns {string} - 格式化的错误文本
 */
function formatErrorAsText(errorReport) {
    let output = '';
    output += '❌ 健康检查失败\n';
    output += `时间: ${errorReport.timestamp}\n`;
    output += `错误: ${errorReport.error}\n`;
    if (errorReport.stack) {
        output += `\n堆栈追踪:\n${errorReport.stack}\n`;
    }
    return output;
}

// ===== 模块导出 =====
module.exports = {
    checkSSHHost,
    checkRemotePicoclaw,
    checkLocalPort,
    runHealthCheck,
    formatReportAsText,
    formatErrorAsText,
    withRetry,
    CONFIG
};

// ===== 主程序入口 =====
if (require.main === module) {
    const args = parseArgs(process.argv.slice(2));
    
    runHealthCheck()
        .then((report) => {
            if (args.format === 'json') {
                console.log(JSON.stringify(report, null, 2));
            } else {
                console.log(formatReportAsText(report));
            }
            process.exit(0);
        })
        .catch((err) => {
            const errorReport = {
                timestamp: new Date().toISOString(),
                error: err.message,
                stack: err.stack,
                status: 'failed'
            };
            if (args.format === 'json') {
                console.error(JSON.stringify(errorReport, null, 2));
            } else {
                console.error(formatErrorAsText(errorReport));
            }
            process.exit(1);
        });
}