#!/bin/bash
# 系统诊断脚本

echo "=== 系统诊断报告 ==="
echo "时间: $(date)"
echo ""

echo "### 磁盘使用 ###"
df -h | grep -E "^/dev|Filesystem"
echo ""

echo "### 内存使用 ###"
free -h
echo ""

echo "### CPU 负载 ###"
uptime
echo ""

echo "### 大文件 (>100MB) ###"
find / -type f -size +100M 2>/dev/null | head -10
echo ""

echo "### 大日志文件 ###"
find /var/log -type f -size +10M 2>/dev/null | head -10
echo ""

echo "### Docker 状态 ###"
docker system df 2>/dev/null || echo "Docker 未运行"
echo ""

echo "### node_modules 目录 ###"
find ~ -type d -name "node_modules" 2>/dev/null | head -10
echo ""

echo "=== 诊断完成 ==="