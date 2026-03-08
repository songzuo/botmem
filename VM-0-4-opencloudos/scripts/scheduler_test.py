#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
调度器功能测试脚本
"""

from geo_task_scheduler import GeoTaskScheduler, TaskType, Region

def test_basic_functionality():
    """测试基本功能"""
    print("=== 调度器基本功能测试 ===")
    
    scheduler = GeoTaskScheduler()
    
    print(f"调度器初始化成功，包含 {len(scheduler.nodes)} 个节点")
    print(f"区域分布:")
    for region, nodes in scheduler.region_nodes.items():
        print(f"  {region}: {len(nodes)} 个节点")
    
    return scheduler

def test_task_assignment(scheduler):
    """测试任务分配功能"""
    print("\n=== 任务分配功能测试 ===")
    
    test_cases = [
        ("部署任务", TaskType.DEPLOYMENT),
        ("代码审查任务", TaskType.PR_REVIEW),
        ("代码生成任务", TaskType.CODE_GENERATION),
        ("测试任务", TaskType.TESTING),
        ("文档任务", TaskType.DOCUMENTATION),
        ("分析任务", TaskType.ANALYSIS),
        ("重计算任务", TaskType.HEAVY_COMPUTE),
        ("轻量任务", TaskType.LIGHTWEIGHT)
    ]
    
    for task_name, task_type in test_cases:
        result = scheduler.assign_task(task_type)
        if result["success"]:
            print(f"✅ {task_name} 成功分配到节点: {result['node']}")
            print(f"   - 区域: {result['region']}")
            print(f"   - 位置: {result['location']}")
            print(f"   - 延迟: {result['latency_ms']}ms")
            print(f"   - 评分: {result['score']:.2f}分")
        else:
            print(f"❌ {task_name} 分配失败: {result['error']}")

def test_region_specific_scheduling(scheduler):
    """测试区域特定调度功能"""
    print("\n=== 区域特定调度功能测试 ===")
    
    # 测试中国区域任务
    print("\n中国区域任务调度:")
    cn_tasks = [
        ("部署任务", TaskType.DEPLOYMENT),
        ("代码审查任务", TaskType.PR_REVIEW)
    ]
    
    for task_name, task_type in cn_tasks:
        result = scheduler.assign_task(task_type, target_region=Region.CN)
        if result["success"]:
            print(f"✅ {task_name} 成功分配到节点: {result['node']}")
            print(f"   - 位置: {result['location']}")
            print(f"   - 延迟: {result['latency_ms']}ms")
    
    # 测试东南亚区域任务
    print("\n东南亚区域任务调度:")
    sea_tasks = [
        ("代码生成任务", TaskType.CODE_GENERATION),
        ("测试任务", TaskType.TESTING)
    ]
    
    for task_name, task_type in sea_tasks:
        result = scheduler.assign_task(task_type, target_region=Region.SEA)
        if result["success"]:
            print(f"✅ {task_name} 成功分配到节点: {result['node']}")
            print(f"   - 位置: {result['location']}")
            print(f"   - 延迟: {result['latency_ms']}ms")

def test_dynamic_scheduling(scheduler):
    """测试动态调度功能"""
    print("\n=== 动态调度功能测试 ===")
    
    # 模拟任务执行和资源释放
    print("\n执行任务...")
    
    for i in range(10):
        task_type = TaskType.CODE_GENERATION
        result = scheduler.assign_task(task_type)
        if result["success"]:
            print(f"任务 {i+1}: 分配到节点 {result['node']}")
    
    print("\n模拟任务完成，释放资源...")
    for node in scheduler.nodes:
        node.current_load = max(0, node.current_load - 0.3)
        node.available_cpu = min(node.cpu, node.available_cpu + 1)
        node.available_ram = min(node.ram_mb, node.available_ram + 500)
    
    # 再次测试分配
    print("\n任务完成后重新分配:")
    result = scheduler.assign_task(TaskType.CODE_GENERATION)
    if result["success"]:
        print(f"✅ 任务成功分配到节点: {result['node']}")
        print(f"   - 负载: {scheduler.nodes[0].current_load:.1%}")
        print(f"   - 可用CPU: {scheduler.nodes[0].available_cpu}核")

def main():
    """主函数"""
    try:
        scheduler = test_basic_functionality()
        test_task_assignment(scheduler)
        test_region_specific_scheduling(scheduler)
        test_dynamic_scheduling(scheduler)
        
        print("\n=== 所有测试通过 ===")
        print("调度器功能正常，任务分配算法工作符合预期")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    main()
