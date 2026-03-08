#!/usr/bin/env python3
"""
监控任务恢复进度
任务ID: 
- recovery-bot.szspd.cn-1772534013
- recovery-bot2.szspd.cn-1772534023
"""

import time
import json
from datetime import datetime

def log(msg, level="INFO"):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [{level}] {msg}")

def get_task_status(task_id):
    """获取任务状态"""
    tasks_file = "/root/.openclaw/workspace/state/tasks.json"
    
    try:
        with open(tasks_file, 'r') as f:
            tasks_data = json.load(f)
        
        if task_id in tasks_data['tasks']:
            return tasks_data['tasks'][task_id]
        else:
            log(f"任务 {task_id} 未找到", "WARNING")
            return None
    except Exception as e:
        log(f"无法读取任务文件: {e}", "ERROR")
        return None

def monitor_tasks():
    """监控任务进度"""
    tasks = [
        "recovery-bot.szspd.cn-1772534013",
        "recovery-bot2.szspd.cn-1772534023"
    ]
    
    log("开始监控任务恢复进度...")
    
    while True:
        all_completed = True
        
        for task_id in tasks:
            task_info = get_task_status(task_id)
            if task_info:
                status = task_info['status']
                updated_at = task_info['updated_at']
                
                log(f"任务 {task_id} - 状态: {status}, 最后更新: {updated_at}")
                
                if status != 'completed':
                    all_completed = False
            else:
                log(f"无法获取任务 {task_id} 的状态", "ERROR")
                all_completed = False
        
        if all_completed:
            log("所有任务已完成！")
            break
        
        log("任务尚未全部完成，等待30秒后再次检查...")
        time.sleep(30)

def main():
    monitor_tasks()

if __name__ == "__main__":
    main()
