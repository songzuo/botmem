# xunshi-inspector 示例文档

本文档提供详细的使用示例和常见场景解决方案。

## 目录

- [快速入门示例](#快速入门示例)
- [健康检查示例](#健康检查示例)
- [Bash 脚本示例](#bash-脚本示例)
- [API 使用示例](#api-使用示例)
- [集成示例](#集成示例)
- [故障排除示例](#故障排除示例)
- [高级配置示例](#高级配置示例)

---

## 快速入门示例

### 示例 1: 第一次运行

```bash
# 1. 进入项目目录
cd /root/.openclaw/workspace/xunshi-inspector

# 2. 安装依赖
npm install

# 3. 设置 SSH 密码
export SSH_PASSWORD="your-password"

# 4. 运行健康检查
npm run health-check
```

**预期输出:**
```
============================================================
健康检查报告 - 2026-03-17T06:30:00.000Z
============================================================

【SSH 主机连通性】
  ✅ bot3 (Evolver/经理) (bot3.szspd.cn): ok - 150ms
  ✅ 7zi (协调经理) (7zi.com): ok - 180ms

【远程 Picoclaw 状态】
  bot3.szspd.cn:
    - Picoclaw: ✅ 运行中
    - 端口 18795: ✅ 监听中

【本地端口 18795】
  ✅ 监听中

【摘要】
  主机总数: 2
  健康主机: 2
  不健康主机: 0
============================================================
```

---

### 示例 2: JSON 输出

```bash
# JSON 格式输出
node scripts/health-check.js --json > report.json

# 美化 JSON 输出
node scripts/health-check.js --json | jq .

# 查看特定字段
node scripts/health-check.js --json | jq '.summary.healthyHosts'
```

---

### 示例 3: 增强版检查

```bash
# 运行增强版检查（包含系统资源）
node scripts/health-check-enhanced.js | jq '.'

# 查看磁盘使用情况
node scripts/health-check-enhanced.js | jq '.remoteChecks[].disk'

# 查看内存使用情况
node scripts/health-check-enhanced.js | jq '.remoteChecks[].memory'
```

---

## 健康检查示例

### 示例 4: 检查单个主机

编辑 `scripts/health-check.js`，修改 `SSH_HOSTS`:

```javascript
const SSH_HOSTS = [
    { host: 'bot3.szspd.cn', port: 22, name: 'bot3' }
];
```

运行检查:
```bash
node scripts/health-check.js
```

---

### 示例 5: 定时检查

创建定时任务:
```bash
crontab -e
```

添加:
```bash
# 每 5 分钟检查一次
*/5 * * * * cd /root/.openclaw/workspace/xunshi-inspector && npm run health-check >> /var/log/xunshi-inspector/health.log 2>&1
```

---

### 示例 6: 邮件告警

创建告警脚本 `scripts/alert.sh`:

```bash
#!/bin/bash
REPORT=$(node scripts/health-check.js --json)
UNHEALTHY=$(echo $REPORT | jq '.summary.unhealthyHosts')

if [ "$UNHEALTHY" -gt 0 ]; then
    echo "警告: 检测到 $UNHEALTHY 个主机不健康" | mail -s "xunshi-inspector 告警" admin@example.com
fi
```

定时执行:
```bash
# 每 10 分钟检查并发送告警
*/10 * * * * /root/.openclaw/workspace/xunshi-inspector/scripts/alert.sh
```

---

## Bash 脚本示例

### 示例 7: 使用公共函数库

创建脚本 `scripts/my-check.sh`:

```bash
#!/bin/bash

# 引用公共函数库
source scripts/lib-common.sh

echo "=== 开始检查 ==="

# 检查节点
echo "检查节点连通性..."
check_nodes "7zi.com bot3.szspd.cn bot6.szspd.cn"
if [ $? -eq 0 ]; then
    echo "✅ 所有节点在线"
else
    echo "❌ 有节点离线"
fi

# 检查端口
echo "检查端口..."
for host in 7zi.com bot3.szspd.cn; do
    if check_port "$host" 18795 5; then
        echo "✅ $host:18795 开放"
    else
        echo "❌ $host:18795 未开放"
    fi
done

# 获取系统状态
echo "系统状态:"
get_system_status

# 记录日志
log_message "/var/log/my-check.log" "检查完成"

echo "=== 检查完成 ==="
```

运行:
```bash
chmod +x scripts/my-check.sh
./scripts/my-check.sh
```

---

### 示例 8: 集群节点检查

```bash
#!/bin/bash

# 引用集群函数库
source scripts/cluster-common.sh

echo "=== 集群节点状态 ==="
check_all_nodes

echo ""
echo "=== HTTP 端点检查 ==="
ENDPOINTS=(
    "http://bot3.szspd.cn:11435/health"
    "http://7zi.com:8080/status"
)

for url in "${ENDPOINTS[@]}"; do
    STATUS=$(check_http_endpoint "$url" 5)
    if [ "$STATUS" = "ok" ]; then
        echo "✅ $url"
    else
        echo "❌ $url"
    fi
done

echo ""
echo "=== 记录日志 ==="
log_write "cluster-check.log" "集群检查完成"
```

---

### 示例 9: 巡视经理检查

```bash
# 运行巡视经理检查
bash scripts/inspector-check.sh

# 定时执行（每 10 分钟）
*/10 * * * * /root/.openclaw/workspace/xunshi-inspector/scripts/inspector-check.sh >> /root/workspace-logs/inspection.log 2>&1

# 查看日志
tail -f /root/workspace-logs/inspection.log
```

---

## API 使用示例

### 示例 10: 在 Node.js 中使用 API

创建文件 `examples/usage.js`:

```javascript
const {
    checkSSHHost,
    checkRemotePicoclaw,
    checkLocalPort,
    runHealthCheck,
    formatReportAsText
} = require('../scripts/health-check.js');

async function main() {
    console.log('=== 示例 1: 检查单个主机 ===');
    const host = { host: 'bot3.szspd.cn', port: 22, name: 'bot3' };
    const sshResult = await checkSSHHost(host);
    console.log('SSH 状态:', sshResult.status);
    console.log('响应时间:', sshResult.responseTime, 'ms');

    console.log('\n=== 示例 2: 检查 picoclaw ===');
    const picoclawResult = await checkRemotePicoclaw(host);
    console.log('Picoclaw 运行中:', picoclawResult.picoclaw.running);
    console.log('端口 18795 监听中:', picoclawResult.port18795.listening);

    console.log('\n=== 示例 3: 检查本地端口 ===');
    const localPort = await checkLocalPort(18795);
    console.log('本地端口 18795:', localPort.listening ? '监听中' : '未监听');

    console.log('\n=== 示例 4: 完整健康检查 ===');
    const report = await runHealthCheck();
    console.log(formatReportAsText(report));

    console.log('\n=== 示例 5: 解析 JSON ===');
    console.log('健康主机数:', report.summary.healthyHosts);
    console.log('主机总数:', report.summary.totalHosts);
}

main().catch(console.error);
```

运行:
```bash
node examples/usage.js
```

---

### 示例 11: 使用报告生成器

创建文件 `examples/report-usage.js`:

```javascript
const ReportGenerator = require('../scripts/report-generator');

async function generateReport() {
    const generator = new ReportGenerator();

    // 添加检查结果
    generator.addResult({
        status: 'ok',
        name: 'bot3',
        host: 'bot3.szspd.cn',
        message: '所有检查通过',
        details: { responseTime: 150, cpu: 45, memory: 60 }
    });

    generator.addResult({
        status: 'warning',
        name: '7zi',
        host: '7zi.com',
        message: '磁盘使用率较高',
        details: { diskUsage: 85 }
    });

    // 生成 JSON 报告
    const jsonReport = generator.generateJSON();
    console.log('JSON 报告:');
    console.log(jsonReport);

    // 生成文本报告
    const textReport = generator.generateText();
    console.log('\n文本报告:');
    console.log(textReport);

    // 保存报告
    const jsonPath = generator.saveReport(`health-report-${Date.now()}.json`, 'json');
    const textPath = generator.saveReport(`health-report-${Date.now()}.txt`, 'text');

    console.log('\n报告已保存:');
    console.log('  JSON:', jsonPath);
    console.log('  Text:', textPath);
}

generateReport();
```

运行:
```bash
node examples/report-usage.js
```

---

### 示例 12: 使用配置验证器

创建文件 `examples/config-validation.js`:

```javascript
const ConfigValidator = require('../scripts/config-validator');

function validateConfig() {
    const validator = new ConfigValidator();

    console.log('=== 示例 1: 验证默认配置 ===');
    const defaultConfig = validator.getDefaultConfig();
    console.log('默认配置:', JSON.stringify(defaultConfig, null, 2));

    console.log('\n=== 示例 2: 验证自定义配置 ===');
    const myConfig = {
        name: 'my-inspector',
        version: '2.0.0',
        timeout: 60000,
        retries: 5,
        logging: {
            level: 'debug',
            format: 'text'
        }
    };

    const result = validator.validateConfig(myConfig);
    console.log('验证结果:', result.valid ? '✅ 有效' : '❌ 无效');
    console.log('错误:', result.errors);
    console.log('警告:', result.warnings);

    console.log('\n=== 示例 3: 验证错误配置 ===');
    const badConfig = {
        name: 'bad-config',
        timeout: -1,  // 无效值
        retries: '3'  // 类型错误
    };

    const badResult = validator.validateConfig(badConfig);
    console.log('验证结果:', badResult.valid ? '✅ 有效' : '❌ 无效');
    console.log('错误:', badResult.errors);
}

validateConfig();
```

运行:
```bash
node examples/config-validation.js
```

---

## 集成示例

### 示例 13: 集成到 Web 服务器

创建文件 `examples/web-server.js`:

```javascript
const express = require('express');
const { runHealthCheck } = require('../scripts/health-check.js');

const app = express();
const PORT = 3000;

// 健康检查端点
app.get('/health', async (req, res) => {
    try {
        const report = await runHealthCheck();
        const isHealthy = report.summary.healthyHosts === report.summary.totalHosts;

        res.status(isHealthy ? 200 : 503).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            report: report
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// 状态端点（简化版）
app.get('/status', async (req, res) => {
    try {
        const report = await runHealthCheck();
        res.json({
            timestamp: report.timestamp,
            total: report.summary.totalHosts,
            healthy: report.summary.healthyHosts,
            unhealthy: report.summary.unhealthyHosts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`健康检查服务器运行在 http://localhost:${PORT}`);
});
```

运行:
```bash
node examples/web-server.js

# 访问端点
curl http://localhost:3000/health
curl http://localhost:3000/status
```

---

### 示例 14: 集成到 CI/CD 流水线

创建 `.github/workflows/health-check.yml`:

```yaml
name: Health Check

on:
  schedule:
    - cron: '*/5 * * * *'  # 每 5 分钟
  workflow_dispatch:        # 手动触发

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Set SSH password
        run: echo "SSH_PASSWORD=${{ secrets.SSH_PASSWORD }}" >> $GITHUB_ENV

      - name: Run health check
        run: npm run health-check --json > report.json

      - name: Check results
        run: |
          UNHEALTHY=$(cat report.json | jq '.summary.unhealthyHosts')
          if [ "$UNHEALTHY" -gt 0 ]; then
            echo "检测到不健康主机"
            exit 1
          fi

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: health-report
          path: report.json
```

---

### 示例 15: 集成到 Telegram Bot

创建文件 `examples/telegram-bot.js`:

```javascript
const TelegramBot = require('node-telegram-bot-api');
const { runHealthCheck } = require('../scripts/health-check.js');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const bot = new TelegramBot(token, { polling: false });

async function sendHealthReport() {
    try {
        const report = await runHealthCheck();
        const message = formatMessage(report);
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log('报告已发送');
    } catch (error) {
        console.error('发送失败:', error);
    }
}

function formatMessage(report) {
    let msg = '*健康检查报告*\n\n';
    msg += `时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}\n`;
    msg += `主机总数: ${report.summary.totalHosts}\n`;
    msg += `健康主机: ${report.summary.healthyHosts}\n`;
    msg += `不健康主机: ${report.summary.unhealthyHosts}\n\n`;

    if (report.summary.unhealthyHosts > 0) {
        msg += '⚠️ *警告:* 有主机不健康\n';
    }

    report.sshHosts.forEach(host => {
        const icon = host.status === 'ok' ? '✅' : '❌';
        msg += `${icon} ${host.name}: ${host.status}\n`;
    });

    return msg;
}

// 运行
sendHealthReport();
```

运行:
```bash
export TELEGRAM_BOT_TOKEN="your-token"
export TELEGRAM_CHAT_ID="your-chat-id"
node examples/telegram-bot.js
```

定时执行:
```bash
# 每 30 分钟发送一次报告
*/30 * * * * cd /root/.openclaw/workspace/xunshi-inspector && node examples/telegram-bot.js
```

---

## 故障排除示例

### 示例 16: 诊断连接问题

创建脚本 `scripts/diagnose.sh`:

```bash
#!/bin/bash

source scripts/lib-common.sh

HOST="bot3.szspd.cn"

echo "=== 诊断 $HOST ==="

echo -e "\n[1/5] Ping 测试..."
if timeout 5 ping -c 3 $HOST > /dev/null 2>&1; then
    echo "✅ Ping 成功"
else
    echo "❌ Ping 失败"
fi

echo -e "\n[2/5] SSH 连接测试..."
if ssh_exec "$HOST" "hostname" 10; then
    echo "✅ SSH 连接成功"
else
    echo "❌ SSH 连接失败"
    echo "  请检查:"
    echo "  - SSH 密码是否正确: SSH_PASSWORD=$SSH_PASSWORD"
    echo "  - SSH 服务是否运行: ssh $HOST 'systemctl status sshd'"
fi

echo -e "\n[3/5] 端口 18795 测试..."
if check_port "$HOST" 18795 5; then
    echo "✅ 端口 18795 开放"
else
    echo "❌ 端口 18795 未开放"
    echo "  请检查:"
    echo "  - picoclaw 进程: ssh $HOST 'ps aux | grep picoclaw'"
    echo "  - 端口监听: ssh $HOST 'netstat -tlnp | grep 18795'"
fi

echo -e "\n[4/5] HTTP 端点测试..."
if check_http_endpoint "http://$HOST:11435/health" 5; then
    echo "✅ HTTP 端点正常"
else
    echo "❌ HTTP 端点异常"
fi

echo -e "\n[5/5] 系统资源检查..."
ssh_exec "$HOST" "free | awk 'NR==2{print \"内存使用率: \"int(\$3*100/\$2)\"%\"}'"
ssh_exec "$HOST" "df / | awk 'NR==2{print \"磁盘使用率: \"\$5}'"
ssh_exec "$HOST" "uptime"

echo -e "\n=== 诊断完成 ==="
```

运行:
```bash
chmod +x scripts/diagnose.sh
./scripts/diagnose.sh
```

---

### 示例 17: 重启不健康的服务

创建脚本 `scripts/auto-fix.sh`:

```bash
#!/bin/bash

source scripts/lib-common.sh

HOST="bot3.szspd.cn"

echo "=== 自动修复 $HOST ==="

# 检查 picoclaw 进程
echo "检查 picoclaw 进程..."
COUNT=$(ssh_exec "$HOST" "ps aux | grep picoclaw | grep -v grep | wc -l")

if [ "$COUNT" -eq 0 ]; then
    echo "❌ picoclaw 未运行，尝试重启..."
    ssh_exec "$HOST" "systemctl restart picoclaw"
    sleep 5

    # 再次检查
    NEW_COUNT=$(ssh_exec "$HOST" "ps aux | grep picoclaw | grep -v grep | wc -l")
    if [ "$NEW_COUNT" -gt 0 ]; then
        echo "✅ picoclaw 已重启"
    else
        echo "❌ picoclaw 重启失败"
    fi
else
    echo "✅ picoclaw 正在运行 ($COUNT 个进程)"
fi

# 检查磁盘空间
echo -e "\n检查磁盘空间..."
DISK=$(ssh_exec "$HOST" "df / | awk 'NR==2{gsub(/%/,'\"'\"','\"'\"'); print \$5}'")

if [ "$DISK" -gt 90 ]; then
    echo "❌ 磁盘空间不足 ($DISK%)，尝试清理..."
    ssh_exec "$HOST" "apt-get clean"
    ssh_exec "$HOST" "journalctl --vacuum-time=7d"
    echo "✅ 清理完成"
else
    echo "✅ 磁盘空间正常 ($DISK%)"
fi

# 检查内存
echo -e "\n检查内存使用..."
MEM=$(ssh_exec "$HOST" "free | awk 'NR==2{printf \"%d\", \$3*100/\$2}'")

if [ "$MEM" -gt 90 ]; then
    echo "❌ 内存使用率过高 ($MEM%)"
    ssh_exec "$HOST" "free -h"
else
    echo "✅ 内存使用正常 ($MEM%)"
fi

echo -e "\n=== 自动修复完成 ==="
```

运行:
```bash
chmod +x scripts/auto-fix.sh
./scripts/auto-fix.sh
```

---

## 高级配置示例

### 示例 18: 使用 SSH 密钥认证

```javascript
// 修改 scripts/health-check.js
conn.connect({
    host: config.host,
    port: config.port,
    username: 'root',
    privateKey: require('fs').readFileSync('/root/.ssh/xunshi_inspector_key'),
    readyTimeout: SSH_TIMEOUT
});
```

---

### 示例 19: 自定义告警规则

创建文件 `examples/custom-alert.js`:

```javascript
const { runHealthCheck } = require('../scripts/health-check.js');

async function checkWithCustomAlerts() {
    const report = await runHealthCheck();

    // 自定义告警规则
    const alerts = [];

    // 规则 1: 检查响应时间
    report.sshHosts.forEach(host => {
        if (host.responseTime > 500) {
            alerts.push({
                type: 'warning',
                message: `${host.name} 响应时间过长: ${host.responseTime}ms`
            });
        }
    });

    // 规则 2: 检查 CPU 负载
    report.remoteChecks.forEach(check => {
        if (check.cpu.loadAvg && check.cpu.loadAvg.m1 > 2.0) {
            alerts.push({
                type: 'warning',
                message: `${check.host} 1分钟负载过高: ${check.cpu.loadAvg.m1}`
            });
        }
    });

    // 规则 3: 检查内存
    report.remoteChecks.forEach(check => {
        if (check.memory.usagePercent > 90) {
            alerts.push({
                type: 'critical',
                message: `${check.host} 内存使用率过高: ${check.memory.usagePercent}%`
            });
        }
    });

    // 输出告警
    if (alerts.length > 0) {
        console.log('=== 告警 ===');
        alerts.forEach(alert => {
            const icon = alert.type === 'critical' ? '🔴' : '⚠️';
            console.log(`${icon} ${alert.message}`);
        });
    } else {
        console.log('✅ 无告警');
    }

    return { report, alerts };
}

checkWithCustomAlerts();
```

---

### 示例 20: 批量操作多个集群

创建文件 `examples/batch-check.js`:

```javascript
const { runHealthCheck } = require('../scripts/health-check.js');

// 定义多个集群
const clusters = {
    production: [
        { host: 'prod1.example.com', port: 22, name: 'prod1' },
        { host: 'prod2.example.com', port: 22, name: 'prod2' }
    ],
    staging: [
        { host: 'stage1.example.com', port: 22, name: 'stage1' }
    ],
    development: [
        { host: 'dev1.example.com', port: 22, name: 'dev1' },
        { host: 'dev2.example.com', port: 22, name: 'dev2' }
    ]
};

async function checkAllClusters() {
    const results = {};

    for (const [clusterName, hosts] of Object.entries(clusters)) {
        console.log(`\n=== 检查集群: ${clusterName} ===`);

        // 临时修改 SSH_HOSTS
        const originalSSH_HOSTS = require('../scripts/health-check.js').SSH_HOSTS;
        require.cache[require.resolve('../scripts/health-check.js')].exports.SSH_HOSTS = hosts;

        try {
            const report = await runHealthCheck();
            results[clusterName] = report;

            const healthy = report.summary.healthyHosts;
            const total = report.summary.totalHosts;
            console.log(`健康: ${healthy}/${total}`);

            if (healthy < total) {
                console.log(`⚠️ ${clusterName} 集群有 ${total - healthy} 个主机不健康`);
            }
        } catch (error) {
            console.error(`❌ ${clusterName} 集群检查失败:`, error.message);
            results[clusterName] = { error: error.message };
        }
    }

    // 生成汇总报告
    console.log('\n=== 汇总报告 ===');
    for (const [clusterName, result] of Object.entries(results)) {
        if (result.error) {
            console.log(`❌ ${clusterName}: ${result.error}`);
        } else {
            const healthy = result.summary.healthyHosts;
            const total = result.summary.totalHosts;
            const icon = healthy === total ? '✅' : '⚠️';
            console.log(`${icon} ${clusterName}: ${healthy}/${total} 健康`);
        }
    }

    return results;
}

checkAllClusters();
```

---

## 更多示例

### 示例 21: 生成 HTML 报告

创建文件 `examples/html-report.js`:

```javascript
const { runHealthCheck } = require('../scripts/health-check.js');
const fs = require('fs');

async function generateHTMLReport() {
    const report = await runHealthCheck();
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>健康检查报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .ok { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .summary { background-color: #f2f2f2; padding: 10px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>健康检查报告</h1>
    <p>时间: ${new Date(report.timestamp).toLocaleString('zh-CN')}</p>

    <div class="summary">
        <h2>摘要</h2>
        <p>主机总数: ${report.summary.totalHosts}</p>
        <p>健康主机: <span class="ok">${report.summary.healthyHosts}</span></p>
        <p>不健康主机: <span class="error">${report.summary.unhealthyHosts}</span></p>
    </div>

    <h2>主机详情</h2>
    <table>
        <tr>
            <th>主机</th>
            <th>状态</th>
            <th>响应时间</th>
            <th>Picoclaw</th>
            <th>端口 18795</th>
        </tr>
        ${report.sshHosts.map((host, i) => `
        <tr>
            <td>${host.name}</td>
            <td class="${host.status === 'ok' ? 'ok' : 'error'}">${host.status}</td>
            <td>${host.responseTime || 'N/A'}ms</td>
            <td class="${report.remoteChecks[i].picoclaw.running ? 'ok' : 'error'}">${report.remoteChecks[i].picoclaw.running ? '运行中' : '未运行'}</td>
            <td class="${report.remoteChecks[i].port18795.listening ? 'ok' : 'error'}">${report.remoteChecks[i].port18795.listening ? '监听中' : '未监听'}</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>
    `;

    const filename = `health-report-${Date.now()}.html`;
    fs.writeFileSync(filename, html);
    console.log(`HTML 报告已保存: ${filename}`);
}

generateHTMLReport();
```

---

## 总结

以上示例涵盖了 xunshi-inspector 的各种使用场景:

1. **快速入门** - 基础的安装和使用
2. **健康检查** - 不同类型的检查方式
3. **Bash 脚本** - 利用公共函数库编写自定义脚本
4. **API 使用** - 在 Node.js 中直接使用 API
5. **集成** - 集成到 Web 服务器、CI/CD、Telegram 等
6. **故障排除** - 诊断和自动修复问题
7. **高级配置** - SSH 密钥认证、自定义告警、批量操作

根据您的实际需求，选择合适的示例进行修改和使用。

---

**最后更新**: 2026-03-17
