#!/bin/bash
nodes=("7zi.com" "bot3.szspd.cn")
echo "=== 快速节点测试 ==="
for node in "${nodes[@]}"; do
    echo "节点: $node"
    ping -c 1 $node
    nc -zv $node 22
    echo "-------------------"
done
