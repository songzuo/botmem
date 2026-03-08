#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
简单性能测试工具 - 测量任务调度算法的性能
"""

import time
import json
import statistics
from geo_task_scheduler import GeoTaskScheduler, TaskType

class SimplePerformanceTester:
    """简单性能测试器"""
    
    def __init__(self):
        self.scheduler = GeoTaskScheduler()
        self.test_results = []
    
    def test_task_assignment_speed(self, task_count=100):
        """测试任务分配速度"""
        print(f"=== 测试任务分配速度 ({task_count}个任务) ===")
        
        execution_times = []
        
        for i in range(task_count):
            task_type = list(TaskType)[i % len(TaskType)]
            
            start_time = time.time()
            result = self.scheduler.assign_task(task_type)
            exec_time = time.time() - start_time
            
            execution_times.append(exec_time * 1000)  # 转换为毫秒
            
            if (i + 1) % 10 == 0:
                print(f"完成 {i + 1} 个任务")
        
        # 计算统计数据
        avg_time = statistics.mean(execution_times)
        min_time = min(execution_times)
        max_time = max(execution_times)
        std_time = statistics.stdev(execution_times)
        
        print(f"\n任务分配速度统计:")
        print(f"平均时间: {avg_time:.2f}ms")
        print(f"最小时间: {min_time:.2f}ms")
        print(f"最大时间: {max_time:.2f}ms")
        print(f"标准差: {std_time:.2f}ms")
        
        # 重置调度器状态
        self.scheduler = GeoTaskScheduler()
        
        return {
            "task_count": task_count,
            "avg_time_ms": avg_time,
            "min_time_ms": min_time,
            "max_time_ms": max_time,
            "std_time_ms": std_time,
            "total_time_ms": sum(execution_times)
        }
    
    def test_task_distribution(self, task_count=100):
        """测试任务分配分布"""
        print(f"\n=== 测试任务分配分布 ({task_count}个任务) ===")
        
        node_assignments = {node.host: 0 for node in self.scheduler.nodes}
        region_assignments = {region: 0 for region in self.scheduler.region_nodes}
        
        for i in range(task_count):
            task_type = list(TaskType)[i % len(TaskType)]
            result = self.scheduler.assign_task(task_type)
            
            if result["success"]:
                node_assignments[result["node"]] += 1
                region_assignments[result["region"]] += 1
        
        # 打印节点分配统计
        print("\n节点任务分配:")
        for node, count in node_assignments.items():
            percentage = (count / task_count) * 100
            print(f"  {node}: {count}个任务 ({percentage:.1f}%)")
        
        # 打印区域分配统计
        print("\n区域任务分配:")
        for region, count in region_assignments.items():
            if count > 0:
                percentage = (count / task_count) * 100
                print(f"  {region}: {count}个任务 ({percentage:.1f}%)")
        
        # 重置调度器状态
        self.scheduler = GeoTaskScheduler()
        
        return {
            "node_assignments": node_assignments,
            "region_assignments": region_assignments
        }
    
    def test_different_task_types(self):
        """测试不同任务类型的分配"""
        print("\n=== 测试不同任务类型的分配 ===")
        
        task_type_results = {}
        
        for task_type in TaskType:
            print(f"\n测试任务类型: {task_type}")
            
            results = []
            for i in range(5):
                result = self.scheduler.assign_task(task_type)
                results.append(result)
            
            # 统计成功率
            success_count = sum(1 for r in results if r["success"])
            success_rate = (success_count / len(results)) * 100
            
            task_type_results[task_type] = {
                "success_count": success_count,
                "success_rate": success_rate,
                "nodes": list(set(r["node"] for r in results if r["success"]))
            }
            
            print(f"  成功率: {success_rate:.1f}%")
            if task_type_results[task_type]["nodes"]:
                print(f"  分配节点: {', '.join(task_type_results[task_type]['nodes'])}")
        
        return task_type_results
    
    def run_complete_test_suite(self):
        """运行完整的测试套件"""
        print("=== 任务调度算法性能测试 ===")
        
        # 测试1: 任务分配速度
        speed_result = self.test_task_assignment_speed(100)
        
        # 测试2: 任务分配分布
        distribution_result = self.test_task_distribution(100)
        
        # 测试3: 不同任务类型的分配
        task_type_result = self.test_different_task_types()
        
        # 保存测试结果
        self.save_test_report(speed_result, distribution_result, task_type_result)
        
        print("\n=== 测试完成 ===")
        print(f"总任务分配时间: {speed_result['total_time_ms']:.2f}ms")
        print(f"平均每个任务: {speed_result['avg_time_ms']:.2f}ms")
        print(f"总任务处理能力: {1000 / speed_result['avg_time_ms']:.2f}任务/秒")
    
    def save_test_report(self, speed_result, distribution_result, task_type_result):
        """保存测试报告"""
        report = {
            "timestamp": time.time(),
            "speed_test": speed_result,
            "distribution_test": {
                "node_assignments": {str(node): count for node, count in distribution_result["node_assignments"].items()},
                "region_assignments": {str(region): count for region, count in distribution_result["region_assignments"].items()}
            },
            "task_type_test": {
                str(task_type): {
                    "success_count": result["success_count"],
                    "success_rate": result["success_rate"],
                    "nodes": result["nodes"]
                } for task_type, result in task_type_result.items()
            }
        }
        
        filename = f"task_scheduler_performance_report_{int(time.time())}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n测试报告已保存到: {filename}")


def main():
    """主函数"""
    try:
        tester = SimplePerformanceTester()
        tester.run_complete_test_suite()
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        print(traceback.format_exc())


if __name__ == "__main__":
    main()
