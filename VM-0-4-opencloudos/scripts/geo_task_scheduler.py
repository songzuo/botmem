#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
基于地理位置的任务调度算法
实现区域化资源分配和网络路径优化
考虑同一物理服务器上多个OpenClaw实例的资源调度优化
"""

import json
import time
import statistics
import logging
from enum import Enum

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
    
    def __repr__(self):
        return f"Node(host={self.host}, region={self.region}, latency={self.latency_ms}ms)"

class GeoTaskScheduler:
    """基于地理位置的任务调度器"""
    
    def __init__(self):
        self.nodes = []
        self.region_nodes = {region: [] for region in Region}
        self._load_node_configuration()
    
    def _load_node_configuration(self):
        """加载节点配置信息"""
        # 从最新网络测试结果中获取的节点信息（2026-02-28）
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
                "region": Region.CN,  # 更新为中国区域，根据延迟判断位置更接近中国
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
            }
        ]
        
        # 创建Node对象并按区域分组
        for info in node_info:
            node = Node(**info)
            self.nodes.append(node)
            self.region_nodes[info["region"]].append(node)
    
    def evaluate_node(self, node, task_type):
        """评估节点的任务执行能力（优化版本）"""
        score = 0.0
        
        # 任务兼容性评分 (40分) - 考虑任务类型与节点能力的匹配度
        if task_type.value in node.tasks:
            score += 40
        
        # 资源可用性评分 (50分) - 优化资源分配算法，对高负载节点进行惩罚
        cpu_available_score = (node.available_cpu / node.cpu) * 30
        ram_available_score = (node.available_ram / node.ram_mb) * 20
        
        # 对接近饱和的资源进行惩罚
        if node.available_cpu < node.cpu * 0.2:  # CPU剩余不足20%
            cpu_available_score *= 0.5
        if node.available_ram < node.ram_mb * 0.2:  # RAM剩余不足20%
            ram_available_score *= 0.5
        
        score += cpu_available_score + ram_available_score
        
        # 网络质量评分 (20分) - 更精细的延迟评分
        # 延迟 < 10ms: 20分, 10-50ms: 15分, 50-100ms: 10分, >100ms: 5分
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
        
        # 负载评分 (30分) - 更严格的负载评估，对高负载节点惩罚更重
        load_score = max(0, 30 - (node.current_load * 60))  # 负载超过50%开始严重扣分
        score += load_score
        
        # 资源均衡性评分 (10分) - 鼓励资源使用率平衡
        cpu_utilization = 1 - (node.available_cpu / node.cpu)
        ram_utilization = 1 - (node.available_ram / node.ram_mb)
        balance_score = max(0, 10 - abs(cpu_utilization - ram_utilization) * 10)
        score += balance_score
        
        # 任务类型与节点能力匹配评分 (10分)
        # 为不同任务类型赋予节点特定的权重
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
            # 根据任务类型确定推荐区域，优化区域间任务分配
            if task_type in [TaskType.COORDINATION, TaskType.PR_REVIEW, TaskType.DEPLOYMENT]:
                target_region = Region.CN
            elif task_type in [TaskType.HEAVY_COMPUTE, TaskType.ANALYSIS]:
                target_region = Region.CN
            elif task_type in [TaskType.CODE_GENERATION, TaskType.TESTING, TaskType.DOCUMENTATION]:
                # 对于代码生成、测试和文档任务，平衡分配到东南亚和中国区域
                # 检查各区域负载和可用节点
                cn_nodes = [node for node in self.get_nodes_by_region(Region.CN) 
                           if task_type.value in node.tasks and node.ssh_reachable]
                sea_nodes = [node for node in self.get_nodes_by_region(Region.SEA) 
                           if task_type.value in node.tasks and node.ssh_reachable]
                
                if cn_nodes and sea_nodes:
                    cn_load = sum(node.current_load for node in cn_nodes) / len(cn_nodes)
                    sea_load = sum(node.current_load for node in sea_nodes) / len(sea_nodes)
                    
                    # 选择负载较低的区域
                    target_region = Region.SEA if sea_load < cn_load else Region.CN
                elif sea_nodes:
                    target_region = Region.SEA
                elif cn_nodes:
                    target_region = Region.CN
                else:
                    target_region = Region.CN
            else:
                # 轻量任务平衡分配
                # 检查各区域负载，选择负载较低的区域
                cn_load = sum(node.current_load for node in self.get_nodes_by_region(Region.CN)) / len(self.get_nodes_by_region(Region.CN)) if self.get_nodes_by_region(Region.CN) else 1
                sea_load = sum(node.current_load for node in self.get_nodes_by_region(Region.SEA)) / len(self.get_nodes_by_region(Region.SEA)) if self.get_nodes_by_region(Region.SEA) else 1
                
                target_region = Region.SEA if sea_load < cn_load else Region.CN
        
        logger.info(f"任务类型: {task_type}, 目标区域: {target_region}")
        
        # 2. 获取候选节点
        candidates = []
        
        # 同区域优先
        for node in self.get_nodes_by_region(target_region):
            if task_type.value in node.tasks and node.ssh_reachable:
                candidates.append(node)
        
        logger.info(f"同区域候选节点 ({len(candidates)}): {[node.host for node in candidates]}")
        
        # 对于高负载区域，扩大候选节点范围，包括其他区域的可用节点
        if candidates:
            region_load = sum(node.current_load for node in self.get_nodes_by_region(target_region)) / len(self.get_nodes_by_region(target_region))
            if region_load > 0.8:  # 区域负载超过80%，扩大候选范围
                logger.warning(f"区域 {target_region} 负载过高 ({region_load:.1%})，扩大候选节点范围")
                for node in self.nodes:
                    if (task_type.value in node.tasks and 
                        node.ssh_reachable and 
                        node.region != target_region and 
                        node not in candidates):
                        candidates.append(node)
        
        # 如果同区域没有可用节点，查找其他区域的合适节点
        if not candidates:
            logger.warning(f"同区域 ({target_region}) 无合适节点，查找跨区域节点")
            for node in self.nodes:
                if task_type.value in node.tasks and node.ssh_reachable and node.region != target_region:
                    candidates.append(node)
        
        # 3. 评估候选节点
        if not candidates:
            logger.error(f"无可用节点执行任务类型: {task_type}")
            return None
        
        scores = []
        for node in candidates:
            score = self.evaluate_node(node, task_type)
            scores.append((node, score))
        
        # 4. 按评分排序
        sorted_nodes = sorted(scores, key=lambda x: x[1], reverse=True)
        
        logger.info("节点评分:")
        for node, score in sorted_nodes:
            logger.info(f"  {node.host}: {score:.2f}分")
        
        # 5. 返回最佳节点
        best_node = sorted_nodes[0][0]
        logger.info(f"选择节点: {best_node.host}")
        
        return best_node
    
    def assign_task(self, task_type, target_region=None):
        """
        分配任务到最佳节点
        
        Args:
            task_type: 任务类型
            target_region: 目标区域
            
        Returns:
            分配结果
        """
        best_node = self.select_optimal_node(task_type, target_region)
        
        if best_node:
            # 模拟任务分配后的资源变化
            best_node.current_load = min(1.0, best_node.current_load + 0.1)
            best_node.available_cpu = max(0, best_node.available_cpu - 1)
            best_node.available_ram = max(0, best_node.available_ram - 200)
            
            return {
                "success": True,
                "node": best_node.host,
                "region": best_node.region,
                "location": best_node.location,
                "latency_ms": best_node.latency_ms,
                "score": self.evaluate_node(best_node, task_type)
            }
        else:
            return {
                "success": False,
                "error": "No suitable node available"
            }
    
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
                    "ssh_reachable": node.ssh_reachable,
                    "redis_reachable": node.redis_reachable
                })
            
            status.append(region_status)
        
        return status
    
    def update_node_latency(self, host, new_latency):
        """更新节点延迟"""
        for node in self.nodes:
            if node.host == host:
                node.latency_ms = new_latency
                logger.info(f"更新节点 {host} 延迟: {new_latency}ms")
    
    def update_node_load(self, host, cpu_usage, ram_usage):
        """更新节点负载"""
        for node in self.nodes:
            if node.host == host:
                node.current_load = cpu_usage
                node.available_cpu = node.cpu - (node.cpu * cpu_usage)
                node.available_ram = node.ram_mb - (node.ram_mb * ram_usage)
                logger.info(f"更新节点 {host} 负载: CPU={cpu_usage:.1%}, RAM={ram_usage:.1%}")

def main():
    """主函数"""
    logger.info("初始化地理位置感知的任务调度器...")
    scheduler = GeoTaskScheduler()
    
    logger.info(f"集群包含 {len(scheduler.nodes)} 个节点，分布在以下区域:")
    for region in Region:
        nodes = scheduler.get_nodes_by_region(region)
        logger.info(f"  {region}: {len(nodes)} 个节点")
    
    logger.info("\n=== 任务分配测试 ===")
    
    test_tasks = [
        TaskType.CODE_GENERATION,
        TaskType.TESTING,
        TaskType.HEAVY_COMPUTE,
        TaskType.ANALYSIS,
        TaskType.DEPLOYMENT
    ]
    
    for task_type in test_tasks:
        logger.info(f"\n分配任务: {task_type}")
        result = scheduler.assign_task(task_type)
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
                        f"CPU={node['cpu']}核, RAM={node['ram_mb']}MB, "
                        f"延迟={node['latency_ms']}ms, 负载={node['load']:.1%}")

if __name__ == "__main__":
    main()
