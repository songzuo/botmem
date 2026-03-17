/**
 * health-check-json.test.js - JSON 输出功能单元测试
 */

const assert = require('assert');
const { execSync } = require('child_process');

/**
 * 测试 JSON 格式输出是否有效
 */
function testJsonOutputFormat() {
    console.log('测试 JSON 输出格式...');
    
    // 执行脚本并获取输出（使用 --json 参数）
    let stdout, stderr;
    try {
        stdout = execSync('node scripts/health-check.js --json', {
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, SSH_PASSWORD: 'test_password_for_mock' }
        });
        stderr = execSync('node scripts/health-check.js --json 2>&1', {
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, SSH_PASSWORD: 'test_password_for_mock' }
        });
    } catch (err) {
        // 脚本可能因 SSH 连接失败而退出，但输出仍应包含有效的 JSON
        stdout = err.stdout || '';
        stderr = err.stderr || '';
    }
    
    // 检查输出是否包含 JSON（可能在 stdout 或 stderr 中）
    const output = stdout || stderr;
    const jsonLines = output.split('\n').filter(line => line.trim().startsWith('{'));
    
    assert(jsonLines.length > 0, '应输出 JSON 格式数据');
    
    // 验证 JSON 是否有效
    const report = JSON.parse(jsonLines[0]);
    assert(report, 'JSON 应该可以解析');
    
    console.log('✅ JSON 输出格式有效');
    return report;
}

/**
 * 测试 JSON 输出包含必要字段
 */
function testRequiredFields(report) {
    console.log('测试必要字段...');
    
    // 必需的顶层字段
    const requiredTopLevelFields = [
        'timestamp',
        'sshHosts',
        'remoteChecks',
        'localPort18795',
        'summary'
    ];
    
    requiredTopLevelFields.forEach(field => {
        assert(report.hasOwnProperty(field), `缺少顶层字段: ${field}`);
    });
    
    // 验证 timestamp 格式
    const timestamp = new Date(report.timestamp);
    assert(!isNaN(timestamp.getTime()), 'timestamp 应为有效的 ISO 8601 日期时间');
    
    // 验证 sshHosts 是数组
    assert(Array.isArray(report.sshHosts), 'sshHosts 应为数组');
    
    // 验证 remoteChecks 是数组
    assert(Array.isArray(report.remoteChecks), 'remoteChecks 应为数组');
    
    // 验证 summary 对象包含必需字段
    const requiredSummaryFields = [
        'totalHosts',
        'healthyHosts',
        'unhealthyHosts',
        'picoclawRunning',
        'portListening'
    ];
    
    requiredSummaryFields.forEach(field => {
        assert(report.summary.hasOwnProperty(field), `summary 缺少字段: ${field}`);
    });
    
    // 验证数值字段为非负数
    assert(report.summary.totalHosts >= 0, 'totalHosts 应为非负数');
    assert(report.summary.healthyHosts >= 0, 'healthyHosts 应为非负数');
    assert(report.summary.unhealthyHosts >= 0, 'unhealthyHosts 应为非负数');
    assert(report.summary.picoclawRunning >= 0, 'picoclawRunning 应为非负数');
    assert(report.summary.portListening >= 0, 'portListening 应为非负数');
    
    console.log('✅ 所有必需字段存在');
}

/**
 * 测试 SSH 主机检查结果结构
 */
function testSshHostStructure() {
    console.log('测试 SSH 主机检查结果结构...');
    
    let stdout, stderr;
    try {
        stdout = execSync('node scripts/health-check.js --json', {
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, SSH_PASSWORD: 'test_password_for_mock' }
        });
        stderr = execSync('node scripts/health-check.js --json 2>&1', {
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, SSH_PASSWORD: 'test_password_for_mock' }
        });
    } catch (err) {
        stdout = err.stdout || '';
        stderr = err.stderr || '';
    }
    
    const output = stdout || stderr;
    const jsonLines = output.split('\n').filter(line => line.trim().startsWith('{'));
    
    if (jsonLines.length === 0) {
        console.log('⚠️  跳过 SSH 主机结构测试（无输出）');
        return;
    }
    
    const report = JSON.parse(jsonLines[0]);
    
    // 如果有 SSH 主机检查结果，验证其结构
    if (report.sshHosts.length > 0) {
        const host = report.sshHosts[0];
        const requiredHostFields = [
            'host',
            'name',
            'status'
        ];
        
        requiredHostFields.forEach(field => {
            assert(host.hasOwnProperty(field), `SSH 主机检查结果缺少字段: ${field}`);
        });
        
        // 验证 status 值是否有效
        const validStatuses = ['ok', 'error', 'timeout', 'unknown'];
        assert(validStatuses.includes(host.status), `status 值无效: ${host.status}`);
        
        console.log('✅ SSH 主机检查结果结构正确');
    } else {
        console.log('⚠️  无 SSH 主机检查结果');
    }
}

/**
 * 测试远程检查结果结构
 */
function testRemoteCheckStructure() {
    console.log('测试远程检查结果结构...');
    
    let stdout, stderr;
    try {
        stdout = execSync('node scripts/health-check.js --json', {
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, SSH_PASSWORD: 'test_password_for_mock' }
        });
        stderr = execSync('node scripts/health-check.js --json 2>&1', {
            encoding: 'utf8',
            timeout: 30000,
            env: { ...process.env, SSH_PASSWORD: 'test_password_for_mock' }
        });
    } catch (err) {
        stdout = err.stdout || '';
        stderr = err.stderr || '';
    }
    
    const output = stdout || stderr;
    const jsonLines = output.split('\n').filter(line => line.trim().startsWith('{'));
    
    if (jsonLines.length === 0) {
        console.log('⚠️  跳过远程检查结构测试（无输出）');
        return;
    }
    
    const report = JSON.parse(jsonLines[0]);
    
    // 如果有远程检查结果，验证其结构
    if (report.remoteChecks.length > 0) {
        const check = report.remoteChecks[0];
        const requiredCheckFields = [
            'host',
            'picoclaw',
            'port18795'
        ];
        
        requiredCheckFields.forEach(field => {
            assert(check.hasOwnProperty(field), `远程检查结果缺少字段: ${field}`);
        });
        
        // 验证 picoclaw 结构
        assert(check.picoclaw.hasOwnProperty('running'), 'picoclaw 应包含 running 字段');
        assert(typeof check.picoclaw.running === 'boolean', 'picoclaw.running 应为布尔值');
        assert(Array.isArray(check.picoclaw.processes), 'picoclaw.processes 应为数组');
        
        // 验证 port18795 结构
        assert(check.port18795.hasOwnProperty('listening'), 'port18795 应包含 listening 字段');
        assert(typeof check.port18795.listening === 'boolean', 'port18795.listening 应为布尔值');
        
        console.log('✅ 远程检查结果结构正确');
    } else {
        console.log('⚠️  无远程检查结果');
    }
}

/**
 * 测试错误情况的 JSON 输出
 */
function testErrorJsonOutput() {
    console.log('测试错误情况的 JSON 输出...');
    
    // 使用无效参数触发错误
    let stdout, stderr;
    try {
        stdout = execSync('node scripts/health-check.js --json', {
            encoding: 'utf8',
            timeout: 30000
            // 不提供 SSH_PASSWORD，可能会触发错误
        });
        stderr = execSync('node scripts/health-check.js --json 2>&1', {
            encoding: 'utf8',
            timeout: 30000
        });
    } catch (err) {
        stdout = err.stdout || '';
        stderr = err.stderr || '';
    }
    
    const output = stdout || stderr;
    const jsonLines = output.split('\n').filter(line => line.trim().startsWith('{'));
    
    if (jsonLines.length > 0) {
        const errorReport = JSON.parse(jsonLines[jsonLines.length - 1]); // 可能最后一行是错误报告
        
        // 如果是错误报告，验证其结构
        if (errorReport.status === 'failed') {
            assert(errorReport.hasOwnProperty('timestamp'), '错误报告应有 timestamp');
            assert(errorReport.hasOwnProperty('error'), '错误报告应有 error');
            assert(errorReport.hasOwnProperty('status'), '错误报告应有 status');
            assert(errorReport.status === 'failed', 'status 应为 failed');
            
            console.log('✅ 错误情况的 JSON 输出正确');
            return;
        }
    }
    
    console.log('⚠️  未检测到错误情况');
}

/**
 * 测试摘要统计的一致性
 */
function testSummaryConsistency(report) {
    console.log('测试摘要统计的一致性...');
    
    // 验证 totalHosts 等于 healthyHosts + unhealthyHosts
    const calculatedTotal = report.summary.healthyHosts + report.summary.unhealthyHosts;
    assert(report.summary.totalHosts === calculatedTotal,
        `摘要不一致: totalHosts(${report.summary.totalHosts}) != healthyHosts(${report.summary.healthyHosts}) + unhealthyHosts(${report.summary.unhealthyHosts})`
    );
    
    // 验证 sshHosts 数量与 totalHosts 一致
    assert(report.sshHosts.length === report.summary.totalHosts,
        `SSH 主机数量(${report.sshHosts.length}) 与 totalHosts(${report.summary.totalHosts}) 不一致`
    );
    
    // 验证 remoteChecks 数量与 sshHosts 数量一致
    assert(report.remoteChecks.length === report.sshHosts.length,
        `remoteChecks 数量(${report.remoteChecks.length}) 与 sshHosts 数量(${report.sshHosts.length}) 不一致`
    );
    
    console.log('✅ 摘要统计一致');
}

// 运行所有测试
console.log('🧪 运行 JSON 输出功能单元测试...\n');

try {
    let report = testJsonOutputFormat();
    testRequiredFields(report);
    testSummaryConsistency(report);
    testSshHostStructure();
    testRemoteCheckStructure();
    testErrorJsonOutput();
    
    console.log('\n✅ 所有测试通过!');
    process.exit(0);
} catch (err) {
    console.error('\n❌ 测试失败:', err.message);
    console.error(err.stack);
    process.exit(1);
}
