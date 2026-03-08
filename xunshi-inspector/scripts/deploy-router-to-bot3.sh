#!/bin/bash
# 🤖 Bot3 智能路由部署脚本
# 替换bot3的路由系统，保留断点续传

set -e

echo "=========================================="
echo "  Bot3 智能路由部署"
echo "=========================================="

# 配置
ROUTER_DIR="/root/smart-router"
PORT=11435

echo ""
echo "[1/5] 创建目录..."
mkdir -p $ROUTER_DIR

echo ""
echo "[2/5] 上传智能路由程序..."
# 这里需要手动复制 smart-router-full.js 的内容
# 或者通过curl/wget从其他机器获取

echo ""
echo "[3/5] 检查端口占用..."
if lsof -i:$PORT > /dev/null 2>&1; then
    echo "  端口 $PORT 已被占用，尝试停止旧进程..."
    pkill -f "node.*router" || true
    sleep 2
fi

echo ""
echo "[4/5] 启动智能路由..."
cd $ROUTER_DIR
nohup node smart-router-full.js > /tmp/router.log 2>&1 &
sleep 3

echo ""
echo "[5/5] 验证路由状态..."
sleep 2
curl -s http://localhost:$PORT/health | head -100

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "Dashboard: http://bot3.szspd.cn:$PORT/dashboard"
echo "健康检查: http://bot3.szspd.cn:$PORT/health"
