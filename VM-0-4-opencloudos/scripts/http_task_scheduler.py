#!/usr/bin/env python3
"""
HTTP任务调度器 - 实现基于HTTP的任务调度和执行
"""

import json
import time
import threading
import queue
import requests
from datetime import datetime
from http_communication_optimizer import HTTPNodeCommunicationOptimizer


class HTTPTaskScheduler:
    """HTTP任务调度器"""
    
    def __init__(self):
        self.task_queue = queue.Queue()
        self.completed_tasks = []
        self.failed_tasks = []
        self.optimization_interval = 600  # 10分钟
        self.http_optimizer = HTTPNodeCommunicationOptimizer()
        self.running = False
        self.optimization_thread = None
        self.scheduler_config = {}
        self.nodes = []
    
    def load_scheduler_config(self):
        """加载调度器配置"""
        try:
            with open('http_task_scheduler_config.json', 'r', encoding='utf-8') as f:
                self.scheduler_config = json.load(f)
        except FileNotFoundError:
            # 创建默认配置
            self.scheduler_config = {
                "name": "HTTP-Based Task Scheduler",
                "version": "2.0.0",
                "max_retries": 3,
                "retry_delay": 5,  # 秒
                "task_timeout": 300,  # 5分钟
                "health_check_interval": 300,  # 5分钟
                "load_balance_threshold": 0.8,
                "priority_levels": ["high", "medium", "low"]
            }
    
    def start_scheduler(self):
        """启动调度器"""
        print("启动HTTP任务调度器...")
        
        # 加载配置
        self.load_scheduler_config()
        
        # 获取节点状态
        self.nodes = self.http_optimizer.nodes
        
        # 启动优化线程
        self.running = True
        self.optimization_thread = threading.Thread(target=self._optimization_loop)
        self.optimization_thread.start()
        
        # 启动任务调度线程
        self.scheduling_thread = threading.Thread(target=self._scheduling_loop)
        self.scheduling_thread.start()
        
        print("调度器已启动")
        return True
    
    def _optimization_loop(self):
        """优化循环"""
        while self.running:
            try:
                print(f"运行网络优化 ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})")
                self.http_optimizer.test_http_connectivity()
                self.http_optimizer.optimize_http_communication()
                
                time.sleep(self.optimization_interval)
            except Exception as e:
                print(f"优化循环错误: {str(e)}")
                time.sleep(self.optimization_interval)
    
    def _scheduling_loop(self):
        """调度循环"""
        while self.running:
            try:
                # 调度任务
                self._schedule_task()
                
                time.sleep(1)
            except Exception as e:
                print(f"调度循环错误: {str(e)}")
                time.sleep(5)
    
    def _schedule_task(self):
        """调度任务"""
        if self.task_queue.empty():
            return
        
        # 获取最优节点
        optimal_node = self.get_optimal_task_node()
        
        if not optimal_node:
            print("没有可用的节点")
            return
        
        # 从队列中获取任务
        task = self.task_queue.get()
        
        # 执行任务
        self._execute_task(task, optimal_node)
    
    def get_optimal_task_node(self):
        """获取最优任务节点"""
        # 检查节点健康状态
        healthy_nodes = []
        
        for node in self.nodes:
            host = node["host"]
            stats = next((s for s in self.http_optimizer.network_stats if s["node"] == host), {})
            
            if (stats.get("http_reachable") or stats.get("https_reachable")) and stats.get("http_response_time_ms", float('inf')) < 5000:
                healthy_nodes.append({
                    "host": host,
                    "response_time_ms": stats.get("http_response_time_ms", float('inf')),
                    "cpu": node.get("cpu", 0),
                    "ram_gb": node.get("ram_mb", 0) / 1024,
                    "type": node.get("type", "unknown"),
                    "role": node.get("role", "unknown")
                })
        
        if not healthy_nodes:
            return None
        
        # 根据任务类型选择最佳节点
        # 这里可以根据任务类型实现更智能的调度
        optimal_node = min(healthy_nodes, key=lambda x: x["response_time_ms"])
        
        return optimal_node["host"]
    
    def _execute_task(self, task, target_node):
        """执行任务"""
        task_id = task.get("task_id", str(time.time()))
        task_type = task.get("type", "lightweight")
        
        print(f"执行任务 {task_id} 在节点 {target_node} 上")
        
        try:
            # 准备任务数据
            task_data = {
                "task_id": task_id,
                "type": task_type,
                "parameters": task.get("parameters", {}),
                "priority": task.get("priority", "medium"),
                "timestamp": time.time()
            }
            
            # 发送任务到目标节点
            response = requests.post(
                f'http://{target_node}/execute',
                json=task_data,
                timeout=self.scheduler_config.get("task_timeout", 300)
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"任务 {task_id} 成功执行在节点 {target_node}")
                self.completed_tasks.append({
                    "task": task,
                    "node": target_node,
                    "result": result,
                    "timestamp": time.time(),
                    "execution_time_ms": response.elapsed.total_seconds() * 1000
                })
            else:
                raise Exception(f"任务执行失败，状态码: {response.status_code}")
                
        except Exception as e:
            print(f"任务 {task_id} 执行失败: {str(e)}")
            self.failed_tasks.append({
                "task": task,
                "node": target_node,
                "error": str(e),
                "timestamp": time.time()
            })
    
    def add_task(self, task):
        """添加任务到队列"""
        # 验证任务格式
        if not isinstance(task, dict):
            raise Exception("任务必须是字典格式")
        
        if "task_id" not in task:
            task["task_id"] = str(time.time())
        
        if "priority" not in task:
            task["priority"] = "medium"
        
        print(f"添加任务 {task.get('task_id')} 到队列")
        self.task_queue.put(task)
    
    def get_scheduler_status(self):
        """获取调度器状态"""
        status = {
            "running": self.running,
            "queue_size": self.task_queue.qsize(),
            "completed_tasks": len(self.completed_tasks),
            "failed_tasks": len(self.failed_tasks),
            "total_tasks": len(self.completed_tasks) + len(self.failed_tasks) + self.task_queue.qsize(),
            "nodes": []
        }
        
        for node in self.nodes:
            host = node["host"]
            stats = next((s for s in self.http_optimizer.network_stats if s["node"] == host), {})
            
            status["nodes"].append({
                "host": host,
                "reachable": stats.get("http_reachable") or stats.get("https_reachable"),
                "response_time_ms": stats.get("http_response_time_ms", float('inf')),
                "services": stats.get("services_available", []),
                "role": node.get("role", "unknown"),
                "cpu": node.get("cpu", 0),
                "ram_gb": node.get("ram_mb", 0) / 1024
            })
        
        return status
    
    def stop_scheduler(self):
        """停止调度器"""
        print("停止HTTP任务调度器...")
        
        self.running = False
        
        if self.optimization_thread:
            self.optimization_thread.join(timeout=10)
        
        if self.scheduling_thread:
            self.scheduling_thread.join(timeout=10)
        
        print("调度器已停止")
        return True
    
    def generate_scheduler_report(self):
        """生成调度器报告"""
        report = {
            "report_name": "HTTP任务调度器状态报告",
            "timestamp": time.time(),
            "scheduler_config": self.scheduler_config,
            "status": self.get_scheduler_status(),
            "optimization_report": self.http_optimizer.generate_report(),
            "performance_metrics": {
                "average_execution_time_ms": statistics.mean(
                    task.get("execution_time_ms", 0) for task in self.completed_tasks
                ),
                "success_rate": len(self.completed_tasks) / max(len(self.completed_tasks) + len(self.failed_tasks), 1),
                "average_queue_time_ms": self._calculate_average_queue_time()
            }
        }
        
        filename = f"http_task_scheduler_report_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"调度器报告已生成: {filename}")
        
        return filename
    
    def _calculate_average_queue_time(self):
        """计算平均排队时间"""
        # 需要更详细的任务时间信息来计算排队时间
        return 0
    
    def test_task_execution(self, task_type="lightweight"):
        """测试任务执行"""
        # 创建测试任务
        test_task = {
            "task_id": f"test_task_{time.time()}",
            "type": task_type,
            "parameters": {"test": True, "iterations": 100},
            "priority": "high"
        }
        
        self.add_task(test_task)
        
        # 等待任务执行
        start_time = time.time()
        while time.time() - start_time < 60:
            if any(task.get("task_id") == test_task["task_id"] for task in self.completed_tasks + self.failed_tasks):
                break
            time.sleep(1)
        
        # 检查结果
        for task in self.completed_tasks:
            if task.get("task") and task.get("task").get("task_id") == test_task["task_id"]:
                print("测试任务成功执行")
                return True
        
        for task in self.failed_tasks:
            if task.get("task") and task.get("task").get("task_id") == test_task["task_id"]:
                print("测试任务执行失败")
                return False
        
        # 任务可能仍在队列中
        if self.task_queue.empty():
            print("测试任务未找到，可能执行超时")
            return False
        
        return False


if __name__ == "__main__":
    import statistics
    
    try:
        # 创建调度器实例
        scheduler = HTTPTaskScheduler()
        
        # 启动调度器
        scheduler.start_scheduler()
        
        # 添加一些测试任务
        print("添加测试任务到队列...")
        
        test_tasks = [
            {
                "task_id": "test_task_1",
                "type": "compute_intensive",
                "parameters": {"data_size": "large", "algorithm": "neural_network"},
                "priority": "high"
            },
            {
                "task_id": "test_task_2",
                "type": "lightweight",
                "parameters": {"data_size": "small", "algorithm": "sorting"},
                "priority": "medium"
            },
            {
                "task_id": "test_task_3",
                "type": "network_intensive",
                "parameters": {"url_count": 100, "timeout": 10},
                "priority": "low"
            }
        ]
        
        for task in test_tasks:
            scheduler.add_task(task)
        
        # 等待任务执行
        time.sleep(30)
        
        # 生成调度器报告
        scheduler.generate_scheduler_report()
        
        # 测试任务执行
        if scheduler.test_task_execution():
            print("✅ 任务调度系统工作正常")
        else:
            print("❌ 任务调度系统测试失败")
        
        # 停止调度器
        scheduler.stop_scheduler()
        
    except Exception as e:
        print(f"任务调度器错误: {str(e)}")
        import traceback
        print(f"详细错误信息: {traceback.format_exc()}")
