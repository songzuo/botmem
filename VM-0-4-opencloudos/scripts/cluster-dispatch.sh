#!/bin/bash
# 集群任务分发器 - SSH直接调度
# 用法: ./cluster-dispatch.sh <task_script> [node1 node2 ...]
# 如果不指定节点，则分发到所有节点

SSH_PASS='ge2099334$ZZ'
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=5"
ALL_NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn bot5.szspd.cn"

TASK_SCRIPT="$1"
shift
NODES="${@:-$ALL_NODES}"

if [ -z "$TASK_SCRIPT" ]; then
  echo "用法: $0 <task_script> [node1 node2 ...]"
  exit 1
fi

echo "📡 分发任务到: $NODES"
echo "📋 任务脚本: $TASK_SCRIPT"
echo "---"

for node in $NODES; do
  (
    result=$(timeout 30 sshpass -p "$SSH_PASS" ssh $SSH_OPTS root@$node "bash -s" < "$TASK_SCRIPT" 2>&1)
    echo "[$node] $result"
  ) &
done

wait
echo "---"
echo "✅ 所有任务完成"
