#!/bin/bash
# 日常清理脚本

echo "开始日常清理..."

# 清理包管理器缓存
echo "清理 npm 缓存..."
npm cache clean --force 2>/dev/null || true

# 清理 yarn 缓存
yarn cache clean 2>/dev/null || true

# 清理 pnpm 缓存
pnpm store prune 2>/dev/null || true

# 清理临时文件
echo "清理临时文件..."
rm -rf /tmp/* 2>/dev/null || true

# 清理旧日志
echo "清理旧日志..."
find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null || true

# 清理 journal
journalctl --vacuum-time=3d 2>/dev/null || true

# Docker 清理
echo "清理 Docker..."
docker system prune -f 2>/dev/null || true

echo "日常清理完成！"