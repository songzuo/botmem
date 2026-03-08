#!/bin/bash
# 🤖 集群全量部署脚本
# 在每台机器上运行此脚本

set -e

# 配置
HOSTNAME=$(hostname)
CHANNEL="picoclaw-cluster-2026"
ROUTER_DIR="/root/smart-router"
MEMORY_DIR="$HOME/.openclaw/workspace/memory"

echo "=========================================="
echo "  集群部署 - $HOSTNAME"
echo "=========================================="

# ===== 第1步: 创建目录结构 =====
echo ""
echo "[1/8] 创建目录结构..."
mkdir -p $MEMORY_DIR
mkdir -p $ROUTER_DIR
mkdir -p ~/scripts

# ===== 第2步: 下载团队规范 =====
echo ""
echo "[2/8] 下载团队规范..."
# 这里应该从7zi.com或其他源下载 team-building-standards.md
# 暂时创建本地版本

# ===== 第3步: 创建自我介绍 =====
echo ""
echo "[3/8] 创建自我介绍..."
cat > $MEMORY_DIR/README.md << 'EOF'
# 我是谁

## 基本信息
- 主机名: $HOSTNAME
- 角色: Worker/Evolver/协调经理/测试机
- 加入时间: $(date '+%Y-%m-%d')

## 职责
（根据角色填写）

## 状态
- 状态: online
- 最后更新: $(date)

## 自主原则
- 自主思考
- 自治管理  
- 不复制，只学习
EOF

sed -i "s/\$HOSTNAME/$HOSTNAME/g" $MEMORY_DIR/README.md

# ===== 第4步: 配置心跳任务 =====
echo ""
echo "[4/8] 配置心跳任务..."

# 创建心跳检查脚本
cat > ~/scripts/heartbeat-check.sh << 'HEARTBEAT'
#!/bin/bash
# 🤖 心跳检查脚本

HOSTNAME=$(hostname)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 检查SSH连通性
NODES="7zi.com bot bot2 bot3 bot4 bot5 bot6"
OFFLINE=""
for node in $NODES; do
    if [ "$node" != "$HOSTNAME" ]; then
        if ! timeout 5 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$node "echo ok" >/dev/null 2>&1; then
            OFFLINE="$OFFLINE $node"
        fi
    fi
done

# 检查内存
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

# 检查磁盘
DISK_USAGE=$(df / | awk 'NR==2{gsub(/%/,""); print $5}')

# 检查进程
EVOMAP_COUNT=$(ps aux | grep evomap | grep -v grep | wc -l)

# 记录状态
echo "[$TIMESTAMP] $HOSTNAME - MEM:${MEM_USAGE}% DISK:${DISK_USAGE}% EVOMAP:$EVOMAP_COUNT OFFLINE:$OFFLINE" >> ~/memory/heartbeat.log 2>/dev/null || true

# 异常处理
if [ "$MEM_USAGE" -gt 85 ]; then
    echo "警告: 内存使用率 ${MEM_USAGE}%"
fi

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "警告: 磁盘使用率 ${DISK_USAGE}%"
fi

if [ "$EVOMAP_COUNT" -gt 20 ]; then
    echo "清理过多evomap进程: $EVOMAP_COUNT"
    ps aux | grep evomap | grep -v grep | awk '{print $2}' | xargs -r kill -9
fi
HEARTBEAT

chmod +x ~/scripts/heartbeat-check.sh

# ===== 第5步: 配置定时任务 =====
echo ""
echo "[5/8] 配置定时任务 (cron)..."

# 添加心跳任务 (每5分钟)
(crontab -l 2>/dev/null | grep -v "heartbeat-check"; echo "*/5 * * * * ~/scripts/heartbeat-check.sh >> ~/memory/heartbeat.log 2>&1") | crontab -

# 添加每日报告 (每天 8:00)
(crontab -l 2>/dev/null | grep -v "daily-report"; echo "0 8 * * * ~/scripts/daily-report.sh >> ~/memory/daily-report.log 2>&1") | crontab -

# 查看cron
echo "  当前定时任务:"
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" || echo "  (无)"

# ===== 第6步: 创建每日报告脚本 =====
echo ""
echo "[6/8] 创建每日报告脚本..."

cat > ~/scripts/daily-report.sh << 'REPORT'
#!/bin/bash
HOSTNAME=$(hostname)
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M')

# 获取状态
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
MEM=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
DISK=$(df / | awk 'NR==2{gsub(/%/,""); print $5}')
REQ=$(curl -s http://localhost:11435/stats 2>/dev/null | grep -o '"totalRequests":[0-9]*' | cut -d: -f2 || echo "N/A")

echo "## $HOSTNAME 日报 - $DATE $TIME"
echo "状态: online"
echo "负载: $LOAD"
echo "内存: ${MEM}%"
echo "磁盘: ${DISK}%"
echo "请求: $REQ"
echo ""
REPORT

chmod +x ~/scripts/daily-report.sh

# ===== 第7步: 配置频道沟通 =====
echo ""
echo "[7/8] 配置Pico频道通信..."

# 创建通信脚本
cat > ~/scripts/cluster-comm.sh << 'COMM'
#!/bin/bash
# 集群通信工具

CHANNEL="picoclaw-cluster-2026"
HOSTNAME=$(hostname)

case "$1" in
    "status")
        echo "[$HOSTNAME] 状态汇报"
        echo "状态: online"
        echo "负载: $(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}')"
        echo "内存: $(free | awk 'NR==2{printf "%.0f", $3*100/$2}')%"
        ;;
    "broadcast")
        shift
        MESSAGE="$@"
        echo "📢 [$HOSTNAME] 广播: $MESSAGE"
        # 这里应该通过pico频道发送
        ;;
    *)
        echo "用法: cluster-comm.sh {status|broadcast <消息>}"
        ;;
esac
COMM

chmod +x ~/scripts/cluster-comm.sh

# ===== 第8步: 验证部署 =====
echo ""
echo "[8/8] 验证部署..."

echo "  目录结构:"
ls -la $MEMORY_DIR/ 2>/dev/null | head -5
ls -la ~/scripts/ 2>/dev/null | head -5

echo ""
echo "=========================================="
echo "  部署完成 - $HOSTNAME"
echo "=========================================="
echo ""
echo "下一步:"
echo "  1. 阅读团队规范: cat $MEMORY_DIR/../team-building-standards.md"
echo "  2. 运行心跳检查: ~/scripts/heartbeat-check.sh"
echo "  3. 查看状态: ~/scripts/cluster-comm.sh status"
echo ""
