# 🔄 OpenClaw 会话记忆系统设计

## 问题分析

### 当前问题
1. ❌ 没有持续的记忆
2. ❌ 最近的指令覆盖前面的
3. ❌ 不知道最近做了哪些事
4. ❌ 不知道是否完成
5. ❌ 无法断点续传

---

## 🎯 解决方案

### 1. 会话日志系统

**文件位置**: `/root/.openclaw/workspace/memory/sessions/`

**文件格式**:
```
sessions/
├── 2026-03-15.json          # 今天的会话
├── 2026-03-14.json          # 昨天的会话
├── 2026-03-13.json          # 前天的会话
└── latest-summary.json      # 最新摘要
```

**每条记录格式**:
```json
{
  "timestamp": "2026-03-15T08:36:00+08:00",
  "type": "task_start|task_progress|task_complete|user_instruction",
  "task": "Cherry Studio 中国版开发",
  "status": "completed|in_progress|blocked|abandoned",
  "progress": {
    "current": 4,
    "total": 5,
    "percentage": 80
  },
  "context": {
    "project": "cherry-studio-cn",
    "branch": "feature/china-edition",
    "files_modified": ["default.ts", "ChineseLLMConfig.tsx"],
    "commits": 4
  },
  "next_steps": ["构建项目", "测试组件"],
  "blocking_issues": [],
  "user_message": "部署了吗 地址是什么"
}
```

---

### 2. 自动保存机制

**触发时机**:
- 每次任务开始时
- 每次任务进度更新时
- 每次任务完成时
- 每次用户给出重要指令时
- 每 30 分钟自动保存

**保存内容**:
- 任务名称和状态
- 当前进度
- 已完成的工作
- 待办事项
- 阻塞问题

---

### 3. 会话摘要系统

**文件**: `memory/sessions/latest-summary.json`

```json
{
  "last_update": "2026-03-15T08:36:00+08:00",
  "active_tasks": [
    {
      "name": "Cherry Studio 中国版开发",
      "status": "completed",
      "progress": 100,
      "files": 4,
      "commits": 4,
      "pushed": true,
      "github": "https://github.com/songzuo/botmem/tree/main/cherry-studio-cn"
    }
  ],
  "recent_decisions": [
    {
      "time": "2026-03-15T04:52:00+08:00",
      "decision": "不安装 code-interpreter 等技能",
      "reason": "安全风险 + 功能重复"
    }
  ],
  "pending_work": [
    "升级 Node.js 到 v24+",
    "构建项目",
    "部署到 7zi.com"
  ],
  "blocking_issues": []
}
```

---

### 4. 启动时自动读取

**流程**:
1. 启动时读取 `latest-summary.json`
2. 读取最近 2 天的会话日志
3. 提取未完成的任务
4. 识别矛盾指令
5. 继续上次的工作

---

## 📋 实施步骤

### Step 1: 创建目录结构

```bash
mkdir -p /root/.openclaw/workspace/memory/sessions
```

### Step 2: 创建会话记录脚本

- `session-log.sh` - 记录会话
- `session-summary.sh` - 生成摘要
- `session-resume.sh` - 恢复会话

### Step 3: 集成到定时任务

- 每 30 分钟自动保存会话状态
- 每次任务完成时更新摘要

### Step 4: 创建记忆检索机制

- 搜索最近会话
- 查找特定任务
- 识别矛盾指令

---

## 🔧 使用示例

### 记录会话
```bash
./session-log.sh --task "Cherry Studio 开发" --status "in_progress" --progress "80%"
```

### 生成摘要
```bash
./session-summary.sh
```

### 恢复会话
```bash
./session-resume.sh
```

---

## 🎯 效果

1. ✅ 持续记忆 - 最近 1-2 天的会话完整记录
2. ✅ 矛盾检测 - 识别前后不一致的指令
3. ✅ 进度跟踪 - 知道任务完成情况
4. ✅ 断点续传 - 从上次中断处继续
5. ✅ 自动保存 - 无需手动操作

---

_创建时间: 2026-03-15 08:36_