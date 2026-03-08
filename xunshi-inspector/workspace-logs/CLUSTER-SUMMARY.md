---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: 66c492c0fd5b395dcc6c615bb737acee
    PropagateID: 66c492c0fd5b395dcc6c615bb737acee
    ReservedCode1: 3045022100d7542c1fdc84bcaa55b780b2201ea56459e259543cef6d120a2781de231134760220633a7d7f9ff83177d267b3517044ae8ce5c6662f509de9be375cbe3f1a2bd657
    ReservedCode2: 3045022100f51adfedd9560e846b88f11f9a2b7e824a097c18f392d9bc370dd0367479d7620220107aede894ec5990ca606c1750f4988b74d461846f2c95be1a14007831e0e31b
---

# 🔍 集群巡视总结

## 巡视经理: 巡视 (Xun Shi)
- **日期**: 2026-03-01
- **状态**: 持续工作中

---

## 集群架构

### 7节点配置

| # | 主机名 | IP | 角色 | 状态 |
|---|--------|-----|------|------|
| 1 | 7zi.com | 165.99.43.61 | 协调经理 | ❌ SSH不可达 |
| 2 | bot.szspd.cn | - | 交易机器人 | ✅ 在线 |
| 3 | bot2.szspd.cn | - | Worker | ❌ SSH不可达 |
| 4 | bot3.szspd.cn | - | 经理(Evolver) | ✅ 路由运行中 |
| 5 | bot4.szspd.cn | - | Worker | ❌ SSH不可达 |
| 6 | bot5 | 182.43.36.134 | Worker | ❌ 认证失败 |
| 7 | bot6.szspd.cn | 109.123.246.140 | 测试机 | ❌ SSH不可达 |

---

## 智能路由 (bot3)

### 运行状态
- **进程**: smart-router-full.js (PID 2021042)
- **端口**: 11435
- **提供商**: 17个
- **健康**: 13/17

### 提供商列表

#### Coding Plan (免费)
1. volcengine-2 ✓
2. volcengine ✓
3. volcengine-3 ✓
4. alibaba ✓
5. bailian2 ✓
6. alibaba-2 ✓

#### 付费
7. siliconflow ✓
8. qiniu ✓
9. openrouter ✗
10. mistral ✓
11. grok ✗
12. self ✓
13. coze ✓
14. minimax ✓
15. newcli-aws ✗
16. newcli-droid ✗
17. newcli-codex ✓

---

## 本机环境

- **主机名**: matrix-agent-claw-xagb-6c8df6df65-llflw
- **类型**: 云沙箱环境
- **角色**: 文档化/协调者(非直接管理者)

---

## 已创建工具

1. `scripts/inspector-check.sh` - 巡视自动检查

---

## 待完成任务

1. SSH连接恢复
2. 部署脚本执行
3. 心跳任务配置

---

*持续更新中*
