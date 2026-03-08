#!/bin/bash
# 修复node_agent Redis连接 - 设置环境变量指向7zi.com
# 在各节点上执行

REDIS_HOST="165.99.43.61"
AGENT_DIR="/opt/openclaw-agent"
AGENT_PY="$AGENT_DIR/node_agent.py"

if [ ! -f "$AGENT_PY" ]; then
  echo "SKIP: no node_agent.py found"
  exit 0
fi

# 创建环境文件
cat > "$AGENT_DIR/.env" << EOF
REDIS_HOST=$REDIS_HOST
REDIS_PORT=6379
REDIS_PASSWORD=openclaw2026
NODE_ID=$(hostname)
EOF

# 检查是否有systemd service
if systemctl list-units --type=service 2>/dev/null | grep -q openclaw-agent; then
  # 添加环境到systemd
  mkdir -p /etc/systemd/system/openclaw-agent.service.d
  cat > /etc/systemd/system/openclaw-agent.service.d/redis.conf << EOF2
[Service]
Environment="REDIS_HOST=$REDIS_HOST"
Environment="REDIS_PORT=6379"
Environment="REDIS_PASSWORD=openclaw2026"
EOF2
  systemctl daemon-reload
  systemctl restart openclaw-agent 2>/dev/null
  echo "FIXED: systemd service restarted with Redis env"
else
  # 直接重启进程
  pkill -f "node_agent.py" 2>/dev/null
  sleep 1
  cd "$AGENT_DIR"
  REDIS_HOST=$REDIS_HOST REDIS_PORT=6379 REDIS_PASSWORD=openclaw2026 \
    nohup python3 node_agent.py > /var/log/openclaw-agent/agent.log 2>&1 &
  echo "FIXED: agent restarted with REDIS_HOST=$REDIS_HOST (pid=$!)"
fi
