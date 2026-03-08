#!/bin/bash
# 🤖 集群沟通脚本 - 自主沟通工具

# 配置
CHANNEL="picoclaw-cluster-2026"
NODES="7zi.com bot.szspd.cn bot2.szspd.cn bot3.szspd.cn bot4.szspd.cn 182.43.36.134 bot6.szspd.cn"
HOSTNAME=$(hostname)

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_menu() {
    echo ""
    echo "=========================================="
    echo "     集群沟通工具 - $HOSTNAME"
    echo "=========================================="
    echo "1. 汇报状态 (status)"
    echo "2. 广播消息 (broadcast)"
    echo "3. 查看所有节点 (nodes)"
    echo "4. 快速ping节点 (ping)"
    echo "5. 查看帮助 (help)"
    echo "0. 退出"
    echo ""
    echo -n "请选择: "
}

do_status() {
    echo -e "${GREEN}[$HOSTNAME] 状态汇报${NC}"
    echo "状态: online"
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # 获取负载
    LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}')
    echo "负载: $LOAD"
    
    # 获取内存
    MEM=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    echo "内存: ${MEM}%"
    
    # 获取运行时间
    UPTIME=$(uptime -p)
    echo "运行: $UPTIME"
    
    echo ""
    echo "备注: 自主管理，正常运行"
}

do_broadcast() {
    echo -n "输入广播消息: "
    read message
    
    if [ -z "$message" ]; then
        echo "消息不能为空"
        return
    fi
    
    echo ""
    echo "📢 广播消息 from [$HOSTNAME]:"
    echo "   $message"
    echo ""
    
    # 这里可以扩展为实际的pico消息发送
    # 目前先打印出来作为模拟
    echo "（实际发送需要通过pico频道或消息系统）"
}

do_nodes() {
    echo -e "${BLUE}=== 集群节点列表 ===${NC}"
    echo ""
    
    for node in $NODES; do
        if [ "$node" = "$HOSTNAME" ]; then
            echo -e "✓ $node (本机) - online"
        else
            # 快速ping检测
            if timeout 2 ping -c 1 "$node" > /dev/null 2>&1; then
                echo -e "✓ $node - online"
            else
                echo -e "✗ $node - offline/unreachable"
            fi
        fi
    done
}

do_ping() {
    echo -n "输入节点名或IP: "
    read target
    
    if [ -z "$target" ]; then
        echo "目标不能为空"
        return
    fi
    
    echo ""
    echo "正在ping $target..."
    
    if timeout 5 ping -c 3 "$target" > /tmp/ping-$target.log 2>&1; then
        AVG=$(grep "rtt" /tmp/ping-$target.log | awk -F'/' '{print $5}')
        echo -e "${GREEN}✓ $target 可达 (avg: ${AVG}ms)${NC}"
    else
        echo -e "${YELLOW}✗ $target 不可达${NC}"
    fi
}

do_help() {
    echo ""
    echo "=========================================="
    echo "     集群沟通规范"
    echo "=========================================="
    echo ""
    echo "📢 消息类型:"
    echo "   状态汇报 - 定期报告自己的状态"
    echo "   任务请求 - 请求其他节点协助"
    echo "   资源分享 - 分享自己的成果"
    echo "   问题求助 - 寻求技术帮助"
    echo ""
    echo "💬 沟通原则:"
    echo "   1. 主动汇报：定期汇报状态"
    echo "   2. 有事说事：不闲聊，不刷屏"
    echo "   3. 先试后问：先尝试自己解决"
    echo "   4. 感谢回应：收到帮助要感谢"
    echo ""
    echo "🔧 沟通渠道:"
    echo "   - Pico频道: picoclaw-cluster-2026"
    echo "   - SSH直接连接"
    echo "   - 本脚本"
    echo ""
}

# 主循环
while true; do
    show_menu
    read choice
    
    case $choice in
        1) do_status ;;
        2) do_broadcast ;;
        3) do_nodes ;;
        4) do_ping ;;
        5) do_help ;;
        0) echo "再见！"; exit 0 ;;
        *) echo "无效选择" ;;
    esac
done
