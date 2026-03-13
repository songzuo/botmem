#!/bin/bash
# Claw-Mesh 进程监控与自动重启脚本
# 功能: 监控关键进程，自动重启，记录日志

# ==================== 配置 ====================
LOG_FILE="/var/log/claw-mesh-watchdog.log"
MACHINE_NAME="bot4"
STATE_FILE="/root/.openclaw/workspace/memory/claw-mesh-state.json"

# 关键进程列表 (进程名:检查命令:启动命令)
PROCESSES=(
    "openclaw-gateway:pgrep -f 'openclaw.*gateway':'openclaw gateway start'"
    "claw-mesh-sync:pgrep -f 'claw-mesh-sync':'echo \"Manual trigger required\"'"
)

# ==================== 日志函数 ====================
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$MACHINE_NAME] [WATCHDOG] $1" | tee -a "$LOG_FILE"
}

# ==================== 检查进程 ====================
check_process() {
    local name=$1
    local check_cmd=$2
    local start_cmd=$3
    
    if eval "$check_cmd" > /dev/null 2>&1; then
        return 0  # 进程存活
    else
        return 1  # 进程死亡
    fi
}

# ==================== 重启进程 ====================
restart_process() {
    local name=$1
    local start_cmd=$2
    local retries=0
    local max_retries=3
    
    while [ $retries -lt $max_retries ]; do
        log "尝试重启 $name (第 $((retries + 1)) 次)..."
        
        if eval "$start_cmd" > /dev/null 2>&1; then
            sleep 5
            if check_process "$name" "$check_cmd" "$start_cmd"; then
                log "✅ $name 重启成功"
                return 0
            fi
        fi
        
        retries=$((retries + 1))
        sleep 10
    done
    
    log "❌ $name 重启失败，已达最大重试次数"
    return 1
}

# ==================== 更新状态 ====================
update_status() {
    local status=$1
    
    if [ -f "$STATE_FILE" ]; then
        local current_time=$(date +%s)
        # 使用 Python 或 jq 更新 JSON（这里用简单的方式）
        sed -i "s/\"status\": \"[^\"]*\"/\"status\": \"$status\"/" "$STATE_FILE" 2>/dev/null || true
    fi
}

# ==================== 主函数 ====================
main() {
    log "🔍 开始进程检查..."
    
    local all_healthy=true
    
    for proc in "${PROCESSES[@]}"; do
        IFS=':' read -r name check_cmd start_cmd <<< "$proc"
        
        if check_process "$name" "$check_cmd" "$start_cmd"; then
            log "✅ $name 运行正常"
        else
            log "⚠️ $name 已停止"
            
            if restart_process "$name" "$start_cmd"; then
                log "✅ $name 恢复成功"
            else
                log "❌ $name 恢复失败"
                all_healthy=false
            fi
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        update_status "healthy"
        log "✅ 所有进程运行正常"
    else
        update_status "degraded"
        log "⚠️ 部分进程异常"
    fi
}

# ==================== 执行 ====================
main "$@"