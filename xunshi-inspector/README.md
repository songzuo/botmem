# xunshi-inspector

巡视图健康检查工具 - 监控 OpenClaw 集群主机和服务状态

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## 📋 目录

- [简介](#简介)
- [功能特性](#功能特性)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [安装指南](#安装指南)
- [配置说明](#配置说明)
- [使用方法](#使用方法)
- [命令行参数](#命令行参数)
- [输出格式](#输出格式)
- [告警机制](#告警机制)
- [Bash 脚本](#bash-脚本)
- [测试](#测试)
- [故障排除](#故障排除)
- [API 文档](#api-文档)
- [配置文档](#配置文档)

---

## 简介

xunshi-inspector 是一个用于监控 OpenClaw 集群主机和服务状态的健康检查工具。它支持 SSH 连通性检查、进程监控、系统资源监控、端口检查等功能，并提供多种输出格式供集成使用。

### 主要特点

- ✅ **多主机并发检查** - 同时检查多个 SSH 主机
- ✅ **进程监控** - 检查 picoclaw 等关键进程状态
- ✅ **系统资源监控** - 监控 CPU、内存、磁盘使用情况
- ✅ **端口检查** - 检查本地和远程端口状态
- ✅ **多种输出格式** - 支持文本和 JSON 格式输出
- ✅ **可配置告警** - 自定义告警阈值
- ✅ **Bash 脚本支持** - 提供丰富的 Bash 工具函数
- ✅ **连接池管理** - 优化 SSH 连接性能

---

## 功能特性

### 1. SSH 主机连通性检查

- 支持多主机并发检查
- 连接超时自动处理
- 响应时间统计
- 自动重试机制

### 2. picoclaw 进程监控

- 检查远程主机上 picoclaw 进程运行状态
- 显示进程列表和数量
- 检测进程异常

### 3. 端口监控

- 检查端口 18795 监听状态
- 支持本地和远程端口检查
- 超时保护机制

### 4. 系统资源监控（增强版）

- 磁盘使用率检查
- CPU 使用率和负载平均值
- 内存使用情况
- 自定义告警阈值

### 5. 报告生成

- JSON 格式报告（程序解析）
- 文本格式报告（人类可读）
- 自动保存到文件
- 摘要统计信息

---

## 系统要求

### 必需软件

- **Node.js**: >= 14.0.0
- **npm**: >= 6.0.0
- **OpenSSH**: 用于 SSH 连接
- **bash**: >= 4.0

### 可选软件

- **curl**: 用于 HTTP 端点检查
- **ss** 或 **netstat**: 用于端口检查

### 操作系统支持

- Linux (Ubuntu, Debian, CentOS, etc.)
- macOS (部分功能)
- Windows (WSL2)

---

## 快速开始

### 1. 克隆或下载项目

```bash
cd /root/.openclaw/workspace/xunshi-inspector
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 SSH 密码

```bash
export SSH_PASSWORD="your-password-here"
```

### 4. 运行健康检查

```bash
npm run health-check
```

或使用增强版（推荐）:

```bash
npm run health-check:enhanced
```

---

## 安装指南

### 从源码安装

```bash
# 1. 进入项目目录
cd xunshi-inspector

# 2. 安装依赖
npm install

# 3. 配置环境变量
echo 'export SSH_PASSWORD="your-password"' >> ~/.bashrc
source ~/.bashrc

# 4. 验证安装
npm run health-check --help
```

### 全局安装

```bash
# 全局安装（可选）
npm install -g .

# 随处使用
xunshi-inspector health-check
```

### Docker 安装（可选）

```bash
# 构建 Docker 镜像
docker build -t xunshi-inspector .

# 运行容器
docker run --rm \
  -e SSH_PASSWORD="your-password" \
  -v /root/.openclaw/workspace/xunshi-inspector:/app \
  xunshi-inspector npm run health-check
```

---

## 配置说明

### 环境变量

创建 `.env` 文件或设置环境变量:

```bash
# 必需配置
export SSH_PASSWORD="your-password"

# 可选配置
export NODE_ENV=production
export LOG_LEVEL=info
export LOG_FORMAT=json
```

### 配置文件

创建 `config.json`:

```json
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
```

### SSH 主机配置

编辑 `scripts/health-check.js`:

```javascript
const SSH_HOSTS = [
    { host: 'bot3.szspd.cn', port: 22, name: 'bot3 (Evolver/经理)' },
    { host: '7zi.com', port: 22, name: '7zi (协调经理)' },
    // 添加更多主机...
];
```

详细配置说明请参阅: [CONFIG.md](./CONFIG.md)

---

## 使用方法

### NPM 脚本

```bash
# 基础健康检查（文本输出）
npm run health-check

# 增强版健康检查（推荐）
npm run health-check:enhanced

# JSON 格式输出
npm run health-check:json

# 验证配置文件
npm run validate-config

# 运行测试
npm test
```

### 直接运行 Node.js 脚本

```bash
# 基础健康检查
node scripts/health-check.js

# 文本格式（默认）
node scripts/health-check.js

# JSON 格式
node scripts/health-check.js --json
node scripts/health-check.js --format=json

# 增强版检查
node scripts/health-check-enhanced.js
```

### Bash 脚本

```bash
# 检查单个主机的 picoclaw
node scripts/check-picoclaw.js

# 巡视经理自动检查
bash scripts/inspector-check.sh

# 集群沟通工具
bash scripts/cluster-communicate.sh

# 集群全量部署
bash scripts/deploy-all-machines.sh
```

---

## 命令行参数

### health-check.js 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--json` | 输出 JSON 格式 | - |
| `--format=json` | 输出 JSON 格式 | text |
| `--format=text` | 输出文本格式 | text |

### 示例

```bash
# JSON 输出
node scripts/health-check.js --json

# 文本输出
node scripts/health-check.js --format=text

# 重定向输出
node scripts/health-check.js --json > report.json
```

---

## 输出格式

### 文本格式输出

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
  7zi.com:
    - Picoclaw: ✅ 运行中
    - 端口 18795: ✅ 监听中

【本地端口 18795】
  ✅ 监听中

【摘要】
  主机总数: 2
  健康主机: 2
  不健康主机: 0
  Picoclaw 运行中: 2
  端口监听: 2
============================================================
```

### JSON 格式输出

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
    },
    {
      "host": "7zi.com",
      "name": "7zi (协调经理)",
      "status": "ok",
      "responseTime": 180
    }
  ],
  "remoteChecks": [
    {
      "host": "bot3.szspd.cn",
      "picoclaw": {
        "running": true,
        "processes": []
      },
      "port18795": {
        "listening": true
      },
      "disk": {
        "usage": 45,
        "error": null
      },
      "memory": {
        "total": 8192000,
        "used": 4096000,
        "usagePercent": 50
      },
      "cpu": {
        "usage": 12.5,
        "loadAvg": {
          "m1": 0.5,
          "m5": 0.3,
          "m15": 0.2
        }
      },
      "error": null
    }
  ],
  "localPort18795": {
    "port": 18795,
    "listening": true,
    "error": null
  },
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

---

## 告警机制

### 默认告警阈值

| 指标 | 阈值 | 触发条件 |
|------|------|----------|
| 磁盘使用率 | 80% | usage > 80 |
| 内存使用率 | 80% | usagePercent > 80 |
| CPU 使用率 | 90% | usage > 90 |

### 告警触发

当指标超过阈值时，会在报告的 `summary` 中记录:

```json
{
  "summary": {
    "highDiskUsage": 1,
    "highMemoryUsage": 0
  }
}
```

### 自定义告警阈值

在 `config.json` 中配置:

```json
{
  "alerts": {
    "diskUsage": 85,
    "memoryUsage": 85,
    "cpuUsage": 95
  }
}
```

或在代码中修改:

```javascript
// scripts/health-check-enhanced.js
if (result.disk.usage && result.disk.usage > 85) {
    report.summary.highDiskUsage++;
}
```

---

## Bash 脚本

### lib-common.sh - 公共函数库

```bash
# 引用公共函数库
source scripts/lib-common.sh

# 检查节点
check_nodes "7zi.com bot3.szspd.cn"

# 检查端口
if check_port "bot3.szspd.cn" 18795 5; then
  echo "端口开放"
fi

# 获取系统状态
get_system_status

# 记录日志
log_message "/var/log/inspector.log" "检查完成"
```

### cluster-common.sh - 集群函数库

```bash
# 引用集群函数库
source scripts/cluster-common.sh

# 检查所有节点
check_all_nodes

# 检查单个节点
check_node_ssh "bot3.szspd.cn" 5

# 检查 HTTP 端点
check_http_endpoint "http://bot3.szspd.cn:11435/health" 5
```

### inspector-check.sh - 巡视经理检查

```bash
# 运行自动检查
bash scripts/inspector-check.sh

# 定时执行（每 10 分钟）
*/10 * * * * /path/to/inspector-check.sh >> /var/log/inspection.log 2>&1
```

### cluster-communicate.sh - 集群沟通工具

```bash
# 交互式菜单
bash scripts/cluster-communicate.sh

# 选项:
# 1. 汇报状态 (status)
# 2. 广播消息 (broadcast)
# 3. 查看所有节点 (nodes)
# 4. 快速ping节点 (ping)
# 5. 查看帮助 (help)
```

---

## 测试

### 运行所有测试

```bash
npm test
```

### 运行特定测试

```bash
# 运行 health-check 测试
npm test -- health-check.test.js

# 运行 JSON 输出测试
npm test -- health-check-json.test.js

# 运行配置验证测试
npm test -- config-validator.test.js

# 运行报告生成测试
npm test -- report-generator.test.js
```

### 查看测试覆盖率

```bash
# 生成覆盖率报告
npm test -- --coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

### 测试文件结构

```
tests/
├── health-check.test.js         # 基础健康检查测试
├── health-check-json.test.js    # JSON 输出测试
├── config-validator.test.js     # 配置验证测试
└── report-generator.test.js     # 报告生成测试
```

---

## 故障排除

### SSH 连接失败

**问题**: 无法连接到 SSH 主机

**解决方案**:
1. 检查网络连通性
```bash
ping bot3.szspd.cn
```

2. 检查 SSH 密码
```bash
echo $SSH_PASSWORD
```

3. 手动测试 SSH 连接
```bash
ssh root@bot3.szspd.cn
```

4. 增加超时时间
```javascript
const SSH_TIMEOUT = 20000; // 20 秒
```

---

### 端口检查失败

**问题**: 端口显示未监听

**解决方案**:
1. 在远程主机上检查端口
```bash
ssh root@bot3.szspd.cn "netstat -tlnp | grep 18795"
```

2. 或使用 ss 命令
```bash
ssh root@bot3.szspd.cn "ss -tlnp | grep 18795"
```

3. 检查 picoclaw 进程
```bash
ssh root@bot3.szspd.cn "ps aux | grep picoclaw"
```

---

### 环境变量未设置

**问题**: 提示 "SSH_PASSWORD not set"

**解决方案**:
```bash
# 临时设置
export SSH_PASSWORD="your-password"

# 永久设置
echo 'export SSH_PASSWORD="your-password"' >> ~/.bashrc
source ~/.bashrc

# 验证
echo $SSH_PASSWORD
```

---

### 配置文件错误

**问题**: 配置验证失败

**解决方案**:
1. 验证配置文件
```bash
node scripts/config-validator.js
```

2. 检查 JSON 格式
```bash
cat config.json | jq .
```

3. 使用默认配置
```bash
rm config.json  # 使用内置默认配置
```

---

### 依赖包问题

**问题**: 模块找不到或版本冲突

**解决方案**:
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 更新依赖
npm update

# 清理 npm 缓存
npm cache clean --force
```

---

### 权限问题

**问题**: 无法执行 Bash 脚本

**解决方案**:
```bash
# 添加执行权限
chmod +x scripts/*.sh

# 验证权限
ls -la scripts/
```

---

## 性能优化

### 使用连接池

增强版脚本已内置连接池，最多支持 5 个并发连接。

```javascript
const pool = new SSHConnectionPool(5);
```

### 调整超时时间

根据网络情况调整超时参数:

```javascript
const SSH_TIMEOUT = 10000;     // SSH 超时
const PORT_TIMEOUT = 5000;     // 端口超时
```

### 批量检查

使用循环批量检查主机:

```bash
for host in 7zi.com bot3.szspd.cn bot6.szspd.cn; do
  node scripts/health-check.js $host
done
```

---

## 定时任务

### 设置 Cron 任务

编辑 crontab:

```bash
crontab -e
```

添加定时任务:

```bash
# 每 5 分钟执行健康检查
*/5 * * * * cd /root/.openclaw/workspace/xunshi-inspector && npm run health-check >> /var/log/xunshi-inspector/health-check.log 2>&1

# 每小时执行增强检查
0 * * * * cd /root/.openclaw/workspace/xunshi-inspector && npm run health-check:enhanced >> /var/log/xunshi-inspector/enhanced-check.log 2>&1

# 每天早上 8:00 生成日报
0 8 * * * cd /root/.openclaw/workspace/xunshi-inspector && bash scripts/inspector-check.sh >> /var/log/xunshi-inspector/daily-report.log 2>&1
```

---

## 项目结构

```
xunshi-inspector/
├── scripts/                    # 脚本目录
│   ├── health-check.js         # 基础健康检查
│   ├── health-check-enhanced.js # 增强版健康检查
│   ├── config-validator.js     # 配置验证器
│   ├── report-generator.js     # 报告生成器
│   ├── lib-common.sh           # 公共函数库
│   ├── cluster-common.sh       # 集群函数库
│   ├── cluster-communicate.sh  # 集群沟通工具
│   ├── inspector-check.sh      # 巡视经理检查
│   ├── check-picoclaw.js       # picoclaw 检查
│   └── deploy-all-machines.sh  # 集群部署脚本
├── tests/                      # 测试目录
│   ├── health-check.test.js
│   ├── health-check-json.test.js
│   ├── config-validator.test.js
│   └── report-generator.test.js
├── reports/                    # 报告输出目录
├── workspace-logs/             # 工作日志目录
├── memory/                     # 内存日志目录
├── coverage/                   # 测试覆盖率目录
├── node_modules/               # 依赖包
├── config.json                 # 配置文件（可选）
├── package.json                # NPM 配置
├── jest.config.json            # Jest 配置
├── README.md                   # 本文件
├── API.md                      # API 文档
├── CONFIG.md                   # 配置文档
└── test-coverage-report.md     # 测试覆盖率报告
```

---

## 文档

- [API.md](./API.md) - API 函数文档
- [CONFIG.md](./CONFIG.md) - 配置说明文档
- [test-coverage-report.md](./test-coverage-report.md) - 测试覆盖率报告

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤:

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 许可证

ISC

---

## 作者

OpenClaw 巡视图项目团队

---

## 更新日志

### v1.0.0 (2026-03-17)

- 初始版本发布
- 基础健康检查功能
- SSH 连通性检查
- picoclaw 进程监控
- 系统资源监控
- 报告生成功能
- Bash 脚本工具集

---

## 支持

如有问题或建议，请通过以下方式联系:

- 提交 Issue
- 发送邮件
- 在集群频道中讨论

---

## 致谢

感谢以下开源项目:

- [ssh2](https://github.com/mscdex/ssh2) - SSH 客户端库
- [jest](https://jestjs.io/) - JavaScript 测试框架

---

**最后更新**: 2026-03-17

**版本**: 1.0.0
