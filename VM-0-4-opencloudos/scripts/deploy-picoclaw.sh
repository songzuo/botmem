#!/bin/bash
# 部署 Picoclaw 到远程节点

NODES=("7zi.com" "bot.szspd.cn" "bot4.szspd.cn" "bot5.szspd.cn" "bot6.szspd.cn")
PASSWORD="ge2099334$ZZ"
LOCAL_PICOLAW="/usr/local/bin/picoclaw"
REMOTE_PICOLAW="/usr/local/bin/picoclaw"

echo "=== 部署 Picoclaw 到多个节点 ==="

for node in "${NODES[@]}"; do
    echo ""
    echo "=== 部署到 $node ==="
    
    # 检查是否已安装
    exists=$(sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "test -f $REMOTE_PICOLAW && echo 'exists' || echo 'missing'" 2>/dev/null)
    
    if [ "$exists" = "exists" ]; then
        echo "⚠️  Picoclaw 已存在，跳过"
        # 检查服务状态
        status=$(sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl is-active picoclaw 2>/dev/null || echo 'inactive'" 2>/dev/null)
        if [ "$status" = "active" ]; then
            echo "✅ 服务已运行"
        else
            echo "🔄 启动服务..."
            sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl start picoclaw 2>/dev/null && sleep 2 && systemctl is-active picoclaw" 2>/dev/null
        fi
        continue
    fi
    
    # 复制二进制文件
    echo "📦 复制 Picoclaw 二进制文件..."
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$LOCAL_PICOLAW" root@$node:"$REMOTE_PICOLAW" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "❌ 复制失败"
        continue
    fi
    
    # 设置执行权限
    echo "🔧 设置权限..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "chmod +x $REMOTE_PICOLAW" 2>/dev/null
    
    # 创建 systemd 服务
    echo "📝 创建 systemd 服务..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "mkdir -p /root/.picoclaw" 2>/dev/null
    
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
    echo "🚀 启动服务..."
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl daemon-reload && systemctl enable picoclaw && systemctl start picoclaw" 2>/dev/null
    
    # 检查状态
    sleep 2
    status=$(sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$node "systemctl is-active picoclaw" 2>/dev/null)
    
    if [ "$status" = "active" ]; then
        echo "✅ 部署成功，服务运行中"
    else
        echo "⚠️  服务状态：$status"
    fi
done

echo ""
echo "=== 部署完成 ==="
