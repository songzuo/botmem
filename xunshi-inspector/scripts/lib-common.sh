#!/bin/bash
# 🤖 公共函数库
# 被其他脚本引用

# 检查SSH节点连通性
# 参数: $NODES (空格分隔的节点列表)
# 返回: 0=成功, 1=有节点离线
check_nodes() {
    local nodes="$1"
    local offline_count=0
    local offline_list=""
    
    for node in $nodes; do
        if [ "$node" = "$(hostname)" ]; then
            continue
        fi
        if ! timeout 5 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$node "hostname" >/dev/null 2>&1; then
            offline_count=$((offline_count + 1))
            offline_list="$offline_list $node"
        fi
    done
    
    if [ $offline_count -gt 0 ]; then
        echo "离线节点:$offline_list"
        return 1
    fi
    return 0
}

# 获取系统资源状态
get_system_status() {
    local mem=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    local disk=$(df / | awk 'NR==2{gsub(/%/,""); print $5}')
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    echo "MEM:${mem}% DISK:${disk}% LOAD:$load"
}

# 检查进程数量
# 参数: $1=进程名, $2=最大允许数量
check_process_count() {
    local proc_name="$1"
    local max_count="$2"
    local count=$(ps aux | grep -i "$proc_name" | grep -v grep | wc -l)
    
    if [ "$count" -gt "$max_count" ]; then
        echo "警告: $proc_name 进程过多 ($count)"
        return 1
    fi
    return 0
}

# 记录日志到文件
# 参数: $1=日志文件, $2=消息
log_message() {
    local log_file="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] $message" >> "$log_file" 2>/dev/null || true
}

# 创建目录（如果不存在）
# 参数: $1=目录路径
ensure_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
    fi
}
