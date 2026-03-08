#!/bin/bash
# 部署cluster-agent到所有节点（用stdin传文件，避免scp问题）
SSH_PASS='ge2099334$ZZ'
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=5"
NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn bot5.szspd.cn"
AGENT_SRC="/root/.openclaw/workspace/tools/cluster-agent.py"
REMOTE_DIR="/opt/cluster-agent"

for node in $NODES; do
  (
    # 停旧进程+创建目录
    timeout 8 sshpass -p "$SSH_PASS" ssh $SSH_OPTS root@$node \
      "pkill -f 'cluster-agent.py' 2>/dev/null; mkdir -p $REMOTE_DIR" 2>/dev/null
    # stdin传文件
    cat "$AGENT_SRC" | timeout 10 sshpass -p "$SSH_PASS" ssh $SSH_OPTS root@$node \
      "cat > $REMOTE_DIR/cluster-agent.py" 2>/dev/null
    # 启动
    timeout 10 sshpass -p "$SSH_PASS" ssh $SSH_OPTS root@$node \
      "cd $REMOTE_DIR && nohup python3 cluster-agent.py > /var/log/cluster-agent.log 2>&1 & sleep 1; curl -s http://localhost:9100/health" 2>/dev/null
    echo " ← $node"
  ) &
done
wait
echo "=== 部署完成 ==="
