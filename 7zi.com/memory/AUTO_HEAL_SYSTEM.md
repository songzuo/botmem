# 自动任务处理系统

## 核心理念
不是"记录"任务，而是任务能够**自动续传**、**自动重试**、**自动恢复**。

---

## 1. 任务自动续传机制

### 问题
- 任务执行到一半，会话结束
- 下次启动需要从头开始

### 解决方案
```
cron/pending-tasks/ 目录
├── <task-id>.json  (待执行任务)
├── <task-id>.running  (执行中)
└── <task-id>.done  (已完成)
```

**工作流程**:
1. 任务创建时 → 写入 pending-tasks/<id>.json
2. 任务开始时 → 重命名为 .running
3. 任务完成时 → 移动到 done/
4. 会话启动时 → 检查 pending-tasks/，自动恢复未完成任务

---

## 2. 故障自动重试机制

### 问题
- 安装技能时 rate limit
- 网络请求失败
- 服务意外中断

### 解决方案
```
cron/retry-daemon.sh
- 检查 .running 状态超过N分钟的任务
- 自动重试/回退
- 达到最大重试次数后标记失败
```

---

## 3. 故障自愈系统

### 问题
- 服务意外停止
- 进程崩溃
- 资源耗尽

### 解决方案
```
cron/health-daemon.sh
- 每分钟检查关键服务状态
- 检测到故障 → 自动尝试修复
- 修复失败 → 告警 + 记录
```

---

## 实现优先级

### P0: 健康检查自愈 (立即部署)
- 检测服务宕机 → 自动重启
- 检测端口不通 → 自动修复

### P1: 任务自动续传 (今天部署)
- 会话启动自动加载未完成任务
- 断点续传

### P2: 故障自动重试 (本周部署)
- 自动重试失败任务
- 指数退避策略

---

## 示例：P0 健康检查自愈

```bash
#!/bin/bash
# cron/health-heal.sh - 服务自愈脚本
# 每分钟运行，检查并自动修复

CHECKS=(
  "19003:curl -s http://localhost:19003/api/health"
  "6379:redis-cli ping"
  "443:nginx -t"
)

for check in "${CHECKS[@]}"; do
  port="${check%%:*}"
  cmd="${check##*:}"
  
  if ! eval "$cmd" > /dev/null 2>&1; then
    echo "⚠️ 服务异常: $port，尝试修复..."
    # 根据端口自动判断修复方案
    case $port in
      19003) pkill -f "clawchat"; cd /root/.openclaw/workspace/clawchat && nohup node dist/server/index.js & ;;
      6379) systemctl restart redis-server ;;
      443) systemctl restart nginx ;;
    esac
  fi
done
