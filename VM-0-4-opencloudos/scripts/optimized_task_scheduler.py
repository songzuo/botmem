#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
优化的任务调度算法
实现任务分配均衡、避免重复、提高可靠性的核心优化策略
"""

import json
import time
import statistics
import logging
import hashlib
from enum import Enum
from typing import List, Dict, Optional, Any

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Region(Enum):
    """区域枚举"""
    CN = "中国区域"
    SEA = "东南亚区域"
    EU = "欧洲区域"

class TaskType(Enum):
    """任务类型枚举"""
    COORDINATION = "coordination"
    PR_REVIEW = "pr_review"
    DEPLOYMENT = "deployment"
    CODE_GENERATION = "code_generation"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    ANALYSIS = "analysis"
    HEAVY_COMPUTE = "heavy_compute"
    LIGHTWEIGHT = "lightweight"

class Node:
    """节点类"""
    def __init__(self, host, role, cpu, ram_mb, cloud, watchdog, capabilities, tasks, 
                 region, location, latency_ms, ssh_reachable, redis_reachable):
        self.host = host
        self.role = role
        self.cpu = cpu
        self.ram_mb = ram_mb
        self.cloud = cloud
        self.watchdog = watchdog
        self.capabilities = capabilities
        self.tasks = tasks
        self.region = region
        self.location = location
        self.latency_ms = latency_ms
        self.ssh_reachable = ssh_reachable
        self.redis_reachable = redis_reachable
        self.current_load = 0.0  # 当前负载 (0-1)
        self.available_cpu = cpu  # 可用CPU核心数
        self.available_ram = ram_mb  # 可用RAM (MB)
        self.active_tasks = []  # 当前正在执行的任务
        self.task_history = []  # 任务执行历史记录
    
    def __repr__(self):
        return f"Node(host={self.host}, region={self.region}, latency={self.latency_ms}ms)"

class OptimizedTaskScheduler:
    """优化的任务调度器"""
    
    def __init__(self):
        self.nodes = []
        self.region_nodes = {region: [] for region in Region}
        self.task_history = []  # 全局任务历史记录
        self.task_assignments = {}  # 任务分配记录 {task_id: node_host}
        self.task_signatures = set()  # 任务签名集合，用于避免重复
        self._load_node_configuration()
        self._load_task_history()
    
    def _load_node_configuration(self):
        """加载节点配置信息"""
        node_info = [
            {
                "host": "7zi.com",
                "role": "coordinator",
                "cpu": 8,
                "ram_mb": 16000,
                "cloud": None,
                "watchdog": True,
                "capabilities": ["docker", "1panel", "evomap", "github"],
                "tasks": ["coordination", "pr_review", "deployment"],
                "region": Region.CN,
                "location": "香港北角",
                "latency_ms": 23.62,
                "ssh_reachable": True,
                "redis_reachable": True
            },
            {
                "host": "bot.szspd.cn",
                "role": "worker",
                "cpu": 2,
                "ram_mb": 1870,
                "cloud": "aliyun",
                "watchdog": True,
                "capabilities": ["evomap", "github"],
                "tasks": ["code_generation", "testing"],
                "region": Region.SEA,
                "location": "印尼雅加达",
                "latency_ms": 349.0,
                "ssh_reachable": True,
                "redis_reachable": False
            },
            {
                "host": "bot2.szspd.cn",
                "role": "worker",
                "cpu": 2,
                "ram_mb": 1870,
                "cloud": "aliyun",
                "watchdog": True,
                "capabilities": ["evomap", "github"],
                "tasks": ["code_generation", "documentation"],
                "region": Region.SEA,
                "location": "泰国曼谷",
                "latency_ms": 386.0,
                "ssh_reachable": True,
                "redis_reachable": False
            },
            {
                "host": "bot3.szspd.cn",
                "role": "worker",
                "cpu": 4,
                "ram_mb": 3655,
                "cloud": "tencent",
                "watchdog": True,
                "capabilities": ["evomap", "github"],
                "tasks": ["code_generation", "analysis", "heavy_compute"],
                "region": Region.CN,
                "location": "中国广州",
                "latency_ms": 0.9574,
                "ssh_reachable": True,
                "redis_reachable": False
            },
            {
                "host": "bot4.szspd.cn",
                "role": "worker",
                "cpu": 2,
                "ram_mb": 2000,
                "cloud": "tencent",
                "watchdog": True,
                "capabilities": ["evomap", "github"],
                "tasks": ["code_generation", "testing"],
                "region": Region.CN,
                "location": "中国深圳",
                "latency_ms": 66.7,
                "ssh_reachable": True,
                "redis_reachable": False
            },
            {
                "host": "bot5.szspd.cn",
                "role": "worker",
                "cpu": 1,
                "ram_mb": 1963,
                "cloud": "volcengine",
                "watchdog": True,
                "capabilities": ["evomap", "github"],
                "tasks": ["code_generation", "lightweight"],
                "region": Region.CN,
                "location": "中国济南",
                "latency_ms": 22.78,
                "ssh_reachable": True,
                "redis_reachable": False
            },
            {
                "host": "bot6.szspd.cn",
                "role": "worker",
                "cpu": 4,
                "ram_mb": 8000,
                "cloud": "aws",
                "watchdog": True,
                "capabilities": ["evomap", "github"],
                "tasks": ["code_generation", "analysis", "heavy_compute"],
                "region": Region.EU,
                "location": "法国Lauterbourg",
                "latency_ms": 254.0,
                "ssh_reachable": True,
                "redis_reachable": False
            }
        ]
        
        # 创建Node对象并按区域分组
        for info in node_info:
            node = Node(**info)
            self.nodes.append(node)
            self.region_nodes[info["region"]].append(node)
    
    def _load_task_history(self):
        """加载任务历史记录"""
        try:
            with open('/root/.openclaw/workspace/state/tasks.json', 'r', encoding='utf-8') as f:
                tasks_data = json.load(f)
                for task_id, task in tasks_data.get('tasks', {}).items():
                    signature = self._generate_task_signature(task)
                    self.task_signatures.add(signature)
        except Exception as e:
            logger.warning(f"加载任务历史记录失败: {str(e)}")
    
    def _generate_task_signature(self, task):
        """生成任务签名，用于避免重复执行"""
        task_str = f"{task.get('description', '')}_{task.get('status', '')}"
        return hashlib.md5(task_str.encode('utf-8')).hexdigest()
    
    def is_duplicate_task(self, task):
        """检查任务是否是重复任务"""
        signature = self._generate_task_signature(task)
        return signature in self.task_signatures
    
    def evaluate_node(self, node, task_type):
        """评估节点的任务执行能力（优化版本）"""
        score = 0.0
        
        # 任务兼容性评分 (40分)
        if task_type.value in node.tasks:
            score += 40
        
        # 资源可用性评分 (50分) - 优化资源分配算法
        cpu_available_score = (node.available_cpu / node.cpu) * 30
        ram_available_score = (node.available_ram / node.ram_mb) * 20
        
        if node.available_cpu < node.cpu * 0.2:
            cpu_available_score *= 0.5
        if node.available_ram < node.ram_mb * 0.2:
            ram_available_score *= 0.5
        
        score += cpu_available_score + ram_available_score
        
        # 网络质量评分 (20分)
        if node.latency_ms < 10:
            score += 20
        elif node.latency_ms < 50:
            score += 15
        elif node.latency_ms < 100:
            score += 10
        else:
            score += max(0, 5 - (node.latency_ms / 200))
        
        # 可访问性评分 (10分)
        if node.ssh_reachable:
            score += 5
        if node.redis_reachable:
            score += 5
        
        # 负载评分 (30分)
        load_score = max(0, 30 - (node.current_load * 60))
        score += load_score
        
        # 资源均衡性评分 (10分)
        cpu_utilization = 1 - (node.available_cpu / node.cpu)
        ram_utilization = 1 - (node.available_ram / node.ram_mb)
        balance_score = max(0, 10 - abs(cpu_utilization - ram_utilization) * 10)
        score += balance_score
        
        # 任务类型与节点能力匹配评分 (10分)
        task_type_weights = {
            TaskType.CODE_GENERATION: 0.9,
            TaskType.HEAVY_COMPUTE: 1.2,
            TaskType.LIGHTWEIGHT: 0.7,
            TaskType.TESTING: 1.0,
            TaskType.DOCUMENTATION: 0.8,
            TaskType.ANALYSIS: 1.1
        }
        
        if task_type in task_type_weights:
            score *= task_type_weights[task_type]
        
        return score
    
    def get_nodes_by_region(self, region):
        """根据区域获取节点"""
        return self.region_nodes.get(region, [])
    
    def select_optimal_node(self, task_type, target_region=None):
        """
        选择最佳任务执行节点
        
        Args:
            task_type: 任务类型 (TaskType枚举)
            target_region: 目标区域 (可选，默认自动确定)
            
        Returns:
            最佳节点或None
        """
        # 1. 确定任务的目标区域
        if target_region is None:
            if task_type in [TaskType.COORDINATION, TaskType.PR_REVIEW, TaskType.DEPLOYMENT]:
                target_region = Region.CN
            elif task_type in [TaskType.HEAVY_COMPUTE, TaskType.ANALYSIS]:
                target_region = Region.CN
            elif task_type in [TaskType.CODE_GENERATION, TaskType.TESTING, TaskType.DOCUMENTATION]:
                cn_nodes = [node for node in self.get_nodes_by_region(Region.CN) 
                           if task_type.value in node.tasks and node.ssh_reachable]
                sea_nodes = [node for node in self.get_nodes_by_region(Region.SEA) 
                           if task_type.value in node.tasks and node.ssh_reachable]
                eu_nodes = [node for node in self.get_nodes_by_region(Region.EU) 
                           if task_type.value in node.tasks and node.ssh_reachable]
                
                all_nodes = cn_nodes + sea_nodes + eu_nodes
                
                if all_nodes:
                    # 检查各区域负载
                    region_loads = {}
                    for region in [Region.CN, Region.SEA, Region.EU]:
                        region_loads[region] = 0.0
                        region_nodes = self.get_nodes_by_region(region)
                        if region_nodes:
                            region_loads[region] = sum(node.current_load for node in region_nodes) / len(region_nodes)
                    
                    # 选择负载最低的区域
                    target_region = min(region_loads.items(), key=lambda x: x[1])[0]
                else:
                    target_region = Region.CN
            else:
                # 轻量任务平衡分配
                region_loads = {}
                for region in [Region.CN, Region.SEA, Region.EU]:
                    region_loads[region] = 0.0
                    region_nodes = self.get_nodes_by_region(region)
                    if region_nodes:
                        region_loads[region] = sum(node.current_load for node in region_nodes) / len(region_nodes)
                
                target_region = min(region_loads.items(), key=lambda x: x[1])[0]
        
        logger.info(f"任务类型: {task_type}, 目标区域: {target_region}")
        
        # 2. 获取候选节点
        candidates = []
        
        for node in self.get_nodes_by_region(target_region):
            if task_type.value in node.tasks and node.ssh_reachable:
                candidates.append(node)
        
        logger.info(f"同区域候选节点 ({len(candidates)}): {[node.host for node in candidates]}")
        
        # 检查区域负载
        region_load = sum(node.current_load for node in self.get_nodes_by_region(target_region)) / len(self.get_nodes_by_region(target_region))
        if candidates and region_load > 0.8:
            logger.warning(f"区域 {target_region} 负载过高 ({region_load:.1%})，扩大候选节点范围")
            for node in self.nodes:
                if (task_type.value in node.tasks and 
                    node.ssh_reachable and 
                    node.region != target_region and 
                    node not in candidates):
                    candidates.append(node)
        
        if not candidates:
            logger.warning(f"同区域 ({target_region}) 无合适节点，查找跨区域节点")
            for node in self.nodes:
                if task_type.value in node.tasks and node.ssh_reachable and node.region != target_region:
                    candidates.append(node)
        
        if not candidates:
            logger.error(f"无可用节点执行任务类型: {task_type}")
            return None
        
        # 3. 评估候选节点
        scores = []
        for node in candidates:
            score = self.evaluate_node(node, task_type)
            scores.append((node, score))
        
        # 4. 按评分排序
        sorted_nodes = sorted(scores, key=lambda x: x[1], reverse=True)
        
        logger.info("节点评分:")
        for node, score in sorted_nodes:
            logger.info(f"  {node.host}: {score:.2f}分")
        
        return sorted_nodes[0][0]
    
    def assign_task(self, task):
        """
        分配任务到最佳节点
        
        Args:
            task: 任务信息字典
            
        Returns:
            分配结果
        """
        if self.is_duplicate_task(task):
            logger.warning(f"任务是重复任务，已拒绝分配: {task.get('description', '')}")
            return {
                "success": False,
                "error": "Duplicate task"
            }
        
        task_type = self._infer_task_type(task)
        task_id = task.get('id', self._generate_task_id(task))
        
        best_node = self.select_optimal_node(task_type)
        
        if best_node:
            # 更新节点状态
            best_node.current_load = min(1.0, best_node.current_load + 0.1)
            best_node.available_cpu = max(0, best_node.available_cpu - 1)
            best_node.available_ram = max(0, best_node.available_ram - 200)
            best_node.active_tasks.append(task_id)
            
            # 记录任务分配
            self.task_assignments[task_id] = best_node.host
            signature = self._generate_task_signature(task)
            self.task_signatures.add(signature)
            
            # 记录任务历史
            task_record = {
                "task_id": task_id,
                "node_host": best_node.host,
                "task_type": task_type.value,
                "status": "assigned",
                "assigned_at": time.time()
            }
            self.task_history.append(task_record)
            best_node.task_history.append(task_record)
            
            return {
                "success": True,
                "node": best_node.host,
                "region": best_node.region,
                "location": best_node.location,
                "latency_ms": best_node.latency_ms,
                "score": self.evaluate_node(best_node, task_type),
                "task_id": task_id
            }
        else:
            return {
                "success": False,
                "error": "No suitable node available"
            }
    
    def _infer_task_type(self, task):
        """根据任务信息推断任务类型"""
        task_desc = task.get('description', '').lower()
        
        if any(keyword in task_desc for keyword in ['coordination', 'pr_review', 'deployment']):
            if 'pr_review' in task_desc:
                return TaskType.PR_REVIEW
            elif 'deployment' in task_desc:
                return TaskType.DEPLOYMENT
            else:
                return TaskType.COORDINATION
        elif any(keyword in task_desc for keyword in ['heavy_compute', 'heavy', 'compute']):
            return TaskType.HEAVY_COMPUTE
        elif any(keyword in task_desc for keyword in ['analysis', 'analyze']):
            return TaskType.ANALYSIS
        elif any(keyword in task_desc for keyword in ['testing', 'test']):
            return TaskType.TESTING
        elif any(keyword in task_desc for keyword in ['documentation', 'doc']):
            return TaskType.DOCUMENTATION
        elif any(keyword in task_desc for keyword in ['lightweight', 'light']):
            return TaskType.LIGHTWEIGHT
        else:
            return TaskType.CODE_GENERATION
    
    def _generate_task_id(self, task):
        """生成任务ID"""
        timestamp = int(time.time() * 1000)
        return f"task_{timestamp}_{hashlib.md5(task.get('description', '').encode('utf-8')).hexdigest()[:8]}"
    
    def complete_task(self, task_id):
        """标记任务完成"""
        if task_id not in self.task_assignments:
            logger.warning(f"任务ID未找到: {task_id}")
            return False
        
        node_host = self.task_assignments[task_id]
        node = next((n for n in self.nodes if n.host == node_host), None)
        
        if node:
            # 恢复节点资源
            node.current_load = max(0.0, node.current_load - 0.1)
            node.available_cpu = min(node.cpu, node.available_cpu + 1)
            node.available_ram = min(node.ram_mb, node.available_ram + 200)
            
            if task_id in node.active_tasks:
                node.active_tasks.remove(task_id)
            
            # 更新任务状态
            for task_record in self.task_history:
                if task_record['task_id'] == task_id:
                    task_record['status'] = 'completed'
                    task_record['completed_at'] = time.time()
            
            for task_record in node.task_history:
                if task_record['task_id'] == task_id:
                    task_record['status'] = 'completed'
                    task_record['completed_at'] = time.time()
            
            return True
        else:
            logger.warning(f"节点未找到: {node_host}")
            return False
    
    def handle_task_failure(self, task_id):
        """处理任务失败"""
        if task_id not in self.task_assignments:
            logger.warning(f"任务ID未找到: {task_id}")
            return
        
        node_host = self.task_assignments[task_id]
        node = next((n for n in self.nodes if n.host == node_host), None)
        
        if node:
            # 恢复节点资源
            node.current_load = max(0.0, node.current_load - 0.1)
            node.available_cpu = min(node.cpu, node.available_cpu + 1)
            node.available_ram = min(node.ram_mb, node.available_ram + 200)
            
            if task_id in node.active_tasks:
                node.active_tasks.remove(task_id)
            
            # 更新任务状态
            for task_record in self.task_history:
                if task_record['task_id'] == task_id:
                    task_record['status'] = 'failed'
                    task_record['failed_at'] = time.time()
            
            for task_record in node.task_history:
                if task_record['task_id'] == task_id:
                    task_record['status'] = 'failed'
                    task_record['failed_at'] = time.time()
            
            # 尝试重新分配任务
            logger.info(f"任务失败，尝试重新分配: {task_id}")
            task_info = self._find_task_info(task_id)
            if task_info:
                self.reassign_task(task_info)
    
    def _find_task_info(self, task_id):
        """根据任务ID查找任务信息"""
        for task in self.task_history:
            if task['task_id'] == task_id:
                return task
        return None
    
    def reassign_task(self, task):
        """重新分配任务"""
        # 从失败节点中移除任务
        if task['task_id'] in self.task_assignments:
            del self.task_assignments[task['task_id']]
        
        # 重新分配任务到其他节点
        return self.assign_task(task)
    
    def get_cluster_status(self):
        """获取集群状态"""
        status = []
        
        for region in Region:
            region_status = {
                "region": region,
                "node_count": len(self.get_nodes_by_region(region)),
                "nodes": []
            }
            
            for node in self.get_nodes_by_region(region):
                region_status["nodes"].append({
                    "host": node.host,
                    "location": node.location,
                    "cpu": node.cpu,
                    "ram_mb": node.ram_mb,
                    "latency_ms": node.latency_ms,
                    "load": node.current_load,
                    "available_cpu": node.available_cpu,
                    "available_ram": node.available_ram,
                    "active_tasks": len(node.active_tasks),
                    "ssh_reachable": node.ssh_reachable,
                    "redis_reachable": node.redis_reachable
                })
            
            status.append(region_status)
        
        return status
    
    def update_node_load(self, host, cpu_usage, ram_usage):
        """更新节点负载"""
        for node in self.nodes:
            if node.host == host:
                node.current_load = cpu_usage
                node.available_cpu = node.cpu - (node.cpu * cpu_usage)
                node.available_ram = node.ram_mb - (node.ram_mb * ram_usage)
                logger.info(f"更新节点 {host} 负载: CPU={cpu_usage:.1%}, RAM={ram_usage:.1%}")
    
    def save_task_history(self):
        """保存任务历史记录到文件"""
        try:
            history_data = []
            for task_record in self.task_history:
                history_data.append({
                    'task_id': task_record['task_id'],
                    'node_host': task_record['node_host'],
                    'task_type': task_record['task_type'],
                    'status': task_record['status'],
                    'assigned_at': task_record['assigned_at'],
                    'completed_at': task_record.get('completed_at'),
                    'failed_at': task_record.get('failed_at')
                })
            
            with open('/root/.openclaw/workspace/research/task_scheduler_history.json', 'w', encoding='utf-8') as f:
                json.dump(history_data, f, indent=2, ensure_ascii=False)
            
            logger.info("任务历史记录已保存")
        except Exception as e:
            logger.error(f"保存任务历史记录失败: {str(e)}")


def main():
    """主函数"""
    logger.info("初始化优化的任务调度器...")
    scheduler = OptimizedTaskScheduler()
    
    logger.info(f"集群包含 {len(scheduler.nodes)} 个节点，分布在以下区域:")
    for region in Region:
        nodes = scheduler.get_nodes_by_region(region)
        logger.info(f"  {region}: {len(nodes)} 个节点")
    
    logger.info("\n=== 任务分配测试 ===")
    
    test_tasks = [
        {
            "id": "test_task_1",
            "description": "代码生成任务",
            "status": "pending"
        },
        {
            "id": "test_task_2",
            "description": "重计算任务",
            "status": "pending"
        },
        {
            "id": "test_task_3",
            "description": "文档任务",
            "status": "pending"
        },
        {
            "id": "test_task_4",
            "description": "部署任务",
            "status": "pending"
        },
        {
            "id": "test_task_5",
            "description": "测试任务",
            "status": "pending"
        }
    ]
    
    for task in test_tasks:
        logger.info(f"\n分配任务: {task['description']}")
        result = scheduler.assign_task(task)
        if result["success"]:
            logger.info(f"成功分配到节点: {result['node']} ({result['location']}, "
                        f"{result['latency_ms']}ms, 评分: {result['score']:.2f})")
        else:
            logger.error(f"分配失败: {result['error']}")
    
    logger.info("\n=== 集群状态 ===")
    status = scheduler.get_cluster_status()
    for region in status:
        logger.info(f"\n区域: {region['region']}")
        for node in region['nodes']:
            logger.info(f"  {node['host']} ({node['location']}): "
                        f"CPU={node['available_cpu']}/{node['cpu']}, "
                        f"RAM={node['available_ram']}/{node['ram_mb']}MB, "
                        f"负载={node['load']:.1%}, 活跃任务={node['active_tasks']}")
    
    # 保存任务历史记录
    scheduler.save_task_history()

if __name__ == "__main__":
    main()
