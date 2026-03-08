#!/bin/bash
# 快速网络测试脚本

echo "=== 快速网络测试 ==="

# 测试7zi.com和bot3.szspd.cn
for node in "7zi.com" "bot3.szspd.cn"; do
    echo ""
    echo "测试节点: $node"
    echo "------------------------"
    
    # 测试SSH连接
    if nc -zv $node 22 2>&1; then
        echo "SSH连接: 正常"
    else
        echo "SSH连接: 失败"
    fi
    
    # 测试Redis连接
    if nc -zv $node 6379 2>&1; then
        echo "Redis连接: 正常"
    else
        echo "Redis连接: 失败"
    fi
    
    # 测试延迟
    if ping -c 5 $node &>/dev/null; then
        avg=$(ping -c 5 $node | grep "avg" | awk -F'/' '{print $5}')
        echo "平均延迟: ${avg}ms"
    else
        echo "Ping失败"
    fi
done
