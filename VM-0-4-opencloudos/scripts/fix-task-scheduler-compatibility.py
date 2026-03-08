#!/usr/bin/env python3
"""
任务调度器兼容性修复脚本
修复任务调度器与checkpoint管理器状态不匹配问题
"""

import json
import os
import sys
from datetime import datetime, timezone

STATE_DIR = "/root/.openclaw/workspace/state"
TASKS_FILE = os.path.join(STATE_DIR, "tasks.json")
CHECKPOINT_FILE = os.path.join(STATE_DIR, "checkpoint.json")

def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def load_json(file_path):
    """加载JSON文件，处理不存在的情况"""
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ 加载文件 {file_path} 失败: {e}")
        return {}

def save_json(data, file_path):
    """保存JSON文件"""
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 文件 {file_path} 已保存")
    except Exception as e:
        print(f"❌ 保存文件 {file_path} 失败: {e}")

def ensure_dir(dir_path):
    """确保目录存在"""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path, exist_ok=True)

def fix_task_scheduler_compatibility():
    """修复任务调度器兼容性问题"""
    print("=== 开始修复任务调度器兼容性问题 ===")
    
    # 确保状态目录存在
    ensure_dir(STATE_DIR)
    
    # 加载任务调度器数据
    tasks_data = load_json(TASKS_FILE)
    checkpoint_data = load_json(CHECKPOINT_FILE)
    
    # 1. 数据结构对齐 - 确保必要字段存在
    print("\n1. 数据结构对齐")
    fix_tasks_data_structure(tasks_data)
    fix_checkpoint_data_structure(checkpoint_data)
    
    # 2. 状态同步 - 确保两个系统状态一致
    print("\n2. 状态同步")
    sync_task_status(tasks_data, checkpoint_data)
    
    # 3. 字段兼容性修复 - 统一字段名称和格式
    print("\n3. 字段兼容性修复")
    fix_field_compatibility(tasks_data, checkpoint_data)
    
    # 4. 保存修复后的数据
    save_json(tasks_data, TASKS_FILE)
    save_json(checkpoint_data, CHECKPOINT_FILE)
    
    print("\n=== 任务调度器兼容性修复完成 ===")
    print(f"任务调度器任务数: {len(tasks_data.get('tasks', {}))}")
    active_task = checkpoint_data.get('active_task')
    print(f"活跃任务: {active_task.get('id', '无') if active_task else '无'}")
    print(f"中断任务数: {len(checkpoint_data.get('interrupted_tasks', []))}")

def fix_tasks_data_structure(data):
    """修复任务调度器数据结构"""
    if "tasks" not in data:
        data["tasks"] = {}
    if "queue" not in data:
        data["queue"] = []
    if "stats" not in data:
        data["stats"] = {"created": 0, "completed": 0, "interrupted": 0}
    if "last_updated" not in data:
        data["last_updated"] = now()
    
    # 修复任务字段
    for task_id, task in data["tasks"].items():
        if "source" not in task:
            task["source"] = "unknown"
        if "priority" not in task:
            task["priority"] = 5
        if "steps" not in task:
            task["steps"] = []
        if "progress_log" not in task:
            task["progress_log"] = []
        if "resume_instructions" not in task:
            task["resume_instructions"] = ""
        if "blocked_reason" not in task:
            task["blocked_reason"] = ""
        if "context" not in task:
            task["context"] = {}
        if "result" not in task:
            task["result"] = ""
        if "started_at" not in task:
            task["started_at"] = None
        if "completed_at" not in task:
            task["completed_at"] = None
    
    # 修复队列
    valid_tids = set(data["tasks"].keys())
    data["queue"] = [tid for tid in data["queue"] if tid in valid_tids]

def fix_checkpoint_data_structure(data):
    """修复checkpoint管理器数据结构"""
    if "version" not in data:
        data["version"] = 2
    if "active_task" not in data:
        data["active_task"] = None
    if "interrupted_tasks" not in data:
        data["interrupted_tasks"] = []
    if "completed_tasks" not in data:
        data["completed_tasks"] = []
    if "last_updated" not in data:
        data["last_updated"] = now()
    
    # 修复任务字段
    if data["active_task"]:
        fix_task_fields(data["active_task"])
    
    for task in data["interrupted_tasks"]:
        fix_task_fields(task)
    
    for task in data["completed_tasks"]:
        fix_task_fields(task)

def fix_task_fields(task):
    """修复单个任务的字段"""
    if "id" not in task:
        task["id"] = "unknown"
    if "description" not in task:
        task["description"] = "未描述"
    if "status" not in task:
        task["status"] = "queued"
    if "started_at" not in task:
        task["started_at"] = now()
    if "updated_at" not in task:
        task["updated_at"] = now()
    if "steps" not in task:
        task["steps"] = []
    if "progress_log" not in task:
        task["progress_log"] = []
    if "resume_instructions" not in task:
        task["resume_instructions"] = ""
    if "context" not in task:
        task["context"] = {}
    if "interrupt_reason" not in task:
        task["interrupt_reason"] = ""

def sync_task_status(tasks_data, checkpoint_data):
    """同步任务状态"""
    # 同步活跃任务
    if checkpoint_data.get("active_task"):
        active_task = checkpoint_data["active_task"]
        task_id = active_task["id"]
        
        if task_id not in tasks_data["tasks"]:
            # 添加到任务调度器
            tasks_data["tasks"][task_id] = create_scheduler_task_from_checkpoint(active_task)
            tasks_data["queue"].append(task_id)
            tasks_data["stats"]["created"] += 1
        else:
            # 更新任务状态
            tasks_data["tasks"][task_id]["status"] = active_task["status"]
            tasks_data["tasks"][task_id]["updated_at"] = active_task["updated_at"]
    
    # 同步中断任务
    for task in checkpoint_data.get("interrupted_tasks", []):
        task_id = task["id"]
        
        if task_id not in tasks_data["tasks"]:
            tasks_data["tasks"][task_id] = create_scheduler_task_from_checkpoint(task)
            tasks_data["stats"]["created"] += 1
        else:
            tasks_data["tasks"][task_id]["status"] = "suspended"
            tasks_data["tasks"][task_id]["blocked_reason"] = task.get("interrupt_reason", "中断")
            tasks_data["tasks"][task_id]["updated_at"] = task["updated_at"]

def create_scheduler_task_from_checkpoint(checkpoint_task):
    """从checkpoint任务创建调度器任务"""
    return {
        "id": checkpoint_task["id"],
        "description": checkpoint_task["description"],
        "source": "migrated",
        "priority": 3,
        "tags": [],
        "status": checkpoint_task.get("status", "queued"),
        "created_at": checkpoint_task.get("started_at", now()),
        "updated_at": checkpoint_task.get("updated_at", now()),
        "started_at": checkpoint_task.get("started_at"),
        "completed_at": checkpoint_task.get("completed_at"),
        "steps": checkpoint_task.get("steps", []),
        "progress_log": checkpoint_task.get("progress_log", []),
        "resume_instructions": checkpoint_task.get("resume_instructions", ""),
        "blocked_reason": checkpoint_task.get("interrupt_reason", ""),
        "context": checkpoint_task.get("context", {}),
        "result": ""
    }

def fix_field_compatibility(tasks_data, checkpoint_data):
    """修复字段兼容性问题"""
    # 统一字段名称和格式
    fix_progress_log_format(tasks_data, checkpoint_data)
    fix_steps_format(tasks_data, checkpoint_data)
    fix_resume_instructions(tasks_data, checkpoint_data)
    fix_context_fields(tasks_data, checkpoint_data)

def fix_progress_log_format(tasks_data, checkpoint_data):
    """修复进度日志格式"""
    # 确保进度日志字段存在且格式一致
    for task_id, task in tasks_data["tasks"].items():
        if "progress_log" not in task:
            task["progress_log"] = []
        else:
            # 确保每个日志条目有time和msg字段
            for log in task["progress_log"]:
                if "time" not in log:
                    log["time"] = now()
                if "msg" not in log:
                    log["msg"] = "未描述的进度"
    
    if checkpoint_data.get("active_task"):
        if "progress_log" not in checkpoint_data["active_task"]:
            checkpoint_data["active_task"]["progress_log"] = []
        else:
            for log in checkpoint_data["active_task"]["progress_log"]:
                if "time" not in log:
                    log["time"] = now()
                if "msg" not in log:
                    log["msg"] = "未描述的进度"
    
    for task in checkpoint_data.get("interrupted_tasks", []):
        if "progress_log" not in task:
            task["progress_log"] = []
        else:
            for log in task["progress_log"]:
                if "time" not in log:
                    log["time"] = now()
                if "msg" not in log:
                    log["msg"] = "未描述的进度"

def fix_steps_format(tasks_data, checkpoint_data):
    """修复步骤格式"""
    for task_id, task in tasks_data["tasks"].items():
        if "steps" in task:
            for step in task["steps"]:
                if "name" not in step:
                    step["name"] = "未命名步骤"
                if "status" not in step:
                    step["status"] = "pending"
                if "updated_at" not in step:
                    step["updated_at"] = now()
    
    if checkpoint_data.get("active_task") and "steps" in checkpoint_data["active_task"]:
        for step in checkpoint_data["active_task"]["steps"]:
            if "name" not in step:
                step["name"] = "未命名步骤"
            if "status" not in step:
                step["status"] = "pending"
            if "updated_at" not in step:
                step["updated_at"] = now()
    
    for task in checkpoint_data.get("interrupted_tasks", []):
        if "steps" in task:
            for step in task["steps"]:
                if "name" not in step:
                    step["name"] = "未命名步骤"
                if "status" not in step:
                    step["status"] = "pending"
                if "updated_at" not in step:
                    step["updated_at"] = now()

def fix_resume_instructions(tasks_data, checkpoint_data):
    """修复恢复指令"""
    for task_id, task in tasks_data["tasks"].items():
        if "resume_instructions" not in task:
            task["resume_instructions"] = ""
        elif not isinstance(task["resume_instructions"], str):
            task["resume_instructions"] = str(task["resume_instructions"])
    
    if checkpoint_data.get("active_task"):
        if "resume_instructions" not in checkpoint_data["active_task"]:
            checkpoint_data["active_task"]["resume_instructions"] = ""
        elif not isinstance(checkpoint_data["active_task"]["resume_instructions"], str):
            checkpoint_data["active_task"]["resume_instructions"] = str(
                checkpoint_data["active_task"]["resume_instructions"]
            )
    
    for task in checkpoint_data.get("interrupted_tasks", []):
        if "resume_instructions" not in task:
            task["resume_instructions"] = ""
        elif not isinstance(task["resume_instructions"], str):
            task["resume_instructions"] = str(task["resume_instructions"])

def fix_context_fields(tasks_data, checkpoint_data):
    """修复上下文字段"""
    for task_id, task in tasks_data["tasks"].items():
        if "context" not in task:
            task["context"] = {}
    
    if checkpoint_data.get("active_task"):
        if "context" not in checkpoint_data["active_task"]:
            checkpoint_data["active_task"]["context"] = {}
    
    for task in checkpoint_data.get("interrupted_tasks", []):
        if "context" not in task:
            task["context"] = {}

def create_backup():
    """创建数据备份"""
    backup_dir = os.path.join(STATE_DIR, "backup")
    ensure_dir(backup_dir)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if os.path.exists(TASKS_FILE):
        import shutil
        shutil.copy(TASKS_FILE, os.path.join(backup_dir, f"tasks_{timestamp}.json"))
    
    if os.path.exists(CHECKPOINT_FILE):
        import shutil
        shutil.copy(CHECKPOINT_FILE, os.path.join(backup_dir, f"checkpoint_{timestamp}.json"))
    
    print(f"✅ 数据备份已创建: {backup_dir}")

def main():
    """主函数"""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("""用法: python3 fix-task-scheduler-compatibility.py [选项]
        
选项:
  --help              显示此帮助信息
  --backup            在修复前创建备份
  --dry-run           模拟修复，不修改数据
  --force             强制修复，覆盖现有数据
        
示例:
  python3 fix-task-scheduler-compatibility.py --backup
  python3 fix-task-scheduler-compatibility.py --dry-run
    """)
        return
    
    # 检查是否需要创建备份
    if "--backup" in sys.argv or "--force" in sys.argv:
        create_backup()
    
    if "--dry-run" in sys.argv:
        print("=== 模拟修复（不修改数据） ===")
        tasks_data = load_json(TASKS_FILE)
        checkpoint_data = load_json(CHECKPOINT_FILE)
        print(f"任务调度器任务数: {len(tasks_data.get('tasks', {}))}")
        active_task = checkpoint_data.get('active_task')
        print(f"活跃任务: {active_task.get('id', '无') if active_task else '无'}")
        print(f"中断任务数: {len(checkpoint_data.get('interrupted_tasks', []))}")
    else:
        fix_task_scheduler_compatibility()

if __name__ == "__main__":
    main()
