#!/usr/bin/env python3
"""
通信优化策略基础测试
"""

import sys
import time
import statistics
import subprocess
import json


def main():
    print("=== OpenClaw通信优化策略测试 ===\n")

    # 1. 检查基础网络连通性
    print("1. 网络连通性测试")
    test_nodes = [
        {"name": "7zi.com", "description": "主力计算节点"},
        {"name": "bot3.szspd.cn", "description": "本地开发节点"},
        {"name": "bot.szspd.cn", "description": "监控节点"},
        {"name": "bot5.szspd.cn", "description": "安全节点"}
    ]

    network_results = []

    for node in test_nodes:
        print(f"\n测试节点: {node['name']} - {node['description']}")
        
        # SSH连通性
        try:
            start_time = time.time()
            ssh_result = subprocess.run(
                ["ssh", node["name"], "echo", "connected"],
                capture_output=True,
                text=True,
                timeout=5
            )
            ssh_time = (time.time() - start_time) * 1000
            ssh_reachable = ssh_result.returncode == 0
            
            print(f"  SSH连通: {'✅' if ssh_reachable else '❌'}")
            if ssh_reachable:
                print(f"  连接时间: {ssh_time:.1f}ms")
            
        except Exception as e:
            ssh_reachable = False
            print(f"  SSH连通: ❌ {e}")

        # Redis连通性
        try:
            start_time = time.time()
            redis_result = subprocess.run(
                ["nc", "-zv", node["name"], "6379"],
                capture_output=True,
                text=True,
                timeout=3
            )
            redis_time = (time.time() - start_time) * 1000
            redis_reachable = redis_result.returncode == 0
            
            print(f"  Redis连通: {'✅' if redis_reachable else '❌'}")
            if redis_reachable:
                print(f"  连接时间: {redis_time:.1f}ms")
            
        except Exception as e:
            redis_reachable = False
            print(f"  Redis连通: ❌ {e}")

        # Ping延迟
        ping_delays = []
        try:
            ping_result = subprocess.run(
                ["ping", "-c", "5", "-W", "1", node["name"]],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if ping_result.returncode == 0:
                delays = []
                for line in ping_result.stdout.split("\n"):
                    if "time=" in line:
                        time_part = line.split("time=")[1].split(" ")[0]
                        if time_part.replace(".", "", 1).isdigit():
                            delays.append(float(time_part))
                
                if delays:
                    ping_delays = delays
                    print(f"  平均延迟: {statistics.mean(delays):.1f}ms")
                    print(f"  最小延迟: {min(delays):.1f}ms")
                    print(f"  最大延迟: {max(delays):.1f}ms")

        except Exception as e:
            print(f"  延迟测试: ❌ {e}")

        network_results.append({
            "node": node["name"],
            "ssh_reachable": ssh_reachable,
            "redis_reachable": redis_reachable,
            "ping_delays": ping_delays
        })

    # 2. 通信优化配置
    print("\n2. 通信优化配置")
    
    # 检查SSH配置
    try:
        ssh_config = subprocess.run(
            ["cat", "~/.ssh/config"],
            capture_output=True,
            text=True
        )
        print("  SSH配置检查完成")
        
        if "ControlMaster auto" in ssh_config.stdout:
            print("  SSH多路复用已启用")
        else:
            print("  SSH多路复用未启用，优化建议: ControlMaster auto")
            
        if "ServerAliveInterval 60" in ssh_config.stdout:
            print("  SSH保持连接已配置")
        else:
            print("  SSH保持连接未配置，优化建议: ServerAliveInterval 60")
            
    except Exception as e:
        print(f"  检查SSH配置失败: {e}")

    # 检查Redis配置
    try:
        for node in test_nodes:
            if network_results[test_nodes.index(node)]["ssh_reachable"]:
                redis_config = subprocess.run(
                    ["ssh", node["name"], "cat /etc/redis/redis.conf"],
                    capture_output=True,
                    text=True,
                    shell=True
                )
                
                if redis_config.returncode == 0:
                    if "protected-mode" in redis_config.stdout:
                        mode = "关闭" if "protected-mode no" in redis_config.stdout else "开启"
                        print(f"  Redis保护模式 {node['name']}: {mode}")

    except Exception as e:
        print(f"  检查Redis配置失败: {e}")

    # 3. 任务优化策略
    print("\n3. 任务优化策略测试")

    task_types = [
        {"name": "网络密集型任务", "type": "network_intensive"},
        {"name": "计算密集型任务", "type": "compute_intensive"},
        {"name": "轻量级任务", "type": "lightweight"}
    ]

    for task in task_types:
        print(f"\n任务类型: {task['name']}")
        
        if task["type"] == "network_intensive":
            print("  优化策略: 选择延迟最低的节点")
            
            best_node = None
            min_latency = float('inf')
            
            for result in network_results:
                if result["ssh_reachable"] and result["ping_delays"]:
                    avg_latency = statistics.mean(result["ping_delays"])
                    if avg_latency < min_latency:
                        min_latency = avg_latency
                        best_node = result["node"]
            
            if best_node:
                print(f"  推荐节点: {best_node} ({min_latency:.1f}ms)")
            else:
                print("  无可用节点")
                
        elif task["type"] == "compute_intensive":
            print("  优化策略: 选择高性能节点")
            
            compute_nodes = [
                ("7zi.com", {"cores": 8, "ram": 16, "score": 0.9}),
                ("bot3.szspd.cn", {"cores": 4, "ram": 3.6, "score": 0.7}),
                ("bot.szspd.cn", {"cores": 2, "ram": 1.8, "score": 0.3})
            ]
            
            available_nodes = []
            for node in compute_nodes:
                result = next(r for r in network_results if r["node"] == node[0])
                if result["ssh_reachable"]:
                    available_nodes.append(node)
            
            if available_nodes:
                best_node = max(available_nodes, key=lambda x: x[1]["score"])
                print(f"  推荐节点: {best_node[0]} ({best_node[1]['cores']}核 {best_node[1]['ram']}GB)")
            else:
                print("  无可用节点")
                
        elif task["type"] == "lightweight":
            print("  优化策略: 选择负载最低的节点")
            
            lightweight_nodes = [
                ("bot5.szspd.cn", {"weight": 0.2, "type": "lightweight"}),
                ("bot2.szspd.cn", {"weight": 0.3, "type": "lightweight"}),
                ("bot4.szspd.cn", {"weight": 0.4, "type": "document"})
            ]
            
            available_nodes = []
            for node in lightweight_nodes:
                result = next((r for r in network_results if r["node"] == node[0]), None)
                if result and result["ssh_reachable"]:
                    available_nodes.append(node)
            
            if available_nodes:
                best_node = min(available_nodes, key=lambda x: x[1]["weight"])
                print(f"  推荐节点: {best_node[0]} (负载指数: {best_node[1]['weight']})")
            else:
                print("  无可用节点")

    # 4. 总结
    print("\n=== 测试总结 ===")
    
    healthy_nodes = [r for r in network_results if r["ssh_reachable"]]
    unhealthy_nodes = [r for r in network_results if not r["ssh_reachable"]]
    
    print(f"\n健康节点: {len(healthy_nodes)}/{len(network_results)}")
    if healthy_nodes:
        for result in healthy_nodes:
            print(f"- {result['node']}")
            
    print(f"\n不可达节点: {len(unhealthy_nodes)}/{len(network_results)}")
    if unhealthy_nodes:
        for result in unhealthy_nodes:
            print(f"- {result['node']}")

    avg_latencies = []
    for result in network_results:
        if result["ssh_reachable"] and result["ping_delays"]:
            avg_latencies.append(statistics.mean(result["ping_delays"]))

    if avg_latencies:
        print(f"\n网络延迟统计:")
        print(f"  平均延迟: {statistics.mean(avg_latencies):.1f}ms")
        print(f"  最小延迟: {min(avg_latencies):.1f}ms")
        print(f"  最大延迟: {max(avg_latencies):.1f}ms")
        if len(avg_latencies) > 1:
            print(f"  延迟差异: {max(avg_latencies) - min(avg_latencies):.1f}ms")

    # 5. 性能优化建议
    print("\n=== 性能优化建议 ===")
    
    print("\n网络优化:")
    for result in network_results:
        if result["ssh_reachable"] and result["ping_delays"]:
            latency = statistics.mean(result["ping_delays"])
            if latency > 300:
                print(f"  - 节点 {result['node']} 延迟过高 ({latency:.1f}ms)")
                
        if not result["redis_reachable"]:
            print(f"  - 节点 {result['node']} Redis连接失败")

    print("\n任务分配优化:")
    if len(healthy_nodes) < 2:
        print("  - 可用节点数量不足，考虑增加备用节点")
        
    high_latency_nodes = [r for r in network_results if r["ssh_reachable"] and 
                         (r["ping_delays"] and statistics.mean(r["ping_delays"]) > 200)]
    if high_latency_nodes:
        print(f"  - {len(high_latency_nodes)}个节点延迟过高，避免分配网络密集型任务")

    print("\n=== 测试完成 ===")
    
    # 保存测试结果
    output_file = f"communication_test_report_{int(time.time())}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(network_results, f, indent=2, ensure_ascii=False)
    print(f"详细报告已保存到: {output_file}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"测试过程中发生错误: {e}")
        import traceback
        print("\n详细错误信息:")
        print(traceback.format_exc())
