#!/bin/bash
# 集群并行执行器 - 纯SSH调度，零依赖
# 用法: 
#   ./cluster-exec.sh "command"                    # 所有节点执行
#   ./cluster-exec.sh "command" node1 node2        # 指定节点
#   ./cluster-exec.sh -f script.sh                 # 执行脚本文件
#   ./cluster-exec.sh -f script.sh node1           # 指定节点执行脚本

SSH_PASS='ge2099334$ZZ'
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=5 -o ServerAliveInterval=10"
ALL_NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn bot5.szspd.cn"
RESULT_DIR="/tmp/cluster-results/$(date +%s)"
mkdir -p "$RESULT_DIR"

# 解析参数
MODE="cmd"
if [ "$1" = "-f" ]; then
  MODE="file"
  TASK="$2"
  shift 2
else
  TASK="$1"
  shift
fi

NODES="${@:-$ALL_NODES}"

if [ -z "$TASK" ]; then
  echo "用法: $0 [-f script.sh | \"command\"] [node1 node2 ...]"
  exit 1
fi

echo "⏱️ $(date '+%H:%M:%S') | 分发到: $NODES"

# 并行执行
for node in $NODES; do
  (
    if [ "$MODE" = "file" ]; then
      result=$(timeout 60 sshpass -p "$SSH_PASS" ssh $SSH_OPTS root@$node "bash -s" < "$TASK" 2>&1)
    else
      result=$(timeout 60 sshpass -p "$SSH_PASS" ssh $SSH_OPTS root@$node "$TASK" 2>&1)
    fi
    code=$?
    echo "$result" > "$RESULT_DIR/$node"
    if [ $code -eq 0 ]; then
      echo "✅ $node: $(echo "$result" | head -3)"
    else
      echo "❌ $node (exit=$code): $(echo "$result" | head -2)"
    fi
  ) &
done

wait
echo "📁 详细结果: $RESULT_DIR/"
