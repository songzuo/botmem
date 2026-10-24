#!/bin/bash
# Claw-Mesh 同步脚本 - 带断点续传和故障恢复
# 版本: 2.0
# 功能: 同步记忆、断点续传、故障恢复、跨机器协作

set -e

# ==================== 配置 ====================
# ⚠️ 凭据：不要在本文件写明文 token（脱敏脚本会把脚本自己改坏）。
# 推荐：把凭据放进 /root/.openclaw/cron/.secrets/ 下的 0600 文件，
# 或使用 clawmesh-credential.sh 提供 clawmesh_token / clawmesh_repo_url。
GIT_TOKEN="YOUR_GITHUB_TOKEN_HERE"
REPO="https://${GIT_TOKEN}@github.com/songzuo/botmem.git"
WORK_DIR="/tmp/botmem-upload"
BOT4_DIR="/root/.openclaw/workspace"
MACHINE_NAME="YOUR_MACHINE_NAME"
LOG_FILE="/var/log/claw-mesh.log"
STATE_FILE="$BOT4_DIR/memory/claw-mesh-state.json"
LOCK_FILE="/tmp/claw-mesh.lock"
MAX_RETRIES=5
TIMEOUT=300

# ==================== 初始化 ====================
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$WORK_DIR"

# ==================== 日志函数 ====================
log() {
    local level=$1
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] [$MACHINE_NAME] $*" | tee -a "$LOG_FILE"
}

# ==================== 状态管理 ====================
load_state() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo '{"step":0,"status":"idle","lastUpdate":0,"errorCount":0}'
    fi
}

save_state() {
    local step=$1
    local status=$2
    local current_time=$(date +%s)
    
    # errorCount 缺省为 0，避免生成非法 JSON (errorCount: ,)
  local err_count
  err_count=$(grep -o '"errorCount": [0-9]*' "$STATE_FILE" 2>/dev/null | cut -d' ' -f2 | head -1)
  [ -z "$err_count" ] && err_count=0

  cat > "$STATE_FILE" << EOF
{
  "machine": "$MACHINE_NAME",
  "step": $step,
  "status": "$status",
  "lastUpdate": $current_time,
  "errorCount": $err_count,
  "lastSync": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF
}

# ==================== 锁管理 ====================
acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log "WARN" "另一个同步进程正在运行 (PID: $lock_pid)"
            return 1
        else
            log "WARN" "清理过期锁文件"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    echo $$ > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT
    return 0
}

# ==================== 故障恢复 ====================
recover_from_failure() {
    log "WARN" "启动故障恢复..."
    
    # 1. 清理临时文件
    rm -rf "$WORK_DIR/botmem/.git/locks" 2>/dev/null || true
    
    # 2. 检查 Git 状态
    if [ -d "$WORK_DIR/botmem/.git" ]; then
        cd "$WORK_DIR/botmem"
        git reset --hard HEAD 2>/dev/null || true
        git clean -fd 2>/dev/null || true
    fi
    
    # 3. 如果 Git 损坏，重新克隆
    if [ ! -d "$WORK_DIR/botmem/.git" ] || ! git -C "$WORK_DIR/botmem" status &>/dev/null; then
        log "INFO" "重新克隆仓库..."
        rm -rf "$WORK_DIR/botmem"
        git clone "$REPO" "$WORK_DIR/botmem" || {
            log "ERROR" "克隆失败"
            return 1
        }
    fi
    
    log "INFO" "故障恢复完成"
    return 0
}

# ==================== 带重试的操作 ====================
retry_operation() {
    local operation=$1
    local description=$2
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        log "INFO" "执行: $description (尝试 $((retries + 1))/$MAX_RETRIES)"
        
        if eval "$operation"; then
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log "WARN" "操作失败，等待 10 秒后重试..."
            sleep 10
        fi
    done
    
    log "ERROR" "操作失败，已达最大重试次数: $description"
    return 1
}

# ==================== 主同步函数 ====================
sync_to_github() {
    local state=$(load_state)
    local current_step=$(echo "$state" | grep -o '"step": [0-9]*' | cut -d' ' -f2)
    [ -z "$current_step" ] && current_step=0

    # 陈旧状态自愈：若上次同步中断在中间步骤（step>0）且已超过 1 小时，
    # 说明是异常终止（如网络中断）留下的残留。此时重置为 0 从头开始，
    # 否则会一直跳过拉取步骤，只在推送阶段反复失败。
    if [ "$current_step" -gt 0 ]; then
        local last_update
        last_update=$(echo "$state" | grep -o '"lastUpdate": [0-9]*' | cut -d' ' -f2)
        if [ -n "$last_update" ]; then
            local age=$(( $(date +%s) - last_update ))
            if [ "$age" -gt 3600 ]; then
                log "WARN" "检测到陈旧状态 (step=$current_step, ${age}s 前中断)，重置为从头同步"
                current_step=0
                save_state 0 "idle"
            fi
        fi
    fi
    
    log "INFO" "开始同步，当前步骤: $current_step"
    
    cd "$WORK_DIR/botmem"
    
    # 步骤 1: 拉取最新变化
    if [ $current_step -le 1 ]; then
        save_state 1 "pulling"
        # 设置较短的连接超时并多试几次：部分节点到 github.com 的链路存在
        # 偶发丢包（实测 5 次请求仅 2 次成功），默认 134s 超时会拖垮整个周期。
        export GIT_HTTP_LOW_SPEED_LIMIT=1
        export GIT_HTTP_LOW_SPEED_TIME=30
        # 不用 `git pull --rebase`：它会把 fetch 与 rebase 串在一起，
        # fetch 卡住时 rebase 一直等待，且本机提交与远端分叉时会留下
        # 难以清理的 rebase 状态。改为分步执行，每步都有独立超时。
        git -c http.connectTimeout=15 -c http.lowSpeedLimit=1 -c http.lowSpeedTime=30 \
            fetch origin main || {
            log "ERROR" "fetch 失败"
            recover_from_failure
            return 1
        }
        # 本地与远端分叉时，用 rebase 变基到远端之上；冲突则放弃本地提交
        if ! git rebase origin/main 2>/dev/null; then
            git rebase --abort 2>/dev/null || true
            log "WARN" "rebase 冲突，放弃本地提交并以远端为准"
            git reset --hard origin/main || {
                log "ERROR" "reset 失败"
                recover_from_failure
                return 1
            }
        fi
        # 同步仓库每次都从远端最新状态开始，避免上一轮的残留改动
        # 影响本轮提交内容。（仅作用于 $WORK_DIR 下的同步副本，不影响工作区）
        git reset --hard origin/main 2>/dev/null || true
        # CLAWMESH_FIX_BRANCH: 确保在 main 分支上，不能是 detached HEAD
        # （detached 时 git push origin main 推的是陈旧的 refs/heads/main，永远被拒）
        git checkout -B main origin/main 2>/dev/null || git checkout main 2>/dev/null || true
    fi
    
    # 步骤 2: 准备文件
    if [ $current_step -le 2 ]; then
        save_state 2 "preparing"
        mkdir -p "$MACHINE_NAME"
        
        # 复制并清理敏感信息
        [ -f "$BOT4_DIR/MEMORY.md" ] && cp "$BOT4_DIR/MEMORY.md" "$MACHINE_NAME/"
        [ -d "$BOT4_DIR/memory" ] && cp -r "$BOT4_DIR/memory" "$MACHINE_NAME/"
        [ -f "$BOT4_DIR/PLAZA.md" ] && cp "$BOT4_DIR/PLAZA.md" "$MACHINE_NAME/"

        # 推送共享静态文件（白名单），供其他节点取用。
        # 只推这几份集群共用的文件；不要整目录拷贝 docs/，
        # 否则会把本机几百份私有文档污染到所有节点。
        #
        # ⚠️ static/HEARTBEAT.md 是**单一槽位**，多节点写入会互相覆盖。
        # 原设计：只有 bot2 写 static/，其余节点只读 —— 但这导致
        #   (a) 非 bot2 节点永远无法把清单改进推给集群
        #   (b) 非 bot2 节点每次同步都会被 bot2 的旧版覆盖本地文件
        #       （2026-10-22 20:38 bot4 的 HEARTBEAT.md 就是这样被回退的）
        #
        # 现设计：**任何节点都可以更新 static/**，但只允许"内容更新"，
        # 且必须通过内容闸门：
        #   1. 非空、且不超过 64KB（挡住"把心跳日志堆进清单"的行为）
        #   2. 必须包含集群清单的标志行
        #   3. 与当前 static/ 版本相比必须是"变长"或"内容不同且更完整"
        #      —— 简化做法：只在内容不同时写入，且不缩字节数
        # 这样多个节点改同一份清单时，合并结果由 git 合并，
        # 而不是"最后写入者赢"。
        mkdir -p "static/docs"
        if true; then
            # 用 cp 到 .tmp 再 mv 原子替换。
            # 注意：cp 直接写目标文件会先截断目标，若中途进程被 kill/超时中断，
            # 目标就变成 0 字节（曾导致共享 HEARTBEAT.md 与各节点本地文件被清空）。
            if [ -f "$BOT4_DIR/HEARTBEAT.md" ] && [ -s "$BOT4_DIR/HEARTBEAT.md" ]; then
                # 内容闸门：只接受"合法集群清单"
                hb_size=$(stat -c %s "$BOT4_DIR/HEARTBEAT.md" 2>/dev/null || echo 0)
                if [ "$hb_size" -gt 65536 ]; then
                    log "WARN 本机 HEARTBEAT.md 过大（$hb_size 字节），疑似混入心跳日志，跳过共享写入"
                elif ! grep -q "集群巡检清单" "$BOT4_DIR/HEARTBEAT.md"; then
                    log "WARN 本机 HEARTBEAT.md 不含集群清单标志行，跳过共享写入"
                elif [ -f "static/HEARTBEAT.md" ] && [ -s "static/HEARTBEAT.md" ]; then
                    cur_size=$(stat -c %s "static/HEARTBEAT.md" 2>/dev/null || echo 0)
                    if [ "$hb_size" -lt "$cur_size" ]; then
                        # 比现有版本更短 —— 多半是旧版本，不覆盖
                        log "INFO 本机 HEARTBEAT.md（$hb_size）比共享版（$cur_size）更短，保留共享版"
                    elif cmp -s "$BOT4_DIR/HEARTBEAT.md" "static/HEARTBEAT.md"; then
                        log "INFO 共享清单已是最新，无需更新"
                    else
                        rm -f "static/.HEARTBEAT.md.tmp"
                        if cp "$BOT4_DIR/HEARTBEAT.md" "static/.HEARTBEAT.md.tmp" 2>/dev/null && \
                           [ -s "static/.HEARTBEAT.md.tmp" ]; then
                            mv -f "static/.HEARTBEAT.md.tmp" "static/HEARTBEAT.md" 2>/dev/null || true
                            log "INFO 共享清单已更新（$cur_size → $hb_size 字节）"
                        else
                            rm -f "static/.HEARTBEAT.md.tmp"
                            log "WARN 复制 static/HEARTBEAT.md 失败，保留原文件"
                        fi
                    fi
                else
                    rm -f "static/.HEARTBEAT.md.tmp"
                    if cp "$BOT4_DIR/HEARTBEAT.md" "static/.HEARTBEAT.md.tmp" 2>/dev/null && \
                       [ -s "static/.HEARTBEAT.md.tmp" ]; then
                        mv -f "static/.HEARTBEAT.md.tmp" "static/HEARTBEAT.md" 2>/dev/null || true
                        log "INFO 共享清单已创建（$hb_size 字节）"
                    else
                        rm -f "static/.HEARTBEAT.md.tmp"
                        log "WARN 复制 static/HEARTBEAT.md 失败，保留原文件"
                    fi
                fi
            else
                log "WARN" "本机 HEARTBEAT.md 缺失或为空，跳过共享文件推送"
            fi
            if [ -f "$BOT4_DIR/docs/CLAW-MESH-HANDOVER.md" ] && [ -s "$BOT4_DIR/docs/CLAW-MESH-HANDOVER.md" ]; then
                rm -f "static/docs/.HANDOVER.tmp"
                if cp "$BOT4_DIR/docs/CLAW-MESH-HANDOVER.md" "static/docs/.HANDOVER.tmp" 2>/dev/null && \
                   [ -s "static/docs/.HANDOVER.tmp" ]; then
                    mv -f "static/docs/.HANDOVER.tmp" "static/docs/CLAW-MESH-HANDOVER.md" 2>/dev/null || true
                else
                    rm -f "static/docs/.HANDOVER.tmp"
                    log "WARN" "复制 static/docs/CLAW-MESH-HANDOVER.md 失败，保留原文件"
                fi
            fi
        else
            log "INFO" "  - 共享清单已在本轮处理"
        fi

        # 清理敏感信息
        # 全仓库脱敏（不只 $MACHINE_NAME）：
        # 历史上只清理本机目录，导致 openclaw/ 等其他目录里的 token 被原样提交。
        # 先用 grep 定位真正含密钥的文件，避免对 7 万多个文件全量 sed。
        # 排除 static/：该目录是本脚本的输入（cp 源），
        # 若同时被 sed -i 改写，会与 cp 竞态导致文件被截断为 0 字节。
        grep -rlE '(^|[^A-Za-z0-9_])gh[p]_[A-Za-z0-9]{20,}|(^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{20,}|ge2[0]99334' . \
            --include='*.md' --include='*.json' --include='*.sh' \
            --exclude-dir=.git --exclude-dir=static 2>/dev/null | while read -r f; do
            sed -i -E -e 's/(^|[^A-Za-z0-9_])gh[p]_[A-Za-z0-9]{20,}/\1[已移除]/g' \
                   -e 's/(^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{20,}/\1[已移除]/g' \
                   -e 's/ge2[0]99334\$ZZ/[已移除]/g' \
                   -e 's/ge2[0]99334/[已移除]/g' "$f"
        done
        # 兜底：本机目录全量脱敏（同样使用左边界 pattern，避免误伤标识符）
        find "$MACHINE_NAME" -type f \( -name "*.md" -o -name "*.json" \) -exec sed -i -E \
            -e 's/(^|[^A-Za-z0-9_])gh[p]_[A-Za-z0-9]{20,}/\1[已移除]/g' \
            -e 's/(^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{20,}/\1[已移除]/g' \
            -e 's/ge2[0]99334\$ZZ/[已移除]/g' \
            {} \; 2>/dev/null || true
    fi
    
    # 步骤 3: 提交
    if [ $current_step -le 3 ]; then
        save_state 3 "committing"
        # 2026-10-24 修复: `git add -A` 会把工作副本里【所有】节点的目录都暂存，
        # 于是本节点会替别人提交（实测 bot4 的提交里混进了 bot2/memory/2026-10-24.md）。
        # 改为只暂存本节点自己的目录。
        # static/ 是集群共享槽位，由 bot2 负责发布。
        if [ "$MACHINE_NAME" = "bot2" ] && [ -d static ]; then
            git add static/
        fi

        # 提交前把最终状态写进本节点的仓库副本：
        # 步骤 2 复制 memory/ 时 state 刚被 save_state 2 "preparing" 覆盖，
        # 而 save_state 0 "idle" 发生在 commit 之后 —— 仓库里的 state 恒为 preparing，
        # 巡检拿不到有效健康信号。
        FINAL_STATE="$WORK_DIR/botmem/$MACHINE_NAME/memory/claw-mesh-state.json"
        if [ -d "$(dirname "$FINAL_STATE")" ]; then
            FS_ERR=$(grep -o '"errorCount": [0-9]*' "$STATE_FILE" 2>/dev/null | cut -d' ' -f2 | head -1)
            [ -z "$FS_ERR" ] && FS_ERR=0
            if [ "$FS_ERR" -eq 0 ] 2>/dev/null; then FS_STATUS="healthy"; else FS_STATUS="degraded"; fi
            cat > "$FINAL_STATE" << STATEEOF
{
  "machine": "$MACHINE_NAME",
  "step": 0,
  "status": "$FS_STATUS",
  "lastUpdate": $(date +%s),
  "errorCount": $FS_ERR,
  "lastSync": "$(date '+%Y-%m-%d %H:%M:%S')"
}
STATEEOF
            # 必须在写完 FINAL_STATE 之后再 add，否则 stage 的是旧的 preparing 副本
            git add "$MACHINE_NAME"/
        else
            git add "$MACHINE_NAME"/
        fi

        # 不变量校验: 仓库里每个 botN/ 目录的 state.machine 必须等于目录名。
        IDENTITY_ERR=0
        for d in bot*/; do
            dn=${d%/}
            sf="$dn/memory/claw-mesh-state.json"
            [ -f "$sf" ] || continue
            sm=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('machine',''))" "$sf" 2>/dev/null)
            [ -z "$sm" ] && continue
            if [ "$sm" != "$dn" ]; then
                echo "[$MACHINE_NAME] X 身份错位: 目录 $dn/ 内 machine=$sm" >&2
                IDENTITY_ERR=1
            fi
        done
        if [ "$IDENTITY_ERR" -ne 0 ]; then
            echo "[$MACHINE_NAME] X 检测到节点目录身份错位，中止提交" >&2
            save_state 3 "identity_mismatch"
            return 1
        fi

        if git diff --staged --quiet; then
            log "INFO" "没有变化，跳过提交"
        else
            retry_operation "git commit -m '$MACHINE_NAME: Claw-Mesh 同步 $(date '+%Y-%m-%d %H:%M')'" "提交变化" || return 1
        fi
    fi
    
    # 步骤 4: 推送
    if [ $current_step -le 4 ]; then
        save_state 4 "pushing"
        # 推送被拒（其他节点抢先提交）时，先拉取再重新提交推送。
        # 否则会因 "fetch first" 一直失败，且状态停在 step 4 导致下次跳过拉取步骤。
        push_with_retry() {
            local attempt=0
            while [ $attempt -lt 6 ]; do
                if git push origin main 2>/tmp/push_err.log; then
                    return 0
                fi
                attempt=$((attempt + 1))
                log "WARN" "推送被拒（第 $attempt 次），尝试拉取远端后重试"
                git fetch origin >/dev/null 2>&1 || true
                # 本地提交可能与远端冲突：优先用 rebase，失败则放弃本地提交重做
                if ! git rebase origin/main >/dev/null 2>&1; then
                    git rebase --abort >/dev/null 2>&1 || true
                    log "WARN" "rebase 冲突，放弃本地提交并以远端为准"
                    git reset --hard origin/main >/dev/null 2>&1 || true
                fi
                sleep 5
            done
            log "ERROR" "推送失败: $(tail -1 /tmp/push_err.log 2>/dev/null)"
            return 1
        }
        push_with_retry || return 1
    fi
    
    # 步骤 5: 完成
    save_state 5 "completed"
    log "INFO" "✅ 同步完成"
    
    # 重置状态，准备下次同步
    save_state 0 "idle"
    
    return 0
}

# ==================== 读取其他机器动态 ====================
read_other_machines() {
    log "INFO" "读取其他机器动态..."
    
    cd "$WORK_DIR/botmem"
    
    for dir in */; do
        if [ "$dir" != "$MACHINE_NAME/" ] && [ -f "${dir}PLAZA.md" ]; then
            local machine=$(basename "$dir")
            log "INFO" "  - 读取 $machine 的广场"
        fi
    done

    # 分发 static/ 下的共享文件到本机 workspace。
    # 集群共用一份巡检清单（HEARTBEAT.md）与交接说明，避免各节点版本漂移。
    if [ -d "static" ]; then
        # 同步共享的 HEARTBEAT.md（仅当本机没有本地修改时覆盖）
        if [ -f "static/HEARTBEAT.md" ] && [ -s "static/HEARTBEAT.md" ] && [ -d "$BOT4_DIR" ]; then
            # 始终以仓库版本为准：各节点的 HEARTBEAT.md 是集群共享的巡检清单，
            # 若允许本地覆盖，会出现各节点版本漂移（曾出现节点停留在 3 月的旧版）
            # 但要加保护：**本机版本比共享版更新/更完整时不要覆盖**。
            # 2026-10-22 20:38 bug：只读共享版 + 只有 bot2 能写共享版
            # → 非 bot2 节点的本地改进每次同步都被抹掉，永远推不出去。
            local_size=0
            [ -f "$BOT4_DIR/HEARTBEAT.md" ] && local_size=$(stat -c %s "$BOT4_DIR/HEARTBEAT.md" 2>/dev/null || echo 0)
            shared_size=$(stat -c %s "static/HEARTBEAT.md" 2>/dev/null || echo 0)
            if [ "$local_size" -gt "$shared_size" ] && grep -q "集群巡检清单" "$BOT4_DIR/HEARTBEAT.md" 2>/dev/null; then
                # 本机更新（含本轮改进）—— 保留本机版本，由上面的写入逻辑发布到 static/
                log "INFO  本机清单（$local_size）比共享版（$shared_size）新，保留本机版本并发布到 static/"
            elif ! cmp -s "static/HEARTBEAT.md" "$BOT4_DIR/HEARTBEAT.md" 2>/dev/null; then
                # 写临时文件再 mv：直接 cp 到工作区文件若中途被中断，
                # 会把本机清单截断为 0 字节（已发生过）
                rm -f "$BOT4_DIR/.HEARTBEAT.md.tmp"
                if cp "static/HEARTBEAT.md" "$BOT4_DIR/.HEARTBEAT.md.tmp" 2>/dev/null && \
                   [ -s "$BOT4_DIR/.HEARTBEAT.md.tmp" ]; then
                    mv -f "$BOT4_DIR/.HEARTBEAT.md.tmp" "$BOT4_DIR/HEARTBEAT.md" 2>/dev/null || true
                    log "INFO" "  - 已更新本机 HEARTBEAT.md（来自 static/）"
                else
                    rm -f "$BOT4_DIR/.HEARTBEAT.md.tmp"
                    log "WARN" "更新本机 HEARTBEAT.md 失败，保留原文件"
                fi
            fi
        fi
        # 同步共享的交接说明（白名单）
        if [ -f "static/docs/CLAW-MESH-HANDOVER.md" ] && [ -s "static/docs/CLAW-MESH-HANDOVER.md" ] && [ -d "$BOT4_DIR" ]; then
            mkdir -p "$BOT4_DIR/docs"
            if ! cmp -s "static/docs/CLAW-MESH-HANDOVER.md" "$BOT4_DIR/docs/CLAW-MESH-HANDOVER.md" 2>/dev/null; then
                rm -f "$BOT4_DIR/docs/.HANDOVER.tmp"
                if cp "static/docs/CLAW-MESH-HANDOVER.md" "$BOT4_DIR/docs/.HANDOVER.tmp" 2>/dev/null && \
                   [ -s "$BOT4_DIR/docs/.HANDOVER.tmp" ]; then
                    mv -f "$BOT4_DIR/docs/.HANDOVER.tmp" "$BOT4_DIR/docs/CLAW-MESH-HANDOVER.md" 2>/dev/null || true
                    log "INFO" "  - 已更新本机 docs/CLAW-MESH-HANDOVER.md（来自 static/docs/）"
                else
                    rm -f "$BOT4_DIR/docs/.HANDOVER.tmp"
                    log "WARN" "更新本机 docs/CLAW-MESH-HANDOVER.md 失败，保留原文件"
                fi
            fi
        fi
    fi
}

# ==================== 更新心跳 ====================
update_heartbeat() {
    log "INFO" "更新心跳..."
    
    cd "$WORK_DIR/botmem"
    
    # 更新 PLAZA.md 中的时间戳
    if [ -f "$MACHINE_NAME/PLAZA.md" ]; then
        sed -i "s/最后更新:.*/最后更新: $(date '+%Y-%m-%d %H:%M:%S')/" "$MACHINE_NAME/PLAZA.md" 2>/dev/null || true
    fi
}

# ==================== 主函数 ====================
main() {
    log "INFO" "🚀 Claw-Mesh 同步启动"
    
    # 获取锁
    if ! acquire_lock; then
        log "WARN" "无法获取锁，退出"
        exit 1
    fi
    
    # 故障恢复检查
    if [ -f "$STATE_FILE" ]; then
        local state=$(cat "$STATE_FILE")
        local status=$(echo "$state" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
        local last_update=$(echo "$state" | grep -o '"lastUpdate": [0-9]*' | cut -d' ' -f2)
        local now=$(date +%s)
        
        # 如果上次同步超过 1 小时且状态不是 idle，触发恢复
        if [ "$status" != "idle" ] && [ $((now - last_update)) -gt 3600 ]; then
            log "WARN" "检测到未完成的同步，触发恢复"
            recover_from_failure
        fi
    fi
    
    # 确保工作目录存在
    if [ ! -d "$WORK_DIR/botmem/.git" ]; then
        recover_from_failure || exit 1
    fi
    
    # 执行同步
    if sync_to_github; then
        read_other_machines
        update_heartbeat
        # 写入成功时间戳，供 watchdog 判断定时同步的新鲜度
        date +%s > /var/run/claw-mesh-sync.ok 2>/dev/null || true
        log "INFO" "🎉 Claw-Mesh 同步成功"
    else
        log "ERROR" "❌ Claw-Mesh 同步失败"
        exit 1
    fi
}

# ==================== 执行 ====================
main "$@"