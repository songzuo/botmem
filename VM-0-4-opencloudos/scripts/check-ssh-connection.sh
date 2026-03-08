#!/bin/bash
# 检查SSH连接
NODE1="bot.szspd.cn"
NODE2="bot2.szspd.cn"
PASSWORD="ge2099334\$ZZ"

log() {
    local level="${2:-INFO}"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] [$level] $1"
}

check_ssh() {
    local node="$1"
    log "检查 $node 的SSH连接..."
    
    # 使用 sshpass 检查连接
    SSH_RESULT=$(sshpass -p 'ge2099334$ZZ' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$node "uptime" 2>&1)
    
    if [ $? -eq 0 ]; then
        log "✅ SSH连接正常 - $node"
        echo "响应: $SSH_RESULT"
        return 0
    else
        log "❌ SSH连接失败 - $node"
        echo "错误信息: $SSH_RESULT"
        return 1
    fi
}

# 检查第一个节点
check_ssh $NODE1
SSH_STATUS1=$?

# 等待1秒后检查第二个节点
sleep 1
check_ssh $NODE2
SSH_STATUS2=$?

# 输出总结
echo
log "连接检查完成"
log "节点1 ($NODE1): $(if [ $SSH_STATUS1 -eq 0 ]; then echo "✅ 成功"; else echo "❌ 失败"; fi)"
log "节点2 ($NODE2): $(if [ $SSH_STATUS2 -eq 0 ]; then echo "✅ 成功"; else echo "❌ 失败"; fi)"
