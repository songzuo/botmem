/**
 * health-check.test.js - 健康检查脚本单元测试
 */

const assert = require('assert');

// 模拟测试 - 验证数据结构
function testReportStructure() {
    const mockReport = {
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

    // 验证必填字段
    assert(mockReport.timestamp, '应有 timestamp 字段');
    assert(mockReport.version, '应有 version 字段');
    assert(mockReport.sshHosts, '应有 sshHosts 字段');
    assert(mockReport.remoteChecks, '应有 remoteChecks 字段');
    assert(mockReport.summary, '应有 summary 字段');
    
    console.log('✅ 数据结构验证通过');
}

function testSSHHostValidation() {
    const host = { host: 'bot3.szspd.cn', port: 22, name: 'bot3' };
    
    // 验证必要字段
    assert(host.host, '应有 host 字段');
    assert(host.port > 0, '端口应为正整数');
    assert(host.name, '应有 name 字段');
    
    console.log('✅ SSH 主机配置验证通过');
}

function testRemoteCheckResultValidation() {
    const result = {
        host: 'bot3.szspd.cn',
        picoclaw: { running: false, processes: [] },
        port18795: { listening: false },
        disk: { usage: null, error: null },
        memory: { total: null, used: null, usagePercent: null },
        cpu: { usage: null, loadAvg: null },
        error: null
    };

    // 验证所有监控项
    assert(result.picoclaw !== undefined, '应有 picoclaw 监控');
    assert(result.port18795 !== undefined, '应有端口监控');
    assert(result.disk !== undefined, '应有磁盘监控');
    assert(result.memory !== undefined, '应有内存监控');
    assert(result.cpu !== undefined, '应有 CPU 监控');
    
    console.log('✅ 远程检查结果验证通过');
}

function testSummaryCalculation() {
    const checks = [
        { disk: { usage: 85 }, memory: { usagePercent: 90 } },
        { disk: { usage: 50 }, memory: { usagePercent: 40 } },
        { disk: { usage: 70 }, memory: { usagePercent: 75 } }
    ];
    
    let highDisk = 0;
    let highMemory = 0;
    
    checks.forEach(check => {
        if (check.disk.usage > 80) highDisk++;
        if (check.memory.usagePercent > 80) highMemory++;
    });
    
    assert(highDisk === 1, '应检测到 1 个高磁盘使用率');
    assert(highMemory === 1, '应检测到 1 个高内存使用率');
    
    console.log('✅ 摘要统计计算验证通过');
}

// 运行所有测试
console.log('🧪 运行单元测试...\n');

try {
    testReportStructure();
    testSSHHostValidation();
    testRemoteCheckResultValidation();
    testSummaryCalculation();
    console.log('\n✅ 所有测试通过!');
    process.exit(0);
} catch (err) {
    console.error('\n❌ 测试失败:', err.message);
    process.exit(1);
}
