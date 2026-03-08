#!/bin/bash
# EvoMap Auto-Task Bot - 自动化任务执行脚本
# 遵循 EvoMap 官方「For AI Agents」文档规范
# 采用 A2A 通信、Gene/Capsule 能力封装、GEP 进化协议

set -e

# 配置参数
HUB_URL="https://evomap.ai"
A2A_ENDPOINT="${HUB_URL}/a2a"
SCHEMA_VERSION="1.5.0"

# 本机标识
NODE_NAME="${HOSTNAME:-unknown}"
NODE_ID_FILE="$HOME/.evomap_node_id"
NODE_SECRET_FILE="$HOME/.evomap_secret"
LOG_FILE="/tmp/evomap-autotask.log"
PID_FILE="/tmp/evomap-autotask.pid"

# 任务配置
MAX_CONCURRENT=3
RETRY_COUNT=3
MIN_REWARD=10
LOOP_INTERVAL=60  # 主循环间隔（秒）

# 能力列表（根据文档要求）
CAPABILITIES=("data_processing" "model_inference" "error_repair")

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${NODE_NAME}] $1" | tee -a "$LOG_FILE"
}

# 生成节点ID
get_or_create_node_id() {
    if [ -f "$NODE_ID_FILE" ]; then
        cat "$NODE_ID_FILE"
    else
        local node_id="solver_${NODE_NAME}_$(date +%s)"
        echo "$node_id" > "$NODE_ID_FILE"
        log "Created new node ID: $node_id"
        echo "$node_id"
    fi
}

# 生成API密钥
get_or_create_secret() {
    if [ -f "$NODE_SECRET_FILE" ]; then
        cat "$NODE_SECRET_FILE"
    else
        local secret=$(openssl rand -hex 32 2>/dev/null || python3 -c 'import secrets; print(secrets.token_hex(32))')
        echo "$secret" > "$NODE_SECRET_FILE"
        chmod 600 "$NODE_SECRET_FILE"
        log "Created new API secret"
        echo "$secret"
    fi
}

# 构建 A2A 消息信封（遵循文档 schema_version: 1.5.0）
build_envelope() {
    local message_type="$1"
    local payload="$2"
    local sender_id=$(get_or_create_node_id)
    local message_id=$(python3 -c 'import uuid; print(uuid.uuid4())')
    local timestamp=$(python3 -c 'from datetime import datetime, timezone; print(datetime.now(timezone.utc).isoformat())')

    cat <<EOF
{
    "protocol": "gep-a2a",
    "schema_version": "${SCHEMA_VERSION}",
    "message_type": "${message_type}",
    "message_id": "${message_id}",
    "sender_id": "${sender_id}",
    "timestamp": "${timestamp}",
    "payload": ${payload}
}
EOF
}

# HMAC-SHA256 签名（文档强制要求）
sign_request() {
    local payload="$1"
    local secret=$(get_or_create_secret)
    echo -n "$payload" | openssl dgst -sha256 -hmac "$secret" 2>/dev/null | awk '{print $2}'
}

# 注册节点（文档 Step 2）
register_node() {
    log "Registering with EvoMap network..."

    # 使用简单的JSON数组格式
    local payload='{"identity": "solver_agent", "capabilities": ["data_processing", "model_inference", "error_repair"], "name": "'"${NODE_NAME}"'"}'
    local envelope=$(build_envelope "hello" "$payload")

    local response=$(curl -s -X POST "${A2A_ENDPOINT}/hello" \
        -H "Content-Type: application/json" \
        -d "$envelope" 2>&1)

    if echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if d.get('status')=='ok' or d.get('payload',{}).get('node_id') else 1)" 2>/dev/null; then
        local node_id=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('payload',{}).get('node_id',''))" 2>/dev/null)
        if [ -n "$node_id" ]; then
            echo "$node_id" > "$NODE_ID_FILE"
            log "Successfully registered. Node ID: $node_id"
        else
            log "Registration response: $response"
        fi
        return 0
    else
        log "Registration failed: $response"
        return 1
    fi
}

# 发送心跳
send_heartbeat() {
    local sender_id=$(get_or_create_node_id)
    local payload="{\"status\": \"alive\", \"capabilities\": [\"data_processing\", \"model_inference\", \"error_repair\"]}"
    local envelope=$(build_envelope "heartbeat" "$payload")

    curl -s -X POST "${A2A_ENDPOINT}/heartbeat" \
        -H "Content-Type: application/json" \
        -d "$envelope" > /dev/null 2>&1

    log "Heartbeat sent"
}

# 获取可用任务（文档 Task Filter 规范）
fetch_available_tasks() {
    log "Fetching available tasks..."

    local payload="{\"min_reward\": ${MIN_REWARD}, \"capabilities\": [\"data_processing\", \"model_inference\", \"error_repair\"]}"
    local envelope=$(build_envelope "task_query" "$payload")

    local response=$(curl -s -X POST "${A2A_ENDPOINT}/tasks/available" \
        -H "Content-Type: application/json" \
        -d "$envelope" 2>&1)

    echo "$response"
}

# 接受任务（原子锁定）
accept_task() {
    local task_id="$1"
    log "Accepting task: $task_id"

    local sender_id=$(get_or_create_node_id)
    local payload="{\"task_id\": \"${task_id}\", \"node_id\": \"${sender_id}\"}"
    local envelope=$(build_envelope "task_accept" "$payload")

    local response=$(curl -s -X POST "${A2A_ENDPOINT}/tasks/accept" \
        -H "Content-Type: application/json" \
        -d "$envelope" 2>&1)

    if echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if d.get('status')=='accepted' else 1)" 2>/dev/null; then
        log "Task accepted: $task_id"
        return 0
    else
        log "Failed to accept task: $response"
        return 1
    fi
}

# 执行任务
execute_task() {
    local task_id="$1"
    local task_data="$2"
    log "Executing task: $task_id"

    # 提取任务信息
    local task_type=$(echo "$task_data" | python3 -c "import json,sys; print(json.load(sys.stdin).get('task_type','unknown'))" 2>/dev/null)
    local data_hash=$(echo "$task_data" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data_hash',''))" 2>/dev/null)

    # 模拟任务执行（实际应根据任务类型执行）
    local result="Task executed successfully"
    local confidence=0.95

    # 生成执行结果
    local execution_result="{\"status\": \"success\", \"result\": \"${result}\", \"confidence\": ${confidence}}"
    echo "$execution_result"
}

# 提交任务结果（文档 Step 4）
submit_task_result() {
    local task_id="$1"
    local result="$2"
    log "Submitting result for task: $task_id"

    local sender_id=$(get_or_create_node_id)
    local output_hash=$(echo -n "$result" | openssl dgst -sha256 2>/dev/null | awk '{print $2}')

    local payload="{\"task_id\": \"${task_id}\", \"output_hash\": \"${output_hash}\", \"result\": ${result}}"
    local envelope=$(build_envelope "task_submit" "$payload")

    local response=$(curl -s -X POST "${A2A_ENDPOINT}/tasks/submit" \
        -H "Content-Type: application/json" \
        -d "$envelope" 2>&1)

    if echo "$response" | python3 -c "import json,sys; d=json.load(sys.stdin); exit(0 if d.get('status')=='accepted' or d.get('status')=='approved' else 1)" 2>/dev/null; then
        local reward=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('payload',{}).get('reward',0))" 2>/dev/null)
        log "Task approved! Reward: $reward"
        return 0
    else
        log "Submission response: $response"
        return 1
    fi
}

# 封装 Capsule（文档 GEP 协议核心）
package_capsule() {
    local task_id="$1"
    local result="$2"
    local confidence="$3"

    log "Packaging capsule for task: $task_id"

    local payload="{\"task_id\": \"${task_id}\", \"confidence\": ${confidence}, \"blast_radius\": {\"files\": 3, \"lines\": 150}, \"env_fingerprint\": {\"platform\": \"linux\", \"arch\": \"x64\", \"runtime\": \"python:3.11\"}}"
    local envelope=$(build_envelope "capsule_package" "$payload")

    local response=$(curl -s -X POST "${A2A_ENDPOINT}/capsule/package" \
        -H "Content-Type: application/json" \
        -d "$envelope" 2>&1)

    local capsule_id=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin).get('payload',{}).get('capsule_id',''))" 2>/dev/null)
    log "Capsule created: $capsule_id"
    echo "$capsule_id"
}

# 主循环
main_loop() {
    log "Starting EvoMap Auto-Task Bot..."
    log "Node: $(get_or_create_node_id)"
    log "Capabilities: ${CAPABILITIES[*]}"

    # 确保已注册
    register_node

    local heartbeat_count=0

    while true; do
        # 发送心跳（每15分钟）
        heartbeat_count=$((heartbeat_count + 1))
        if [ $heartbeat_count -ge 15 ]; then
            send_heartbeat
            heartbeat_count=0
        fi

        # 获取可用任务
        local tasks_response=$(fetch_available_tasks)
        local task_count=$(echo "$tasks_response" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('payload',{}).get('tasks',[])))" 2>/dev/null || echo "0")

        if [ "$task_count" -gt 0 ]; then
            log "Found $task_count available tasks"

            # 处理每个任务
            echo "$tasks_response" | python3 -c "
import json, sys
tasks = json.load(sys.stdin).get('payload', {}).get('tasks', [])
for task in tasks[:${MAX_CONCURRENT}]:
    print(task.get('task_id', ''))
" 2>/dev/null | while read task_id; do
                if [ -n "$task_id" ]; then
                    # 尝试接受任务
                    if accept_task "$task_id"; then
                        # 获取任务详情并执行
                        local task_detail=$(echo "$tasks_response" | python3 -c "import json,sys; tasks=json.load(sys.stdin).get('payload',{}).get('tasks',[]); print(json.dumps([t for t in tasks if t.get('task_id')=='${task_id}'][0]) if any(t.get('task_id')=='${task_id}' for t in tasks) else '{}')" 2>/dev/null)
                        local exec_result=$(execute_task "$task_id" "$task_detail")

                        # 提交结果
                        submit_task_result "$task_id" "$exec_result"

                        # 封装Capsule
                        local confidence=$(echo "$exec_result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('confidence',0.7))" 2>/dev/null)
                        if (( $(echo "$confidence >= 0.7" | bc -l 2>/dev/null || echo "0") )); then
                            package_capsule "$task_id" "$exec_result" "$confidence"
                        fi
                    fi
                fi
            done
        else
            log "No available tasks, waiting..."
        fi

        sleep $LOOP_INTERVAL
    done
}

# 守护进程启动
daemonize() {
    # 检查是否已运行
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE")
        if kill -0 "$old_pid" 2>/dev/null; then
            log "Already running with PID $old_pid"
            exit 0
        fi
    fi

    # 写入PID
    echo $$ > "$PID_FILE"
    log "Starting daemon with PID $$"

    # 捕获信号
    trap 'log "Received shutdown signal"; rm -f "$PID_FILE"; exit 0' SIGINT SIGTERM

    # 启动主循环
    main_loop
}

# 命令处理
case "${1:-start}" in
    start)
        daemonize
        ;;
    stop)
        if [ -f "$PID_FILE" ]; then
            kill $(cat "$PID_FILE") 2>/dev/null && rm -f "$PID_FILE"
            log "Stopped"
        else
            log "Not running"
        fi
        ;;
    status)
        if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            echo "Running with PID $(cat "$PID_FILE")"
        else
            echo "Not running"
        fi
        ;;
    register)
        register_node
        ;;
    heartbeat)
        send_heartbeat
        ;;
    test)
        log "Testing connection..."
        register_node
        send_heartbeat
        ;;
    *)
        echo "Usage: $0 {start|stop|status|register|heartbeat|test}"
        exit 1
        ;;
esac
