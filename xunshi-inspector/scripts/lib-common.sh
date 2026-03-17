#!/bin/bash
# 🤖 公共函数库
# 被其他脚本引用

# ===== 颜色定义 =====
export COLOR_GREEN='\033[0;32m'
export COLOR_YELLOW='\033[1;33m'
export COLOR_RED='\033[0;31m'
export COLOR_BLUE='\033[0;34m'
export COLOR_NC='\033[0m'

# ===== 基础工具函数 =====

# 打印彩色消息
# 参数: $1=颜色, $2=消息
print_color() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${COLOR_NC}"
}

# 打印成功消息
print_success() {
    print_color "$COLOR_GREEN" "$1"
}

# 打印警告消息
print_warning() {
    print_color "$COLOR_YELLOW" "$1"
}

# 打印错误消息
print_error() {
    print_color "$COLOR_RED" "$1"
}

# 打印信息消息
print_info() {
    print_color "$COLOR_BLUE" "$1"
}

# ===== 网络检查函数 =====

# 执行 SSH 命令（超时保护）
# 参数: $1=主机, $2=命令, $3=超时秒数(可选, 默认5)
# 返回: SSH 命令的退出码
ssh_exec() {
    local host="$1"
    local cmd="$2"
    local timeout="${3:-5}"
    
    timeout $timeout ssh -o ConnectTimeout=$timeout -o StrictHostKeyChecking=no root@$host "$cmd" 2>/dev/null
    return $?
}

# 检查 SSH 连通性（内部函数）
# 参数: $1=主机, $2=超时秒数(可选, 默认5)
# 返回: 0=连通, 1=不通
_ssh_check() {
    local host="$1"
    local timeout="${2:-5}"
    
    ssh_exec "$host" "hostname" $timeout >/dev/null 2>&1
    return $?
}

# 检查是否为本地主机
# 参数: $1=主机名/IP
# 返回: 0=是本地主机, 1=不是
_is_local_host() {
    [ "$1" = "$(hostname)" ]
}

# 检查SSH节点连通性
# 参数: $NODES (空格分隔的节点列表)
# 返回: 0=成功, 1=有节点离线
check_nodes() {
    local nodes="$1"
    local offline_count=0
    local offline_list=""
    
    for node in $nodes; do
        _is_local_host "$node" && continue
        _ssh_check "$node" || {
            offline_count=$((offline_count + 1))
            offline_list="$offline_list $node"
        }
    done
    
    if [ $offline_count -gt 0 ]; then
        echo "离线节点:$offline_list"
        return 1
    fi
    return 0
}

# 检查单个主机是否在线 (Ping)
# 参数: $1=主机名/IP, $2=超时秒数(默认3)
is_host_online() {
    local host="$1"
    local timeout="${2:-3}"
    
    _is_local_host "$host" && return 0
    timeout $timeout ping -c 1 "$host" > /dev/null 2>&1
}

# 执行带超时的命令（内部函数）
# 参数: $1=超时秒数, $2...=命令及参数
# 返回: 命令的退出码
_timeout_exec() {
    local timeout="$1"
    shift
    timeout $timeout "$@" 2>/dev/null
}

# 检查端口是否开放
# 参数: $1=主机, $2=端口, $3=超时秒数(默认5)
check_port() {
    local host="$1"
    local port="$2"
    local timeout="${3:-5}"
    
    _timeout_exec $timeout bash -c "echo >/dev/tcp/$host/$port"
}

# ===== 系统资源函数 =====

# 获取内存使用率 (百分比) - 内部函数
_get_mem_percent() {
    free | awk 'NR==2{printf "%.0f", $3*100/$2}'
}

# 获取磁盘使用率 (百分比) - 内部函数
_get_disk_percent() {
    df / | awk 'NR==2{gsub(/%/,""); print $5}'
}

# 获取系统负载 - 内部函数
_get_load() {
    uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'
}

# 获取系统资源状态
get_system_status() {
    local mem=$(_get_mem_percent)
    local disk=$(_get_disk_percent)
    local load=$(_get_load)
    
    echo "MEM:${mem}% DISK:${disk}% LOAD:$load"
}

# 获取内存使用率 (百分比)
get_memory_percent() {
    _get_mem_percent
}

# 获取磁盘使用率 (百分比)
get_disk_percent() {
    _get_disk_percent
}

# ===== 进程检查函数 =====

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

# 获取进程列表
# 参数: $1=进程名
get_process_list() {
    local proc_name="$1"
    ps aux | grep -i "$proc_name" | grep -v grep
}

# ===== 日志函数 =====

# 写入日志到文件（内部函数）
# 参数: $1=日志文件, $2=内容
_write_log() {
    local log_file="$1"
    local content="$2"
    echo "$content" >> "$log_file" 2>/dev/null || true
}

# 记录日志到文件
# 参数: $1=日志文件, $2=消息
log_message() {
    local log_file="$1"
    local message="$2"
    _write_log "$log_file" "[$(get_timestamp)] $message"
}

# 带级别的日志
# 参数: $1=日志文件, $2=级别(INFO|WARN|ERROR), $3=消息
log_with_level() {
    local log_file="$1"
    local level="$2"
    local message="$3"
    _write_log "$log_file" "[$(get_timestamp)] [$level] $message"
}

# ===== 文件系统函数 =====

# 创建目录（如果不存在）
# 参数: $1=目录路径
ensure_dir() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
    fi
}

# 获取文件大小 (人类可读)
# 参数: $1=文件路径
get_file_size() {
    local file="$1"
    if [ -f "$file" ]; then
        du -h "$file" | awk '{print $1}'
    else
        echo "N/A"
    fi
}

# ===== 工具函数 =====

# 等待一段时间
# 参数: $1=秒数
wait_seconds() {
    local seconds="${1:-1}"
    sleep "$seconds"
}

# 检查命令是否存在
# 参数: $1=命令名
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 获取当前时间戳
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 获取当前日期
get_date() {
    date '+%Y-%m-%d'
}
