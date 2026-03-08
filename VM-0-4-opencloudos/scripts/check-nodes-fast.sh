#!/bin/bash
# 快速节点检查脚本

EXECUTOR_DIR="/workspace/projects/workspace"
LOG_DIR="$EXECUTOR_DIR/memory/executor-logs"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 日志函数
log() {
    local message="$1"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $message" >> "$LOG_DIR/check-nodes.log"
    echo "[$timestamp] $message"
}

# 读取节点信息
read_node_info() {
    if [ ! -f "$EXECUTOR_DIR/memory/tasks.json" ]; then
        log "任务文件不存在，无法获取节点信息"
        return
    fi
    
    python3 - <<END
import json
with open('$EXECUTOR_DIR/memory/tasks.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
    if 'nodes' in data:
        nodes = data['nodes']
        
        for name, info in nodes.items():
            print(f"{name}|{info['hostname']}|{info.get('username', 'root')}|{info.get('password', '')}|{info.get('role', 'worker')}")
END
}

# 检查单个节点连通性
check_node_connectivity() {
    local node_info="$1"
    IFS='|' read -r name hostname username password role <<< "$node_info"
    
    log "开始检查节点: $name ($hostname)"
    
    # 使用简单的ping检查
    if timeout 5 ping -c 1 "$hostname" &> /dev/null; then
        log "✅ 节点 $name 连通性正常"
        
        # 检查SSH端口是否打开
        if timeout 5 bash -c "</dev/tcp/$hostname/22" 2>/dev/null; then
            log "✅ 节点 $name SSH端口(22)已打开"
            
            # 记录成功状态
            echo "$name|success|$(date +%s)" >> "$LOG_DIR/node-status.log"
        else
            log "⚠️  节点 $name SSH端口(22)未打开"
            echo "$name|ssh_port_closed|$(date +%s)" >> "$LOG_DIR/node-status.log"
        fi
    else
        log "❌ 节点 $name 无法ping通"
        echo "$name|unreachable|$(date +%s)" >> "$LOG_DIR/node-status.log"
    fi
    
    log "---"
}

# 检查所有节点
check_all_nodes() {
    log "====== 开始节点连通性检查 ======"
    
    # 初始化节点状态文件
    echo "# Node connectivity status (node|status|timestamp)" > "$LOG_DIR/node-status.log"
    
    # 获取并检查每个节点
    node_count=0
    while IFS= read -r node_info; do
        if [ -n "$node_info" ]; then
            node_count=$((node_count + 1))
            check_node_connectivity "$node_info"
        fi
    done < <(read_node_info)
    
    log "====== 节点连通性检查完成 ======"
    log "检查的节点总数: $node_count"
}

# 统计节点状态
count_node_status() {
    log "节点状态统计:"
    
    if [ ! -f "$LOG_DIR/node-status.log" ]; then
        log "未找到节点状态文件"
        return
    fi
    
    total_nodes=$(grep -v '^#' "$LOG_DIR/node-status.log" | grep -v '^$' | wc -l)
    success_nodes=$(grep -v '^#' "$LOG_DIR/node-status.log" | grep -v '^$' | grep -c 'success')
    ssh_closed_nodes=$(grep -v '^#' "$LOG_DIR/node-status.log" | grep -v '^$' | grep -c 'ssh_port_closed')
    unreachable_nodes=$(grep -v '^#' "$LOG_DIR/node-status.log" | grep -v '^$' | grep -c 'unreachable')
    
    log "总节点数: $total_nodes"
    log "连通正常: $success_nodes"
    log "SSH未打开: $ssh_closed_nodes"
    log "无法连通: $unreachable_nodes"
}

# 显示节点状态概览
show_node_overview() {
    log "节点状态概览:"
    if [ -f "$LOG_DIR/node-status.log" ]; then
        while IFS= read -r line; do
            if [[ ! "$line" =~ ^# && -n "$line" ]]; then
                IFS='|' read -r name status timestamp <<< "$line"
                log "  $name: $status"
            fi
        done < "$LOG_DIR/node-status.log"
    fi
}

# 主函数
main() {
    check_all_nodes
    count_node_status
    show_node_overview
}

# 处理信号
trap 'log "节点检查脚本被中断"; exit 1' INT TERM

main "$@"