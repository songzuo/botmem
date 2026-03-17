#!/usr/bin/env node
/**
 * health-check-enhanced.js - 增强版健康检查脚本
 * 
 * 新增功能:
 * 1. SSH 连接池管理
 * 2. 磁盘空间检查
 * 3. CPU/内存使用率检查
 * 4. 更好的错误处理和重试机制
 */

const { Client } = require('ssh2');
const net = require('net');

// SSH 主机配置
const SSH_HOSTS = [
    { host: 'bot3.szspd.cn', port: 22, name: 'bot3 (Evolver/经理)' },
    { host: '7zi.com', port: 22, name: '7zi (协调经理)' },
];

// 超时配置
const SSH_TIMEOUT = 10000;
const PORT_TIMEOUT = 5000;

/**
 * SSH 连接池管理
 */
class SSHConnectionPool {
    constructor(maxConnections = 3) {
        this.pool = [];
        this.maxConnections = maxConnections;
    }

    async getConnection(config) {
        // 查找可用连接
        const available = this.pool.find(c => 
            c.config.host === config.host && c.available
        );
        
        if (available) {
            available.available = false;
            return available.conn;
        }

        // 创建新连接
        if (this.pool.length < this.maxConnections) {
            const conn = new Client();
            await this.connect(conn, config);
            this.pool.push({ conn, config, available: false });
            return conn;
        }

        // 等待可用连接
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const available = this.pool.find(c => 
                    c.config.host === config.host && c.available
                );
                if (available) {
                    clearInterval(checkInterval);
                    available.available = false;
                    resolve(available.conn);
                }
            }, 500);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('连接池超时'));
            }, SSH_TIMEOUT);
        });
    }

    connect(conn, config) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                conn.destroy();
                reject(new Error('连接超时'));
            }, SSH_TIMEOUT);

            conn.on('ready', () => {
                clearTimeout(timeout);
                resolve();
            });

            conn.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });

            conn.connect({
                host: config.host,
                port: config.port,
                username: 'root',
                password: process.env.SSH_PASSWORD,
                readyTimeout: SSH_TIMEOUT
            });
        });
    }

    release(conn) {
        const entry = this.pool.find(c => c.conn === conn);
        if (entry) entry.available = true;
    }

    destroy() {
        this.pool.forEach(({ conn }) => conn.destroy());
        this.pool = [];
    }
}

/**
 * 检查 SSH 主机连通性 - 带重试
 */
async function checkSSHHost(config, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await doCheckSSHHost(config);
            if (result.status === 'ok') return result;
        } catch (e) {
            if (i === retries - 1) {
                return {
                    host: config.host,
                    name: config.name,
                    status: 'error',
                    responseTime: null,
                    error: e.message
                };
            }
        }
    }
}

function doCheckSSHHost(config) {
    return new Promise((resolve, reject) => {
        const result = {
            host: config.host,
            name: config.name,
            status: 'unknown',
            responseTime: null,
            error: null
        };

        const startTime = Date.now();
        const conn = new Client();

        const timeout = setTimeout(() => {
            conn.destroy();
            result.status = 'timeout';
            result.error = `连接超时 (${SSH_TIMEOUT}ms)`;
            resolve(result);
        }, SSH_TIMEOUT);

        conn.on('ready', () => {
            clearTimeout(timeout);
            result.status = 'ok';
            result.responseTime = Date.now() - startTime;
            conn.end();
            resolve(result);
        });

        conn.on('error', (err) => {
            clearTimeout(timeout);
            result.status = 'error';
            result.error = err.message;
            resolve(result);
        });

        conn.connect({
            host: config.host,
            port: config.port,
            username: 'root',
            password: process.env.SSH_PASSWORD,
            readyTimeout: SSH_TIMEOUT
        });
    });
}

/**
 * 增强的远程检查 - 包含磁盘/CPU/内存
 */
async function checkRemoteEnhanced(config) {
    return new Promise((resolve) => {
        const result = {
            host: config.host,
            picoclaw: { running: false, processes: [] },
            port18795: { listening: false },
            disk: { usage: null, error: null },
            memory: { total: null, used: null, usagePercent: null },
            cpu: { usage: null, loadAvg: null },
            error: null
        };

        const conn = new Client();
        
        const timeout = setTimeout(() => {
            conn.destroy();
            result.error = 'SSH 连接超时';
            resolve(result);
        }, SSH_TIMEOUT);

        conn.on('ready', () => {
            clearTimeout(timeout);
            
            // 执行增强检查
            const commands = `
                echo "=== PROC ===" && ps aux | grep -i picoclaw | grep -v grep || true
                echo "=== PORT ===" && (netstat -tlnp 2>/dev/null | grep 18795 || ss -tlnp | grep 18795 || echo "")
                echo "=== DISK ===" && df -h / | tail -1 | awk '{print $5}' | sed 's/%//'
                echo "=== MEM ===" && free | grep Mem | awk '{print $2","$3","int($3/$2*100)}'
                echo "=== CPU ===" && top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//'
                echo "=== LOAD ===" && cat /proc/loadavg | awk '{print $1","$2","$3}'
            `;
            
            conn.exec(commands, (err, stream) => {
                if (err) {
                    result.error = err.message;
                    conn.end();
                    resolve(result);
                    return;
                }

                let output = '';
                stream.on('data', (data) => { output += data.toString(); });
                stream.on('close', () => {
                    // 解析输出
                    const sections = output.split('===').map(s => s.trim()).filter(Boolean);
                    
                    sections.forEach(section => {
                        const [key, ...valueParts] = section.split('\n');
                        const value = valueParts.join('\n').trim();
                        
                        if (key === 'PROC' && value) {
                            result.picoclaw.running = true;
                            result.picoclaw.processes = value.split('\n');
                        } else if (key === 'PORT' && value) {
                            result.port18795.listening = true;
                        } else if (key === 'DISK' && value) {
                            result.disk.usage = parseInt(value) || null;
                        } else if (key === 'MEM' && value) {
                            const [total, used, percent] = value.split(',');
                            result.memory.total = parseInt(total);
                            result.memory.used = parseInt(used);
                            result.memory.usagePercent = parseInt(percent);
                        } else if (key === 'CPU' && value) {
                            result.cpu.usage = parseFloat(value);
                        } else if (key === 'LOAD' && value) {
                            const [m1, m5, m15] = value.split(',');
                            result.cpu.loadAvg = { m1: parseFloat(m1), m5: parseFloat(m5), m15: parseFloat(m15) };
                        }
                    });

                    conn.end();
                    resolve(result);
                });
            });
        });

        conn.on('error', (err) => {
            clearTimeout(timeout);
            result.error = err.message;
            resolve(result);
        });

        conn.connect({
            host: config.host,
            port: config.port,
            username: 'root',
            password: process.env.SSH_PASSWORD,
            readyTimeout: SSH_TIMEOUT
        });
    });
}

/**
 * 检查本地端口
 */
function checkLocalPort(port) {
    return new Promise((resolve) => {
        const result = { port, listening: false, error: null };
        const socket = new net.Socket();
        
        const timeout = setTimeout(() => {
            socket.destroy();
            result.error = '连接超时';
            resolve(result);
        }, PORT_TIMEOUT);

        socket.connect(port, '127.0.0.1', () => {
            clearTimeout(timeout);
            result.listening = true;
            socket.destroy();
            resolve(result);
        });

        socket.on('error', (err) => {
            clearTimeout(timeout);
            result.error = err.message;
            resolve(result);
        });
    });
}

/**
 * 主函数
 */
async function runHealthCheck() {
    const report = {
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        sshHosts: [],
        remoteChecks: [],
        localPort18795: null,
        summary: {
            totalHosts: 0,
            healthyHosts: 0,
            unhealthyHosts: 0,
            picoclawRunning: 0,
            portListening: 0,
            highDiskUsage: 0,
            highMemoryUsage: 0
        }
    };

    console.error('开始增强健康检查...');

    // 1. SSH 连通性检查
    console.error('检查 SSH 主机...');
    for (const host of SSH_HOSTS) {
        const result = await checkSSHHost(host);
        report.sshHosts.push(result);
        report.summary.totalHosts++;
        if (result.status === 'ok') report.summary.healthyHosts++;
        else report.summary.unhealthyHosts++;
    }

    // 2. 增强的远程检查
    console.error('检查远程服务状态...');
    for (const host of SSH_HOSTS) {
        const result = await checkRemoteEnhanced(host);
        report.remoteChecks.push(result);
        
        if (result.picoclaw.running) report.summary.picoclawRunning++;
        if (result.port18795.listening) report.summary.portListening++;
        if (result.disk.usage && result.disk.usage > 80) report.summary.highDiskUsage++;
        if (result.memory.usagePercent && result.memory.usagePercent > 80) report.summary.highMemoryUsage++;
    }

    // 3. 本地端口检查
    console.error('检查本地端口...');
    report.localPort18795 = await checkLocalPort(18795);

    return report;
}

// 执行
runHealthCheck()
    .then((report) => {
        console.log(JSON.stringify(report, null, 2));
        process.exit(0);
    })
    .catch((err) => {
        console.error(JSON.stringify({ timestamp: new Date().toISOString(), error: err.message, status: 'failed' }, null, 2));
        process.exit(1);
    });
