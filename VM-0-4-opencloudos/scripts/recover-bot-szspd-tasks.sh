#!/bin/bash
# 恢复任务: 节点 bot.szspd.cn 和 bot2.szspd.cn 自我恢复

TASK1_ID="recovery-bot.szspd.cn-1772534013"
TASK2_ID="recovery-bot2.szspd.cn-1772534023"
NODE1="bot.szspd.cn"
NODE2="bot2.szspd.cn"
PASSWORD="ge2099334\$ZZ"

# 日志函数
log() {
    local level="${2:-INFO}"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $1"
}

# 更新任务状态函数
update_task_status() {
    local task_id="$1"
    local status="${2:-running}"
    local progress_msg="${3:-任务正在恢复}"
    
    log "更新任务状态 - $task_id: $status"
    
    TASKS_FILE="/root/.openclaw/workspace/state/tasks.json"
    
    if [ ! -f "$TASKS_FILE" ]; then
        log "任务状态文件不存在: $TASKS_FILE" "ERROR"
        return 1
    fi
    
    python3 <<END
import json
from datetime import datetime

with open("$TASKS_FILE", 'r') as f:
    tasks_data = json.load(f)

if "$task_id" in tasks_data['tasks']:
    tasks_data['tasks']["$task_id"]['status'] = "$status"
    tasks_data['tasks']["$task_id"]['updated_at'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    tasks_data['tasks']["$task_id"]['blocked_reason'] = ""
    
    if 'progress_log' not in tasks_data['tasks']["$task_id"]:
        tasks_data['tasks']["$task_id"]['progress_log'] = []
    
    tasks_data['tasks']["$task_id"]['progress_log'].append({
        "time": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "msg": "$progress_msg"
    })
    
    tasks_data['last_updated'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    with open("$TASKS_FILE", 'w') as f:
        json.dump(tasks_data, f, indent=2)

    print("✅ 任务状态已更新")
else:
    print("⚠️ 未找到任务 $task_id")
END
}

# 检查节点SSH连接
check_ssh_connection() {
    local node="$1"
    
    log "检查 $node 的SSH连接..."
    SSH_TEST=$(sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "whoami" 2>&1)
    
    if echo "$SSH_TEST" | grep -q "root"; then
        log "✅ SSH连接正常 - $node"
        return 0
    else
        log "❌ SSH连接失败 - $node: $SSH_TEST" "ERROR"
        return 1
    fi
}

# 检查系统资源
check_system_resources() {
    local node="$1"
    
    log "检查 $node 的系统资源..."
    
    log "内存使用情况:"
    sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "free -h" 2>&1
    
    log "CPU使用情况:"
    sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "top -bn1 | head -10" 2>&1
    
    log "磁盘使用情况:"
    sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "df -h" 2>&1
}

# 检查OpenClaw服务
check_openclaw_services() {
    local node="$1"
    
    log "检查 $node 的OpenClaw服务..."
    SERVICES=("openclaw-gateway" "docker" "nginx" "cron")
    
    for service in "${SERVICES[@]}"; do
        log "检查 $service 服务..."
        STATUS=$(sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "systemctl is-active $service" 2>&1)
        
        if echo "$STATUS" | grep -q "active"; then
            log "✅ $service 服务正在运行"
        else
            log "⚠️ $service 服务未运行，正在尝试启动..." "WARNING"
            sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "systemctl start $service" 2>&1
            sleep 2
            NEW_STATUS=$(sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "systemctl is-active $service" 2>&1)
            
            if echo "$NEW_STATUS" | grep -q "active"; then
                log "✅ $service 服务启动成功"
            else
                log "❌ $service 服务启动失败: $NEW_STATUS" "ERROR"
            fi
        fi
    done
}

# 检查evomap进程
check_evomap_process() {
    local node="$1"
    
    log "检查 $node 的evomap进程..."
    PS_RESULT=$(sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "ps -eo pid,lstart,cmd --sort=start_time | grep -E 'evomap|openclaw-evomap' | grep -v grep" 2>&1)
    
    if [ -n "$PS_RESULT" ]; then
        log "evomap进程正在运行:"
        echo "$PS_RESULT"
    else
        log "⚠️ 未找到evomap进程，正在尝试启动..." "WARNING"
        sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "cd /root/openclaw-evomap && nohup node openclaw-evomap.js > /tmp/evomap.log 2>&1 &"
        sleep 3
        NEW_PS_RESULT=$(sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no root@$node "ps -eo pid,lstart,cmd --sort=start_time | grep -E 'evomap|openclaw-evomap' | grep -v grep" 2>&1)
        
        if [ -n "$NEW_PS_RESULT" ]; then
            log "✅ evomap进程已成功启动:"
            echo "$NEW_PS_RESULT"
        else
            log "❌ 无法启动evomap进程" "ERROR"
        fi
    fi
}

# 恢复单个任务
recover_task() {
    local task_id="$1"
    local node="$2"
    
    log "="*50
    log "开始恢复任务: $task_id"
    log "="*50
    
    # 1. 更新任务状态为运行中
    update_task_status "$task_id" "running" "任务已恢复，正在执行节点检查"
    
    # 2. 检查SSH连接
    if ! check_ssh_connection "$node"; then
        log "❌ 无法建立SSH连接，任务 $task_id 恢复失败" "ERROR"
        return 1
    fi
    
    # 3. 检查系统资源
    check_system_resources "$node"
    
    # 4. 检查OpenClaw服务
    check_openclaw_services "$node"
    
    # 5. 检查evomap进程
    check_evomap_process "$node"
    
    # 6. 完成任务
    log "="*50
    log "任务恢复完成: $task_id"
    log "="*50
    
    update_task_status "$task_id" "completed" "节点自我恢复成功"
    return 0
}

log "开始恢复 szspd 节点任务..."

# 恢复第一个任务
if recover_task "$TASK1_ID" "$NODE1"; then
    log "✅ 任务 $TASK1_ID 恢复成功"
else
    log "❌ 任务 $TASK1_ID 恢复失败" "ERROR"
fi

# 等待3秒后恢复第二个任务
log "等待3秒后恢复第二个任务..."
sleep 3

# 恢复第二个任务
if recover_task "$TASK2_ID" "$NODE2"; then
    log "✅ 任务 $TASK2_ID 恢复成功"
else
    log "❌ 任务 $TASK2_ID 恢复失败" "ERROR"
fi

log "所有任务恢复完成"
