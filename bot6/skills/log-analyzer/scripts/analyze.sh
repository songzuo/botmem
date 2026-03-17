#!/bin/bash
# Log Analyzer - 日志分析脚本
# 用法: ./analyze.sh [--since "time"] [--service name] [--level level] [--format format]

set -e

# 默认配置
SINCE="1 hour ago"
SERVICE="all"
LEVEL="all"
FORMAT="text"
LOG_DIR="/root/.openclaw/logs"

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --since)
            SINCE="$2"
            shift 2
            ;;
        --service)
            SERVICE="$2"
            shift 2
            ;;
        --level)
            LEVEL="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 分析函数
analyze_errors() {
    local log_files=$(find "$LOG_DIR" -name "*.log" -type f 2>/dev/null)
    
    # 如果没有日志文件，显示系统日志
    if [ -z "$log_files" ]; then
        echo "未在 $LOG_DIR 中找到日志文件，检查系统日志..."
        log_files=$(find /var/log -name "*.log" -type f -size +0 2>/dev/null | head -10)
        if [ -z "$log_files" ]; then
            echo "未找到任何日志文件"
            return
        fi
    fi
    
    local total_lines=0
    local error_count=0
    local warn_count=0
    local info_count=0
    
    # 统计日志
    for file in $log_files; do
        local lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        total_lines=$((total_lines + lines))
    done
    
    # 错误统计
    error_count=$(grep -rh -E "(ERROR|FATAL|Exception|Traceback)" $log_files 2>/dev/null | wc -l)
    warn_count=$(grep -rh -E "(WARN|WARNING)" $log_files 2>/dev/null | wc -l)
    
    # 输出结果
    if [ "$FORMAT" = "json" ]; then
        cat <<EOF
{
    "analysis_time": "$(date -Iseconds)",
    "time_range": "$SINCE",
    "total_lines": $total_lines,
    "errors": $error_count,
    "warnings": $warn_count,
    "error_rate": "$(echo "scale=4; $error_count * 100 / $total_lines" | bc 2>/dev/null || echo "0")%"
}
EOF
    else
        echo -e "${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${BLUE}        📊 日志分析报告${NC}"
        echo -e "${BLUE}═══════════════════════════════════════${NC}"
        echo ""
        echo -e "分析时间范围: ${GREEN}$SINCE${NC}"
        echo -e "总日志条目: ${GREEN}$total_lines${NC}"
        echo ""
        echo -e "${RED}🔴 错误数量: $error_count${NC}"
        echo -e "${YELLOW}⚠️  警告数量: $warn_count${NC}"
        echo ""
        
        # 错误率计算
        if [ "$total_lines" -gt 0 ]; then
            if command -v bc &> /dev/null; then
                error_rate=$(echo "scale=2; $error_count * 100 / $total_lines" | bc)
            else
                # Fallback if bc is not available - 转换为整数比较
                error_rate_int=$((error_count * 100 / total_lines))
            fi
            echo -e "错误率: ${error_rate:-${error_rate_int}}%"
            
            # 使用整数比较
            if [ "${error_rate_int:-0}" -gt 5 ]; then
                echo -e "${RED}❌ 错误率过高！需要立即处理${NC}"
            elif [ "${error_rate_int:-0}" -gt 1 ]; then
                echo -e "${YELLOW}⚠️  错误率偏高，建议检查${NC}"
            else
                echo -e "${GREEN}✅ 错误率正常${NC}"
            fi
        fi
        
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${RED}最近错误 (Top 10):${NC}"
        echo -e "${BLUE}───────────────────────────────────────${NC}"
        grep -rh -E "(ERROR|FATAL)" $log_files 2>/dev/null | tail -10
        
        echo ""
        echo -e "${BLUE}═══════════════════════════════════════${NC}"
        echo -e "${YELLOW}最近警告 (Top 10):${NC}"
        echo -e "${BLUE}───────────────────────────────────────${NC}"
        grep -rh -E "(WARN|WARNING)" $log_files 2>/dev/null | tail -10
    fi
}

# 执行分析
echo -e "${GREEN}开始分析日志...${NC}"
echo ""
analyze_errors
