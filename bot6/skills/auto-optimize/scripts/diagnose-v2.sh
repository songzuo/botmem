#!/bin/bash
# 高级系统诊断脚本 v2.0
# 增加更多诊断项目和健康检查

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           🔍 Advanced System Diagnostic Report            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo "⏰ 时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. 系统基本信息
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 系统信息"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "主机名: $(hostname)"
echo "运行时间: $(uptime -p 2>/dev/null || uptime)"
echo "内核版本: $(uname -r)"
echo ""

# 2. 磁盘使用分析
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 磁盘使用"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
df -h | grep -E "^/dev|Filesystem" | head -10
echo ""
echo "📊 inode 使用:"
df -i | grep -E "^/dev|Filesystem" | head -5
echo ""

# 3. 内存分析
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧠 内存使用"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
free -h
echo ""
echo "🔄 内存详情:"
cat /proc/meminfo | grep -E "MemTotal|MemAvailable|MemFree|SwapTotal|SwapFree" | head -5
echo ""

# 4. CPU 分析
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ CPU 状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "负载: $(uptime | awk -F'load average:' '{print $2}')"
echo "CPU 核心数: $(nproc)"
top -bn1 | head -5 | tail -1
echo ""

# 5. 进程分析
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔎 Top 10 内存占用进程"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ps aux --sort=-%mem | head -11
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔎 Top 10 CPU 占用进程"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ps aux --sort=-%cpu | head -11
echo ""

# 6. 网络连接
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 网络连接"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ESTABLISHED 连接数: $(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l)"
echo "TIME_WAIT 连接数: $(netstat -an 2>/dev/null | grep TIME_WAIT | wc -l)"
echo ""
echo "监听端口:"
netstat -tlnp 2>/dev/null | grep LISTEN | head -10
echo ""

# 7. Docker 状态
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Docker 状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker system df 2>/dev/null || echo "Docker 未运行"
echo ""
echo "运行中的容器:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "无"
echo ""

# 8. 大文件扫描
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 大文件 (>100MB)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find / -type f -size +100M 2>/dev/null | head -15
echo ""

# 9. 日志文件
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 大日志文件 (>10MB)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find /var/log -type f -size +10M 2>/dev/null | head -15
echo ""

# 10. node_modules 清理建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 node_modules 分析"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "项目 node_modules 总大小:"
du -sh ~/workspace/*/node_modules 2>/dev/null | sort -rh | head -10
echo ""

# 11. 系统健康评分
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💚 系统健康评分"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

score=100

# 检查磁盘
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $disk_usage -gt 90 ]; then
    echo "❌ 磁盘使用率: ${disk_usage}% (危险)"
    score=$((score - 30))
elif [ $disk_usage -gt 80 ]; then
    echo "⚠️ 磁盘使用率: ${disk_usage}% (警告)"
    score=$((score - 15))
else
    echo "✅ 磁盘使用率: ${disk_usage}% (正常)"
fi

# 检查内存
mem_available=$(free | grep Mem | awk '{print $7}')
mem_total=$(free | grep Mem | awk '{print $2}')
mem_pct=$((100 - mem_available * 100 / mem_total))
if [ $mem_pct -gt 90 ]; then
    echo "❌ 内存使用率: ${mem_pct}% (危险)"
    score=$((score - 25))
elif [ $mem_pct -gt 80 ]; then
    echo "⚠️ 内存使用率: ${mem_pct}% (警告)"
    score=$((score - 10))
else
    echo "✅ 内存使用率: ${mem_pct}% (正常)"
fi

# 检查负载
load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
cpus=$(nproc)
load_int=${load%.*}
if [ $load_int -gt $((cpus * 2)) ]; then
    echo "⚠️ 系统负载: $load (高)"
    score=$((score - 10))
else
    echo "✅ 系统负载: $load (正常)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 综合健康评分: $score/100"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "=== 诊断完成 ==="
