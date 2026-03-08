#!/usr/bin/env python3
"""
智能任务调度器 - 基于通信优化的任务分配
"""

import json
import time
import subprocess
import random
from communication_optimizer import NodeCommunicationOptimizer


class SmartTaskScheduler:
    """智能任务调度器"""
    
    def __init__(self):
        self.optimizer = NodeCommunicationOptimizer()
        self.task_queue = []
        self.task_assignments = {}
        self.task_history = []
        self.load_balancer = TaskLoadBalancer()
    
    def add_task(self, task):
        """添加任务到队列"""
        task["id"] = self._generate_task_id()
        task["status"] = "pending"
        task["created_at"] = time.time()
        
        self.task_queue.append(task)
        
        print(f"任务添加成功: {task['id']} - {task['name']}")
        return task["id"]
    
    def _generate_task_id(self):
        """生成唯一任务ID"""
        timestamp = int(time.time() * 1000)
        random_id = random.randint(1000, 9999)
        return f"task_{timestamp}_{random_id}"
    
    def optimize_task_scheduling(self):
        """优化任务调度"""
        pending_tasks = [task for task in self.task_queue if task["status"] == "pending"]
        
        if not pending_tasks:
            print("任务队列为空，无需调度")
            return
        
        # 优化任务分配
        for task in pending_tasks:
            optimal_node = self._find_optimal_node_for_task(task)
            
            if optimal_node:
                self._assign_task(task, optimal_node)
            else:
                print(f"任务 {task['id']} 无法分配到任何节点")
    
    def _find_optimal_node_for_task(self, task):
        """为任务找到最佳节点"""
        task_type = self._infer_task_type(task)
        
        # 使用通信优化器选择节点
        optimal_node = self.optimizer.get_optimal_node(task_type)
        
        # 检查节点负载是否合理
        if optimal_node and self.load_balancer.is_node_overloaded(optimal_node):
            # 如果节点过载，选择负载较低的替代节点
            optimal_node = self.load_balancer.find_lowest_load_node(optimal_node)
        
        return optimal_node
    
    def _infer_task_type(self, task):
        """推断任务类型"""
        task_name = task.get("name", "").lower()
        
        if any(keyword in task_name for keyword in ["download", "upload", "sync"]):
            return "network_intensive"
        elif any(keyword in task_name for keyword in ["compute", "render", "analyze"]):
            return "compute_intensive"
        else:
            return "lightweight"
    
    def _assign_task(self, task, node):
        """分配任务到节点"""
        task["status"] = "assigned"
        task["assigned_node"] = node
        task["assigned_at"] = time.time()
        
        self.task_assignments[task["id"]] = node
        
        print(f"任务 {task['id']} 已分配到节点 {node}")
        
        # 更新负载统计
        task_weight = self._calculate_task_weight(task)
        self.load_balancer.update_node_load(node, task_weight)
    
    def _calculate_task_weight(self, task):
        """计算任务权重"""
        task_type = self._infer_task_type(task)
        
        weights = {
            "network_intensive": 1.0,
            "compute_intensive": 0.6,
            "lightweight": 0.2
        }
        
        return weights.get(task_type, 0.5)
    
    def execute_task(self, task_id):
        """执行任务"""
        task = next((t for t in self.task_queue if t["id"] == task_id), None)
        
        if not task:
            raise Exception(f"任务 {task_id} 不存在")
        
        if task["status"] == "pending":
            self.optimize_task_scheduling()
        
        if task["status"] != "assigned":
            raise Exception(f"任务 {task_id} 未分配到节点")
        
        node = task["assigned_node"]
        
        print(f"正在节点 {node} 执行任务: {task['id']}")
        
        try:
            task["status"] = "running"
            task["started_at"] = time.time()
            
            # 执行任务
            result = self._execute_on_node(task, node)
            
            task["status"] = "completed"
            task["completed_at"] = time.time()
            task["result"] = result
            
            self._log_task_result(task)
            
            return result
        
        except Exception as e:
            task["status"] = "failed"
            task["failed_at"] = time.time()
            task["error"] = str(e)
            
            self._log_task_result(task)
            
            # 任务失败处理
            self._handle_task_failure(task)
    
    def _execute_on_node(self, task, node):
        """在节点上执行任务"""
        command = task.get("command")
        
        try:
            result = subprocess.run(
                ['ssh', node, command],
                capture_output=True,
                text=True,
                check=True,
                timeout=task.get("timeout", 300)
            )
            
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            raise Exception("任务执行超时")
        except subprocess.CalledProcessError as e:
            raise Exception(f"命令执行失败 (返回码 {e.returncode}): {e.output}")
        except Exception as e:
            raise Exception(f"执行任务失败: {str(e)}")
    
    def _handle_task_failure(self, task):
        """处理任务失败"""
        node = task["assigned_node"]
        
        # 记录失败信息
        failure_info = {
            "task_id": task["id"],
            "node": node,
            "error": task["error"],
            "timestamp": task["failed_at"]
        }
        
        self.task_history.append(failure_info)
        
        print(f"任务 {task['id']} 执行失败: {task['error']}")
        
        # 尝试重新分配到其他节点
        self._reassign_failed_task(task)
    
    def _reassign_failed_task(self, task):
        """重新分配失败的任务"""
        available_nodes = self.optimizer.health_check()
        
        if task["assigned_node"] in available_nodes:
            available_nodes.remove(task["assigned_node"])
        
        if not available_nodes:
            print(f"无其他可用节点，任务 {task['id']} 无法重新分配")
            return
        
        # 尝试分配到其他节点
        for node in available_nodes:
            try:
                self._assign_task(task, node)
                self.execute_task(task["id"])
                break
            except Exception as e:
                print(f"重新分配到节点 {node} 失败: {str(e)}")
                continue
    
    def _log_task_result(self, task):
        """记录任务结果"""
        task_result = {
            "id": task["id"],
            "name": task["name"],
            "node": task.get("assigned_node"),
            "status": task["status"],
            "created_at": task["created_at"],
            "started_at": task.get("started_at"),
            "completed_at": task.get("completed_at"),
            "duration": None,
            "result": task.get("result"),
            "error": task.get("error")
        }
        
        if task["status"] == "completed":
            task_result["duration"] = task["completed_at"] - task["started_at"]
            print(f"任务完成: {task['id']} - 耗时 {task_result['duration']:.2f}秒")
        
        self.task_history.append(task_result)
    
    def get_task_status(self, task_id):
        """获取任务状态"""
        task = next((t for t in self.task_queue if t["id"] == task_id), None)
        
        if not task:
            raise Exception(f"任务 {task_id} 不存在")
        
        return task
    
    def get_stats(self):
        """获取调度统计信息"""
        total_tasks = len(self.task_queue)
        completed_tasks = [t for t in self.task_queue if t["status"] == "completed"]
        failed_tasks = [t for t in self.task_queue if t["status"] == "failed"]
        running_tasks = [t for t in self.task_queue if t["status"] == "running"]
        pending_tasks = [t for t in self.task_queue if t["status"] == "pending"]
        
        stats = {
            "total": total_tasks,
            "completed": len(completed_tasks),
            "failed": len(failed_tasks),
            "running": len(running_tasks),
            "pending": len(pending_tasks),
            "success_rate": len(completed_tasks) / total_tasks if total_tasks > 0 else 0
        }
        
        if completed_tasks:
            avg_duration = sum(
                t["completed_at"] - t["started_at"] for t in completed_tasks
            ) / len(completed_tasks)
            stats["avg_duration"] = avg_duration
        
        return stats
    
    def save_task_history(self):
        """保存任务历史"""
        filename = f"task_scheduler_history_{int(time.time())}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.task_history, f, indent=2, ensure_ascii=False)
            
            print(f"任务历史已保存到: {filename}")
        except Exception as e:
            print(f"保存任务历史失败: {str(e)}")


class TaskLoadBalancer:
    """任务负载均衡器"""
    
    def __init__(self):
        self.node_load = {}
        self.cpu_threshold = 80
        self.memory_threshold = 85
    
    def update_node_load(self, node, task_weight):
        """更新节点负载"""
        if node not in self.node_load:
            self.node_load[node] = {"tasks": 0, "weight": 0.0}
        
        self.node_load[node]["tasks"] += 1
        self.node_load[node]["weight"] += task_weight
    
    def is_node_overloaded(self, node):
        """检查节点是否过载"""
        load_info = self.node_load.get(node, {})
        
        if load_info.get("tasks", 0) > 5:
            return True
        
        if load_info.get("weight", 0.0) > 3.0:
            return True
        
        return False
    
    def find_lowest_load_node(self, excluded_node=None):
        """找到负载最低的节点"""
        sorted_nodes = sorted(
            self.node_load.items(),
            key=lambda x: x[1]["weight"]
        )
        
        for node, load in sorted_nodes:
            if node != excluded_node and not self.is_node_overloaded(node):
                return node
        
        return None
    
    def balance_load(self):
        """执行负载均衡"""
        overloaded_nodes = [node for node, load in self.node_load.items() 
                          if self.is_node_overloaded(node)]
        
        for node in overloaded_nodes:
            self._balance_node_load(node)
    
    def _balance_node_load(self, node):
        """平衡单个节点的负载"""
        # 获取该节点上的任务
        tasks = self._get_node_tasks(node)
        
        if not tasks:
            return
        
        # 找到最合适的迁移目标节点
        target_node = self.find_lowest_load_node(node)
        
        if target_node:
            # 选择权重最低的任务进行迁移
            task_to_migrate = min(
                tasks,
                key=lambda x: x["weight"]
            )
            
            self._migrate_task(task_to_migrate, node, target_node)
    
    def _get_node_tasks(self, node):
        """获取节点上的任务"""
        # 实际实现应该从任务调度器获取
        pass
    
    def _migrate_task(self, task, from_node, to_node):
        """迁移任务"""
        # 更新任务分配
        self.update_node_load(from_node, -task["weight"])
        self.update_node_load(to_node, task["weight"])
        
        print(f"任务 {task['id']} 从 {from_node} 迁移到 {to_node}")


# 主程序入口
if __name__ == "__main__":
    import subprocess
    
    # 初始化调度器
    scheduler = SmartTaskScheduler()
    
    # 优化通信
    scheduler.optimizer.optimize_ssh_config()
    
    # 添加示例任务
    sample_tasks = [
        {
            "name": "下载数据集",
            "command": "wget https://example.com/dataset.tar.gz -O /data/dataset.tar.gz",
            "type": "network_intensive"
        },
        {
            "name": "数据分析任务",
            "command": "python3 /app/analyze.py /data/dataset.tar.gz",
            "type": "compute_intensive"
        },
        {
            "name": "更新系统",
            "command": "apt update && apt upgrade -y",
            "type": "lightweight"
        }
    ]
    
    # 添加任务到调度器
    for task in sample_tasks:
        scheduler.add_task(task)
    
    # 优化任务调度
    scheduler.optimize_task_scheduling()
    
    # 执行任务
    for task in scheduler.task_queue:
        try:
            scheduler.execute_task(task["id"])
        except Exception as e:
            print(f"任务 {task['id']} 执行失败: {str(e)}")
    
    # 输出统计信息
    print("\n=== 调度结果 ===")
    stats = scheduler.get_stats()
    
    print(f"总任务数: {stats['total']}")
    print(f"完成任务: {stats['completed']}")
    print(f"失败任务: {stats['failed']}")
    print(f"运行中任务: {stats['running']}")
    print(f"待处理任务: {stats['pending']}")
    
    if "avg_duration" in stats:
        print(f"平均执行时间: {stats['avg_duration']:.2f} 秒")
    
    # 保存任务历史
    scheduler.save_task_history()
