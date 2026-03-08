#!/bin/bash
# 任务监控脚本

EXECUTOR_DIR="/workspace/projects/workspace"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== OpenClaw 任务监控 ===${NC}"

# 检查任务文件
TASKS_FILE="$EXECUTOR_DIR/memory/tasks.json"
if [ ! -f "$TASKS_FILE" ]; then
    echo -e "${RED}❌ 任务文件不存在: $TASKS_FILE${NC}"
    exit 1
fi

# 显示任务执行状态
echo -e "\n${BLUE}任务执行状态:${NC}"

python3 - <<END
import json
with open('$TASKS_FILE', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
    print("统计信息:")
    print(f"总任务: {data['statistics']['total']}")
    print(f"运行中: {data['statistics']['running']}")
    print(f"已完成: {data['statistics']['completed']}")
    print(f"待执行: {data['statistics']['pending']}")
    print(f"失败:    {data['statistics']['failed']}")
    print(f"阻塞:    {data['statistics']['blocked']}")
    print()
    
    if data['statistics']['running'] > 0:
        print("正在执行的任务:")
        for task in data['tasks']:
            if task['status'] == 'running':
                print(f"  • {task['title']} ({task['id']})")
    print()
    
    if data['statistics']['completed'] > 0:
        print("已完成的任务:")
        for task in data['tasks']:
            if task['status'] == 'completed':
                completion_time = task.get('completedAt', '未知')
                print(f"  • {task['title']} ({task['id']}) - {completion_time}")
    print()
    
    if data['statistics']['failed'] > 0:
        print("失败的任务:")
        for task in data['tasks']:
            if task['status'] == 'failed':
                print(f"  • {task['title']} ({task['id']})")
                if task.get('errorLog'):
                    print(f"    错误: {task['errorLog'][:100]}...")
    print()
    
    if data['statistics']['pending'] > 0:
        print("待执行的任务:")
        for task in data['tasks']:
            if task['status'] == 'pending':
                dependencies = task.get('dependencies', [])
                print(f"  • {task['title']} ({task['id']})")
                if dependencies:
                    print(f"    依赖: {', '.join(dependencies)}")
END

# 检查任务执行时间
echo -e "\n${BLUE}任务执行时间:${NC}"

python3 - <<END
import json
import time
from datetime import datetime

with open('$TASKS_FILE', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
    for task in data['tasks']:
        if task.get('status') == 'running' and task.get('startedAt'):
            start_time = datetime.fromisoformat(task['startedAt'].replace('Z', '+00:00'))
            elapsed = int((datetime.now() - start_time).total_seconds())
            print(f"  • {task['title']} ({task['id']}): 已执行 {elapsed} 秒")
END

# 检查任务执行顺序
echo -e "\n${BLUE}任务执行顺序:${NC}"
python3 - <<END
import json

with open('$TASKS_FILE', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
    priority_order = ["critical", "high", "medium", "low"]
    
    ready_tasks = []
    for task in data['tasks']:
        if task.get('status') == 'pending':
            dependencies = task.get('dependencies', [])
            if not dependencies:
                ready_tasks.append(task)
            else:
                all_deps_completed = True
                for dep_id in dependencies:
                    dep_task = next((t for t in data['tasks'] if t.get('id') == dep_id), None)
                    if not dep_task or dep_task.get('status') != 'completed':
                        all_deps_completed = False
                        break
                        
                if all_deps_completed:
                    ready_tasks.append(task)
                    
    if ready_tasks:
        ready_tasks.sort(key=lambda t: priority_order.index(t.get('priority', 'low')))
        
        print("准备好执行的任务顺序:")
        for i, task in enumerate(ready_tasks, 1):
            print(f"  {i}. {task['title']} ({task['id']}) - {task['priority']}")
    else:
        print("没有准备好执行的任务")
END

echo -e "\n${BLUE}=== OpenClaw 任务监控完成 ===${NC}"
