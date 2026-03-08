#!/bin/bash
# OpenClaw 节点检查脚本

EXECUTOR_DIR="/workspace/projects/workspace"
LOG_DIR="$EXECUTOR_DIR/memory/executor-logs"
NODE_LOG="$LOG_DIR/node-check.log"

# 确保日志目录存在
mkdir -p "$LOG_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 记录日志
log_node_check() {
    local message="$1"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $message" >> "$NODE_LOG"
    echo -e "[$timestamp] $message"
}

# 读取任务文件中的节点信息
read_node_info() {
    python3 - <<END
import json
import os

EXECUTOR_DIR = "$EXECUTOR_DIR"
TASKS_FILE = os.path.join(EXECUTOR_DIR, "memory", "tasks.json")

try:
    with open(TASKS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    nodes = data.get("nodes", {})
    
    node_list = []
    for name, info in nodes.items():
        if 'hostname' in info:
            node_list.append({
                'name': name,
                'hostname': info['hostname'],
                'ip': info.get('ip', 'unknown'),
                'username': info.get('username', 'root'),
                'password': info.get('password', 'unknown'),
                'role': info.get('role', 'worker')
            })
            
    print(json.dumps(node_list, indent=2))
    print()
    
except Exception as e:
    print(f"无法读取节点信息: {e}")
END
}

# 检查节点连通性
check_nodes_connectivity() {
    log_node_check "=== 节点连通性检查开始 ==="
    
    local node_info=$(read_node_info)
    
    # 使用python解析JSON
    python3 - <<END
import json
import subprocess
from datetime import datetime

LOG_DIR = "$LOG_DIR"
node_info = """$node_info"""

try:
    nodes = json.loads(node_info)
    
    log_node_check = lambda msg: print(msg)
    
    for node in nodes:
        log_node_check(f"检查节点 {node['name']}: {node['hostname']}")
        
        hostname = node['hostname']
        username = node.get('username', 'root')
        password = node.get('password', 'unknown')
        
        log_node_check(f"尝试SSH连接: {username}@{hostname}")
        
        try:
            # 使用sshpass进行密码验证
            ssh_command = [
                'sshpass', '-p', password,
                'ssh',
                '-o', 'StrictHostKeyChecking=no',
                '-o', 'ConnectTimeout=5',
                '-o', 'BatchMode=yes',
                f"{username}@{hostname}",
                'echo "Connected"', ';',
                'hostname', ';',
                'uname -a'
            ]
            
            ssh_result = subprocess.run(
                ssh_command,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if ssh_result.returncode == 0:
                print(f"✅ 节点 {node['name']} 连通成功")
                print(f"   输出: {ssh_result.stdout.strip()}")
            else:
                print(f"❌ 节点 {node['name']} 连通失败")
                if ssh_result.stderr:
                    print(f"   错误: {ssh_result.stderr.strip()}")
                    
        except subprocess.TimeoutExpired:
            print(f"❌ 节点 {node['name']} 连接超时")
        except Exception as e:
            print(f"❌ 节点 {node['name']} 检查失败: {e}")
            
        print()
        
except Exception as e:
    print(f"节点检查执行失败: {e}")
END
    
    log_node_check "=== 节点连通性检查完成 ==="
    log_node_check ""
}

# 检查OpenClaw服务
check_openclaw_service() {
    log_node_check "=== OpenClaw服务检查 ==="
    
    local node_info=$(read_node_info)
    
    python3 - <<END
import json
import subprocess
import sys

node_info = """$node_info"""
LOG_DIR = "$LOG_DIR"

try:
    nodes = json.loads(node_info)
    
    for node in nodes:
        print(f"检查OpenClaw服务在节点 {node['name']}: {node['hostname']}")
        
        hostname = node['hostname']
        username = node.get('username', 'root')
        password = node.get('password', 'unknown')
        
        try:
            ssh_command = [
                'sshpass', '-p', password,
                'ssh',
                '-o', 'StrictHostKeyChecking=no',
                '-o', 'ConnectTimeout=10',
                '-o', 'BatchMode=yes',
                f"{username}@{hostname}",
                'which openclaw; echo -e "\\nOpenClaw版本:"; openclaw --version; echo -e "\\nOpenClaw状态:"; systemctl status openclaw 2>&1 | head -20'
            ]
            
            ssh_result = subprocess.run(
                ssh_command,
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if ssh_result.returncode == 0:
                print("✅ OpenClaw服务检查成功")
                print("输出:")
                print("-" * 30)
                print(ssh_result.stdout)
                print("-" * 30)
            else:
                print("❌ OpenClaw服务检查失败")
                if ssh_result.stderr:
                    print(f"错误: {ssh_result.stderr}")
                    
        except Exception as e:
            print(f"❌ 无法检查OpenClaw服务: {e}")
            
        print()
        
except Exception as e:
    print(f"OpenClaw服务检查失败: {e}")
END
}

# 检查节点资源使用
check_node_resources() {
    log_node_check "=== 节点资源使用检查 ==="
    
    local node_info=$(read_node_info)
    
    python3 - <<END
import json
import subprocess
from datetime import datetime

LOG_DIR = "$LOG_DIR"
node_info = """$node_info"""

try:
    nodes = json.loads(node_info)
    
    for node in nodes:
        print(f"检查节点资源使用: {node['name']} - {node['hostname']}")
        
        hostname = node['hostname']
        username = node.get('username', 'root')
        password = node.get('password', 'unknown')
        
        try:
            ssh_command = [
                'sshpass', '-p', password,
                'ssh',
                '-o', 'StrictHostKeyChecking=no',
                '-o', 'ConnectTimeout=10',
                '-o', 'BatchMode=yes',
                f"{username}@{hostname}",
                'top -bn1 | head -10; echo -e "\\n内存使用:"; free -h; echo -e "\\n磁盘使用:"; df -h /; echo -e "\\n网络连接:"; ss -tuln | head -20'
            ]
            
            ssh_result = subprocess.run(
                ssh_command,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if ssh_result.returncode == 0:
                print("✅ 资源检查成功")
                print("输出:")
                print("-" * 30)
                print(ssh_result.stdout)
                print("-" * 30)
            else:
                print("❌ 资源检查失败")
                if ssh_result.stderr:
                    print(f"错误: {ssh_result.stderr}")
                    
        except Exception as e:
            print(f"❌ 无法检查资源使用: {e}")
            
        print()
        
except Exception as e:
    print(f"资源使用检查失败: {e}")
END
}

# 主节点检查过程
main_node_check() {
    log_node_check "=== OpenClaw 节点检查开始 ==="
    
    check_nodes_connectivity
    check_openclaw_service
    check_node_resources
    
    log_node_check "=== OpenClaw 节点检查完成 ==="
    log_node_check ""
}

# 处理中断
trap 'log_node_check "节点检查中断"; exit 1' INT TERM

# 主函数
main() {
    log_node_check "OpenClaw 节点检查脚本启动"
    
    # 检查依赖
    if ! command -v sshpass &> /dev/null; then
        log_node_check "sshpass命令未找到，正在尝试安装..."
        apt-get update && apt-get install -y sshpass
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_node_check "ssh命令未找到，正在尝试安装..."
        apt-get update && apt-get install -y openssh-client
    fi
    
    main_node_check
    
    log_node_check "OpenClaw 节点检查脚本完成"
}

main "$@"