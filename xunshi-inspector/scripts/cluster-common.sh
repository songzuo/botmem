#!/bin/bash
# 🤖 公共函数库 - 集群脚本共享
# 所有集群脚本应该 source 此文件

# ===== 配置 =====
export CLUSTER_NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn 182.43.36.134 bot6.szspd.cn"
export CLUSTER_CHANNEL="picoclaw-cluster-2026"
export CLUSTER_LOG_DIR="$HOME/workspace-logs"

# ===== 颜色定义 =====
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export RED='\033[0;31m'
export BLUE='\033[0;34m'
export NC='\033[0m'

# ===== 基础函数 =====

# 获取主机名
get_hostname() {
    echo "$(hostname)"
}

# 获取时间戳
get_timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# ===== 系统资源函数 =====

# 获取内存使用百分比
get_memory_usage() {
    free | awk 'NR==2{printf "%.0f", $3*100/$2}'
}

# 获取磁盘使用百分比
get_disk_usage() {
    df / | awk 'NR==2{gsub(/%/,""); print $5}'
}

# 获取系统负载 (1分钟)
get_load() {
    uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'
}

# 获取运行时间
get_uptime() {
    uptime -p
}

# 获取完整的系统状态
get_system_status() {
    echo "内存: $(get_memory_usage)%"
    echo "磁盘: $(get_disk_usage)%"
    echo "负载: $(get_load)"
    echo "运行: $(get_uptime)"
}

# ===== 网络检查函数 =====

# 检查单个节点SSH连通性
# 参数: $1 = 节点名, $2 = 超时秒数(默认5)
check_node_ssh() {
    local node="$1"
    local timeout="${2:-5}"
    
    if [ "$node" = "$(hostname)" ]; then
        echo "self"
        return 0
    fi
    
    if timeout $timeout ssh -o ConnectTimeout=$timeout -o StrictHostKeyChecking=no root@$node "hostname" >/dev/null 2>&1; then
        echo "online"
        return 0
    else
        echo "offline"
        return 1
    fi
}

# 检查单个节点Ping连通性
# 参数: $1 = 节点名, $2 = 超时秒数(默认2)
check_node_ping() {
    local node="$1"
    local timeout="${2:-2}"
    
    if [ "$node" = "$(hostname)" ]; then
        echo "self"
        return 0
    fi
    
    if timeout $timeout ping -c 1 "$node" > /dev/null 2>&1; then
        echo "online"
        return 0
    else
        echo "offline"
        return 1
    fi
}

# 检查所有节点状态
check_all_nodes() {
    local hostname=$(hostname)
    
    for node in $CLUSTER_NODES; do
        if [ "$node" = "$hostname" ]; then
            echo -e "${GREEN}✓${NC} $node (本机)"
        else
            if check_node_ping "$node" 2 > /dev/null; then
                echo -e "${GREEN}✓${NC} $node - online"
            else
                echo -e "${RED}✗${NC} $node - offline"
            fi
        fi
    done
}

# 检查HTTP端点
# 参数: $1 = URL, $2 = 超时秒数(默认5)
check_http_endpoint() {
    local url="$1"
    local timeout="${2:-5}"
    
    if timeout $timeout curl -s "$url" >/dev/null 2>&1; then
        echo "ok"
        return 0
    else
        echo "fail"
        return 1
    fi
}

# ===== 进程检查函数 =====

# 检查进程数量
# 参数: $1 = 进程名
get_process_count() {
    ps aux | grep -i "$1" | grep -v grep | wc -l
}

# 检查多个进程
check_processes() {
    for proc in "$@"; do
        count=$(get_process_count "$proc")
        echo "  $proc: $count 进程"
    done
}

# ===== 日志函数 =====

# 确保日志目录存在
ensure_log_dir() {
    mkdir -p "$CLUSTER_LOG_DIR"
}

# 写入日志
# 参数: $1 = 日志文件名, $2 = 内容
log_write() {
    local logfile="$CLUSTER_LOG_DIR/$1"
    local content="$2"
    ensure_log_dir
    echo "[$(get_timestamp)] $content" >> "$logfile"
}

# ===== 初始化 =====
# 如果脚本直接运行，显示帮助
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "集群公共函数库"
    echo ""
    echo "在脚本中引用: source /path/to/cluster-common.sh"
    echo ""
    echo "可用变量:"
    echo "  CLUSTER_NODES    - 节点列表"
    echo "  CLUSTER_CHANNEL  - 频道名"
    echo "  CLUSTER_LOG_DIR  - 日志目录"
    echo ""
    echo "可用函数:"
    echo "  get_hostname()       - 获取主机名"
    echo "  get_timestamp()      - 获取时间戳"
    echo "  get_memory_usage()   - 获取内存使用%"
    echo "  get_disk_usage()     - 获取磁盘使用%"
    echo "  get_load()           - 获取系统负载"
    echo "  get_system_status()  - 获取完整状态"
    echo "  check_node_ssh()     - 检查SSH连通性"
    echo "  check_node_ping()    - 检查Ping连通性"
    echo "  check_all_nodes()    - 检查所有节点"
    echo "  check_http_endpoint()- 检查HTTP端点"
    echo "  get_process_count()  - 获取进程数"
    echo "  log_write()          - 写入日志"
fi
