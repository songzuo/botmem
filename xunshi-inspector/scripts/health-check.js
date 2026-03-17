#!/usr/bin/env node
/**
 * health-check.js - xunshi-inspector 健康检查脚本
 * 
 * 功能:
 * 1. 检查 SSH 主机连通性
 * 2. 检查 picoclaw 进程是否运行
 * 3. 检查端口 18795 是否监听
 * 4. 输出 JSON 格式的健康报告
 */

const { Client } = require('ssh2');
const net = require('net');

// SSH 主机配置
const SSH_HOSTS = [
    { host: 'bot3.szspd.cn', port: 22, name: 'bot3 (Evolver/经理)' },
    { host: '7zi.com', port: 22, name: '7zi (协调经理)' },
    // 可根据需要添加更多主机
];

// 超时配置 (毫秒)
const SSH_TIMEOUT = 10000;
const PORT_TIMEOUT = 5000;

/**
 * 检查 SSH 主机连通性
 */
function checkSSHHost(config) {
    return new Promise((resolve) => {
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
 * 通过 SSH 检查远程主机上的 picoclaw 进程和端口
 */
function checkRemotePicoclaw(config) {
    return new Promise((resolve) => {
        const result = {
            host: config.host,
            picoclaw: { running: false, processes: [] },
            port18795: { listening: false, info: null },
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
            
            // 检查 picoclaw 进程
            conn.exec('ps aux | grep -i picoclaw | grep -v grep || true', (err, stream) => {
                if (err) {
                    result.error = err.message;
                    conn.end();
                    resolve(result);
                    return;
                }

                let processOutput = '';
                stream.on('data', (data) => { processOutput += data.toString(); });
                stream.on('close', () => {
                    if (processOutput.trim()) {
                        result.picoclaw.running = true;
                        result.picoclaw.processes = processOutput.trim().split('\n');
                    }

                    // 检查端口 18795
                    conn.exec('netstat -tlnp 2>/dev/null | grep 18795 || ss -tlnp | grep 18795 || echo ""', (err2, stream2) => {
                        if (err2) {
                            result.error = err2.message;
                            conn.end();
                            resolve(result);
                            return;
                        }

                        let portOutput = '';
                        stream2.on('data', (data) => { portOutput += data.toString(); });
                        stream2.on('close', () => {
                            if (portOutput.trim()) {
                                result.port18795.listening = true;
                                result.port18795.info = portOutput.trim();
                            }
                            conn.end();
                            resolve(result);
                        });
                    });
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
 * 检查本地端口是否监听
 */
function checkLocalPort(port) {
    return new Promise((resolve) => {
        const result = {
            port: port,
            listening: false,
            error: null
        };

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
 * 主健康检查函数
 */
async function runHealthCheck() {
    const report = {
        timestamp: new Date().toISOString(),
        sshHosts: [],
        remoteChecks: [],
        localPort18795: null,
        summary: {
            totalHosts: 0,
            healthyHosts: 0,
            unhealthyHosts: 0,
            picoclawRunning: 0,
            portListening: 0
        }
    };

    console.error('开始健康检查...');

    // 1. 检查所有 SSH 主机连通性
    console.error('检查 SSH 主机连通性...');
    for (const host of SSH_HOSTS) {
        const result = await checkSSHHost(host);
        report.sshHosts.push(result);
        report.summary.totalHosts++;
        if (result.status === 'ok') {
            report.summary.healthyHosts++;
        } else {
            report.summary.unhealthyHosts++;
        }
    }

    // 2. 检查远程主机上的 picoclaw 和端口
    console.error('检查远程 picoclaw 状态...');
    for (const host of SSH_HOSTS) {
        const result = await checkRemotePicoclaw(host);
        report.remoteChecks.push(result);
        if (result.picoclaw.running) {
            report.summary.picoclawRunning++;
        }
        if (result.port18795.listening) {
            report.summary.portListening++;
        }
    }

    // 3. 检查本地端口 18795
    console.error('检查本地端口 18795...');
    report.localPort18795 = await checkLocalPort(18795);

    return report;
}

// 执行健康检查并输出 JSON 报告
runHealthCheck()
    .then((report) => {
        console.log(JSON.stringify(report, null, 2));
        process.exit(0);
    })
    .catch((err) => {
        const errorReport = {
            timestamp: new Date().toISOString(),
            error: err.message,
            status: 'failed'
        };
        console.error(JSON.stringify(errorReport, null, 2));
        process.exit(1);
    });
