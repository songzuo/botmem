# xunshi-inspector 配置说明

## 目录

- [环境变量](#环境变量)
- [配置文件](#配置文件)
- [SSH 主机配置](#ssh-主机配置)
- [告警阈值配置](#告警阈值配置)
- [日志配置](#日志配置)
- [NPM 脚本配置](#npm-脚本配置)
- [Cron 定时任务](#cron-定时任务)

---

## 环境变量

### SSH_PASSWORD

SSH 登录密码，用于连接远程主机。

**必需:** 是

**设置方法:**

```bash
# 临时设置（当前会话有效）
export SSH_PASSWORD="your-password-here"

# 永久设置（添加到 ~/.bashrc 或 ~/.zshrc）
echo 'export SSH_PASSWORD="your-password-here"' >> ~/.bashrc
source ~/.bashrc

# 从文件读取（更安全）
echo 'export SSH_PASSWORD=$(cat ~/.ssh/password.txt)' >> ~/.bashrc
```

**安全建议:**

1. 不要将密码提交到版本控制系统
2. 将 `SSH_PASSWORD` 添加到 `.gitignore`
3. 使用密钥认证代替密码（推荐）
4. 定期更换密码

**示例:**

```bash
# 方法1: 直接导出
export SSH_PASSWORD="MySecurePass123"

# 方法2: 从文件读取（更安全）
echo "MySecurePass123" > ~/.ssh/password.txt
chmod 600 ~/.ssh/password.txt
export SSH_PASSWORD=$(cat ~/.ssh/password.txt)
```

---

### NODE_ENV

Node.js 运行环境。

**可选:** 是

**默认值:** production

**可选值:**
- `production`: 生产环境（默认）
- `development`: 开发环境
- `test`: 测试环境

**示例:**

```bash
export NODE_ENV=production
```

---

### DEBUG

启用调试模式，输出详细日志。

**可选:** 是

**默认值:** 未设置

**示例:**

```bash
# 启用所有调试输出
export DEBUG=*

# 启用特定模块的调试
export DEBUG=health-check:*
export DEBUG=ssh2:*
```

---

## 配置文件

### config.json

项目主配置文件，位于项目根目录。

**必需:** 否（存在则使用，不存在则使用默认配置）

**默认配置:**

```json
{
  "name": "xunshi-inspector",
  "version": "1.0.0",
  "timeout": 30000,
  "retries": 3,
  "hosts": [],
  "logging": {
    "level": "info",
    "format": "json"
  },
  "alerts": {
    "diskUsage": 80,
    "memoryUsage": 80,
    "cpuUsage": 90
  }
}
```

**配置项说明:**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | String | 是 | 项目名称 |
| `version` | String | 是 | 项目版本 |
| `timeout` | Number | 否 | 超时时间（毫秒），默认 30000 |
| `retries` | Number | 否 | 重试次数，默认 3 |
| `hosts` | Array | 否 | 主机列表 |
| `logging.level` | String | 否 | 日志级别: 'info' | 'warn' | 'error' |
| `logging.format` | String | 否 | 日志格式: 'json' | 'text' |
| `alerts.diskUsage` | Number | 否 | 磁盘使用率告警阈值（%），默认 80 |
| `alerts.memoryUsage` | Number | 否 | 内存使用率告警阈值（%），默认 80 |
| `alerts.cpuUsage` | Number | 否 | CPU 使用率告警阈值（%），默认 90 |

**创建配置文件:**

```bash
cat > config.json << EOF
{
  "name": "xunshi-inspector",
  "version": "1.0.0",
  "timeout": 30000,
  "retries": 3,
  "hosts": [
    { "host": "bot3.szspd.cn", "port": 22, "name": "bot3" },
    { "host": "7zi.com", "port": 22, "name": "7zi" }
  ],
  "logging": {
    "level": "info",
    "format": "json"
  },
  "alerts": {
    "diskUsage": 80,
    "memoryUsage": 80,
    "cpuUsage": 90
  }
}
EOF
```

**验证配置文件:**

```bash
node scripts/config-validator.js
```

---

## SSH 主机配置

### 在代码中配置

编辑 `scripts/health-check.js` 或 `scripts/health-check-enhanced.js`:

```javascript
const SSH_HOSTS = [
    { host: 'bot3.szspd.cn', port: 22, name: 'bot3 (Evolver/经理)' },
    { host: '7zi.com', port: 22, name: '7zi (协调经理)' },
    { host: 'bot6.szspd.cn', port: 22, name: 'bot6 (主控)' },
    // 添加更多主机...
];
```

**配置项:**

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `host` | String | 是 | 主机地址（域名或IP） |
| `port` | Number | 是 | SSH 端口号，通常为 22 |
| `name` | String | 是 | 主机显示名称，用于报告 |

---

### 在配置文件中配置

在 `config.json` 中定义 `hosts` 字段:

```json
{
  "hosts": [
    { "host": "bot3.szspd.cn", "port": 22, "name": "bot3" },
    { "host": "7zi.com", "port": 22, "name": "7zi" },
    { "host": "bot6.szspd.cn", "port": 22, "name": "bot6" }
  ]
}
```

---

## 告警阈值配置

### 默认阈值

| 指标 | 阈值 | 说明 |
|------|------|------|
| 磁盘使用率 | 80% | 超过则触发告警 |
| 内存使用率 | 80% | 超过则触发告警 |
| CPU 使用率 | 90% | 超过则触发告警 |

---

### 自定义阈值

在 `config.json` 中修改:

```json
{
  "alerts": {
    "diskUsage": 85,
    "memoryUsage": 85,
    "cpuUsage": 95
  }
}
```

或在代码中直接修改 `scripts/health-check-enhanced.js`:

```javascript
// 在 report.summary 中检查阈值
if (result.disk.usage && result.disk.usage > 85) {
    report.summary.highDiskUsage++;
}
```

---

## 日志配置

### 日志级别

支持的日志级别:

- `info`: 信息日志（默认）
- `warn`: 警告日志
- `error`: 错误日志

**设置日志级别:**

```bash
# 通过配置文件
echo '{"logging": {"level": "warn"}}' > config.json

# 通过环境变量
export LOG_LEVEL=warn
```

---

### 日志格式

支持的日志格式:

- `json`: JSON 格式（默认）
- `text`: 文本格式

**设置日志格式:**

```bash
# 通过配置文件
echo '{"logging": {"format": "text"}}' > config.json

# 通过环境变量
export LOG_FORMAT=text
```

---

### 日志文件位置

**Bash 脚本日志:**

- `workspace-logs/inspection.log` - 巡视检查日志
- `workspace-logs/CLUSTER-SUMMARY.md` - 集群摘要日志

**Node.js 脚本日志:**

- 输出到 stdout/stderr（可通过管道重定向）
- JSON 格式输出用于日志解析

**配置日志目录:**

```bash
# 设置环境变量
export LOG_DIR="/var/log/xunshi-inspector"

# 在脚本中使用
source scripts/cluster-common.sh
export CLUSTER_LOG_DIR="$LOG_DIR"
```

---

## NPM 脚本配置

### package.json 脚本

```json
{
  "name": "xunshi-inspector",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "health-check": "node scripts/health-check.js",
    "health-check:enhanced": "node scripts/health-check-enhanced.js",
    "health-check:json": "node scripts/health-check.js --json",
    "validate-config": "node scripts/config-validator.js"
  }
}
```

---

### 添加自定义脚本

在 `package.json` 中添加:

```json
{
  "scripts": {
    "check:all": "node scripts/health-check-enhanced.js",
    "check:bot3": "node scripts/check-picoclaw.js",
    "report:daily": "node scripts/report-generator.js && cat reports/*.txt",
    "deploy:cluster": "bash scripts/deploy-all-machines.sh"
  }
}
```

---

### 运行脚本

```bash
# 运行预定义脚本
npm run health-check
npm run health-check:enhanced
npm run health-check:json

# 运行自定义脚本
npm run check:all
npm run report:daily

# 运行测试
npm test
```

---

## Cron 定时任务

### 设置定时检查

编辑 crontab:

```bash
crontab -e
```

添加以下任务:

```bash
# 每 5 分钟执行一次健康检查
*/5 * * * * cd /root/.openclaw/workspace/xunshi-inspector && npm run health-check >> /var/log/xunshi-inspector/health-check.log 2>&1

# 每小时执行一次增强检查
0 * * * * cd /root/.openclaw/workspace/xunshi-inspector && npm run health-check:enhanced >> /var/log/xunshi-inspector/enhanced-check.log 2>&1

# 每天早上 8:00 生成日报
0 8 * * * cd /root/.openclaw/workspace/xunshi-inspector && npm run report:daily >> /var/log/xunshi-inspector/daily-report.log 2>&1
```

---

### 巡视经理自动检查脚本

使用 `scripts/inspector-check.sh`:

```bash
# 设置定时任务（每 10 分钟）
*/10 * * * * /root/.openclaw/workspace/xunshi-inspector/scripts/inspector-check.sh >> /root/workspace-logs/inspection.log 2>&1
```

---

### 心跳检查脚本

使用 `scripts/heartbeat_upload.sh`:

```bash
# 每 5 分钟执行一次
*/5 * * * * /root/.openclaw/workspace/xunshi-inspector/scripts/heartbeat_upload.sh >> /root/memory/heartbeat.log 2>&1
```

---

## 集群节点配置

### 节点列表

在 `scripts/cluster-common.sh` 中配置:

```bash
export CLUSTER_NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn 182.43.36.134 bot6.szspd.cn"
```

---

### 集群频道

```bash
export CLUSTER_CHANNEL="picoclaw-cluster-2026"
```

---

### 日志目录

```bash
export CLUSTER_LOG_DIR="$HOME/workspace-logs"
```

---

## 超时配置

### SSH 连接超时

在 `scripts/health-check.js` 中修改:

```javascript
const SSH_TIMEOUT = 10000;  // 10 秒
```

---

### 端口检查超时

```javascript
const PORT_TIMEOUT = 5000;  // 5 秒
```

---

### 全局超时

在 `config.json` 中配置:

```json
{
  "timeout": 30000
}
```

---

## 依赖包配置

### 安装依赖

```bash
npm install
```

---

### package.json 依赖

```json
{
  "dependencies": {
    "ssh2": "^1.15.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

---

### 更新依赖

```bash
# 更新所有依赖到最新版本
npm update

# 更新特定包
npm update ssh2

# 检查过时的包
npm outdated
```

---

## 安全配置

### SSH 密钥认证（推荐）

生成 SSH 密钥:

```bash
# 生成密钥对
ssh-keygen -t rsa -b 4096 -C "xunshi-inspector" -f ~/.ssh/xunshi_inspector_key

# 复制公钥到目标主机
ssh-copy-id -i ~/.ssh/xunshi_inspector_key.pub root@bot3.szspd.cn

# 设置权限
chmod 600 ~/.ssh/xunshi_inspector_key
```

修改 `scripts/health-check.js` 使用密钥认证:

```javascript
conn.connect({
    host: config.host,
    port: config.port,
    username: 'root',
    privateKey: require('fs').readFileSync('/root/.ssh/xunshi_inspector_key'),
    readyTimeout: SSH_TIMEOUT
});
```

---

### 环境变量管理

使用 `.env` 文件（需要安装 dotenv）:

```bash
npm install dotenv
```

创建 `.env` 文件:

```bash
SSH_PASSWORD=your-password-here
NODE_ENV=production
LOG_LEVEL=info
```

在脚本中加载:

```javascript
require('dotenv').config();
const sshPassword = process.env.SSH_PASSWORD;
```

---

### 权限控制

```bash
# 设置脚本执行权限
chmod +x scripts/*.sh

# 设置日志目录权限
chmod 755 /var/log/xunshi-inspector

# 设置配置文件权限
chmod 600 ~/.ssh/password.txt
```

---

## 性能优化配置

### 并发连接数

在 `scripts/health-check-enhanced.js` 中配置连接池:

```javascript
const pool = new SSHConnectionPool(5);  // 最多 5 个并发连接
```

---

### 重试配置

```javascript
const SSH_TIMEOUT = 10000;     // SSH 超时 10 秒
const MAX_RETRIES = 2;          // 最多重试 2 次
```

---

## 故障排除配置

### 调试模式

启用详细日志:

```bash
export DEBUG=*
export NODE_ENV=development
```

---

### 日志重定向

```bash
# 将错误输出到文件
npm run health-check 2> error.log

# 将所有输出到文件
npm run health-check > output.log 2>&1

# 同时输出到控制台和文件
npm run health-check 2>&1 | tee output.log
```

---

## 配置验证

### 验证 SSH 连接

```bash
# 测试 SSH 连接
ssh -o ConnectTimeout=10 root@bot3.szspd.cn "hostname"

# 使用脚本测试
node scripts/check-picoclaw.js
```

---

### 验证配置文件

```bash
node scripts/config-validator.js
```

---

### 验证所有配置

```bash
# 运行完整检查
npm run health-check:enhanced

# 检查所有节点
bash scripts/inspector-check.sh

# 测试集群连接
source scripts/cluster-common.sh
check_all_nodes
```

---

## 配置示例

### 开发环境配置

```json
{
  "name": "xunshi-inspector",
  "version": "1.0.0",
  "timeout": 60000,
  "retries": 5,
  "logging": {
    "level": "debug",
    "format": "text"
  },
  "alerts": {
    "diskUsage": 90,
    "memoryUsage": 90,
    "cpuUsage": 95
  }
}
```

---

### 生产环境配置

```json
{
  "name": "xunshi-inspector",
  "version": "1.0.0",
  "timeout": 30000,
  "retries": 3,
  "logging": {
    "level": "info",
    "format": "json"
  },
  "alerts": {
    "diskUsage": 80,
    "memoryUsage": 80,
    "cpuUsage": 90
  }
}
```

---

### 测试环境配置

```json
{
  "name": "xunshi-inspector",
  "version": "1.0.0",
  "timeout": 10000,
  "retries": 1,
  "logging": {
    "level": "warn",
    "format": "text"
  },
  "alerts": {
    "diskUsage": 95,
    "memoryUsage": 95,
    "cpuUsage": 100
  }
}
```

---

## 更多信息

- API 文档: [API.md](./API.md)
- 主文档: [README.md](./README.md)
- 测试文档: [test-coverage-report.md](./test-coverage-report.md)