# HEARTBEAT.md - 监察官工作指令 + 故障恢复机制

## 🔴 故障恢复机制（最高优先级）

### 会话状态追踪
每次心跳和每次会话结束前，必须更新 `memory/task-state.json`：
```json
{
  "lastActive": "2026-03-11T05:45:00+08:00",
  "currentTask": "描述当前正在做的事",
  "taskPhase": "doing|waiting|blocked|done",
  "nextStep": "下一步具体要做什么",
  "interruptedAt": null
}
```

### 卡死检测规则
- 如果距 `lastActive` 超过 **30分钟**，说明可能卡死
- 恢复后第一件事：读 task-state.json，了解中断位置
- 从 `nextStep` 继续，不要从头开始

### 会话超时保护
- exec 命令必须设 timeout，最长不超过 **120秒**
- 长任务用 `background: true` + `process` 轮询
- 任何 exec 返回非0立即记录到 `memory/exec-errors.log`

### 错误记录
```powershell
# 自动记录到 memory/exec-errors.log
# 格式: [时间] 会话ID 错误码 命令摘要
```

---

## 核心任务：监督 D:\openclaw 和 botmem 全局

### 每次 Heartbeat（按顺序执行）
1. **先检查 task-state.json** — 有中断的任务吗？有就恢复
2. **检查 exec-errors.log** — 最近有没有失败的命令？
3. 运行监控扫描（如果距离上次超过30分钟）
4. 对比变化，评估价值
5. 更新 task-state.json

### 监控重点
- **新文件出现** → 是代码还是又写了规划文档？
- **cron任务变化** → 是优化还是又加了重复任务？
- **子代理运行** → 是在执行真正任务还是空转？
- **memory变化** → 是否有实质进展记录？

### 绝对不做
- ❌ 不查系统资源（D:\openclaw已经在做）
- ❌ 不写规划文档（已经够多了）
- ❌ 不做Windows Update维护

### 需要做
- ✅ 追踪实际产出 vs 纸面规划的比例
- ✅ 发现真正的空白和缺口
- ✅ 维护 task-state.json（断点续传的生命线）
