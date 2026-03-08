# 7台机器完整诊断报告

## 当前状态总览

### 进程混乱 (需要清理)

| 机器 | OpenClaw进程 | Picoclaw进程 | 问题 |
|------|-------------|--------------|------|
| 7zi.com | 1 | 0 | 多余node进程 |
| bot | 0 | 0 | moltbot在运行 |
| bot2 | 1 | 1 | 重复! |
| bot3 | 2 | 1 | 重复! |
| bot4 | 1 | 1 | 重复! |
| bot5 | 1 | 1 | 重复! |
| bot6 | 0 | 1 | 正常 |

### 频道配置

| 机器 | 频道 |
|------|------|
| 7zi.com | Telegram |
| bot | DingTalk |
| bot2 | Telegram |
| bot3 | DingTalk |
| bot4 | Telegram |
| bot5 | DingTalk |
| bot6 | DingTalk |

### 防火墙状态

| 机器 | SSH限制 | Gateway端口 |
|------|---------|------------|
| 7zi.com | 无限制 | 18795全开放 |
| bot2 | 有 | 特定IP |
| bot3 | 有 | 全开放 |
| bot4 | 有 | 特定IP |
| bot5 | 无 | 全开放 |
| bot6 | 无 | 全开放 |

## 需要修复

1. **进程重复** - 每台只运行一个服务
2. **防火墙** - 统一安全策略
3. **自启动** - 配置systemd
