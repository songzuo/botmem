# xunshi-inspector

巡视图健康检查工具 - 监控 OpenClaw 集群主机和服务状态

## 功能特性

### 1. SSH 主机连通性检查
- 支持多主机并发检查
- 连接超时自动处理
- 响应时间统计

### 2. picoclaw 进程监控
- 检查远程主机上 picoclaw 进程运行状态
- 端口 18795 监听状态检测

### 3. 系统资源监控 (增强版)
- 磁盘使用率检查
- CPU 使用率和负载平均值
- 内存使用情况

### 4. 本地端口检查
- 监控本地 18795 端口状态

## 安装

```bash
cd xunshi-inspector
npm install
```

## 配置

设置 SSH 密码环境变量:
```bash
export SSH_PASSWORD="your-password"
```

## 使用方法

### 基础健康检查
```bash
npm run health-check
```

### 增强版检查 (推荐)
```bash
node scripts/health-check-enhanced.js
```

### 运行测试
```bash
node tests/health-check.test.js
```

## 输出示例

```json
{
  "timestamp": "2026-03-17T06:30:00.000Z",
  "version": "2.0.0",
  "sshHosts": [
    {
      "host": "bot3.szspd.cn",
      "name": "bot3 (Evolver/经理)",
      "status": "ok",
      "responseTime": 150
    }
  ],
  "remoteChecks": [
    {
      "host": "bot3.szspd.cn",
      "picoclaw": { "running": true },
      "port18795": { "listening": true },
      "disk": { "usage": 45 },
      "memory": { "total": 8192000, "used": 4096000, "usagePercent": 50 },
      "cpu": { "usage": 12.5, "loadAvg": { "m1": 0.5, "m5": 0.3, "m15": 0.2 } }
    }
  ],
  "summary": {
    "totalHosts": 2,
    "healthyHosts": 2,
    "unhealthyHosts": 0,
    "picoclawRunning": 2,
    "portListening": 2,
    "highDiskUsage": 0,
    "highMemoryUsage": 0
  }
}
```

## SSH 主机配置

在 `scripts/health-check-enhanced.js` 中修改:

```javascript
const SSH_HOSTS = [
    { host: 'bot3.szspd.cn', port: 22, name: 'bot3' },
    { host: '7zi.com', port: 22, name: '7zi' },
    // 添加更多主机...
];
```

## 告警阈值

- 高磁盘使用率: > 80%
- 高内存使用率: > 80%

可以在 `summary` 中检查 `highDiskUsage` 和 `highMemoryUsage` 字段触发告警。

## 许可证

ISC
