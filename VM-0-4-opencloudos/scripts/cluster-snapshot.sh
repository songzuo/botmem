#!/bin/bash
# 集群状态快照 - 一键获取全集群状态
SSH_PASS='ge2099334$ZZ'
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=5"
NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn bot5.szspd.cn"

echo "🎯 集群状态快照 $(date '+%Y-%m-%d %H:%M:%S UTC')"
echo "================================================"

for node in $NODES; do
  (
    r=$(timeout 10 sshpass -p "$SSH_PASS" ssh $SSH_OPTS root@$node \
      "h=\$(hostname); m=\$(free | awk 'NR==2{printf \"%.0f\", \$3*100/\$2}'); d=\$(df / | awk 'NR==2{gsub(/%/,\"\"); print \$5}'); l=\$(cat /proc/loadavg | awk '{print \$1}'); u=\$(uptime -p 2>/dev/null | sed 's/up //'); e=\$(ps aux | grep evomap | grep -v grep | wc -l); echo \"\$h|mem=\${m}%|disk=\${d}%|load=\$l|up=\$u|evomap=\$e\"" 2>/dev/null)
    if [ -n "$r" ]; then
      echo "✅ $node: $r"
    else
      echo "❌ $node: UNREACHABLE"
    fi
  ) &
done
wait
echo "================================================"
