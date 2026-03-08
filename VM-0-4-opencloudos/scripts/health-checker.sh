#!/bin/bash
# 健康检查器 - 每10分钟检查集群健康

HEALTH_DIR="/workspace/projects/workspace/memory/health"
mkdir -p "$HEALTH_DIR"

LOG="/workspace/projects/workspace/memory/health-checker.log"

while true; do
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    HEALTH_FILE="$HEALTH_DIR/health-$TIMESTAMP.json"

    echo "[$(date)] 开始健康检查..." | tee -a "$LOG"

    # 检查节点在线状态
    echo '{"checks": [' > "$HEALTH_FILE"

    # 检查7zi.com
    {
        export SSHPASS="ge2099334\$ZZ"
        sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@7zi.com "
            echo '{'
            echo '  \"node\": \"7zi.com\",'
            echo '  \"timestamp\": \"'$(date -Iseconds)'\",'
            echo '  \"status\": \"online\",'
            echo '  \"load_average\": \"'$(uptime | awk -F'load' '{print $2}' | sed 's/^[[:space:]]*//')'\",'
            echo '  \"disk_usage\": \"'$(df / | tail -1 | awk '{print $5}' | cut -d% -f1)'\",'
            echo '  \"disk_warning\": '$(df / | tail -1 | awk '{print $5}' | cut -d% -f1 | awk '{if ($1 > 80) print "true"; else print "false"}')','
            echo '  \"services\": {'
            echo '    \"docker\": \"'$(systemctl is-active docker 2>/dev/null || echo 'unknown')'\",'
            echo '    \"ssh\": \"running\"'
            echo '  }'
            echo '}'
        " 2>/dev/null || echo '{\"node\": \"7zi.com\", \"status\": \"offline\"}'
    } >> "$HEALTH_FILE"

    echo ',' >> "$HEALTH_FILE"

    # 检查bot2.szspd.cn
    {
        export SSHPASS="ge2099334\$ZZ"
        sshpass -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@bot2.szspd.cn "
            echo '{'
            echo '  \"node\": \"bot2.szspd.cn\",'
            echo '  \"timestamp\": \"'$(date -Iseconds)'\",'
            echo '  \"status\": \"online\",'
            echo '  \"load_average\": \"'$(uptime | awk -F'load' '{print $2}' | sed 's/^[[:space:]]*//')'\",'
            echo '  \"disk_usage\": \"'$(df / | tail -1 | awk '{print $5}' | cut -d% -f1)'\",'
            echo '  \"disk_warning\": '$(df / | tail -1 | awk '{print $5}' | cut -d% -f1 | awk '{if ($1 > 80) print "true"; else print "false"}')','
            echo '  \"services\": {'
            echo '    \"docker\": \"'$(systemctl is-active docker 2>/dev/null || echo 'unknown')'\",'
            echo '    \"ssh\": \"running\"'
            echo '  }'
            echo '}'
        " 2>/dev/null || echo '{\"node\": \"bot2.szspd.cn\", \"status\": \"offline\"}'
    } >> "$HEALTH_FILE"

    echo ']}' >> "$HEALTH_FILE"

    # 检查是否有警告
    WARNINGS=$(grep -c '"disk_warning": true' "$HEALTH_FILE" 2>/dev/null || echo 0)
    if [ "$WARNINGS" -gt 0 ]; then
        echo "[$(date)] ⚠️ 发现 $WARNINGS 个磁盘使用率警告" | tee -a "$LOG"

        # 尝试发送告警到Telegram
        if [ -f "/workspace/projects/workspace/scripts/setup-telegram.sh" ]; then
            ALERT_MSG="🚨 集群健康告警

检测到磁盘使用率警告！

警告数量: $WARNINGS

详细信息:
$(cat "$HEALTH_FILE" | grep -A 10 'disk_warning: true')
"
            /workspace/projects/workspace/scripts/setup-telegram.sh "test" 2>&1 | grep -v "未配置"
        fi
    fi

    # 检查后台任务是否运行
    TASKS_RUNNING=$(ps aux | grep -E "auto-planner|state-collector|auto-reporter|auto-analyzer" | grep -v grep | wc -l)
    if [ "$TASKS_RUNNING" -lt 4 ]; then
        echo "[$(date)] ⚠️ 警告: 只发现 $TASKS_RUNNING 个后台任务运行（预期4个）" | tee -a "$LOG"
    fi

    echo "[$(date)] 健康检查完成" | tee -a "$LOG"

    # 每10分钟运行一次
    sleep 600
done
