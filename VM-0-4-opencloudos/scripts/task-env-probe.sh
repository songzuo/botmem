#!/bin/bash
# 节点环境探测 - 收集各节点能力信息
echo "NODE=$(hostname)"
echo "OS=$(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2)"
echo "CORES=$(nproc)"
echo "MEM_MB=$(free -m | awk 'NR==2{print $2}')"
echo "DISK_FREE_GB=$(df / | awk 'NR==2{printf "%.1f", $4/1048576}')"
echo "PYTHON=$(python3 --version 2>/dev/null || echo 'none')"
echo "NODE_JS=$(node --version 2>/dev/null || echo 'none')"
echo "DOCKER=$(docker --version 2>/dev/null || echo 'none')"
echo "GIT=$(git --version 2>/dev/null || echo 'none')"
echo "OPENCLAW=$(openclaw --version 2>/dev/null || echo 'none')"
echo "REDIS=$(redis-cli --version 2>/dev/null || echo 'none')"
echo "UPTIME=$(uptime -p 2>/dev/null || uptime)"
