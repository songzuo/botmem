#!/bin/bash

# GitHub 上传配置
REPO="https://github.com/songzuo/botmem"
TOKEN="REMOVED_TOKEN"
MACHINE_NAME="7zi.com"
WORKSPACE="/root/.openclaw/workspace"
TEMP_DIR="/tmp/botmem-upload"

echo "=== 开始完整 GitHub 上传 ==="
echo "机器: $MACHINE_NAME"
echo "时间: $(date)"

# 1. 创建临时目录
echo "[1/7] 创建临时目录..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR/$MACHINE_NAME"

# 2. 克隆仓库（只获取最新状态，不下载历史）
echo "[2/7] 克隆仓库..."
cd "$TEMP_DIR"
git clone --depth 1 https://$TOKEN@github.com/songzuo/botmem.git repo 2>&1 | head -5

# 3. 复制记忆文件
echo "[3/7] 复制记忆文件..."
cd "$TEMP_DIR/repo"

# 创建机器目录（不删除其他机器的目录）
mkdir -p "$MACHINE_NAME/memory"

# 复制 MEMORY.md
if [ -f "$WORKSPACE/MEMORY.md" ]; then
    cp "$WORKSPACE/MEMORY.md" "$MACHINE_NAME/"
    echo "  - MEMORY.md ✅"
fi

# 复制 memory/ 目录
if [ -d "$WORKSPACE/memory" ]; then
    cp -r "$WORKSPACE/memory/"* "$MACHINE_NAME/memory/" 2>/dev/null
    echo "  - memory/ 目录 ✅"
fi

# 4. 复制常规重要文件
echo "[4/7] 复制常规文件..."
for file in AGENTS.md SOUL.md IDENTITY.md USER.md README HEARTBEAT.md TOOLS.md; do
    if [ -f "$WORKSPACE/$file" ]; then
        # 移除敏感信息
        sed 's/REMOVED_TOKEN[A-Za-z0-9]*/REMOVED_TOKEN/g; s/ge2099334\$ZZ/REMOVED_PASS/g' \
            "$WORKSPACE/$file" > "$MACHINE_NAME/$file"
        echo "  - $file ✅"
    fi
done

# 复制 sessions.json
if [ -f "$WORKSPACE/sessions.json" ]; then
    sed 's/REMOVED_TOKEN[A-Za-z0-9]*/REMOVED_TOKEN/g; s/ge2099334\$ZZ/REMOVED_PASS/g' \
        "$WORKSPACE/sessions.json" > "$MACHINE_NAME/sessions.json"
    echo "  - sessions.json ✅"
fi

# 5. 复制重要工具和程序
echo "[5/7] 复制重要工具..."
mkdir -p "$MACHINE_NAME/tools"
mkdir -p "$MACHINE_NAME/skills"

# 复制 tools 目录中的重要脚本
if [ -d "$WORKSPACE/tools" ]; then
    for script in "$WORKSPACE/tools"/*.sh "$WORKSPACE/tools"/*.py; do
        if [ -f "$script" ]; then
            filename=$(basename "$script")
            sed 's/REMOVED_TOKEN[A-Za-z0-9]*/REMOVED_TOKEN/g; s/ge2099334\$ZZ/REMOVED_PASS/g' \
                "$script" > "$MACHINE_NAME/tools/$filename"
            echo "  - tools/$filename ✅"
        fi
    done
fi

# 6. Git 提交和推送
echo "[6/7] Git 提交..."
git config user.email "bot@7zi.com"
git config user.name "7zi-bot"
git add -A
git commit -m "上传 7zi.com 完整记忆和工具 - $(date '+%Y-%m-%d %H:%M')" 2>&1 | head -5

echo "[7/7] 推送到 GitHub..."
git push origin main 2>&1 | head -10

# 清理
cd /
rm -rf "$TEMP_DIR"

echo "=== 上传完成 ==="
echo "时间: $(date)"
