# xunshi-inspector API 文档

## 概述

xunshi-inspector 提供了一系列用于检查 OpenClaw 集群主机和服务状态的函数。主要功能包括 SSH 连通性检查、进程监控、系统资源监控和报告生成。

---

## 核心模块

### health-check.js

基础健康检查模块，提供 SSH 连通性、远程进程和端口检查功能。

#### 函数: `checkSSHHost(config)`

检查 SSH 主机的连通性。

**参数:**
- `config` (Object): 主机配置对象
  - `host` (String): 主机地址
  - `port` (Number): SSH 端口号
  - `name` (String): 主机显示名称

**返回值:** Promise<Object>
```javascript
{
  host: String,        // 主机地址
  name: String,        // 主机名称
  status: String,      // 状态: 'ok' | 'error' | 'timeout' | 'unknown'
  responseTime: Number | null,  // 响应时间(毫秒)
  error: String | null  // 错误信息
}
```

**示例:**
```javascript
const result = await checkSSHHost({
  host: 'bot3.szspd.cn',
  port: 22,
  name: 'bot3 (Evolver)'
});
console.log(result.status); // 'ok', 'error', or 'timeout'
```

---

#### 函数: `checkRemotePicoclaw(config)`

通过 SSH 检查远程主机上的 picoclaw 进程和端口状态。

**参数:**
- `config` (Object): 主机配置对象（同 `checkSSHHost`）

**返回值:** Promise<Object>
```javascript
{
  host: String,        // 主机地址
  picoclaw: {
    running: Boolean,  // picoclaw 是否运行
    processes: Array<String>  // 进程列表
  },
  port18795: {
    listening: Boolean,  // 端口 18795 是否监听
    info: String | null  // 端口信息
  },
  error: String | null  // 错误信息
}
```

**示例:**
```javascript
const check = await checkRemotePicoclaw({
  host: 'bot3.szspd.cn',
  port: 22,
  name: 'bot3'
});

if (check.picoclaw.running) {
  console.log('Picoclaw 进程列表:', check.picoclaw.processes);
}
```

---

#### 函数: `checkLocalPort(port)`

检查本地端口是否监听。

**参数:**
- `port` (Number): 端口号

**返回值:** Promise<Object>
```javascript
{
  port: Number,        // 端口号
  listening: Boolean,  // 是否监听
  error: String | null  // 错误信息
}
```

**示例:**
```javascript
const result = await checkLocalPort(18795);
console.log(result.listening ? '端口监听中' : '端口未监听');
```

---

#### 函数: `runHealthCheck()`

执行完整的健康检查并生成报告。

**返回值:** Promise<Object>
```javascript
{
  timestamp: String,   // ISO 8601 时间戳
  sshHosts: Array,     // SSH 主机检查结果
  remoteChecks: Array, // 远程检查结果
  localPort18795: Object,  // 本地端口检查结果
  summary: {
    totalHosts: Number,     // 主机总数
    healthyHosts: Number,   // 健康主机数
    unhealthyHosts: Number, // 不健康主机数
    picoclawRunning: Number,  // picoclaw 运行数量
    portListening: Number     // 端口监听数量
  }
}
```

**示例:**
```javascript
const report = await runHealthCheck();
console.log(`健康主机: ${report.summary.healthyHosts}/${report.summary.totalHosts}`);
```

---

#### 函数: `formatReportAsText(report)`

将健康检查报告格式化为可读文本。

**参数:**
- `report` (Object): 健康检查报告对象

**返回值:** String - 格式化的文本报告

**示例:**
```javascript
const report = await runHealthCheck();
const textReport = formatReportAsText(report);
console.log(textReport);
```

---

#### 函数: `formatErrorAsText(errorReport)`

将错误报告格式化为文本。

**参数:**
- `errorReport` (Object): 错误报告对象

**返回值:** String - 格式化的错误文本

**示例:**
```javascript
const errorReport = {
  timestamp: new Date().toISOString(),
  error: '连接超时',
  status: 'failed'
};
console.log(formatErrorAsText(errorReport));
```

---

### health-check-enhanced.js

增强版健康检查模块，增加了连接池、重试机制和系统资源监控。

#### 函数: `checkSSHHost(config, retries)`

带重试机制的 SSH 主机连通性检查。

**参数:**
- `config` (Object): 主机配置对象
- `retries` (Number): 重试次数，默认 2

**返回值:** Promise<Object> - 与基础版相同的返回格式

**示例:**
```javascript
const result = await checkSSHHost({ host: 'bot3.szspd.cn', port: 22, name: 'bot3' }, 3);
```

---

#### 函数: `checkRemoteEnhanced(config)`

增强的远程检查，包含磁盘、CPU、内存监控。

**参数:**
- `config` (Object): 主机配置对象

**返回值:** Promise<Object>
```javascript
{
  host: String,
  picoclaw: {
    running: Boolean,
    processes: Array<String>
  },
  port18795: {
    listening: Boolean
  },
  disk: {
    usage: Number | null,     // 磁盘使用百分比
    error: String | null
  },
  memory: {
    total: Number | null,     // 总内存(KB)
    used: Number | null,      // 已用内存(KB)
    usagePercent: Number | null  // 使用百分比
  },
  cpu: {
    usage: Number | null,     // CPU 使用率
    loadAvg: {
      m1: Number,  // 1分钟负载
      m5: Number,  // 5分钟负载
      m15: Number  // 15分钟负载
    }
  },
  error: String | null
}
```

**示例:**
```javascript
const check = await checkRemoteEnhanced({ host: 'bot3.szspd.cn', port: 22, name: 'bot3' });

console.log(`磁盘使用: ${check.disk.usage}%`);
console.log(`内存使用: ${check.memory.usagePercent}%`);
console.log(`CPU 使用率: ${check.cpu.usage}%`);
console.log(`系统负载: ${check.cpu.loadAvg.m1} (1分钟)`);
```

---

#### 类: `SSHConnectionPool`

SSH 连接池管理类，用于复用 SSH 连接。

**构造函数:**
```javascript
new SSHConnectionPool(maxConnections)
```
- `maxConnections` (Number): 最大连接数，默认 3

**方法:**

##### `async getConnection(config)`

获取可用的 SSH 连接。

**参数:**
- `config` (Object): 主机配置对象

**返回值:** Promise<Client> - ssh2 Client 实例

---

##### `release(conn)`

释放连接回连接池。

**参数:**
- `conn` (Client): ssh2 Client 实例

---

##### `destroy()`

销毁所有连接。

---

**示例:**
```javascript
const pool = new SSHConnectionPool(5);

// 获取连接
const conn = await pool.getConnection({ host: 'bot3.szspd.cn', port: 22 });
// 使用连接...

// 释放连接
pool.release(conn);

// 销毁连接池
pool.destroy();
```

---

### config-validator.js

配置文件验证模块。

#### 类: `ConfigValidator`

配置验证器类。

**方法:**

##### `validateProjectConfig(configPath)`

验证项目配置文件。

**参数:**
- `configPath` (String): 配置文件路径，默认 './config.json'

**返回值:** Object
```javascript
{
  valid: Boolean,      // 是否有效
  errors: Array<String>,  // 错误列表
  warnings: Array<String>,  // 警告列表
  config: Object | null  // 配置对象
}
```

**示例:**
```javascript
const validator = new ConfigValidator();
const result = validator.validateProjectConfig('./config.json');

if (!result.valid) {
  console.error('配置错误:', result.errors);
}
```

---

##### `validateConfig(config)`

验证配置对象。

**参数:**
- `config` (Object): 配置对象

**返回值:** Object - 与 `validateProjectConfig` 相同的格式

---

##### `getDefaultConfig()`

获取默认配置。

**返回值:** Object - 默认配置对象

**示例:**
```javascript
const defaultConfig = validator.getDefaultConfig();
console.log(defaultConfig);
// {
//   name: 'xunshi-inspector',
//   version: '1.0.0',
//   timeout: 30000,
//   retries: 3,
//   hosts: [],
//   logging: { level: 'info', format: 'json' }
// }
```

---

### report-generator.js

报告生成模块，支持多种格式输出。

#### 类: `ReportGenerator`

报告生成器类。

**方法:**

##### `addResult(result)`

添加检查结果。

**参数:**
- `result` (Object): 检查结果对象
  - `status` (String): 状态 'ok' | 'warning' | 'error' | 'failed'
  - `name` (String): 名称
  - `host` (String): 主机
  - `message` (String): 消息
  - `details` (Object): 详细信息

**示例:**
```javascript
const generator = new ReportGenerator();
generator.addResult({
  status: 'ok',
  name: 'bot3',
  host: 'bot3.szspd.cn',
  message: '所有检查通过',
  details: { responseTime: 150 }
});
```

---

##### `generateJSON()`

生成 JSON 格式报告。

**返回值:** String - JSON 字符串

**返回格式:**
```javascript
{
  generated_at: String,
  summary: {
    total: Number,
    success: Number,
    failed: Number,
    warnings: Number,
    successRate: Number
  },
  results: Array<Object>
}
```

---

##### `generateText()`

生成文本格式报告。

**返回值:** String - 格式化的文本报告

---

##### `saveReport(filename, format)`

保存报告到文件。

**参数:**
- `filename` (String): 文件名
- `format` (String): 格式 'json' | 'text'，默认 'json'

**返回值:** String - 保存的文件完整路径

**示例:**
```javascript
const path = generator.saveReport('health-report-2026-03-17.txt', 'text');
console.log(`报告已保存: ${path}`);
```

---

##### `clear()`

清空所有结果。

---

##### `generateSummary()`

生成摘要信息。

**返回值:** Object
```javascript
{
  total: Number,       // 总检查数
  success: Number,     // 成功数
  failed: Number,      // 失败数
  warnings: Number,    // 警告数
  successRate: Number  // 成功率(百分比)
}
```

---

## Bash 脚本函数

### lib-common.sh

公共函数库，被其他 Bash 脚本引用。

#### 网络检查函数

##### `ssh_exec(host, cmd, timeout)`

执行 SSH 命令（带超时保护）。

**参数:**
- `host` (String): 主机地址
- `cmd` (String): 要执行的命令
- `timeout` (Number): 超时秒数，默认 5

**返回:** 退出码

**示例:**
```bash
ssh_exec "bot3.szspd.cn" "hostname" 10
```

---

##### `check_nodes(NODES)`

检查多个节点的 SSH 连通性。

**参数:**
- `NODES` (String): 空格分隔的节点列表

**返回:** 0=成功，1=有节点离线

**示例:**
```bash
NODES="7zi.com bot3.szspd.cn bot6.szspd.cn"
check_nodes "$NODES"
```

---

##### `is_host_online(host, timeout)`

检查主机是否在线（Ping）。

**参数:**
- `host` (String): 主机名/IP
- `timeout` (Number): 超时秒数，默认 3

**返回:** 0=在线，1=离线

---

##### `check_port(host, port, timeout)`

检查端口是否开放。

**参数:**
- `host` (String): 主机地址
- `port` (Number): 端口号
- `timeout` (Number): 超时秒数，默认 5

**示例:**
```bash
if check_port "bot3.szspd.cn" 18795 5; then
  echo "端口 18795 开放"
fi
```

---

#### 系统资源函数

##### `get_system_status()`

获取系统资源状态。

**返回:** String - "MEM:XX% DISK:XX% LOAD:X.XX"

**示例:**
```bash
STATUS=$(get_system_status)
echo "系统状态: $STATUS"
```

---

##### `get_memory_percent()`

获取内存使用率（百分比）。

**返回:** String - 内存使用百分比

---

##### `get_disk_percent()`

获取磁盘使用率（百分比）。

**返回:** String - 磁盘使用百分比

---

#### 进程检查函数

##### `check_process_count(proc_name, max_count)`

检查进程数量是否超过限制。

**参数:**
- `proc_name` (String): 进程名
- `max_count` (Number): 最大允许数量

**返回:** 0=正常，1=进程过多

**示例:**
```bash
check_process_count "node" 10
```

---

##### `get_process_list(proc_name)`

获取进程列表。

**参数:**
- `proc_name` (String): 进程名

**返回:** 进程列表输出

---

#### 日志函数

##### `log_message(log_file, message)`

记录日志到文件。

**参数:**
- `log_file` (String): 日志文件路径
- `message` (String): 日志消息

**示例:**
```bash
log_message "/var/log/inspector.log" "检查完成"
```

---

##### `log_with_level(log_file, level, message)`

记录带级别的日志。

**参数:**
- `log_file` (String): 日志文件路径
- `level` (String): 级别 'INFO' | 'WARN' | 'ERROR'
- `message` (String): 日志消息

**示例:**
```bash
log_with_level "/var/log/inspector.log" "WARN" "内存使用率高"
```

---

#### 工具函数

##### `command_exists(cmd)`

检查命令是否存在。

**参数:**
- `cmd` (String): 命令名

**返回:** 0=存在，1=不存在

**示例:**
```bash
if command_exists "curl"; then
  echo "curl 已安装"
fi
```

---

##### `get_timestamp()`

获取当前时间戳。

**返回:** String - 格式 "YYYY-MM-DD HH:MM:SS"

---

##### `get_date()`

获取当前日期。

**返回:** String - 格式 "YYYY-MM-DD"

---

### cluster-common.sh

集群脚本专用公共函数库。

#### 变量

```bash
export CLUSTER_NODES="7zi.com bot.szspd.cn bot2.szspd.cn ..."
export CLUSTER_CHANNEL="picoclaw-cluster-2026"
export CLUSTER_LOG_DIR="$HOME/workspace-logs"
```

#### 函数

##### `check_node_ssh(node, timeout)`

检查单个节点的 SSH 连通性。

**参数:**
- `node` (String): 节点名
- `timeout` (Number): 超时秒数，默认 5

**返回:** 'self' | 'online' | 'offline'

**示例:**
```bash
source scripts/cluster-common.sh
STATUS=$(check_node_ssh "bot3.szspd.cn" 5)
echo "节点状态: $STATUS"
```

---

##### `check_node_ping(node, timeout)`

检查单个节点的 Ping 连通性。

**参数:**
- `node` (String): 节点名
- `timeout` (Number): 超时秒数，默认 2

**返回:** 'self' | 'online' | 'offline'

---

##### `check_all_nodes()`

检查所有节点状态并输出。

**示例:**
```bash
source scripts/cluster-common.sh
check_all_nodes
```

---

##### `check_http_endpoint(url, timeout)`

检查 HTTP 端点是否可达。

**参数:**
- `url` (String): URL 地址
- `timeout` (Number): 超时秒数，默认 5

**返回:** 'ok' | 'fail'

**示例:**
```bash
STATUS=$(check_http_endpoint "http://bot3.szspd.cn:11435/health" 5)
```

---

##### `log_write(logfile, content)`

写入日志文件。

**参数:**
- `logfile` (String): 日志文件名
- `content` (String): 日志内容

**示例:**
```bash
log_write "inspection.log" "节点检查完成"
```

---

## 常量配置

### SSH_TIMEOUT

SSH 连接超时时间（毫秒），默认 `10000`

### PORT_TIMEOUT

端口检查超时时间（毫秒），默认 `5000`

### SSH_HOSTS

SSH 主机配置数组，在 health-check.js 和 health-check-enhanced.js 中定义。

**默认配置:**
```javascript
const SSH_HOSTS = [
    { host: 'bot3.szspd.cn', port: 22, name: 'bot3 (Evolver/经理)' },
    { host: '7zi.com', port: 22, name: '7zi (协调经理)' }
];
```

---

## 使用示例

### 完整的 JavaScript 使用示例

```javascript
const { runHealthCheck, formatReportAsText } = require('./scripts/health-check.js');

// 执行健康检查
runHealthCheck()
  .then(report => {
    // 生成文本报告
    console.log(formatReportAsText(report));

    // 检查是否所有主机都健康
    if (report.summary.healthyHosts === report.summary.totalHosts) {
      console.log('✅ 所有主机健康');
    } else {
      console.log('⚠️  部分主机不健康');
    }
  })
  .catch(err => {
    console.error('健康检查失败:', err);
  });
```

### 完整的 Bash 使用示例

```bash
#!/bin/bash

# 引用公共函数库
source scripts/lib-common.sh
source scripts/cluster-common.sh

# 检查所有节点
echo "=== 集群节点状态 ==="
check_all_nodes

# 检查特定节点
echo ""
echo "=== bot3 详细检查 ==="
if is_host_online "bot3.szspd.cn" 3; then
  echo "节点在线"
  echo "系统状态: $(get_system_status)"
  echo "进程列表:"
  get_process_list "picoclaw"
else
  echo "节点离线"
fi

# 记录日志
log_write "inspection.log" "检查完成"

echo ""
echo "=== 端口检查 ==="
if check_port "bot3.szspd.cn" 18795 5; then
  echo "✅ 端口 18795 开放"
else
  echo "❌ 端口 18795 未开放"
fi
```

---

## 错误处理

所有异步函数都可能抛出错误，建议使用 try-catch 或 .catch() 处理。

**常见错误:**

1. **SSH 连接超时**
   - 错误信息: "连接超时 (10000ms)"
   - 解决: 检查网络连通性，增加 SSH_TIMEOUT

2. **认证失败**
   - 错误信息: "All configured authentication methods failed"
   - 解决: 检查 SSH_PASSWORD 环境变量

3. **端口连接失败**
   - 错误信息: "ECONNREFUSED"
   - 解决: 检查目标端口是否监听

---

## 更多信息

- 主文档: [README.md](./README.md)
- 配置说明: [CONFIG.md](./CONFIG.md)
- 测试文档: [test-coverage-report.md](./test-coverage-report.md)