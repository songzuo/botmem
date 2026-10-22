#!/bin/bash
# sync-from-botmem.sh - 从 GitHub botmem 仓库同步本机记忆 (从节点版)
# 部署位置：bot, bot2 (从节点)
#
# 修复说明 (2026-10-22):
#   旧脚本 sync-from-slave.sh / sync-from-peer.sh 依赖同步节点上的
#   /tmp/botmem-sync/botmem 目录，但上游节点已改为 /tmp/botmem-upload，
#   且该目录会被临时清理，导致每 4 小时同步全部失败并回滚。
#   本脚本直接从 GitHub 仓库拉取，只取本机目录(bot2/)，最可靠。
#
# 用法: sync-from-botmem.sh [--dry-run] [--rollback]

set -e

# ==================== 配置区 ====================
REPO_URL="https://github.com/songzuo/botmem.git"
WORK_DIR="/tmp/botmem-pull"
MEMORY_DIR="/root/.openclaw/workspace/memory"
BACKUP_DIR="/root/.openclaw/workspace/memory.backup"
LOG_FILE="/var/log/botmem-sync-from-botmem.log"
CURRENT_HOST=$(hostname -f 2>/dev/null || hostname)
MACHINE_NAME=${CURRENT_HOST%%.*}
# 仓库中对应本机的目录名（不同机器目录名不同，按需调整）
REPO_SUBDIR="${REPO_SUBDIR:-$MACHINE_NAME}"

# ==================== 函数定义 ====================
log() {
    local level="$1"; shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "$*"; }
log_warn() { log "WARN" "$*"; }
log_error() { log "ERROR" "$*"; }

backup_local_data() {
    log_info "备份现有数据..."
    rm -rf "$BACKUP_DIR"
    if [ -d "$MEMORY_DIR" ]; then
        cp -r "$MEMORY_DIR" "$BACKUP_DIR"
        log_info "✅ 备份完成：$BACKUP_DIR"
    else
        mkdir -p "$MEMORY_DIR"
        log_warn "MEMORY_DIR 不存在，跳过备份"
    fi
}

pull_repo() {
    log_info "从 GitHub 拉取 botmem 仓库..."
    rm -rf "$WORK_DIR"
    mkdir -p "$WORK_DIR"
    if ! git clone --depth 1 "$REPO_URL" "$WORK_DIR/botmem" 2>&1 | tee -a "$LOG_FILE"; then
        log_error "❌ 克隆失败"
        return 1
    fi
    log_info "✅ 仓库拉取完成"
    return 0
}

merge_to_local() {
    local source_dir="$WORK_DIR/botmem/$REPO_SUBDIR/memory"
    if [ ! -d "$source_dir" ]; then
        log_error "❌ 仓库中未找到目录：$REPO_SUBDIR/memory"
        return 1
    fi
    mkdir -p "$MEMORY_DIR"
    log_info "合并 $source_dir -> $MEMORY_DIR"
    # 只覆盖 .md 文件，保留本机本地的 state json
    cp -rv "$source_dir"/*.md "$MEMORY_DIR/" 2>&1 | tee -a "$LOG_FILE" || true
    log_info "✅ 数据合并完成"
    return 0
}

verify_data() {
    local file_count
    file_count=$(find "$MEMORY_DIR" -type f -name "*.md" 2>/dev/null | wc -l)
    if [ "$file_count" -gt 0 ]; then
        log_info "✅ 验证通过：$file_count 个 markdown 文件"
        return 0
    fi
    log_warn "⚠️  未找到 markdown 文件"
    return 1
}

cleanup() {
    rm -rf "$WORK_DIR"
}

rollback() {
    log_info "执行回滚..."
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf "$MEMORY_DIR"
        mv "$BACKUP_DIR" "$MEMORY_DIR"
        log_info "✅ 回滚完成"
    else
        log_warn "⚠️  无备份可回滚"
    fi
}

main_sync() {
    log_info "🚀 开始同步流程 (GitHub botmem / 机器: $MACHINE_NAME)"
    backup_local_data
    if ! pull_repo; then
        log_error "同步失败"; rollback; return 1
    fi
    if ! merge_to_local; then
        log_error "数据合并失败"; rollback; return 1
    fi
    verify_data || true
    cleanup
    log_info "✅ 同步流程完成"
    return 0
}

main() {
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    case "${1:-}" in
        --dry-run) log_info "🔍 预览：将从 $REPO_URL 拉取 $REPO_SUBDIR/memory"; exit 0 ;;
        --rollback) rollback ;;
        "") main_sync ;;
        *) echo "未知选项：$1"; exit 1 ;;
    esac
}

main "$@"
