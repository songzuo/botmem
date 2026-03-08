#!/bin/bash
# OpenClaw 自主执行系统 - 自我驱动的完整循环

EXECUTOR_DIR="/workspace/projects/workspace"
SCRIPTS_DIR="$EXECUTOR_DIR/scripts"
MEMORY_DIR="$EXECUTOR_DIR/memory"
LOG_DIR="$MEMORY_DIR/executor-logs"
HISTORY_DIR="$MEMORY_DIR/autonomous-history"

mkdir -p "$HISTORY_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    local message="$1"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $message" >> "$LOG_DIR/self-driving.log"
    echo -e "[$timestamp] $message"
}

# 执行完整的自主循环
execute_autonomous_cycle() {
    local cycle_name="$1"
    local log_file="$HISTORY_DIR/autonomous-cycle-$cycle_name.log"
    
    log "开始自主执行循环: $cycle_name"
    
    # 记录执行状态
    touch "$log_file"
    
    python3 - <<END
import json
from datetime import datetime

cycle_info = {
    "cycle_name": "$cycle_name",
    "start_time": $(date +%s),
    "start_time_str": "$(date +"%Y-%m-%d %H:%M:%S")",
    "status": "running",
    "stages": []
}

with open('$log_file', 'w') as f:
    json.dump(cycle_info, f, indent=2, ensure_ascii=False)
END

    # 1. 系统评估阶段
    log "🎯 阶段 1: 系统评估"
    
    if "$SCRIPTS_DIR/autonomous-executor.sh" assess; then
        log "✅ 系统评估完成"
    else
        log "❌ 系统评估失败"
        return 1
    fi

    # 2. 数据分析阶段
    log "📊 阶段 2: 数据分析"
    
    if "$SCRIPTS_DIR/auto-analyzer.sh"; then
        log "✅ 数据分析完成"
    else
        log "❌ 数据分析失败"
        return 1
    fi

    # 3. 任务规划阶段
    log "🎯 阶段 3: 任务规划"
    
    if plan_file=$("$SCRIPTS_DIR/auto-planner.sh" -r); then
        log "✅ 任务规划完成"
    else
        log "❌ 任务规划失败"
        return 1
    fi

    # 4. 执行阶段
    log "⚡ 阶段 4: 任务执行"
    
    if "$SCRIPTS_DIR/auto-planner.sh" -f "$plan_file"; then
        log "✅ 任务执行完成"
    else
        log "❌ 任务执行失败"
        return 1
    fi

    # 5. 学习优化阶段
    log "📚 阶段 5: 学习优化"
    
    if "$SCRIPTS_DIR/auto-reporter.sh"; then
        log "✅ 学习优化完成"
    else
        log "❌ 学习优化失败"
        return 1
    fi

    # 更新循环状态
    python3 - <<END
import json
with open('$log_file', 'r') as f:
    cycle_info = json.load(f)
    
cycle_info["status"] = "completed"
cycle_info["end_time"] = $(date +%s)
cycle_info["end_time_str"] = "$(date +"%Y-%m-%d %H:%M:%S")"
cycle_info["duration"] = cycle_info["end_time"] - cycle_info["start_time"]
cycle_info["stages"].append({
    "stage": "complete",
    "timestamp": $(date +%s),
    "message": "循环完成"
})

with open('$log_file', 'w') as f:
    json.dump(cycle_info, f, indent=2, ensure_ascii=False)
END

    log "✅ 自主执行循环完成 ($cycle_name)"
}

# 执行任务级别的自主循环
execute_task_cycle() {
    local task_name="$1"
    local log_file="$HISTORY_DIR/task-cycle-$task_name.log"
    
    log "🎯 开始任务 $task_name 的自主循环"
    
    python3 - <<END
import json
from datetime import datetime

cycle_info = {
    "task_name": "$task_name",
    "start_time": $(date +%s),
    "status": "running",
    "task_info": {},
    "operations": []
}

with open('$log_file', 'w') as f:
    json.dump(cycle_info, f, indent=2, ensure_ascii=False)
END

    # 评估任务
    log "🔍 评估任务 $task_name"
    
    task_info=$(python3 - <<END
import json
with open('$EXECUTOR_DIR/memory/tasks.json') as f:
    tasks = json.load(f)
    
for t in tasks.get('tasks', []):
    if t.get('title') == "$task_name" or t.get('id') == "$task_name":
        import json
        print(json.dumps(t))
END
    )
    
    log "🎯 任务信息: $task_info"
    
    # 执行任务
    log "⚡ 执行任务 $task_name"
    
    task_success=$(python3 - <<END
import json
import subprocess

try:
    task_data = json.loads('$task_info')
    task_script = task_data.get('script', '')
    
    if task_script and task_script.endswith('.sh'):
        script_path = f'{EXECUTOR_DIR}/scripts/{task_script}'
        
        result = subprocess.run(['bash', script_path], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("success")
        else:
            print("failed")
    else:
        print("no_script")
        
except Exception as e:
    print(f"error: {e}")
END
    )
    
    if [ "$task_success" = "success" ]; then
        log "✅ 任务 $task_name 执行成功"
        
        python3 - <<END
import json
with open('$log_file', 'r') as f:
    cycle_info = json.load(f)
    
cycle_info["status"] = "completed"
cycle_info["task_result"] = "success"
cycle_info["end_time"] = $(date +%s)
cycle_info["operations"].append({
    "operation": "run_task",
    "timestamp": $(date +%s),
    "success": True
})

with open('$log_file', 'w') as f:
    json.dump(cycle_info, f, indent=2, ensure_ascii=False)
END
    else
        log "❌ 任务 $task_name 执行失败"
        
        python3 - <<END
import json
with open('$log_file', 'r') as f:
    cycle_info = json.load(f)
    
cycle_info["status"] = "failed"
cycle_info["task_result"] = "failed"
cycle_info["end_time"] = $(date +%s)
cycle_info["operations"].append({
    "operation": "run_task",
    "timestamp": $(date +%s),
    "success": False,
    "error": "$task_success"
})

with open('$log_file', 'w') as f:
    json.dump(cycle_info, f, indent=2, ensure_ascii=False)
END
    fi
}

# 执行节点级别的自主循环
execute_node_cycle() {
    local node_name="$1"
    local log_file="$HISTORY_DIR/node-cycle-$node_name.log"
    
    log "🎯 开始节点 $node_name 的自主循环"
    
    python3 - <<END
import json
from datetime import datetime

cycle_info = {
    "node_name": "$node_name",
    "start_time": $(date +%s),
    "status": "running",
    "operations": []
}

with open('$log_file', 'w') as f:
    json.dump(cycle_info, f, indent=2, ensure_ascii=False)
END

    # 检查节点连通性
    log "🌐 检查节点 $node_name 连通性"
    
    node_status=$(python3 - <<END
import subprocess

result = subprocess.run(
    ['sshpass', '-p', 'ge2099334\$ZZ', 'ssh', 
     '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=5',
     f'root@{node_name}', 'echo "Success"'],
    capture_output=True,
    text=True,
    timeout=10
)

if result.returncode == 0:
    print("success")
else:
    print(f"failed: {result.returncode}")
END
    )
    
    log "✅ 节点 $node_name 状态: $node_status"
    
    # 执行节点操作
    if [ "$node_status" = "success" ]; then
        log "⚡ 执行节点 $node_name 操作"
        
        node_operations=$(python3 - <<END
import subprocess

result = subprocess.run(
    ['sshpass', '-p', 'ge2099334\$ZZ', 'ssh', 
     '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=10',
     f'root@{node_name}', 'uname -a; hostname; uptime'],
    capture_output=True,
    text=True,
    timeout=10
)

print(result.stdout)
END
        )
        
        log "✅ 节点操作完成"
        log "$node_operations"
    fi
    
    # 更新循环状态
    python3 - <<END
import json
with open('$log_file', 'r') as f:
    cycle_info = json.load(f)
    
cycle_info["status"] = "completed"
cycle_info["end_time"] = $(date +%s)
cycle_info["node_status"] = "$node_status"

if "$node_status" == "success":
    cycle_info["success"] = True
else:
    cycle_info["success"] = False

with open('$log_file', 'w') as f:
    json.dump(cycle_info, f, indent=2, ensure_ascii=False)
END
    
    log "✅ 节点 $node_name 自主循环完成"
}

# 显示执行循环状态
show_cycle_status() {
    local cycle_type="$1"
    
    log "=== 执行循环状态 ==="
    
    python3 - <<END
import os
import json

history_dir = '$HISTORY_DIR'

if not os.path.exists(history_dir):
    print("❌ 历史目录不存在")
    raise SystemExit(1)

print("=== 所有执行循环 ===")

for filename in sorted(os.listdir(history_dir)):
    if cycle_type == 'all' or filename.startswith(f'{cycle_type}-'):
        file_path = f'{history_dir}/{filename}'
        
        with open(file_path) as f:
            data = json.load(f)
            
        duration = None
        if 'end_time' in data and 'start_time' in data:
            duration = data['end_time'] - data['start_time']
        
        status = data.get('status', 'unknown')
        
        if status == 'running':
            duration_str = "进行中"
        else:
            duration_str = f"{duration} 秒"
            
        print()
        print("-" * 50)
        
        if 'cycle_name' in data:
            print(f"🎯 循环: {data['cycle_name']}")
        elif 'task_name' in data:
            print(f"🎯 任务: {data['task_name']}")
        elif 'node_name' in data:
            print(f"🎯 节点: {data['node_name']}")
            
        print(f"⏱️ 状态: {status} ({duration_str})")
        
        if status == 'completed':
            end_time = None
            if 'end_time_str' in data:
                end_time = data['end_time_str']
            elif 'end_time' in data:
                from datetime import datetime
                end_time = datetime.fromtimestamp(data['end_time']).strftime('%Y-%m-%d %H:%M:%S')
                
            print(f"✅ 完成时间: {end_time}")
            
        print()
END
}

# 主自主学习系统
main() {
    log "🚀 启动OpenClaw自主执行系统"
    
    case "$1" in
        cycle|all)
            execute_autonomous_cycle "full_cycle_$(date +%Y%m%d_%H%M%S)"
            ;;
            
        task)
            if [ -z "$2" ]; then
                log "❌ 请指定任务名称"
                log "使用示例: $0 task '任务名称'"
                exit 1
            fi
            execute_task_cycle "$2"
            ;;
            
        node)
            if [ -z "$2" ]; then
                log "❌ 请指定节点名称"
                log "使用示例: $0 node '7zi.com'"
                exit 1
            fi
            execute_node_cycle "$2"
            ;;
            
        status)
            if [ -z "$2" ]; then
                show_cycle_status 'all'
            else
                show_cycle_status "$2"
            fi
            ;;
            
        info)
            log "OpenClaw自主执行系统信息"
            log "-----------------------------------"
            log "🚀 系统运行时间: $(uptime -p)"
            log "📊 任务总数: $(jq '.tasks | length' $EXECUTOR_DIR/memory/tasks.json)"
            log "⏱️ 执行循环: $(ls $HISTORY_DIR/execution-*.json 2>/dev/null | wc -l)"
            log "-----------------------------------"
            log ""
            log "系统正在自动分析和优化"
            log ""
            log "可用命令:"
            log "  $0 cycle       执行完整循环"
            log "  $0 task <name> 执行任务循环"
            log "  $0 node <name> 执行节点循环"
            log "  $0 status      查看状态"
            log "  $0 info        查看系统信息"
            ;;
            
        *)
            log "🔍 自动分析和执行"
            
            if "$SCRIPTS_DIR/auto-analyzer.sh" && "$SCRIPTS_DIR/auto-planner.sh" && "$SCRIPTS_DIR/auto-reporter.sh"; then
                log "✅ 自动分析和执行成功"
            else
                log "❌ 自动分析和执行失败"
                return 1
            fi
            ;;
    esac
}

# 检查是否直接运行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi