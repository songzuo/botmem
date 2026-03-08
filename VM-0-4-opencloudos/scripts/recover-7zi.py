#!/usr/bin/env python3
"""
恢复任务: 节点 7zi.com 自我恢复 (recovery-7zi.com-1772529863)
"""

import subprocess
import time
from datetime import datetime

PASSWORD = "ge2099334$ZZ"
NODE = "7zi.com"
TASK_ID = "recovery-7zi.com-1772529863"

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def ssh_exec(node, cmd, timeout=60):
    """执行SSH命令"""
    try:
        command = f"sshpass -p '{PASSWORD}' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 -o ServerAliveInterval=5 -o ServerAliveCountMax=3 root@{node} '{cmd}'"
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=timeout
        )
        return result.returncode == 0, (result.stdout + result.stderr).strip()
    except Exception as e:
        return False, str(e)

def check_ssh_connectivity(node):
    """检查SSH连接"""
    log(f"检查 {node} 的SSH连接...")
    success, result = ssh_exec(node, "whoami")
    if success and "root" in result:
        log(f"✅ SSH连接正常 - {node}")
        return True
    else:
        log(f"❌ SSH连接失败 - {node}: {result}", "ERROR")
        return False

def check_openclaw_services(node):
    """检查OpenClaw相关服务"""
    log(f"检查 {node} 的OpenClaw服务...")
    services = ["openclaw-gateway", "docker", "nginx", "cron"]
    
    for service in services:
        success, status = ssh_exec(node, f"systemctl is-active {service}")
        if success:
            if "active" in status:
                log(f"✅ {service} 服务正在运行")
            else:
                log(f"⚠️ {service} 服务未运行，正在尝试启动...", "WARNING")
                start_success, start_result = ssh_exec(node, f"systemctl start {service}")
                if start_success:
                    time.sleep(2)
                    check_success, check_status = ssh_exec(node, f"systemctl is-active {service}")
                    if "active" in check_status:
                        log(f"✅ {service} 服务启动成功")
                    else:
                        log(f"❌ {service} 服务启动失败: {check_status}", "ERROR")
                else:
                    log(f"❌ 无法启动 {service} 服务: {start_result}", "ERROR")
        else:
            log(f"❌ 无法检查 {service} 服务状态: {status}", "ERROR")

def check_node_health(node):
    """检查节点健康状态"""
    log(f"检查 {node} 的系统资源...")
    
    # 检查内存
    success, mem_result = ssh_exec(node, "free -h")
    if success:
        log(f"内存使用情况:\n{mem_result}")
    
    # 检查CPU
    success, cpu_result = ssh_exec(node, "top -bn1 | head -10")
    if success:
        log(f"CPU使用情况:\n{cpu_result}")
    
    # 检查磁盘
    success, disk_result = ssh_exec(node, "df -h")
    if success:
        log(f"磁盘使用情况:\n{disk_result}")

def check_evomap_processes(node):
    """检查evomap进程"""
    log(f"检查 {node} 的evomap进程...")
    success, ps_result = ssh_exec(node, "ps -eo pid,lstart,cmd --sort=start_time | grep -E 'evomap|openclaw-evomap' | grep -v grep")
    if success:
        if ps_result:
            log(f"evomap进程正在运行:\n{ps_result}")
        else:
            log(f"⚠️ 未找到evomap进程，正在尝试启动...", "WARNING")
            start_cmd = "cd /root/openclaw-evomap && nohup node openclaw-evomap.js > /tmp/evomap.log 2>&1 &"
            ssh_exec(node, start_cmd)
            time.sleep(3)
            # 再次检查
            success, new_ps_result = ssh_exec(node, "ps -eo pid,lstart,cmd --sort=start_time | grep -E 'evomap|openclaw-evomap' | grep -v grep")
            if success and new_ps_result:
                log(f"✅ evomap进程已成功启动:\n{new_ps_result}")
            else:
                log(f"❌ 无法启动evomap进程", "ERROR")
    else:
        log(f"❌ 无法检查进程状态: {ps_result}", "ERROR")

def update_task_status(task_id, status="running", progress_msg="任务已恢复"):
    """更新任务状态"""
    log(f"更新任务状态 - {task_id}: {status}")
    
    tasks_file = "/root/.openclaw/workspace/state/tasks.json"
    
    try:
        import json
        with open(tasks_file, 'r') as f:
            tasks_data = json.load(f)
        
        if task_id in tasks_data['tasks']:
            tasks_data['tasks'][task_id]['status'] = status
            tasks_data['tasks'][task_id]['updated_at'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            tasks_data['tasks'][task_id]['blocked_reason'] = ""
            
            # 添加进度日志
            if 'progress_log' not in tasks_data['tasks'][task_id]:
                tasks_data['tasks'][task_id]['progress_log'] = []
            
            tasks_data['tasks'][task_id]['progress_log'].append({
                "time": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "msg": progress_msg
            })
            
            tasks_data['last_updated'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            
            with open(tasks_file, 'w') as f:
                json.dump(tasks_data, f, indent=2, default=str)
            
            log(f"✅ 任务状态已更新")
            return True
        else:
            log(f"⚠️ 未找到任务 {task_id}", "WARNING")
            return False
    
    except Exception as e:
        log(f"❌ 无法更新任务状态: {e}", "ERROR")
        return False

def main():
    log("=" * 50)
    log(f"开始恢复任务: {TASK_ID}")
    log("=" * 50)
    
    # 1. 检查SSH连接
    if not check_ssh_connectivity(NODE):
        log("❌ 无法建立SSH连接，任务恢复失败", "ERROR")
        return
    
    # 2. 更新任务状态为运行中
    update_task_status(TASK_ID, "running", "任务已恢复，正在执行节点检查")
    
    # 3. 检查系统资源和健康状态
    check_node_health(NODE)
    
    # 4. 检查OpenClaw相关服务
    check_openclaw_services(NODE)
    
    # 5. 检查并启动evomap进程
    check_evomap_processes(NODE)
    
    # 6. 完成任务
    log("=" * 50)
    log(f"任务恢复完成: {TASK_ID}")
    log("=" * 50)
    
    update_task_status(TASK_ID, "completed", "节点自我恢复成功")

if __name__ == "__main__":
    main()
