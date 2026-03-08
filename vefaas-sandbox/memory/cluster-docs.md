# 7台机器完整配置文档

## ⚠️ 重要：机器角色区分

**bot (8.215.23.144) 是 moltbot 交易机器人，不是 OpenClaw！**
- 运行 moltbot-gateway，不是 openclaw-gateway
- 无需修复 Telegram 配置
- 配置在 moltbot.json

## 机器列表

| # | 主机名 | IP | 频道 | 端口 | 备注 |
|---|--------|-----|------|------|------|
| 1 | 7zi.com | 165.99.43.61 | Telegram | 18789 | |
| 2 | bot.szspd.cn | 8.215.23.144 | **moltbot** | - | 交易机器人，非OpenClaw |
| 3 | bot2.szspd.cn | 47.81.39.226 | Telegram | 18789 | |
| 4 | bot3.szspd.cn | 159.75.149.84 | DingTalk | 18789 | |
| 5 | bot4.szspd.cn | 43.159.49.231 | Telegram | 18789 | |
| 6 | bot5.szspd.cn | 182.43.36.134 | - | - | SSH失联 |
| 7 | bot6.szspd.cn | 109.123.246.140 | DingTalk | 18795 | |

## 登录信息

- 密码: ge2099334$ZZ (大部分)
- 密码: ge2099334$Z (182.43.36.134)

## 标准配置

### 统一端口
- OpenClaw Gateway: 18789
- picoclaw: 18795 (备用)

### 自愈脚本
位置: ~/scripts/self-heal.sh
功能: 每5分钟检查Gateway状态，自动重启

### 备份
位置: ~/.openclaw/backups/

## 常用命令

```bash
# 状态检查
./cluster-manager-v2.sh status

# 重启Gateway
./cluster-manager-v2.sh restart
```

## Telegram Bots

- 7zi.com: @Bot8clawbot
- bot2: 3个bots
- bot4: @Bot

## DingTalk

所有DingTalk机器使用相同配置:
- clientId: dingpcborakffejd8f93
- clientSecret: 2qD63I8eA3MzeCgIAA309kccv35sfSR7O8TDwIBRtwZCYSq2mTGwpfJ_5VKLUtEH
