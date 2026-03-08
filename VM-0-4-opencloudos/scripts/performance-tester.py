#!/usr/bin/env python3
"""
性能测试工具 - 测量节点通信优化的效果
"""

import time
import subprocess
import json
import statistics
import matplotlib.pyplot as plt
from communication_optimizer import NodeCommunicationOptimizer
from task_scheduler import SmartTaskScheduler


class PerformanceTester:
    """性能测试器"""
    
    def __init__(self):
        self.optimizer = NodeCommunicationOptimizer()
        self.scheduler = SmartTaskScheduler()
        self.test_results = []
        self.compared_algorithms = []
        self.execution_times = {}
    
    def run_optimization_comparison(self, iterations=5):
        """运行优化前后的对比测试"""
        print("=== 优化策略对比测试 ===")
        
        # 运行优化前测试
        before_results = self._run_test_suite("before", iterations)
        
        # 应用优化策略
        print("\n应用优化策略...")
        self.optimizer.optimize_ssh_config()
        self.optimizer.optimize_redis_connections()
        
        # 运行优化后测试
        after_results = self._run_test_suite("after", iterations)
        
        self._compare_results(before_results, after_results)
        self._save_test_report(before_results, after_results)
        
        return before_results, after_results
    
    def _run_test_suite(self, test_label, iterations):
        """运行完整的测试套件"""
        test_results = []
        
        for i in range(iterations):
            print(f"运行 {test_label} 测试 ({i+1}/{iterations})")
            test_result = self._run_single_test()
            test_result["iteration"] = i+1
            test_result["label"] = test_label
            test_results.append(test_result)
            
            time.sleep(1)
        
        return test_results
    
    def _run_single_test(self):
        """运行单个测试"""
        start_time = time.time()
        
        results = {
            "ssh_connect_time": self._measure_ssh_connect_time(),
            "redis_connect_time": self._measure_redis_connect_time(),
            "command_execution_time": self._measure_command_execution_time(),
            "ping_latency": self._measure_ping_latency(),
            "cpu_usage": self._measure_cpu_usage(),
            "memory_usage": self._measure_memory_usage(),
            "task_scheduling_time": self._measure_task_scheduling_time()
        }
        
        results["total_time"] = time.time() - start_time
        return results
    
    def _measure_ssh_connect_time(self):
        """测量SSH连接时间"""
        times = []
        
        for node in ["7zi.com", "bot3.szspd.cn"]:
            try:
                start = time.time()
                subprocess.run(
                    ['ssh', node, 'echo', 'connected'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=10,
                    check=True
                )
                connect_time = time.time() - start
                times.append({"node": node, "time_ms": connect_time * 1000})
            except Exception as e:
                print(f"SSH连接失败 {node}: {str(e)}")
        
        return times
    
    def _measure_redis_connect_time(self):
        """测量Redis连接时间"""
        times = []
        
        for node in ["7zi.com"]:
            try:
                conn = redis.StrictRedis(
                    host=node,
                    port=6379,
                    socket_timeout=5,
                    decode_responses=True
                )
                
                start = time.time()
                conn.ping()
                connect_time = time.time() - start
                times.append({"node": node, "time_ms": connect_time * 1000})
                
            except Exception as e:
                print(f"Redis连接失败 {node}: {str(e)}")
        
        return times
    
    def _measure_command_execution_time(self):
        """测量命令执行时间"""
        commands = {
            "ls": "ls -la",
            "cpu_info": "cat /proc/cpuinfo | head -20",
            "mem_info": "cat /proc/meminfo | head -20"
        }
        
        times = []
        
        for node in ["7zi.com", "bot3.szspd.cn"]:
            for cmd_name, cmd in commands.items():
                try:
                    start = time.time()
                    subprocess.run(
                        ['ssh', node, cmd],
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        timeout=10,
                        check=True
                    )
                    exec_time = time.time() - start
                    times.append({"node": node, "command": cmd_name, "time_ms": exec_time * 1000})
                except Exception as e:
                    print(f"命令执行失败 {node}: {str(e)}")
        
        return times
    
    def _measure_ping_latency(self):
        """测量ping延迟"""
        times = []
        
        for node in ["7zi.com", "bot3.szspd.cn"]:
            try:
                output = subprocess.check_output(
                    ['ping', '-c', '5', '-W', '1', node],
                    universal_newlines=True
                )
                
                delays = []
                for line in output.split('\n'):
                    if 'time=' in line:
                        time_part = line.split('time=')[-1].split(' ')[0]
                        delays.append(float(time_part))
                
                if delays:
                    times.append({
                        "node": node,
                        "min_ms": min(delays),
                        "max_ms": max(delays),
                        "avg_ms": statistics.mean(delays)
                    })
                    
            except Exception as e:
                print(f"Ping失败 {node}: {str(e)}")
        
        return times
    
    def _measure_cpu_usage(self):
        """测量CPU使用率"""
        try:
            import psutil
            return psutil.cpu_percent()
        except Exception:
            return 0.0
    
    def _measure_memory_usage(self):
        """测量内存使用率"""
        try:
            import psutil
            return psutil.virtual_memory().percent
        except Exception:
            return 0.0
    
    def _measure_task_scheduling_time(self):
        """测量任务调度时间"""
        start = time.time()
        
        task = {
            "name": "测试任务",
            "command": "echo 'test'",
            "type": "lightweight"
        }
        
        try:
            task_id = self.scheduler.add_task(task)
            self.scheduler.optimize_task_scheduling()
            self.scheduler.execute_task(task_id)
            
            return (time.time() - start) * 1000
        
        except Exception as e:
            print(f"任务调度失败: {str(e)}")
            return 0.0
    
    def _compare_results(self, before, after):
        """比较测试结果"""
        improvement = {}
        
        improvement["ssh_connect"] = self._calculate_improvement(
            [t for test in before for t in test["ssh_connect_time"]],
            [t for test in after for t in test["ssh_connect_time"]]
        )
        
        improvement["command_execution"] = self._calculate_improvement(
            [t for test in before for t in test["command_execution_time"]],
            [t for test in after for t in test["command_execution_time"]]
        )
        
        improvement["ping_latency"] = self._calculate_improvement(
            [t for test in before for t in test["ping_latency"]],
            [t for test in after for t in test["ping_latency"]]
        )
        
        improvement["task_scheduling"] = self._calculate_improvement(
            [test["task_scheduling_time"] for test in before],
            [test["task_scheduling_time"] for test in after]
        )
        
        self._print_improvement_report(improvement)
    
    def _calculate_improvement(self, before_data, after_data):
        """计算改进百分比"""
        if not before_data or not after_data:
            return {"before": 0, "after": 0, "improvement": 0}
        
        before_avg = statistics.mean([d["time_ms"] if isinstance(d, dict) else d for d in before_data])
        after_avg = statistics.mean([d["time_ms"] if isinstance(d, dict) else d for d in after_data])
        
        improvement = ((before_avg - after_avg) / before_avg) * 100
        
        return {
            "before": before_avg,
            "after": after_avg,
            "improvement": max(improvement, 0)
        }
    
    def _print_improvement_report(self, improvement):
        """打印改进报告"""
        print("\n=== 优化效果对比 ===")
        
        print("\nSSH连接优化:")
        ssh_imp = improvement["ssh_connect"]
        print(f"  优化前: {ssh_imp['before']:.2f}ms")
        print(f"  优化后: {ssh_imp['after']:.2f}ms")
        print(f"  改进: {ssh_imp['improvement']:.1f}%")
        
        print("\n命令执行优化:")
        cmd_imp = improvement["command_execution"]
        print(f"  优化前: {cmd_imp['before']:.2f}ms")
        print(f"  优化后: {cmd_imp['after']:.2f}ms")
        print(f"  改进: {cmd_imp['improvement']:.1f}%")
        
        print("\n任务调度优化:")
        task_imp = improvement["task_scheduling"]
        print(f"  优化前: {task_imp['before']:.2f}ms")
        print(f"  优化后: {task_imp['after']:.2f}ms")
        print(f"  改进: {task_imp['improvement']:.1f}%")
        
        print("\nPing延迟优化:")
        ping_imp = improvement["ping_latency"]
        print(f"  优化前: {ping_imp['before']:.2f}ms")
        print(f"  优化后: {ping_imp['after']:.2f}ms")
        print(f"  改进: {ping_imp['improvement']:.1f}%")
    
    def _save_test_report(self, before, after):
        """保存测试报告"""
        report = {
            "timestamp": time.time(),
            "before": before,
            "after": after,
            "summary": {
                "total_improvement": self._calculate_overall_improvement(before, after)
            }
        }
        
        filename = f"performance_test_report_{int(time.time())}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            print(f"\n测试报告已保存到: {filename}")
            
        except Exception as e:
            print(f"保存测试报告失败: {str(e)}")
    
    def _calculate_overall_improvement(self, before, after):
        """计算整体改进"""
        before_total = 0
        after_total = 0
        
        for test in before:
            before_total += test["total_time"]
        
        for test in after:
            after_total += test["total_time"]
        
        if before_total == 0:
            return 0
        
        return ((before_total - after_total) / before_total) * 100
    
    def run_stress_test(self, duration_minutes=5):
        """运行压力测试"""
        print(f"\n=== 开始 {duration_minutes} 分钟压力测试 ===")
        
        start_time = time.time()
        end_time = start_time + (duration_minutes * 60)
        
        test_count = 0
        failures = 0
        execution_times = []
        
        while time.time() < end_time:
            try:
                test_time = time.time()
                
                task = {
                    "name": f"压力测试任务{test_count+1}",
                    "command": "echo 'stress test' && sleep 0.5",
                    "type": "lightweight"
                }
                
                task_id = self.scheduler.add_task(task)
                self.scheduler.optimize_task_scheduling()
                self.scheduler.execute_task(task_id)
                
                execution_times.append(time.time() - test_time)
                test_count += 1
                
                time.sleep(0.5)
                
            except Exception as e:
                failures += 1
                print(f"测试失败 {test_count+1}: {str(e)}")
                time.sleep(1)
        
        self._print_stress_test_report(test_count, failures, execution_times, duration_minutes)
    
    def _print_stress_test_report(self, test_count, failures, execution_times, duration):
        """打印压力测试报告"""
        success_rate = ((test_count - failures) / test_count) * 100 if test_count > 0 else 0
        
        avg_time = 0.0
        if execution_times:
            avg_time = statistics.mean(execution_times)
        
        print(f"\n=== 压力测试报告 ===")
        print(f"测试持续时间: {duration} 分钟")
        print(f"总测试数: {test_count}")
        print(f"成功数: {test_count - failures}")
        print(f"失败数: {failures}")
        print(f"成功率: {success_rate:.1f}%")
        print(f"平均执行时间: {avg_time * 1000:.2f}ms")
        print(f"吞吐量: {test_count / (duration * 60):.2f} 任务/秒")
    
    def plot_performance_comparison(self, before_results, after_results):
        """绘制性能对比图"""
        plt.figure(figsize=(15, 10))
        
        # SSH连接时间
        plt.subplot(2, 2, 1)
        self._plot_ssh_connect_time(before_results, after_results)
        plt.title("SSH连接时间对比 (ms)")
        
        # 任务调度时间
        plt.subplot(2, 2, 2)
        self._plot_task_scheduling_time(before_results, after_results)
        plt.title("任务调度时间对比 (ms)")
        
        # 命令执行时间
        plt.subplot(2, 2, 3)
        self._plot_command_execution_time(before_results, after_results)
        plt.title("命令执行时间对比 (ms)")
        
        # Ping延迟
        plt.subplot(2, 2, 4)
        self._plot_ping_latency(before_results, after_results)
        plt.title("Ping延迟对比 (ms)")
        
        plt.tight_layout()
        
        # 保存图表
        filename = f"performance_comparison_{int(time.time())}.png"
        plt.savefig(filename)
        plt.close()
        
        print(f"性能对比图表已保存到: {filename}")
    
    def _plot_ssh_connect_time(self, before, after):
        """绘制SSH连接时间图"""
        before_times = [t["time_ms"] for test in before for t in test["ssh_connect_time"]]
        after_times = [t["time_ms"] for test in after for t in test["ssh_connect_time"]]
        
        plt.boxplot([before_times, after_times])
        plt.xticks([1, 2], ["优化前", "优化后"])
        plt.ylabel("连接时间 (ms)")
    
    def _plot_task_scheduling_time(self, before, after):
        """绘制任务调度时间图"""
        before_times = [test["task_scheduling_time"] for test in before]
        after_times = [test["task_scheduling_time"] for test in after]
        
        plt.boxplot([before_times, after_times])
        plt.xticks([1, 2], ["优化前", "优化后"])
        plt.ylabel("调度时间 (ms)")
    
    def _plot_command_execution_time(self, before, after):
        """绘制命令执行时间图"""
        before_times = [t["time_ms"] for test in before for t in test["command_execution_time"]]
        after_times = [t["time_ms"] for test in after for t in test["command_execution_time"]]
        
        plt.boxplot([before_times, after_times])
        plt.xticks([1, 2], ["优化前", "优化后"])
        plt.ylabel("执行时间 (ms)")
    
    def _plot_ping_latency(self, before, after):
        """绘制Ping延迟图"""
        before_times = []
        for test in before:
            for ping in test["ping_latency"]:
                if isinstance(ping, dict) and "avg_ms" in ping:
                    before_times.append(ping["avg_ms"])
        
        after_times = []
        for test in after:
            for ping in test["ping_latency"]:
                if isinstance(ping, dict) and "avg_ms" in ping:
                    after_times.append(ping["avg_ms"])
        
        plt.boxplot([before_times, after_times])
        plt.xticks([1, 2], ["优化前", "优化后"])
        plt.ylabel("延迟 (ms)")


# 主程序入口
if __name__ == "__main__":
    tester = PerformanceTester()
    
    print("开始性能测试套件...")
    
    # 运行优化对比测试
    before, after = tester.run_optimization_comparison(iterations=3)
    
    # 运行压力测试
    tester.run_stress_test(duration_minutes=2)
    
    # 绘制性能对比图
    tester.plot_performance_comparison(before, after)
    
    print("\n=== 性能测试完成 ===")
    
    print(f"优化前平均总时间: {sum(test['total_time'] for test in before)/len(before)*1000:.2f}ms")
    print(f"优化后平均总时间: {sum(test['total_time'] for test in after)/len(after)*1000:.2f}ms")
    
    # 保存详细测试结果
    with open(f"performance_test_detailed_{int(time.time())}.json", 'w', encoding='utf-8') as f:
        json.dump({
            "before_optimization": before,
            "after_optimization": after
        }, f, indent=2, ensure_ascii=False)
