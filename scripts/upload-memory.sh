#!/bin/bash
# Memory Upload Script - Sync memory files to remote storage
# Version: 1.0

set -e

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="/var/log/bot6-memory-upload.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

log "Starting memory upload..."

# Check if claw-mesh-sync exists and run it
if [ -x "/root/.openclaw/cron/claw-mesh-sync.sh" ]; then
    log "Using claw-mesh-sync for upload"
    /root/.openclaw/cron/claw-mesh-sync.sh
else
    log "WARN: claw-mesh-sync.sh not found or not executable"
fi

log "Memory upload completed"
