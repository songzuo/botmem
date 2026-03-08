#!/usr/bin/env python3
"""
网络性能测试脚本 - 评估节点通信延迟和可靠性
"""

import subprocess
import time
import statistics
import json

class NetworkPerformanceTester:
    def __init__(self, nodes):
        self.nodes = nodes
        self.results = []
        
    def ping_node(self, node, count=5):
        """Ping节点以测试延迟"""
        try:
            output = subprocess.check_output(
                ["ping", "-c", str(count), "-W", "5", node],
                stderr=subprocess.STDOUT,
                universal_newlines=True
            )
            
            # 解析延迟信息
            lines = output.strip().split('\n')
            delays = []
            
            for line in lines:
                if "time=" in line:
                    parts = line.split("time=")
                    if len(parts) > 1:
                        delay_part = parts[1].split()[0]
                        try:
                            delay = float(delay_part)
                            delays.append(delay)
                        except ValueError:
                            continue
            
            return delays
            
        except Exception as e:
            print(f"Ping节点 {node} 失败: {str(e)}")
            return []
            
    def ssh_test(self, node):
        """SSH连接测试"""
        try:
            # 测试SSH端口是否开放
            result = subprocess.call(
                ["nc", "-zv", node, "22"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            return result == 0
            
        except Exception as e:
            print(f"SSH测试节点 {node} 失败: {str(e)}")
            return False
            
    def tcp_connectivity_test(self, node, port):
        """TCP连接测试"""
        try:
            import socket
            sock = socket.create_connection((node, port), timeout=5)
            sock.close()
            return True
        except Exception as e:
            print(f"TCP连接节点 {node}:{port} 失败: {str(e)}")
            return False
            
    def redis_connectivity_test(self, node):
        """Redis连接测试"""
        try:
            # 尝试连接到Redis端口6379
            return self.tcp_connectivity_test(node, 6379)
        except Exception as e:
            print(f"Redis测试节点 {node} 失败: {str(e)}")
            return False
            
    def run_comprehensive_test(self):
        """运行综合网络性能测试"""
        print("=== 节点通信延迟和可靠性测试 ===")
        print(f"测试时间: {time.ctime()}")
        print()
        
        all_results = []
        
        for node in self.nodes:
            print(f"=== 测试节点: {node} ===")
            
            # Ping测试
            print("  1. Ping测试...")
            ping_delays = self.ping_node(node)
            ssh_reachable = self.ssh_test(node)
            redis_reachable = self.redis_connectivity_test(node)
            
            # 汇总结果
            result = {
                "node": node,
                "timestamp": time.time(),
                "ssh_reachable": ssh_reachable,
                "redis_reachable": redis_reachable,
                "ping_delays_ms": ping_delays
            }
            
            if ping_delays:
                result["ping_min_ms"] = min(ping_delays)
                result["ping_max_ms"] = max(ping_delays)
                result["ping_avg_ms"] = statistics.mean(ping_delays)
                if len(ping_delays) > 1:
                    result["ping_std_ms"] = statistics.stdev(ping_delays)
                else:
                    result["ping_std_ms"] = 0
            
            # 输出结果
            if ssh_reachable:
                print(f"  SSH连接: 正常")
            else:
                print(f"  SSH连接: 失败")
                
            if redis_reachable:
                print(f"  Redis连接: 正常")
            else:
                print(f"  Redis连接: 失败")
                
            if ping_delays:
                print(f"  延迟统计: {result['ping_avg_ms']:.2f}ms ±{result['ping_std_ms']:.2f}ms")
                print(f"  最小值: {result['ping_min_ms']:.2f}ms, 最大值: {result['ping_max_ms']:.2f}ms")
            else:
                print(f"  Ping测试: 无响应")
                
            print()
            all_results.append(result)
            
        # 保存结果到JSON文件
        timestamp = int(time.time())
        filename = f"network_test_results_{timestamp}.json"
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2, default=str)
            
        print(f"结果已保存到: {filename}")
        print()
        
        return all_results
        
    def generate_analysis_report(self, results):
        """生成性能分析报告"""
        print("=== 网络性能分析报告 ===")
        
        reachable_nodes = []
        unreachable_nodes = []
        high_latency_nodes = []
        
        for result in results:
            node = result["node"]
            
            if not result["ssh_reachable"]:
                unreachable_nodes.append(node)
                continue
                
            reachable_nodes.append(node)
            
            if "ping_avg_ms" in result and result["ping_avg_ms"] > 300:
                high_latency_nodes.append(node)
                
        print(f"节点总数: {len(results)}")
        print(f"SSH可达节点: {len(reachable_nodes)}")
        print(f"SSH不可达节点: {len(unreachable_nodes)}")
        
        if unreachable_nodes:
            print(f"不可达节点: {', '.join(unreachable_nodes)}")
            
        if high_latency_nodes:
            print(f"高延迟节点(>300ms): {', '.join(high_latency_nodes)}")
            
        print()
        
        # 延迟分析
        print("=== 延迟分布分析 ===")
        
        avg_delays = []
        for result in results:
            if "ping_avg_ms" in result and result["node"] in reachable_nodes:
                avg_delays.append(result["ping_avg_ms"])
                
        if avg_delays:
            avg_avg = statistics.mean(avg_delays)
            min_avg = min(avg_delays)
            max_avg = max(avg_delays)
            std_avg = statistics.stdev(avg_delays)
            
            print(f"平均延迟: {avg_avg:.2f}ms")
            print(f"最小平均延迟: {min_avg:.2f}ms")
            print(f"最大平均延迟: {max_avg:.2f}ms")
            print(f"延迟标准差: {std_avg:.2f}ms")
            
            print()
            print("各节点延迟:")
            for result in sorted(results, key=lambda x: x.get("ping_avg_ms", 1000)):
                if "ping_avg_ms" in result and result["node"] in reachable_nodes:
                    print(f"  {result['node']}: {result['ping_avg_ms']:.2f}ms")
        
        print()
        print("=== Redis连通性 ===")
        
        redis_reachable = [r["node"] for r in results if r["redis_reachable"]]
        print(f"Redis可达节点: {len(redis_reachable)}")
        
        if len(results) - len(reachable_nodes) > 0:
            print(f"Redis不可达节点: {len(results) - len(reachable_nodes)}")
            
        print()
        print("=== 总结 ===")
        
        print("根据测试结果，我们观察到:")
        
        if unreachable_nodes:
            print("1. 部分节点SSH连接失败，请检查网络连接")
            
        if high_latency_nodes:
            print("2. 某些节点延迟较高，可能会影响通信性能")
            
        if len(avg_delays) > 0:
            print(f"3. 平均网络延迟为 {avg_avg:.2f}ms，标准差为 {std_avg:.2f}ms")
            
        print("4. 需要进一步优化的重点是节点间通信的可靠性")
        print("5. 建议优化TCP参数，使用压缩传输，实现智能路由")

if __name__ == "__main__":
    # 定义要测试的节点
    nodes = [
        "7zi.com",
        "bot.szspd.cn",
        "bot2.szspd.cn",
        "bot3.szspd.cn",
        "bot4.szspd.cn",
        "bot5.szspd.cn"
    ]
    
    # 创建性能测试器
    tester = NetworkPerformanceTester(nodes)
    
    # 运行综合测试
    results = tester.run_comprehensive_test()
    
    # 生成分析报告
    tester.generate_analysis_report(results)
