/**
 * health-check.jest.test.js - 健康检查脚本 Jest 测试
 * 覆盖主要函数和边界情况
 */

const { Client } = require('ssh2');
const net = require('net');
const healthCheck = require('../scripts/health-check');

// Mock SSH2 Client
jest.mock('ssh2');
jest.mock('net');

describe('health-check.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset environment
        process.env.SSH_PASSWORD = 'test-password';
    });

    afterEach(() => {
        delete process.env.SSH_PASSWORD;
    });

    describe('parseArgs', () => {
        it('should default to text format when no args provided', () => {
            const args = healthCheck.parseArgs([]);
            expect(args.format).toBe('text');
        });

        it('should parse --json flag', () => {
            const args = healthCheck.parseArgs(['--json']);
            expect(args.format).toBe('json');
        });

        it('should parse --format=json', () => {
            const args = healthCheck.parseArgs(['--format=json']);
            expect(args.format).toBe('json');
        });

        it('should parse --format=text', () => {
            const args = healthCheck.parseArgs(['--format=text']);
            expect(args.format).toBe('text');
        });

        it('should handle multiple args correctly', () => {
            const args = healthCheck.parseArgs(['--json', '--other']);
            expect(args.format).toBe('json');
        });
    });

    describe('sleep', () => {
        it('should resolve after specified time', async () => {
            const start = Date.now();
            await healthCheck.sleep(100);
            const elapsed = Date.now() - start;
            expect(elapsed).toBeGreaterThanOrEqual(90);
            expect(elapsed).toBeLessThan(200);
        });

        it('should handle zero delay', async () => {
            const start = Date.now();
            await healthCheck.sleep(0);
            const elapsed = Date.now() - start;
            expect(elapsed).toBeLessThan(50);
        });
    });

    describe('withRetry', () => {
        it('should succeed on first attempt', async () => {
            const fn = jest.fn().mockResolvedValue('success');
            const result = await healthCheck.withRetry(fn, 3, 100);
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on retryable error', async () => {
            const fn = jest.fn()
                .mockRejectedValueOnce({ code: 'TIMEOUT' })
                .mockRejectedValueOnce({ code: 'ECONNRESET' })
                .mockResolvedValue('success');

            const result = await healthCheck.withRetry(fn, 3, 10);
            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should fail after max attempts', async () => {
            const fn = jest.fn().mockRejectedValue({ code: 'TIMEOUT' });
            await expect(healthCheck.withRetry(fn, 2, 10))
                .rejects.toEqual({ code: 'TIMEOUT' });
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('should not retry non-retryable error', async () => {
            const fn = jest.fn().mockRejectedValue({ code: 'AUTH_FAILED' });
            await expect(healthCheck.withRetry(fn, 3, 10, (err) => err.code === 'TIMEOUT'))
                .rejects.toEqual({ code: 'AUTH_FAILED' });
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should pass attempt number to function', async () => {
            const fn = jest.fn((attempt) => `attempt-${attempt}`);
            await healthCheck.withRetry(fn, 2, 10);
            expect(fn).toHaveBeenCalledWith(1);
        });
    });

    describe('checkSSHHost', () => {
        let mockClient;

        beforeEach(() => {
            mockClient = {
                connect: jest.fn(),
                on: jest.fn(),
                end: jest.fn(),
                destroy: jest.fn()
            };
            Client.mockImplementation(() => mockClient);
        });

        it('should return success when SSH connection succeeds', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'ready') {
                    setTimeout(() => callback(), 10);
                }
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkSSHHost(config);

            expect(result.host).toBe('test.example.com');
            expect(result.name).toBe('Test Host');
            expect(result.status).toBe('ok');
            expect(result.responseTime).toBeGreaterThan(0);
            expect(result.error).toBeNull();
        });

        it('should return error on SSH connection failure', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error('Connection refused')), 10);
                }
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkSSHHost(config);

            expect(result.status).toBe('error');
            expect(result.error).toContain('SSH连接失败');
            expect(result.errorCode).toBeDefined();
        });

        it('should handle connection timeout', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error('ETIMEDOUT')), 10);
                }
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkSSHHost(config);

            expect(result.status).toBe('error');
            expect(result.errorCode).toBe('ETIMEDOUT');
        });

        it('should retry on timeout', async () => {
            let attempts = 0;
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'ready') {
                    attempts++;
                    if (attempts === 2) {
                        setTimeout(() => callback(), 10);
                    } else if (event === 'error') {
                        setTimeout(() => callback(new Error('ETIMEDOUT')), 10);
                    }
                }
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkSSHHost(config);

            expect(result.status).toBe('ok');
            expect(result.attempts).toBeGreaterThan(1);
        });

        it('should use correct SSH credentials', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'ready') {
                    setTimeout(() => callback(), 10);
                }
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            await healthCheck.checkSSHHost(config);

            expect(mockClient.connect).toHaveBeenCalledWith({
                host: 'test.example.com',
                port: 22,
                username: 'root',
                password: 'test-password',
                readyTimeout: 10000
            });
        });
    });

    describe('execSSHCommand', () => {
        let mockClient;
        let mockStream;

        beforeEach(() => {
            mockStream = {
                on: jest.fn(),
                stderr: { on: jest.fn() }
            };
            mockClient = {
                exec: jest.fn((cmd, callback) => {
                    callback(null, mockStream);
                })
            };
        });

        it('should execute command and return output', async () => {
            mockStream.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from('command output'));
                } else if (event === 'close') {
                    callback(0);
                }
            });

            const result = await healthCheck.execSSHCommand(mockClient, 'echo test', 5000);
            expect(result).toBe('command output');
            expect(mockClient.exec).toHaveBeenCalledWith('echo test', expect.any(Function));
        });

        it('should handle command timeout', async () => {
            // Don't call close to trigger timeout
            mockStream.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from('output'));
                }
            });

            await expect(healthCheck.execSSHCommand(mockClient, 'sleep 10', 100))
                .rejects.toThrow('命令执行超时');
        });

        it('should collect stderr output', async () => {
            let stdoutData = '';
            let stderrData = '';

            mockStream.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from('stdout'));
                } else if (event === 'close') {
                    stdoutData += 'stdout';
                    callback(0);
                }
            });

            mockStream.stderr.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    stderrData += 'stderr';
                    callback(Buffer.from('stderr'));
                }
            });

            const result = await healthCheck.execSSHCommand(mockClient, 'test', 5000);
            expect(result).toContain('stdout');
        });

        it('should handle exec error', async () => {
            mockClient.exec = jest.fn((cmd, callback) => {
                callback(new Error('Command failed'), null);
            });

            await expect(healthCheck.execSSHCommand(mockClient, 'invalid', 5000))
                .rejects.toThrow('命令执行失败');
        });
    });

    describe('checkRemotePicoclaw', () => {
        let mockClient;
        let mockStream;

        beforeEach(() => {
            mockStream = {
                on: jest.fn(),
                stderr: { on: jest.fn() }
            };
            mockClient = {
                on: jest.fn(),
                exec: jest.fn((cmd, callback) => {
                    callback(null, mockStream);
                }),
                end: jest.fn()
            };
            Client.mockImplementation(() => mockClient);
        });

        it('should detect running picoclaw process', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'ready') {
                    setTimeout(() => callback(), 10);
                }
            });

            let execCount = 0;
            mockClient.exec.mockImplementation((cmd, callback) => {
                callback(null, mockStream);
                mockStream.on.mockImplementation((event, cb) => {
                    if (event === 'data') {
                        if (cmd.includes('ps aux')) {
                            execCount++;
                            cb(Buffer.from('root 1234 1.0 picoclaw'));
                        } else if (cmd.includes('netstat')) {
                            cb(Buffer.from('tcp 0 0 0.0.0.0:18795 LISTEN 1234/picoclaw'));
                        }
                    } else if (event === 'close') {
                        cb(0);
                    }
                });
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkRemotePicoclaw(config);

            expect(result.connectionStatus).toBe('connected');
            expect(result.picoclaw.running).toBe(true);
            expect(result.picoclaw.processes.length).toBeGreaterThan(0);
            expect(result.port18795.listening).toBe(true);
            expect(result.error).toBeNull();
        });

        it('should handle no picoclaw process running', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'ready') {
                    setTimeout(() => callback(), 10);
                }
            });

            mockClient.exec.mockImplementation((cmd, callback) => {
                callback(null, mockStream);
                mockStream.on.mockImplementation((event, cb) => {
                    if (event === 'data') {
                        cb(Buffer.from(''));
                    } else if (event === 'close') {
                        cb(0);
                    }
                });
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkRemotePicoclaw(config);

            expect(result.picoclaw.running).toBe(false);
            expect(result.picoclaw.processes).toEqual([]);
            expect(result.port18795.listening).toBe(false);
        });

        it('should handle SSH connection failure', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error('Connection failed')), 10);
                }
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkRemotePicoclaw(config);

            expect(result.connectionStatus).toBe('failed');
            expect(result.error).toContain('SSH连接失败');
        });

        it('should handle command timeout gracefully', async () => {
            mockClient.on.mockImplementation((event, callback) => {
                if (event === 'ready') {
                    setTimeout(() => callback(), 10);
                }
            });

            mockClient.exec.mockImplementation((cmd, callback) => {
                callback(null, mockStream);
                mockStream.on.mockImplementation((event, cb) => {
                    if (event === 'data') {
                        // Don't trigger close to simulate timeout
                    }
                });
            });

            const config = { host: 'test.example.com', port: 22, name: 'Test Host' };
            const result = await healthCheck.checkRemotePicoclaw(config);

            expect(result.connectionStatus).toBe('connected');
            expect(result.errorCode).toBe('CMD_TIMEOUT');
        });
    });

    describe('checkLocalPort', () => {
        let mockSocket;

        beforeEach(() => {
            mockSocket = {
                connect: jest.fn(),
                on: jest.fn(),
                destroy: jest.fn()
            };
            net.Socket.mockImplementation(() => mockSocket);
        });

        it('should detect listening port', async () => {
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'connect') {
                    setTimeout(() => callback(), 10);
                }
            });

            const result = await healthCheck.checkLocalPort(18795);

            expect(result.port).toBe(18795);
            expect(result.listening).toBe(true);
            expect(result.error).toBeNull();
        });

        it('should detect non-listening port', async () => {
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error('ECONNREFUSED')), 10);
                }
            });

            const result = await healthCheck.checkLocalPort(18795);

            expect(result.listening).toBe(false);
            expect(result.error).toContain('端口检查失败');
        });

        it('should handle port check timeout', async () => {
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    setTimeout(() => callback(new Error('ETIMEDOUT')), 10);
                }
            });

            const result = await healthCheck.checkLocalPort(18795);

            expect(result.errorCode).toBe('ETIMEDOUT');
        });

        it('should connect to localhost', async () => {
            mockSocket.on.mockImplementation((event, callback) => {
                if (event === 'connect') {
                    setTimeout(() => callback(), 10);
                }
            });

            await healthCheck.checkLocalPort(8080);

            expect(mockSocket.connect).toHaveBeenCalledWith(8080, '127.0.0.1');
        });
    });

    describe('formatReportAsText', () => {
        it('should format report with SSH hosts', () => {
            const report = {
                timestamp: '2024-01-01T00:00:00Z',
                sshHosts: [
                    { host: 'test.com', name: 'Test', status: 'ok', responseTime: 100, attempts: 1 }
                ],
                remoteChecks: [],
                localPort18795: { listening: true },
                summary: {
                    totalHosts: 1,
                    healthyHosts: 1,
                    unhealthyHosts: 0,
                    picoclawRunning: 0,
                    portListening: 0
                },
                config: {
                    timeout: { sshConnection: 10000, sshCommand: 8000, portCheck: 5000 },
                    retry: { maxAttempts: 3, delay: 1000 }
                }
            };

            const formatted = healthCheck.formatReportAsText(report);

            expect(formatted).toContain('健康检查报告');
            expect(formatted).toContain('test.com');
            expect(formatted).toContain('✅');
            expect(formatted).toContain('100ms');
        });

        it('should format report with errors', () => {
            const report = {
                timestamp: '2024-01-01T00:00:00Z',
                sshHosts: [
                    { host: 'test.com', name: 'Test', status: 'error', error: 'Connection failed', errorCode: 'ECONNREFUSED' }
                ],
                remoteChecks: [],
                localPort18795: null,
                summary: {
                    totalHosts: 1,
                    healthyHosts: 0,
                    unhealthyHosts: 1,
                    picoclawRunning: 0,
                    portListening: 0
                },
                config: {
                    timeout: { sshConnection: 10000, sshCommand: 8000, portCheck: 5000 },
                    retry: { maxAttempts: 3, delay: 1000 }
                }
            };

            const formatted = healthCheck.formatReportAsText(report);

            expect(formatted).toContain('❌');
            expect(formatted).toContain('Connection failed');
            expect(formatted).toContain('ECONNREFUSED');
        });

        it('should format remote picoclaw checks', () => {
            const report = {
                timestamp: '2024-01-01T00:00:00Z',
                sshHosts: [],
                remoteChecks: [
                    {
                        host: 'test.com',
                        name: 'Test',
                        connectionStatus: 'connected',
                        picoclaw: { running: true, processes: ['root 1234 picoclaw'] },
                        port18795: { listening: true }
                    }
                ],
                localPort18795: null,
                summary: {
                    totalHosts: 1,
                    healthyHosts: 0,
                    unhealthyHosts: 0,
                    picoclawRunning: 1,
                    portListening: 1
                },
                config: {
                    timeout: { sshConnection: 10000, sshCommand: 8000, portCheck: 5000 },
                    retry: { maxAttempts: 3, delay: 1000 }
                }
            };

            const formatted = healthCheck.formatReportAsText(report);

            expect(formatted).toContain('Picoclaw: ✅ 运行中');
            expect(formatted).toContain('端口 18795: ✅ 监听中');
        });

        it('should include summary statistics', () => {
            const report = {
                timestamp: '2024-01-01T00:00:00Z',
                sshHosts: [],
                remoteChecks: [],
                localPort18795: { listening: true },
                summary: {
                    totalHosts: 2,
                    healthyHosts: 1,
                    unhealthyHosts: 1,
                    picoclawRunning: 1,
                    portListening: 1
                },
                config: {
                    timeout: { sshConnection: 10000, sshCommand: 8000, portCheck: 5000 },
                    retry: { maxAttempts: 3, delay: 1000 }
                }
            };

            const formatted = healthCheck.formatReportAsText(report);

            expect(formatted).toContain('主机总数: 2');
            expect(formatted).toContain('健康主机: 1 (50%)');
            expect(formatted).toContain('不健康主机: 1');
        });
    });

    describe('formatErrorAsText', () => {
        it('should format error with message', () => {
            const errorReport = {
                timestamp: '2024-01-01T00:00:00Z',
                error: 'Test error message',
                stack: 'Error: Test error\n    at test.js:10:5',
                status: 'failed'
            };

            const formatted = healthCheck.formatErrorAsText(errorReport);

            expect(formatted).toContain('❌ 健康检查失败');
            expect(formatted).toContain('Test error message');
            expect(formatted).toContain('堆栈追踪');
        });

        it('should handle error without stack', () => {
            const errorReport = {
                timestamp: '2024-01-01T00:00:00Z',
                error: 'Test error',
                status: 'failed'
            };

            const formatted = healthCheck.formatErrorAsText(errorReport);

            expect(formatted).toContain('Test error');
            expect(formatted).not.toContain('堆栈追踪');
        });
    });

    describe('CONFIG', () => {
        it('should have correct SSH hosts configuration', () => {
            expect(healthCheck.CONFIG.sshHosts).toBeInstanceOf(Array);
            expect(healthCheck.CONFIG.sshHosts.length).toBeGreaterThan(0);
            expect(healthCheck.CONFIG.sshHosts[0]).toHaveProperty('host');
            expect(healthCheck.CONFIG.sshHosts[0]).toHaveProperty('port');
            expect(healthCheck.CONFIG.sshHosts[0]).toHaveProperty('name');
        });

        it('should have timeout configuration', () => {
            expect(healthCheck.CONFIG.timeouts).toHaveProperty('sshConnection');
            expect(healthCheck.CONFIG.timeouts).toHaveProperty('sshCommand');
            expect(healthCheck.CONFIG.timeouts).toHaveProperty('portCheck');
            expect(healthCheck.CONFIG.timeouts.sshConnection).toBe(10000);
            expect(healthCheck.CONFIG.timeouts.sshCommand).toBe(8000);
            expect(healthCheck.CONFIG.timeouts.portCheck).toBe(5000);
        });

        it('should have retry configuration', () => {
            expect(healthCheck.CONFIG.retry).toHaveProperty('maxAttempts');
            expect(healthCheck.CONFIG.retry).toHaveProperty('delay');
            expect(healthCheck.CONFIG.retry.maxAttempts).toBe(3);
            expect(healthCheck.CONFIG.retry.delay).toBe(1000);
        });
    });
});
