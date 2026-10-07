# 持续记忆系统设计

## 核心问题
OpenClaw 每次会话重启后丢失上下文，无法：
1. 知道最近做了什么
2. 断点续传
3. 避免重复故障

## 解决方案：三重记忆机制

### 1. 会话启动记忆 (Session Boot Memory)
**触发**: 每次新会话开始
**操作**: 自动加载最近2天的记忆摘要
**文件**: `memory/recent-summary.md`

### 2. 任务状态记忆 (Task State Memory)
**触发**: 每个任务开始/完成/失败时
**操作**: 记录任务ID、状态、进度、断点
**文件**: `memory/tasks.json`

### 3. 故障分析记忆 (Fault Analysis Memory)
**触发**: 每次故障发生时
**操作**: 记录故障根因、解决方案、预防措施
**文件**: `memory/faults.json`

---

## 实现机制

### 机制1：会话启动自动加载
```
每次会话开始 → 读取 recent-summary.md → 加载到上下文
```

### 机制2：任务生命周期管理
```
任务开始 → 记录任务ID和状态
任务进行中 → 记录断点
任务完成/失败 → 记录结果 + 故障分析(如有)
```

### 机制3：故障根因分析
```
故障发生 → 记录现象 → 分析根因 → 记录解决方案 → 提取预防措施
```

---

## 文件格式

### recent-summary.md
```markdown
# 最近会话摘要

## 最近任务
- [进行中] skill-vetter安装 - 断点: 第二次尝试安装
- [已完成] Claw-Mesh部署 - 03-13完成

## 重要指令
- "自己决策" → 自主安装skill-vetter

## 待处理
- (无)
```

### tasks.json
```json
{
  "tasks": [
    {
      "id": "skill-vetter-install",
      "name": "安装skill-vetter",
      "status": "completed",
      "started": "2026-03-14T20:45:00Z",
      "completed": "2026-03-14T20:53:00Z",
      "断点": "第一次rate limit失败，第二次成功",
      "result": "success"
    }
  ]
}
```

### faults.json
```json
{
  "faults": [
    {
      "id": "clawhub-rate-limit",
      "time": "2026-03-14T20:53:00Z",
      "现象": "安装skill-vetter时rate limit",
      "根因": "ClawHub API限流",
      "解决方案": "等待后重试/使用备用包名",
      "预防措施": "添加重试机制，备用包名列表"
    }
  ]
}
```

---

## 自动执行

### Cron 任务
- 每天 00:00: 生成昨日摘要到 recent-summary.md
- 每小时: 清理过期任务状态
- 每次故障: 自动写入 faults.json

### 会话启动
- 自动读取 recent-summary.md
- 自动恢复未完成任务状态
