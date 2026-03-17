#!/bin/bash
# Health Monitor - System Health Check Script v1.1 (Fixed)

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/../logs"
DATA_DIR="${SCRIPT_DIR}/../data"

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 创建目录
mkdir -p "$LOG_DIR" "$DATA_DIR"

# 解析参数
VERBOSE=false
QUIET=false
REPORT=false
WATCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose) VERBOSE=true; shift ;;
        -q|--quiet) QUIET=true; shift ;;
        -r|--report) REPORT=true; shift ;;
        -w|--watch) WATCH=true; shift ;;
        *) shift ;;
    esac
done

# 获取系统信息
get_cpu_usage() {
    top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{printf "%.0f", 100 - $1}'
}

get_memory_usage() {
    free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}'
}

get_disk_usage() {
    df / | tail -1 | awk '{print $5}' | sed 's/%//'
}

get_load_per_core() {
    cores=$(nproc)
    load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    awk "BEGIN {printf \"%.2f\", $load/$cores}"
}

# 评估状态 - 使用 awk 处理小数
evaluate_status() {
    local value=$1 warning=$2 critical=$3
    
    result=$(awk -v v="$value" -v w="$warning" -v c="$critical" 'BEGIN {
        if (v >= c) { print "critical"; exit 2 }
        else if (v >= w) { print "warning"; exit 1 }
        else { print "ok"; exit 0 }
    }')
    echo "$result"
}

# 打印进度条
print_bar() {
    local value=$1
    local chars=20
    local filled=$((value * chars / 100))
    local empty=$((chars - filled))
    printf "["
    printf '%*s' "$filled" '' | tr ' ' '█'
    printf '%*s' "$empty" '' | tr ' ' '░'
    printf "] %3d%%" "$value"
}

# 运行健康检查
run_health_check() {
    local score=100
    local issues=0
    
    # 获取指标
    cpu=$(get_cpu_usage)
    mem=$(get_memory_usage)
    disk=$(get_disk_usage)
    load=$(get_load_per_core)
    
    [ "$QUIET" = true ] && return
    
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║              🔍 System Health Report                      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo "⏰ 检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 资源使用"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # CPU
    cpu_status=$(evaluate_status "$cpu" 70 90)
    echo -n "CPU:     "
    print_bar "$cpu"
    if [ "$cpu_status" = "critical" ]; then echo -e "  ${RED}🔴 危险${NC}"; score=$((score - 15)); issues=$((issues + 1))
    elif [ "$cpu_status" = "warning" ]; then echo -e "  ${YELLOW}⚠️ 警告${NC}"; score=$((score - 10)); issues=$((issues + 1))
    else echo -e "  ${GREEN}✅ 正常${NC}"; fi
    
    # Memory
    mem_status=$(evaluate_status "$mem" 80 95)
    echo -n "内存:    "
    print_bar "$mem"
    if [ "$mem_status" = "critical" ]; then echo -e "  ${RED}🔴 危险${NC}"; score=$((score - 20)); issues=$((issues + 1))
    elif [ "$mem_status" = "warning" ]; then echo -e "  ${YELLOW}⚠️ 警告${NC}"; score=$((score - 15)); issues=$((issues + 1))
    else echo -e "  ${GREEN}✅ 正常${NC}"; fi
    
    # Disk
    disk_status=$(evaluate_status "$disk" 85 95)
    echo -n "磁盘:    "
    print_bar "$disk"
    if [ "$disk_status" = "critical" ]; then echo -e "  ${RED}🔴 危险${NC}"; score=$((score - 25)); issues=$((issues + 1))
    elif [ "$disk_status" = "warning" ]; then echo -e "  ${YELLOW}⚠️ 警告${NC}"; score=$((score - 15)); issues=$((issues + 1))
    else echo -e "  ${GREEN}✅ 正常${NC}"; fi
    
    # Load
    load_int=$(echo "$load" | cut -d. -f1)
    [ -z "$load_int" ] && load_int=0
    if [ "$load_int" -gt 2 ]; then
        echo -e "负载:    $load (per core)  ${RED}🔴 危险${NC}"
        score=$((score - 20)); issues=$((issues + 1))
    elif [ "$load_int" -gt 1 ]; then
        echo -e "负载:    $load (per core)  ${YELLOW}⚠️ 警告${NC}"
        score=$((score - 10)); issues=$((issues + 1))
    else
        echo -e "负载:    $load (per core)  ${GREEN}✅ 正常${NC}"
    fi
    echo ""
    
    # 服务状态
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔌 服务状态"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if pgrep -x docker >/dev/null 2>&1; then echo -e "Docker:   ${GREEN}✅ 运行中${NC}"
    else echo -e "Docker:   ${RED}❌ 未运行${NC}"; score=$((score - 15)); issues=$((issues + 1)); fi
    
    if pgrep nginx >/dev/null 2>&1; then echo -e "Nginx:    ${GREEN}✅ 运行中${NC}"
    else echo -e "Nginx:    ${YELLOW}⚠️ 未运行${NC}"; fi
    
    if pgrep -f openclaw >/dev/null 2>&1; then echo -e "OpenClaw: ${GREEN}✅ 运行中${NC}"
    else echo -e "OpenClaw: ${RED}❌ 未运行${NC}"; score=$((score - 15)); issues=$((issues + 1)); fi
    echo ""
    
    # 网络状态
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 网络状态"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    established=$(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l || echo "0")
    time_wait=$(netstat -an 2>/dev/null | grep TIME_WAIT | wc -l || echo "0")
    listening=$(netstat -tlnp 2>/dev/null | grep LISTEN | wc -l || echo "0")
    echo "ESTABLISHED: $established"
    echo "TIME_WAIT:    $time_wait"
    echo "监听端口:     $listening"
    echo ""
    
    # 总体评估
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 总体评估"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ $issues -eq 0 ]; then echo -e "状态: ${GREEN}✅ 所有指标正常${NC}"
    elif [ $issues -le 2 ]; then echo -e "状态: ${YELLOW}⚠️ 需要关注 ($issues 项异常)${NC}"
    else echo -e "状态: ${RED}🔴 紧急处理 ($issues 项异常)${NC}"; fi
    echo ""
    
    # 健康评分
    echo "╔═══════════════════════════════════════════════════════════╗"
    if [ $score -ge 80 ]; then echo "║                 ✅ 健康评分: $score/100                      ║"
    elif [ $score -ge 60 ]; then echo "║                 ⚠️ 健康评分: $score/100                      ║"
    else echo "║                 🔴 健康评分: $score/100                      ║"; fi
    echo "╚═══════════════════════════════════════════════════════════╝"
    
    # 保存数据
    echo "$(date '+%Y-%m-%d %H:%M:%S'),$cpu,$mem,$disk,$load,$score" >> "$DATA_DIR/metrics.csv" 2>/dev/null || true
}

# 主程序
if [ "$WATCH" = true ]; then
    echo "🔄 持续监控模式 (按 Ctrl+C 退出)"
    while true; do run_health_check; sleep 30; done
elif [ "$REPORT" = true ]; then
    run_health_check > "${LOG_DIR}/daily-$(date '+%Y-%m-%d').log"
    echo "报告已保存"
else
    run_health_check
fi
