#!/bin/bash
# 在已有 picoclaw 二进制文件的节点上启用服务

NODES=("7zi.com" "bot.szspd.cn" "bot4.szspd.cn" "bot5.szspd.cn" "bot6.szspd.cn")
PASSWORD="ge2099334$ZZ"

echo "=== 启用 Picoclaw 服务 ==="

for node in "${NODES[@]}"; do
    echo ""
    echo "=== $node ==="
    
    # 创建 .picoclaw 目录
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "mkdir -p /root/.picoclaw" 2>/dev/null
    
    # 创建 systemd 服务文件
    echo "📝 创建 systemd 服务..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "cat > /etc/systemd/system/picoclaw.service << 'EOF'
[Unit]
Description=Picoclaw Gateway Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/picoclaw gateway
WorkingDirectory=/root/.picoclaw
Restart=always
RestartSec=10
KillMode=mixed
TimeoutStopSec=300
StandardOutput=append:/var/log/picoclaw.log
StandardError=append:/var/log/picoclaw.log

[Install]
WantedBy=multi-user.target
EOF
" 2>/dev/null
    
    # 重载 systemd 并启动服务
    echo "🚀 重载并启动服务..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl daemon-reload && systemctl enable picoclaw && systemctl start picoclaw" 2>&1
    
    # 检查状态
    sleep 2
    status=$(sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl is-active picoclaw" 2>/dev/null)
    
    if [ "$status" = "active" ]; then
        echo "✅ 服务已启动"
    else
        echo "⚠️  服务状态：$status"
        # 尝试查看日志
        sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "journalctl -u picoclaw --no-pager -n 5" 2>/dev/null
    fi
done

echo ""
echo "=== 完成 ==="
