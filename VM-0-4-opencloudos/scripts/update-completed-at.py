#!/usr/bin/env python3
"""
更新token-harvester-e2e任务的completed_at字段
"""

import json
from datetime import datetime

def update_completed_at():
    """更新completed_at字段"""
    tasks_file = "/root/.openclaw/workspace/state/tasks.json"
    
    try:
        with open(tasks_file, 'r') as f:
            tasks_data = json.load(f)
        
        task_id = "token-harvester-e2e"
        
        if task_id in tasks_data['tasks']:
            tasks_data['tasks'][task_id]['completed_at'] = "2026-03-03T17:36:04Z"
            tasks_data['last_updated'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            
            with open(tasks_file, 'w') as f:
                json.dump(tasks_data, f, indent=2, default=str)
            
            print("✅ 任务完成时间已更新")
            return True
        else:
            print(f"⚠️ 未找到任务 {task_id}")
            return False
    
    except Exception as e:
        print(f"❌ 无法更新任务完成时间: {e}")
        return False

if __name__ == "__main__":
    update_completed_at()
