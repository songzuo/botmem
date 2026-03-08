# Claw-Mesh 模型互助机制 - 快速参考

## 🚨 模型错误时自动触发

### 错误检测
- 连续 3 次失败 → 自动切换
- 连续 5 次失败 → 广播救援
- 连续 10 次失败 → 通知用户

### 切换顺序
1. custom-customa1/qwen3.5-plus (主)
2. custom-custom32/qwen3.5-plus (备用 1)
3. minimax/MiniMax-M2.5 (备用 2)
4. custom-customda/mistral-small (备用 3)
5. qwen-portal/coder-model (代码专用)

## 📁 共享记忆区位置

```
memory/shared/
├── model-status/       # 各模型状态
├── rescue-requests/    # 救援请求
├── rescue-history/     # 救援历史
└── model-config/       # 配置文件
```

## 📋 各代理职责

| 代理 | 职责 |
|------|------|
| Main | 总协调、生成报告 |
| Memory | 记录事件、维护历史 |
| Sys | 网络诊断、API 测试 |
| Code | 配置检查、修复 |
| Chat | 通知用户、广播 |
| 其他 | 待命协助 |

## 🔧 手动切换模型

```bash
# 查看可用模型
/models

# 切换模型
/models custom-customa1/qwen3.5-plus
```

## 📊 告警级别

| 级别 | 条件 | 动作 |
|------|------|------|
| 🟢 正常 | 成功率>95% | 继续运行 |
| 🟡 警告 | 成功率 80-95% | 准备切换 |
| 🟠 严重 | 成功率 50-80% | 自动切换 |
| 🔴 故障 | 成功率<50% | 紧急切换 + 通知 |

---

*创建时间：2026-03-08 13:55*
