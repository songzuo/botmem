#!/bin/bash
# Claw-Mesh 同步脚本 - 带断点续传和故障恢复
# 版本: 2.0
# 功能: 同步记忆、断点续传、故障恢复、跨机器协作

set -e

# ==================== 配置 ====================
GIT_TOKEN="YOUR_GITHUB_TOKEN_HERE"
REPO="https://${GIT_TOKEN}@github.com/songzuo/botmem.git"
WORK_DIR="/tmp/botmem-upload"
BOT4_DIR="/root/.openclaw/workspace"
MACHINE_NAME="bot4"
LOG_FILE="/var/log/claw-mesh.log"
STATE_FILE="$BOT4_DIR/memory/claw-mesh-state.json"
LOCK_FILE="/tmp/claw-mesh.lock"
MAX_RETRIES=3
TIMEOUT=300

# ==================== 初始化 ====================
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$WORK_DIR"

# ==================== 日志函数 ====================
log() {
    local level=$1
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] [$MACHINE_NAME] $*" | tee -a "$LOG_FILE"
}

# ==================== 状态管理 ====================
load_state() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo '{"step":0,"status":"idle","lastUpdate":0,"errorCount":0}'
    fi
}

save_state() {
    local step=$1
    local status=$2
    local current_time=$(date +%s)
    
    cat > "$STATE_FILE" << EOF
{
  "machine": "$MACHINE_NAME",
  "step": $step,
  "status": "$status",
  "lastUpdate": $current_time,
  "errorCount": $(cat "$STATE_FILE" 2>/dev/null | grep -o '"errorCount": [0-9]*' | cut -d' ' -f2 || echo "0"),
  "lastSync": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF
}

# ==================== 锁管理 ====================
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log "WARN" "另一个同步进程正在运行 (PID: $lock_pid)"
            return 1
        else
            log "WARN" "清理过期锁文件"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    echo $$ > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT
    return 0
}

# ==================== 故障恢复 ====================
recover_from_failure() {
    log "WARN" "启动故障恢复..."
    
    # 1. 清理临时文件
    rm -rf "$WORK_DIR/botmem/.git/locks" 2>/dev/null || true
    
    # 2. 检查 Git 状态
    if [ -d "$WORK_DIR/botmem/.git" ]; then
        cd "$WORK_DIR/botmem"
        git reset --hard HEAD 2>/dev/null || true
        git clean -fd 2>/dev/null || true
    fi
    
    # 3. 如果 Git 损坏，重新克隆
    if [ ! -d "$WORK_DIR/botmem/.git" ] || ! git -C "$WORK_DIR/botmem" status &>/dev/null; then
        log "INFO" "重新克隆仓库..."
        rm -rf "$WORK_DIR/botmem"
        git clone "$REPO" "$WORK_DIR/botmem" || {
            log "ERROR" "克隆失败"
            return 1
        }
    fi
    
    log "INFO" "故障恢复完成"
    return 0
}

# ==================== 带重试的操作 ====================
retry_operation() {
    local operation=$1
    local description=$2
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        log "INFO" "执行: $description (尝试 $((retries + 1))/$MAX_RETRIES)"
        
        if eval "$operation"; then
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log "WARN" "操作失败，等待 10 秒后重试..."
            sleep 10
        fi
    done
    
    log "ERROR" "操作失败，已达最大重试次数: $description"
    return 1
}

# ==================== 主同步函数 ====================
sync_to_github() {
    local state=$(load_state)
    local current_step=$(echo "$state" | grep -o '"step": [0-9]*' | cut -d' ' -f2)
    [ -z "$current_step" ] && current_step=0
    
    log "INFO" "开始同步，当前步骤: $current_step"
    
    cd "$WORK_DIR/botmem"
    
    # 步骤 1: 拉取最新变化
    if [ $current_step -le 1 ]; then
        save_state 1 "pulling"
        retry_operation "git fetch origin && git pull origin main --rebase" "拉取最新变化" || {
            recover_from_failure
            return 1
        }
    fi
    
    # 步骤 2: 准备文件
    if [ $current_step -le 2 ]; then
        save_state 2 "preparing"
        mkdir -p "$MACHINE_NAME"
        
        # 复制并清理敏感信息
        [ -f "$BOT4_DIR/MEMORY.md" ] && cp "$BOT4_DIR/MEMORY.md" "$MACHINE_NAME/"
        [ -d "$BOT4_DIR/memory" ] && cp -r "$BOT4_DIR/memory" "$MACHINE_NAME/"
        [ -f "$BOT4_DIR/PLAZA.md" ] && cp "$BOT4_DIR/PLAZA.md" "$MACHINE_NAME/"
        
        # 清理敏感信息
        find "$MACHINE_NAME" -type f \( -name "*.md" -o -name "*.json" \) -exec sed -i \
            -e 's/ghp_[A-Za-z0-9]*/[已移除]/g' \
            -e 's/sk_[A-Za-z0-9]*/[已移除]/g' \
            -e 's/ge2099334\$ZZ/[已移除]/g' \
            {} \; 2>/dev/null || true
    fi
    
    # 步骤 3: 提交
    if [ $current_step -le 3 ]; then
        save_state 3 "committing"
        git add -A
        
        if git diff --staged --quiet; then
            log "INFO" "没有变化，跳过提交"
        else
            retry_operation "git commit -m '$MACHINE_NAME: Claw-Mesh 同步 $(date '+%Y-%m-%d %H:%M')'" "提交变化" || return 1
        fi
    fi
    
    # 步骤 4: 推送
    if [ $current_step -le 4 ]; then
        save_state 4 "pushing"
        retry_operation "git push origin main" "推送到 GitHub" || return 1
    fi
    
    # 步骤 5: 完成
    save_state 5 "completed"
    log "INFO" "✅ 同步完成"
    
    # 重置状态，准备下次同步
    save_state 0 "idle"
    
    return 0
}

# ==================== 读取其他机器动态 ====================
read_other_machines() {
    log "INFO" "读取其他机器动态..."
    
    cd "$WORK_DIR/botmem"
    
    for dir in */; do
        if [ "$dir" != "$MACHINE_NAME/" ] && [ -f "${dir}PLAZA.md" ]; then
            local machine=$(basename "$dir")
            log "INFO" "  - 读取 $machine 的广场"
        fi
    done
}

# ==================== 更新心跳 ====================
update_heartbeat() {
    log "INFO" "更新心跳..."
    
    cd "$WORK_DIR/botmem"
    
    # 更新 PLAZA.md 中的时间戳
    if [ -f "$MACHINE_NAME/PLAZA.md" ]; then
        sed -i "s/最后更新:.*/最后更新: $(date '+%Y-%m-%d %H:%M:%S')/" "$MACHINE_NAME/PLAZA.md" 2>/dev/null || true
    fi
}

# ==================== 主函数 ====================
main() {
    log "INFO" "🚀 Claw-Mesh 同步启动"
    
    # 获取锁
    if ! acquire_lock; then
        log "WARN" "无法获取锁，退出"
        exit 1
    fi
    
    # 故障恢复检查
    if [ -f "$STATE_FILE" ]; then
        local state=$(cat "$STATE_FILE")
        local status=$(echo "$state" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
        local last_update=$(echo "$state" | grep -o '"lastUpdate": [0-9]*' | cut -d' ' -f2)
        local now=$(date +%s)
        
        # 如果上次同步超过 1 小时且状态不是 idle，触发恢复
        if [ "$status" != "idle" ] && [ $((now - last_update)) -gt 3600 ]; then
            log "WARN" "检测到未完成的同步，触发恢复"
            recover_from_failure
        fi
    fi
    
    # 确保工作目录存在
    if [ ! -d "$WORK_DIR/botmem/.git" ]; then
        recover_from_failure || exit 1
    fi
    
    # 执行同步
    if sync_to_github; then
        read_other_machines
        update_heartbeat
        log "INFO" "🎉 Claw-Mesh 同步成功"
    else
        log "ERROR" "❌ Claw-Mesh 同步失败"
        exit 1
    fi
}

# ==================== 执行 ====================
main "$@"