#!/usr/bin/env python3
"""
集群自治系统 - 清理重复进程 + 安装Claude Code + 启动自治工作
"""

import paramiko
import time
from datetime import datetime
import subprocess

PASSWORD = "ge2099334$ZZ"
NODES = ["7zi.com", "bot.szspd.cn", "bot2.szspd.cn", "bot3.szspd.cn", "bot4.szspd.cn", "bot5.szspd.cn"]

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def ssh_exec(node, cmd, timeout=60):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(node, username="root", password=PASSWORD, timeout=15)
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
        result = stdout.read().decode() + stderr.read().decode()
        ssh.close()
        return True, result.strip()
    except Exception as e:
        return False, str(e)

def cleanup_evomap_processes(node):
    """清理重复的evomap进程，只保留最新的2个"""
    log(f"清理 {node} 的evomap进程...")
    
    # 获取所有evomap相关进程PID（按启动时间排序）
    cmd = """
    # 获取所有evomap相关进程
    pids=$(ps -eo pid,lstart,cmd --sort=start_time | grep -E 'evomap|openclaw-evomap' | grep -v grep | awk '{print $1}')
    count=$(echo "$pids" | wc -w)
    
    if [ "$count" -gt 2 ]; then
        # 保留最后2个（最新的），杀掉其他的
        kill_count=$((count - 2))
        to_kill=$(echo $pids | tr ' ' '\\n' | head -n $kill_count)
        for pid in $to_kill; do
            kill -9 $pid 2>/dev/null
        done
        echo "清理了 $kill_count 个进程，保留 2 个"
    else
        echo "进程数正常: $count 个"
    fi
    
    # 显示剩余进程
    ps aux | grep -E 'evomap' | grep -v grep | wc -l
    """
    
    success, result = ssh_exec(node, cmd)
    if success:
        log(f"  {node}: {result}")
    else:
        log(f"  {node}: 失败 - {result}", "ERROR")
    return success

def check_and_install_claude(node):
    """检查并安装Claude Code"""
    log(f"检查 {node} 的Claude Code...")
    
    # 检查是否已安装
    success, result = ssh_exec(node, "which claude 2>/dev/null && claude --version 2>/dev/null")
    
    if "claude" in result.lower() and "not found" not in result.lower():
        log(f"  {node}: Claude已安装 - {result.split()[0] if result else 'OK'}")
        return True
    
    log(f"  {node}: Claude未安装，开始安装...")
    
    # 安装Claude Code
    install_cmd = """
    # 安装Claude Code
    npm install -g @anthropic-ai/claude-code 2>&1 | tail -3
    
    # 验证安装
    which claude && claude --version
    """
    
    success, result = ssh_exec(node, install_cmd, timeout=120)
    if success and "claude" in result.lower():
        log(f"  {node}: Claude安装成功")
        return True
    else:
        log(f"  {node}: Claude安装失败 - {result[:100]}", "ERROR")
        return False

def setup_claude_api(node):
    """配置Claude API（使用火山引擎API）"""
    log(f"配置 {node} 的Claude API...")
    
    # 配置火山引擎API
    config_cmd = """
    mkdir -p ~/.claude
    cat > ~/.claude/settings.json << 'CONF'
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "4e051cf9-b27b-41eb-9540-2890ad94a271",
    "ANTHROPIC_BASE_URL": "https://ark.cn-beijing.volces.com/api/coding",
    "ANTHROPIC_MODEL": "ark-code-latest"
  }
}
CONF

    # 确保完成初始化
    cat > ~/.claude.json << 'CONF'
{
  "hasCompletedOnboarding": true
}
CONF

    echo "配置完成"
    cat ~/.claude/settings.json
    """
    
    success, result = ssh_exec(node, config_cmd)
    if success:
        log(f"  {node}: API配置成功")
    return success

def start_autonomous_work(node):
    """启动自治工作进程"""
    log(f"启动 {node} 的自治工作...")
    
    # 创建自治工作脚本
    work_script = '''
#!/bin/bash
# 自治工作脚本 - 24小时不断工作

LOG_FILE="/tmp/autonomous-work.log"
WORK_DIR="/root/autonomous-work"

mkdir -p $WORK_DIR
cd $WORK_DIR

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

log "自治工作启动"

# 主循环
while true; do
    log "开始新一轮工作..."
    
    # 1. 检查系统状态
    mem=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    load=$(cat /proc/loadavg | awk '{print $1}')
    log "系统状态: 内存=${mem}%, 负载=${load}"
    
    # 2. 执行EvoMap任务
    if [ -f /root/openclaw-evomap/openclaw-evomap.js ]; then
        cd /root/openclaw-evomap
        timeout 300 node openclaw-evomap.js >> /tmp/evomap-work.log 2>&1
        log "EvoMap任务完成"
    fi
    
    # 3. 休息5分钟
    sleep 300
done
'''
    
    cmd = f"""
    # 写入自治工作脚本
    cat > /root/autonomous-work.sh << 'SCRIPT'
{work_script}
SCRIPT
    chmod +x /root/autonomous-work.sh
    
    # 检查是否已在运行
    if pgrep -f "autonomous-work.sh" > /dev/null; then
        echo "自治工作已在运行"
    else
        nohup /root/autonomous-work.sh > /tmp/autonomous-work.log 2>&1 &
        echo "自治工作已启动"
    fi
    """
    
    success, result = ssh_exec(node, cmd)
    if success:
        log(f"  {node}: {result}")
    return success

def check_and_install_sshpass_local():
    """检查本地是否安装sshpass，必要时安装"""
    log("检查本地sshpass...")
    try:
        # 检查sshpass是否存在
        subprocess.run("which sshpass", shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        log("✅ sshpass 已安装")
        return True
    except subprocess.CalledProcessError:
        log("⚠️ sshpass 未安装，开始安装...")
        try:
            # 更新包列表并安装sshpass
            subprocess.run("apt-get update && apt-get install -y sshpass", shell=True, check=True, 
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            log("✅ sshpass 安装成功")
            return True
        except subprocess.CalledProcessError as e:
            log(f"❌ sshpass 安装失败: {e}", "ERROR")
            return False

def main():
    log("=" * 50)
    log("集群自治系统 - 开始执行")
    log("=" * 50)
    
    # 0. 检查本地基础工具
    log("\n--- Phase 0: 基础工具检查 ---")
    check_and_install_sshpass_local()
    
    # 1. 清理所有节点的重复进程
    log("\n--- Phase 1: 清理重复进程 ---")
    for node in NODES:
        cleanup_evomap_processes(node)
    
    # 2. 检查并安装Claude Code
    log("\n--- Phase 2: 检查/安装Claude Code ---")
    for node in NODES:
        check_and_install_claude(node)
    
    # 3. 配置Claude API
    log("\n--- Phase 3: 配置Claude API ---")
    for node in NODES:
        setup_claude_api(node)
    
    log("\n" + "=" * 50)
    log("集群自治系统 - 执行完成")
    log("=" * 50)

if __name__ == "__main__":
    main()
