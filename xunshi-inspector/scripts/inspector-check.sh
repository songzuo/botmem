#!/bin/bash
# 🤖 巡视经理自动检查脚本
# 定期检查集群状态

NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn 182.43.36.134 bot6.szspd.cn"
HOSTNAME=$(hostname)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="$HOME/workspace-logs/inspection.log"

echo "=========================================="
echo "  巡视经理自动检查 - $TIMESTAMP"
echo "=========================================="

# 检查SSH连通性
echo ""
echo "[1/4] 检查节点连通性..."
for node in $NODES; do
    if [ "$node" = "$HOSTNAME" ]; then
        continue
    fi
    if timeout 5 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$node "hostname" >/dev/null 2>&1; then
        echo "  ✓ $node 在线"
    else
        echo "  ✗ $node 离线"
    fi
done

# 检查bot3路由
echo ""
echo "[2/4] 检查bot3路由..."
if timeout 5 curl -s http://bot3.szspd.cn:11435/health >/dev/null 2>&1; then
    echo "  ✓ bot3 路由正常"
else
    echo "  ✗ bot3 路由异常"
fi

# 检查本地资源
echo ""
echo "[3/4] 检查本地资源..."
MEM=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
DISK=$(df / | awk 'NR==2{gsub(/%/,""); print $5}')
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
echo "  内存: ${MEM}%"
echo "  磁盘: ${DISK}%"
echo "  负载: $LOAD"

# 检查进程
echo ""
echo "[4/4] 检查关键进程..."
for proc in "openclaw" "picoclaw" "node"; do
    count=$(ps aux | grep -i $proc | grep -v grep | wc -l)
    echo "  $proc: $count 进程"
done

echo ""
echo "=========================================="
echo "  检查完成"
echo "=========================================="

# 记录到日志
echo "[$TIMESTAMP] MEM:${MEM}% DISK:${DISK}% LOAD:$LOAD" >> $LOG_FILE
