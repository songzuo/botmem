#!/usr/bin/env python3
"""
更新任务调度器中的任务进度脚本
"""

import json
import os
from datetime import datetime, timezone

STATE_DIR = "/root/.openclaw/workspace/state"
TASKS_FILE = os.path.join(STATE_DIR, "tasks.json")

def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def load_tasks():
    """加载任务调度器数据"""
    if not os.path.exists(TASKS_FILE):
        return {"version": 2, "tasks": {}, "queue": [], "stats": {}}
    
    with open(TASKS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_tasks(data):
    """保存任务调度器数据"""
    with open(TASKS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def update_task_progress(task_id, completed_steps, total_steps, current_phase):
    """更新任务进度"""
    tasks_data = load_tasks()
    
    if task_id not in tasks_data["tasks"]:
        print(f"任务 {task_id} 不存在")
        return False
    
    # 更新任务进度
    tasks_data["tasks"][task_id]["progress"] = {
        "completed": completed_steps,
        "total": total_steps,
        "current": current_phase
    }
    
    # 更新时间戳
    tasks_data["tasks"][task_id]["updated_at"] = now()
    
    # 保存数据
    save_tasks(tasks_data)
    print(f"任务 {task_id} 进度已更新为 {completed_steps}/{total_steps}，当前阶段：{current_phase}")
    return True

if __name__ == "__main__":
    task_id = "independent-thinking-bot6"
    completed_steps = 6
    total_steps = 6
    current_phase = "系统测试与验证"
    
    update_task_progress(task_id, completed_steps, total_steps, current_phase)
