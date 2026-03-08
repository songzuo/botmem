#!/usr/bin/env python3
"""
验证token-harvester-e2e任务状态
"""

import json

def verify_task_status():
    """验证任务状态"""
    tasks_file = "/root/.openclaw/workspace/state/tasks.json"
    
    try:
        with open(tasks_file, 'r') as f:
            tasks_data = json.load(f)
        
        task_id = "token-harvester-e2e"
        
        if task_id in tasks_data['tasks']:
            task = tasks_data['tasks'][task_id]
            
            print(f"✅ 任务 {task_id} 已找到")
            print(f"   状态: {task['status']}")
            print(f"   开始时间: {task['started_at']}")
            print(f"   完成时间: {task['completed_at']}")
            print(f"   优先级: {task['priority']}")
            
            # 检查任务是否已完成
            if task['status'] == "completed":
                print("\n✅ 任务已成功完成")
                return True
            else:
                print("\n❌ 任务尚未完成")
                return False
        else:
            print(f"❌ 任务 {task_id} 未找到")
            return False
    
    except Exception as e:
        print(f"❌ 无法验证任务状态: {e}")
        return False

def check_progress_log():
    """检查任务进度日志"""
    tasks_file = "/root/.openclaw/workspace/state/tasks.json"
    
    try:
        with open(tasks_file, 'r') as f:
            tasks_data = json.load(f)
        
        task_id = "token-harvester-e2e"
        
        if task_id in tasks_data['tasks']:
            task = tasks_data['tasks'][task_id]
            
            if 'progress_log' in task and task['progress_log']:
                print("\n✅ 任务进度日志:")
                for log in task['progress_log']:
                    print(f"   {log['time']}: {log['msg']}")
                return True
            else:
                print("\n❌ 任务无进度日志")
                return False
        else:
            print(f"❌ 任务 {task_id} 未找到")
            return False
    
    except Exception as e:
        print(f"❌ 无法检查任务进度日志: {e}")
        return False

if __name__ == "__main__":
    print("token-harvester-e2e 任务状态验证")
    print("-" * 40)
    
    if verify_task_status():
        check_progress_log()
    else:
        print("\n❌ 任务验证失败")
