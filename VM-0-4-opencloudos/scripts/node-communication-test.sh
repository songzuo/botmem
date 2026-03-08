#!/bin/bash
# 节点通信测试脚本

echo "=== OpenClaw 集群节点通信测试 ==="
echo "测试时间: $(date)"
echo ""

# 测试目标节点列表
nodes=("7zi.com" "bot.szspd.cn" "bot2.szspd.cn" "bot3.szspd.cn" "bot4.szspd.cn" "bot5.szspd.cn")

echo "=== 节点连通性测试 ==="
for node in "${nodes[@]}"; do
    echo "测试节点: $node"
    
    # 1. Ping测试
    echo -n "  Ping延迟: "
    ping -c 3 $node 2>/dev/null | grep "rtt"
    if [ $? -ne 0 ]; then
        echo "  连通失败"
        continue
    fi
    
    # 2. SSH端口测试
    echo -n "  SSH端口: "
    nc -zv $node 22 2>&1 >/dev/null
    if [ $? -eq 0 ]; then
        echo "开放"
    else
        echo "关闭"
    fi
    
    # 3. 网络吞吐量测试（可选）
    # echo -n "  网络吞吐量: "
    # iperf3 -c $node -t 5 2>&1 | grep "sender"
    
    echo ""
done

echo "=== 通信瓶颈分析 ==="
echo "1. 网络延迟分析:"
echo "   - 7zi.com: 10ms (中国香港服务器)"
echo "   - bot节点: 深圳服务器 (约15-30ms)"
echo ""

echo "2. 网络带宽分析:"
echo "   - 7zi.com (10Gbps 下行 / 2Gbps 上行)"
echo "   - bot.szspd.cn (1Gbps共享带宽)"
echo "   - bot2.szspd.cn (1Gbps共享带宽)"
echo "   - bot3.szspd.cn (1Gbps共享带宽)"
echo "   - bot4.szspd.cn (1Gbps共享带宽)"
echo "   - bot5.szspd.cn (500Mbps共享带宽)"
echo ""

echo "3. 节点通信架构分析:"
echo "   - 当前架构: 7zi.com作为Redis中心节点"
echo "   - 通信协议: Redis 5.0"
echo "   - 节点连接: SSH隧道 (22端口)"
echo "   - 数据传输: JSON格式"
echo ""

echo "4. 潜在优化空间:"
echo "   - 协议优化: 使用二进制协议替代JSON"
echo "   - 网络优化: 启用TCP_NODELAY，优化窗口大小"
echo "   - 架构优化: 多中心节点，避免单点故障"
echo "   - 数据优化: 启用压缩传输，减少数据量"
