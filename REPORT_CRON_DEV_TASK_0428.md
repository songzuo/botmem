# 主管报告：子代理调度器状态

**时间**: 2026-04-28 07:36 UTC (09:36 欧洲/柏林)

## ❌ 当前状态：0 个活跃任务

## 问题诊断

**根本原因**: 所有最近的子代理任务因 API Token 过期而失败。

```
错误信息: "401 该令牌已过期 (request id: 202604280709...)"
```

### 失败的子代理（全部，8个）

| 任务 | 模型 | 运行时 | 错误 |
|------|------|--------|------|
| dev-task-retry-prod-health | deepseek-v3-2-251201 | 1m | 401 Token过期 |
| dev-task-retry-api-docs | deepseek-v3-2-251201 | 1m | 401 Token过期 |
| dev-task-retry-nextjs | deepseek-v3-2-251201 | 1m | 401 Token过期 |
| dev-task-retry-evomap | deepseek-v3-2-251201 | 1m | 401 Token过期 |
| dev-task-4-prod-health | minimax | 1m | 401 Token过期 |
| dev-task-3-nextjs16 | minimax | 1m | 401 Token过期 |
| dev-task-3-nextjs16 | minimax | 1m | 401 Token过期 |
| dev-task-1-evomap | minimax | 1m | 401 Token过期 |

## 影响

- **活跃任务数**: 0 (目标: 3-5个)
- **新任务无法启动**: 由于认证失败，所有新spawn的子代理会立即失败
- **调度器暂停**: 在token续期前无法正常调度任务

## 需要的操作

**主人需要**:
1. 检查 OpenClaw 配置的 API Key 设置
2. 为 `volcengine` (deepseek-v3) 和 `minimax` 提供商更新/续期 token
3. 验证配置后重新启动调度

## 已完成的检查

- [x] 检查活跃子代理列表
- [x] 检查会话状态
- [x] 诊断失败原因
- [x] 生成状态报告

## 建议

待 API Token 续期后，主管可以恢复调度任务。当前workspace有大量开发任务待处理：
- NextJS16 兼容性检查
- 生产环境健康检查  
- API文档同步
- Evomap集成状态检查
- 等等...

---

*主管 - 持续工作调度器*