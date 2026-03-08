#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
基于地理位置的任务调度算法性能分析
"""

import time
import random
import matplotlib.pyplot as plt
from geo_task_scheduler import GeoTaskScheduler, TaskType, Region

def benchmark_scheduler():
    """基准测试调度器性能"""
    print("=== 任务调度算法性能测试 ===")
    
    # 创建调度器实例
    scheduler = GeoTaskScheduler()
    
    # 测试任务类型
    task_types = list(TaskType)
    num_tasks = 100
    
    print(f"测试 {num_tasks} 个任务分配...")
    
    # 记录开始时间
    start_time = time.time()
    
    # 模拟任务分配
    region_counts = {region: 0 for region in Region}
    node_counts = {node.host: 0 for node in scheduler.nodes}
    
    for i in range(num_tasks):
        # 随机选择任务类型
        task_type = random.choice(task_types)
        
        # 模拟任务分配
        result = scheduler.assign_task(task_type)
        
        if result["success"]:
            # 记录区域和节点分配情况
            region_counts[result["region"]] += 1
            node_counts[result["node"]] += 1
            
            # 模拟任务完成后资源释放
            for node in scheduler.nodes:
                if node.host == result["node"]:
                    node.current_load = max(0, node.current_load - 0.05)
                    node.available_cpu = min(node.cpu, node.available_cpu + 0.5)
                    node.available_ram = min(node.ram_mb, node.available_ram + 100)
    
    # 计算执行时间
    exec_time = time.time() - start_time
    
    print(f"分配 {num_tasks} 个任务耗时: {exec_time:.3f} 秒")
    print(f"平均每个任务分配耗时: {exec_time/num_tasks:.6f} 秒")
    
    return region_counts, node_counts, scheduler.get_cluster_status()

def analyze_assignment_distribution(region_counts, node_counts):
    """分析任务分配分布"""
    print("\n=== 任务分配分布分析 ===")
    
    total_tasks = sum(region_counts.values())
    
    print("\n区域分配分布:")
    for region, count in region_counts.items():
        percentage = (count / total_tasks) * 100
        print(f"  {region}: {count} 个任务 ({percentage:.1f}%)")
    
    print("\n节点分配分布:")
    sorted_nodes = sorted(node_counts.items(), key=lambda x: x[1], reverse=True)
    for node, count in sorted_nodes:
        percentage = (count / total_tasks) * 100
        print(f"  {node}: {count} 个任务 ({percentage:.1f}%)")
    
    # 绘制区域分配柱状图
    plt.figure(figsize=(12, 6))
    
    plt.subplot(1, 2, 1)
    regions = list(region_counts.keys())
    counts = list(region_counts.values())
    plt.bar([str(region) for region in regions], counts)
    plt.title("任务区域分配分布")
    plt.xlabel("区域")
    plt.ylabel("任务数量")
    
    plt.subplot(1, 2, 2)
    nodes = list(node_counts.keys())
    counts = list(node_counts.values())
    plt.bar(nodes, counts)
    plt.title("任务节点分配分布")
    plt.xlabel("节点")
    plt.ylabel("任务数量")
    plt.xticks(rotation=45)
    
    plt.tight_layout()
    plt.savefig("/root/.openclaw/workspace/reports/scheduler_assignment_distribution.png")
    print("\n分配分布图已保存到 reports/scheduler_assignment_distribution.png")

def analyze_cluster_status(cluster_status):
    """分析集群状态"""
    print("\n=== 集群状态分析 ===")
    
    for region in cluster_status:
        print(f"\n区域: {region['region']}")
        print(f"节点数量: {region['node_count']}")
        
        region_loads = []
        region_latencies = []
        
        for node in region['nodes']:
            print(f"  {node['host']} ({node['location']}):")
            print(f"    资源: {node['cpu']}核, {node['ram_mb']}MB")
            print(f"    延迟: {node['latency_ms']}ms")
            print(f"    负载: {node['load']:.1%}")
            print(f"    可达性: SSH={node['ssh_reachable']}, Redis={node['redis_reachable']}")
            
            region_loads.append(node['load'])
            region_latencies.append(node['latency_ms'])
        
        # 计算区域平均负载和延迟
        if region_loads:
            avg_load = sum(region_loads) / len(region_loads)
            avg_latency = sum(region_latencies) / len(region_latencies)
            print(f"  区域平均负载: {avg_load:.1%}")
            print(f"  区域平均延迟: {avg_latency:.2f}ms")

def test_region_specific_scheduling():
    """测试区域特定任务调度"""
    print("\n=== 区域特定任务调度测试 ===")
    
    scheduler = GeoTaskScheduler()
    
    region_tasks = [
        (Region.CN, [TaskType.DEPLOYMENT, TaskType.PR_REVIEW]),
        (Region.SEA, [TaskType.CODE_GENERATION, TaskType.TESTING]),
        (Region.EU, [TaskType.DOCUMENTATION, TaskType.ANALYSIS])
    ]
    
    for region, tasks in region_tasks:
        print(f"\n区域 {region} 任务调度测试:")
        
        for task_type in tasks:
            result = scheduler.assign_task(task_type, target_region=region)
            
            if result["success"]:
                print(f"  任务 {task_type} 分配到: {result['node']} ({result['location']})")
            else:
                print(f"  任务 {task_type} 分配失败: {result['error']}")

def compare_scheduling_strategies():
    """比较不同调度策略的性能"""
    print("\n=== 调度策略比较 ===")
    
    # 策略1: 随机调度
    scheduler1 = GeoTaskScheduler()
    random_times = []
    
    for _ in range(10):
        start = time.time()
        scheduler1.assign_task(random.choice(list(TaskType)))
        random_times.append(time.time() - start)
    
    # 策略2: 区域感知调度
    scheduler2 = GeoTaskScheduler()
    geo_times = []
    
    for _ in range(10):
        start = time.time()
        scheduler2.assign_task(random.choice(list(TaskType)))
        geo_times.append(time.time() - start)
    
    print(f"随机调度平均时间: {sum(random_times)/len(random_times):.6f} 秒")
    print(f"区域感知调度平均时间: {sum(geo_times)/len(geo_times):.6f} 秒")
    
    improvement = ((sum(random_times)/len(random_times)) - (sum(geo_times)/len(geo_times))) / (sum(random_times)/len(random_times)) * 100
    print(f"性能提升: {improvement:.1f}%")

def main():
    """主函数"""
    print("基于地理位置的任务调度算法性能分析")
    print("=" * 50)
    
    # 1. 基准测试
    region_counts, node_counts, cluster_status = benchmark_scheduler()
    
    # 2. 分析任务分配分布
    analyze_assignment_distribution(region_counts, node_counts)
    
    # 3. 分析集群状态
    analyze_cluster_status(cluster_status)
    
    # 4. 测试区域特定调度
    test_region_specific_scheduling()
    
    # 5. 比较调度策略
    compare_scheduling_strategies()
    
    print("\n分析完成！")
    print("结果已保存到 reports/ 目录")

if __name__ == "__main__":
    main()
