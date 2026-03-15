# 🔄 任务断点续传与故障恢复系统

## 🎯 系统目标

1. **自动记录任务进度** - 每个关键步骤自动保存
2. **故障根源分析** - 每次故障自动诊断
3. **自动恢复机制** - 从断点继续执行
4. **避免重复错误** - 记录错误模式，防止再犯

---

## 📐 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    任务跟踪系统                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 任务定义     │  │ 进度跟踪     │  │ 状态持久化   │      │
│  │ tasks.json   │  │ progress.log │  │ state.json   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └─────────┬───────┴─────────┬───────┘               │
│                   ▼                 ▼                        │
│         ┌─────────────────────────────────┐                 │
│         │      故障诊断与恢复系统          │                 │
│         │  - 错误检测                      │                 │
│         │  - 根源分析                      │                 │
│         │  - 自动重试                      │                 │
│         │  - 错误记录                      │                 │
│         └─────────────────────────────────┘                 │
│                   │                                         │
│                   ▼                                         │
│         ┌─────────────────────────────────┐                 │
│         │      智能恢复策略                │                 │
│         │  - 断点续传                      │                 │
│         │  - 任务回滚                      │                 │
│         │  - 状态恢复                      │                 │
│         └─────────────────────────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 文件结构

```
/root/.openclaw/workspace/memory/
├── tasks/
│   ├── current.json          # 当前任务
│   ├── queue.json            # 任务队列
│   ├── completed.json        # 已完成任务
│   └── failed.json           # 失败任务（含错误分析）
├── checkpoints/
│   ├── checkpoint-001.json   # 检查点1
│   ├── checkpoint-002.json   # 检查点2
│   └── latest.json           # 最新检查点
├── errors/
│   ├── error-log.json        # 错误日志
│   ├── error-patterns.json   # 错误模式库
│   └── solutions.json        # 解决方案库
└── sessions/
    ├── session-2026-03-15.json
    └── latest-summary.json
```

---

## 🔧 核心组件

### 1. 任务状态文件 (current.json)

```json
{
  "taskId": "task-20260315-001",
  "name": "Cherry Studio 中国版部署",
  "type": "deployment",
  "status": "in_progress",
  "priority": "high",
  "created": "2026-03-13T18:25:00+08:00",
  "updated": "2026-03-13T20:23:00+08:00",
  
  "progress": {
    "total": 10,
    "completed": 6,
    "current": 7,
    "percentage": 60
  },
  
  "steps": [
    {"id": 1, "name": "克隆源代码", "status": "completed", "timestamp": "2026-03-13T18:26:00+08:00"},
    {"id": 2, "name": "安装依赖", "status": "completed", "timestamp": "2026-03-13T18:30:00+08:00"},
    {"id": 3, "name": "添加中国模型", "status": "completed", "timestamp": "2026-03-13T19:00:00+08:00"},
    {"id": 4, "name": "创建组件", "status": "completed", "timestamp": "2026-03-13T19:30:00+08:00"},
    {"id": 5, "name": "提交代码", "status": "completed", "timestamp": "2026-03-13T19:45:00+08:00"},
    {"id": 6, "name": "推送到GitHub", "status": "completed", "timestamp": "2026-03-13T20:00:00+08:00"},
    {"id": 7, "name": "构建项目", "status": "in_progress", "timestamp": "2026-03-13T20:10:00+08:00"},
    {"id": 8, "name": "部署到7zi.com", "status": "pending"},
    {"id": 9, "name": "测试验证", "status": "pending"},
    {"id": 10, "name": "完成确认", "status": "pending"}
  ],
  
  "currentStep": {
    "id": 7,
    "name": "构建项目",
    "status": "in_progress",
    "startedAt": "2026-03-13T20:10:00+08:00",
    "checkpoint": "checkpoint-007.json"
  },
  
  "dependencies": {
    "node_version": ">=24.11.1",
    "current_node": "v22.22.0",
    "blocking": true
  },
  
  "errors": [
    {
      "step": 7,
      "timestamp": "2026-03-13T20:10:16+08:00",
      "type": "process_killed",
      "message": "Typecheck process terminated (SIGTERM)",
      "rootCause": "Node.js version mismatch (required >=24.11.1, current v22.22.0)",
      "solution": "Upgrade Node.js to v24+ before building",
      "resolved": false
    }
  ],
  
  "context": {
    "project": "cherry-studio-cn",
    "branch": "feature/china-edition",
    "commits": 4,
    "files_modified": 9,
    "github": "https://github.com/songzuo/botmem/tree/main/cherry-studio-cn"
  },
  
  "resumeStrategy": {
    "from_step": 7,
    "action": "upgrade_nodejs",
    "prerequisites": ["Node.js v24+"]
  }
}
```

---

### 2. 检查点文件 (checkpoint-007.json)

```json
{
  "checkpointId": "checkpoint-007",
  "taskId": "task-20260315-001",
  "step": 7,
  "timestamp": "2026-03-13T20:10:00+08:00",
  
  "state": {
    "git_branch": "feature/china-edition",
    "git_commits": 4,
    "git_status": "clean",
    "files_created": [
      "src/renderer/src/components/ChineseFeatures/ChineseHolidayReminder.tsx",
      "src/renderer/src/components/ChineseFeatures/EnterpriseIntegration.tsx",
      "src/renderer/src/components/ChineseFeatures/ChineseLLMConfig.tsx",
      "src/renderer/src/components/ChineseFeatures/index.ts"
    ],
    "files_modified": [
      "src/renderer/src/config/models/default.ts",
      "src/renderer/src/i18n/locales/zh-cn.json",
      "docs/PROGRESS.md",
      "docs/coding-plan.md"
    ],
    "github_pushed": true,
    "github_url": "https://github.com/songzuo/botmem/tree/main/cherry-studio-cn"
  },
  
  "environment": {
    "node_version": "v22.22.0",
    "pnpm_version": "10.27.0",
    "os": "Linux",
    "cwd": "/root/workspace/cherry-studio-cn"
  },
  
  "nextAction": {
    "type": "build",
    "command": "pnpm build",
    "dependencies": ["Node.js >=24.11.1"],
    "blocking_issue": "Node version too old"
  },
  
  "resumeCommand": "cd /root/workspace/cherry-studio-cn && pnpm build"
}
```

---

### 3. 错误模式库 (error-patterns.json)

```json
{
  "patterns": [
    {
      "id": "EP001",
      "type": "node_version_mismatch",
      "pattern": "Unsupported engine.*wanted.*node.*current",
      "rootCause": "Node.js version doesn't meet project requirements",
      "solutions": [
        {
          "action": "upgrade_nodejs",
          "command": "nvm install 24 && nvm use 24",
          "prevention": "Check Node version before starting task"
        }
      ],
      "occurrences": 3,
      "lastSeen": "2026-03-13T20:10:16+08:00"
    },
    {
      "id": "EP002",
      "type": "github_token_invalid",
      "pattern": "401|Unauthorized|invalid_token",
      "rootCause": "GitHub token expired or revoked",
      "solutions": [
        {
          "action": "update_token",
          "command": "Update GITHUB_TOKEN in .env",
          "prevention": "Validate token before push"
        }
      ],
      "occurrences": 2,
      "lastSeen": "2026-03-08T14:20:00+08:00"
    },
    {
      "id": "EP003",
      "type": "process_timeout",
      "pattern": "SIGTERM|timeout|killed",
      "rootCause": "Process took too long or system killed it",
      "solutions": [
        {
          "action": "increase_timeout",
          "command": "Set longer timeout or run in background",
          "prevention": "Monitor long-running processes"
        }
      ],
      "occurrences": 5,
      "lastSeen": "2026-03-13T20:10:16+08:00"
    }
  ]
}
```

---

## 🚀 使用方式

### 1. 启动新任务

```bash
./task-manager.sh start "Cherry Studio 中国版部署" --priority high
```

### 2. 更新任务进度

```bash
./task-manager.sh progress --step 7 --status in_progress
```

### 3. 创建检查点

```bash
./task-manager.sh checkpoint --step 7
```

### 4. 故障发生时

```bash
./task-manager.sh error --step 7 --type "process_killed" --message "Typecheck terminated"
```

### 5. 恢复任务

```bash
./task-manager.sh resume
```

---

## 🔍 故障分析流程

1. **检测故障** → 记录错误信息
2. **匹配模式** → 查找已知错误模式
3. **根源分析** → 确定根本原因
4. **生成方案** → 提供解决方案
5. **执行恢复** → 从断点继续
6. **记录经验** → 更新错误模式库

---

## 📊 效果

1. ✅ **断点续传** - 从中断处继续
2. ✅ **故障诊断** - 自动分析根本原因
3. ✅ **避免重复** - 错误模式库防止再犯
4. ✅ **状态持久** - 重启后可恢复
5. ✅ **自动记录** - 无需手动操作

---

_创建时间: 2026-03-15 08:55_
_系统版本: 1.0_