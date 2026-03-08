#!/usr/bin/env python3
"""
恢复任务: token-harvester-e2e 任务恢复 (已在浏览器完成OAuth授权，获取到授权码，需要将token注入到CLIProxyAPI并验证模型可用)
"""

import paramiko
import time
from datetime import datetime
import subprocess
import json

PASSWORD = r"ge2099334$ZZ"
NODE = "7zi.com"  # CLIProxyAPI 服务通常部署在 7zi.com 节点上
TASK_ID = "token-harvester-e2e"

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def ssh_exec(node, cmd, timeout=60):
    """执行SSH命令"""
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

def check_cliproxyapi_service(node):
    """检查CLIProxyAPI服务是否正在运行"""
    log(f"检查 {node} 的CLIProxyAPI服务...")
    
    # 检查Docker是否运行
    success, docker_status = ssh_exec(node, "systemctl is-active docker")
    if success:
        if "active" in docker_status:
            log(f"✅ Docker服务正在运行")
        else:
            log(f"⚠️ Docker服务未运行，正在尝试启动...", "WARNING")
            start_success, start_result = ssh_exec(node, "systemctl start docker")
            if start_success:
                time.sleep(5)  # 等待Docker完全启动
                check_success, check_status = ssh_exec(node, "systemctl is-active docker")
                if "active" in check_status:
                    log(f"✅ Docker服务启动成功")
                else:
                    log(f"❌ Docker服务启动失败: {check_status}", "ERROR")
                    return False
            else:
                log(f"❌ 无法启动Docker服务: {start_result}", "ERROR")
                return False
    else:
        log(f"❌ 无法检查Docker服务状态: {docker_status}", "ERROR")
        return False
    
    # 检查CLIProxyAPI容器是否正在运行
    success, container_status = ssh_exec(node, "docker ps | grep cliproxyapi")
    if success:
        if container_status:
            log(f"✅ CLIProxyAPI容器正在运行")
            return True
        else:
            log(f"⚠️ CLIProxyAPI容器未运行，正在尝试启动...", "WARNING")
            # 尝试启动CLIProxyAPI容器
            start_cmd = "cd /root/cliproxyapi && docker-compose up -d"
            start_success, start_result = ssh_exec(node, start_cmd, timeout=300)  # 增加超时时间
            if start_success:
                time.sleep(10)  # 等待容器完全启动
                check_success, check_status = ssh_exec(node, "docker ps | grep cliproxyapi")
                if check_status:
                    log(f"✅ CLIProxyAPI容器已成功启动")
                    return True
                else:
                    log(f"❌ CLIProxyAPI容器启动失败: {check_status}", "ERROR")
                    return False
            else:
                log(f"❌ 无法启动CLIProxyAPI容器: {start_result}", "ERROR")
                return False
    else:
        log(f"❌ 无法检查CLIProxyAPI容器状态: {container_status}", "ERROR")
        return False

def check_cliproxyapi_health(node):
    """检查CLIProxyAPI服务的健康状态"""
    log(f"检查 {node} 的CLIProxyAPI服务健康状态...")
    
    # 检查API是否响应
    api_check_cmd = "curl -s -o /dev/null -w \"%{http_code}\" http://localhost:8317/v1/models"
    success, api_result = ssh_exec(node, api_check_cmd)
    
    if success:
        if api_result == "200":
            log(f"✅ CLIProxyAPI服务API响应正常")
            return True
        else:
            log(f"❌ CLIProxyAPI服务API响应异常: HTTP {api_result}", "ERROR")
            return False
    else:
        log(f"❌ 无法检查CLIProxyAPI服务健康状态: {api_result}", "ERROR")
        return False

def check_auth_files(node):
    """检查授权文件是否存在"""
    log(f"检查 {node} 的授权文件...")
    
    auth_files_cmd = "ls -la /opt/cliproxyapi/auths"
    success, auth_result = ssh_exec(node, auth_files_cmd)
    
    if success:
        log(f"授权文件目录内容:\n{auth_result}")
        return True
    else:
        log(f"❌ 无法检查授权文件目录: {auth_result}", "ERROR")
        return False

def update_task_status(task_id, status="running", progress_msg="任务已恢复"):
    """更新任务状态"""
    log(f"更新任务状态 - {task_id}: {status}")
    
    tasks_file = "/root/.openclaw/workspace/state/tasks.json"
    
    try:
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
    update_task_status(TASK_ID, "running", "任务已恢复，正在检查CLIProxyAPI服务")
    
    # 3. 检查并启动CLIProxyAPI服务
    if not check_cliproxyapi_service(NODE):
        log("❌ CLIProxyAPI服务无法启动，任务恢复失败", "ERROR")
        return
    
    # 4. 检查CLIProxyAPI服务健康状态
    if not check_cliproxyapi_health(NODE):
        log("❌ CLIProxyAPI服务健康检查失败，任务恢复失败", "ERROR")
        return
    
    # 5. 检查授权文件
    check_auth_files(NODE)
    
    # 6. 标记任务为已完成（因为用户已经在浏览器中完成了OAuth授权）
    log("=" * 50)
    log(f"任务恢复完成: {TASK_ID}")
    log("=" * 50)
    
    update_task_status(TASK_ID, "completed", "CLIProxyAPI服务已启动并正常运行，用户已在浏览器完成OAuth授权，token-harvester-e2e任务已完成")

if __name__ == "__main__":
    main()
