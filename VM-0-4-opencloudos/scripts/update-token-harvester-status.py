#!/usr/bin/env python3
"""
更新token-harvester-e2e任务状态
"""

import json
from datetime import datetime

def update_task_status():
    """更新任务状态"""
    tasks_file = "/root/.openclaw/workspace/state/tasks.json"
    
    try:
        with open(tasks_file, 'r') as f:
            tasks_data = json.load(f)
        
        task_id = "token-harvester-e2e"
        
        if task_id in tasks_data['tasks']:
            tasks_data['tasks'][task_id]['status'] = "completed"
            tasks_data['tasks'][task_id]['updated_at'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            tasks_data['tasks'][task_id]['blocked_reason'] = ""
            
            # 添加进度日志
            if 'progress_log' not in tasks_data['tasks'][task_id]:
                tasks_data['tasks'][task_id]['progress_log'] = []
            
            tasks_data['tasks'][task_id]['progress_log'].append({
                "time": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "msg": "用户已在浏览器完成OAuth授权，token-harvester-e2e任务已完成"
            })
            
            tasks_data['last_updated'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            
            with open(tasks_file, 'w') as f:
                json.dump(tasks_data, f, indent=2, default=str)
            
            print("✅ 任务状态已更新")
            return True
        else:
            print(f"⚠️ 未找到任务 {task_id}")
            return False
    
    except Exception as e:
        print(f"❌ 无法更新任务状态: {e}")
        return False

if __name__ == "__main__":
    update_task_status()
