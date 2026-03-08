#!/usr/bin/env python3
"""
HTTP通信优化器 - 实现基于HTTP的任务调度和节点通信
替代传统的SSH通信，适用于SSH端口无法访问的场景
"""

import json
import time
import requests
import statistics
import psutil
import socket
from datetime import datetime


class HTTPNodeCommunicationOptimizer:
    """HTTP节点通信优化器"""
    
    def __init__(self):
        self.nodes = self.load_nodes_config()
        self.network_stats = {}
        self.optimization_strategies = {
            "network_intensive": self._optimize_network_intensive,
            "compute_intensive": self._optimize_compute_intensive,
            "lightweight": self._optimize_lightweight
        }
        self.http_endpoints = {
            "health": "/health",
            "status": "/status",
            "task": "/task",
            "execute": "/execute",
            "data": "/data"
        }
    
    def load_nodes_config(self):
        """加载节点配置"""
        try:
            with open('cluster-workers.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
                return config.get("nodes", [])
        except FileNotFoundError:
            return [
                {"host": "7zi.com", "role": "coordinator", "cpu": 8, "ram_mb": 16000, "type": "compute"},
                {"host": "bot.szspd.cn", "role": "worker", "cpu": 2, "ram_mb": 1870, "type": "monitor"},
                {"host": "bot2.szspd.cn", "role": "worker", "cpu": 2, "ram_mb": 1870, "type": "search"},
                {"host": "bot3.szspd.cn", "role": "worker", "cpu": 4, "ram_mb": 3655, "type": "develop"},
                {"host": "bot4.szspd.cn", "role": "worker", "cpu": 2, "ram_mb": 2000, "type": "document"},
                {"host": "bot5.szspd.cn", "role": "worker", "cpu": 1, "ram_mb": 1963, "type": "security"}
            ]
    
    def test_http_connectivity(self):
        """测试HTTP连通性"""
        self.network_stats = {}
        
        for node in self.nodes:
            host = node["host"]
            stats = {
                "node": host,
                "timestamp": time.time(),
                "http_reachable": False,
                "https_reachable": False,
                "http_proxy_reachable": False,
                "http_response_time_ms": None,
                "https_response_time_ms": None,
                "http_proxy_response_time_ms": None,
                "http_status_code": None,
                "https_status_code": None,
                "http_proxy_status_code": None,
                "api_versions": {},
                "services_available": []
            }
            
            # 测试HTTP访问
            try:
                start_time = time.time()
                response = requests.get(f'http://{host}', timeout=5)
                stats["http_reachable"] = True
                stats["http_response_time_ms"] = (time.time() - start_time) * 1000
                stats["http_status_code"] = response.status_code
            except Exception as e:
                pass
            
            # 测试HTTPS访问
            try:
                start_time = time.time()
                response = requests.get(f'https://{host}', timeout=5)
                stats["https_reachable"] = True
                stats["https_response_time_ms"] = (time.time() - start_time) * 1000
                stats["https_status_code"] = response.status_code
            except Exception as e:
                pass
            
            # 测试HTTP代理访问（尝试常见代理端口）
            for proxy_port in [8080, 3128, 8888, 1080]:
                try:
                    start_time = time.time()
                    proxies = {
                        'http': f'http://127.0.0.1:{proxy_port}',
                        'https': f'http://127.0.0.1:{proxy_port}'
                    }
                    response = requests.get(f'http://{host}', proxies=proxies, timeout=5)
                    stats["http_proxy_reachable"] = True
                    stats["http_proxy_response_time_ms"] = (time.time() - start_time) * 1000
                    stats["http_proxy_status_code"] = response.status_code
                    break
                except Exception:
                    continue
            
            # 测试API服务端点
            for endpoint_name, endpoint_path in self.http_endpoints.items():
                try:
                    response = requests.get(f'http://{host}{endpoint_path}', timeout=3)
                    if response.status_code == 200:
                        stats["services_available"].append(endpoint_name)
                        try:
                            data = response.json()
                            if "version" in data:
                                stats["api_versions"][endpoint_name] = data["version"]
                        except Exception:
                            pass
                except Exception:
                    continue
            
            self.network_stats[host] = stats
        
        self.save_network_stats()
    
    def save_network_stats(self):
        """保存网络统计数据"""
        filename = f"http_network_stats_{int(time.time())}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(list(self.network_stats.values()), f, indent=2, ensure_ascii=False)
            print(f"HTTP网络统计数据已保存到: {filename}")
        except Exception as e:
            print(f"保存HTTP网络统计数据失败: {str(e)}")
    
    def _optimize_network_intensive(self, task):
        """优化网络密集型任务的通信"""
        # 找到网络延迟最低的可用节点
        best_node = None
        min_latency = float('inf')
        
        for node in self.nodes:
            host = node["host"]
            stats = self.network_stats.get(host, {})
            
            if (stats.get("http_reachable") or stats.get("https_reachable")) and stats.get("http_response_time_ms"):
                if stats["http_response_time_ms"] < min_latency:
                    best_node = host
                    min_latency = stats["http_response_time_ms"]
        
        return best_node
    
    def _optimize_compute_intensive(self, task):
        """优化计算密集型任务的通信"""
        # 找到性能最佳的节点
        best_node = None
        best_performance = 0
        
        for node in self.nodes:
            host = node["host"]
            stats = self.network_stats.get(host, {})
            
            if stats.get("http_reachable") or stats.get("https_reachable"):
                performance_score = node["cpu"] * (node["ram_mb"] / 1024)  # CPU核数 * 内存GB
                if performance_score > best_performance:
                    best_node = host
                    best_performance = performance_score
        
        return best_node
    
    def _optimize_lightweight(self, task):
        """优化轻量级任务的通信"""
        # 找到资源利用率最低的节点（通过API获取状态）
        best_node = None
        min_load = float('inf')
        
        for node in self.nodes:
            host = node["host"]
            stats = self.network_stats.get(host, {})
            
            if (stats.get("http_reachable") or stats.get("https_reachable")) and "status" in stats.get("services_available", []):
                try:
                    response = requests.get(f'http://{host}/status', timeout=3)
                    if response.status_code == 200:
                        status_data = response.json()
                        cpu_usage = status_data.get("cpu_usage", 100)
                        mem_usage = status_data.get("mem_usage", 100)
                        total_load = (cpu_usage + mem_usage) / 2
                        
                        if total_load < min_load:
                            best_node = host
                            min_load = total_load
                except Exception:
                    continue
        
        return best_node
    
    def get_optimal_node(self, task_type="lightweight"):
        """获取最优节点"""
        optimizer = self.optimization_strategies.get(
            task_type, self._optimize_lightweight
        )
        
        return optimizer(task_type)
    
    def create_http_task_scheduler(self):
        """创建基于HTTP的任务调度器"""
        scheduler_config = {
            "name": "HTTP-Based Task Scheduler",
            "version": "2.0.0",
            "created": datetime.now().isoformat(),
            "nodes": [],
            "scheduling_strategies": self.optimization_strategies.keys(),
            "communication_protocols": ["http", "https", "http_proxy"],
            "api_endpoints": self.http_endpoints,
            "task_queue": "/queue",
            "task_completion": "/complete"
        }
        
        for host, stats in self.network_stats.items():
            node_config = {
                "host": host,
                "reachable": stats.get("http_reachable") or stats.get("https_reachable"),
                "response_time_ms": stats.get("http_response_time_ms", float('inf')),
                "services": stats.get("services_available", []),
                "api_versions": stats.get("api_versions", {}),
                "protocols": []
            }
            
            if stats.get("http_reachable"):
                node_config["protocols"].append("http")
            if stats.get("https_reachable"):
                node_config["protocols"].append("https")
            if stats.get("http_proxy_reachable"):
                node_config["protocols"].append("http_proxy")
            
            scheduler_config["nodes"].append(node_config)
        
        filename = "http_task_scheduler_config.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(scheduler_config, f, indent=2, ensure_ascii=False)
        print(f"HTTP任务调度器配置已生成: {filename}")
        
        return scheduler_config
    
    def optimize_http_communication(self):
        """优化HTTP通信策略"""
        optimization_plan = {
            "timestamp": time.time(),
            "optimizations": []
        }
        
        for host, stats in self.network_stats.items():
            node_optimization = {
                "node": host,
                "current_status": "unreachable" if not (stats.get("http_reachable") or stats.get("https_reachable")) else "reachable",
                "recommended_protocol": None,
                "connection_timeout": 10.0,
                "retries": 3,
                "retry_delay": 2.0,
                "compression": False
            }
            
            # 选择最佳通信协议
            if stats.get("https_reachable") and stats.get("https_response_time_ms"):
                node_optimization["recommended_protocol"] = "https"
                node_optimization["connection_timeout"] = 8.0
            elif stats.get("http_reachable") and stats.get("http_response_time_ms"):
                node_optimization["recommended_protocol"] = "http"
                node_optimization["connection_timeout"] = 5.0
            elif stats.get("http_proxy_reachable") and stats.get("http_proxy_response_time_ms"):
                node_optimization["recommended_protocol"] = "http_proxy"
                node_optimization["connection_timeout"] = 15.0
            
            # 启用压缩和优化
            if node_optimization["recommended_protocol"]:
                node_optimization["compression"] = True
                node_optimization["retries"] = 5
                node_optimization["retry_delay"] = 1.5
            
            optimization_plan["optimizations"].append(node_optimization)
        
        filename = "http_communication_optimization_plan.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(optimization_plan, f, indent=2, ensure_ascii=False)
        print(f"HTTP通信优化方案已生成: {filename}")
        
        return optimization_plan
    
    def health_check(self):
        """健康检查"""
        self.test_http_connectivity()
        
        healthy_nodes = []
        for host, stats in self.network_stats.items():
            # 健康条件
            is_healthy = (
                (stats.get("http_reachable") or stats.get("https_reachable")) and
                stats.get("http_response_time_ms", float('inf')) < 5000  # 5秒内响应
            )
            
            if is_healthy:
                healthy_nodes.append(host)
                print(f"✅ {host} - 健康")
            else:
                print(f"❌ {host} - 不健康: {self._format_health_issues(host, stats)}")
        
        return healthy_nodes
    
    def _format_health_issues(self, node, stats):
        """格式化健康问题"""
        issues = []
        
        if not (stats.get("http_reachable") or stats.get("https_reachable")):
            issues.append("HTTP/HTTPS不可达")
        
        if stats.get("http_response_time_ms", float('inf')) >= 5000:
            issues.append(f"响应超时 ({stats['http_response_time_ms']:.1f}ms)")
        
        if not stats.get("http_proxy_reachable"):
            issues.append("HTTP代理不可用")
        
        if not stats.get("services_available"):
            issues.append("API服务端点不可用")
        
        return ", ".join(issues)
    
    def run_optimization(self, task_type="lightweight"):
        """运行优化"""
        print(f"正在优化 {task_type} 任务的HTTP通信策略...")
        
        # 健康检查
        healthy_nodes = self.health_check()
        
        # 获取最优节点
        optimal_node = self.get_optimal_node(task_type)
        
        if optimal_node and optimal_node in healthy_nodes:
            print(f"选择最优节点: {optimal_node}")
            
            # 创建任务调度器
            self.create_http_task_scheduler()
            
            # 优化通信策略
            self.optimize_http_communication()
            
            return optimal_node
        else:
            raise Exception("未找到健康的可通信节点")
    
    def generate_report(self):
        """生成优化报告"""
        report = {
            "timestamp": time.time(),
            "report_name": "HTTP通信优化报告",
            "nodes_checked": len(self.network_stats),
            "healthy_nodes": [node for node, stats in self.network_stats.items() if (stats.get("http_reachable") or stats.get("https_reachable"))],
            "nodes_config": self.nodes,
            "network_stats": self.network_stats,
            "optimization_plan": self.optimize_http_communication(),
            "system_info": {
                "cpu_usage": psutil.cpu_percent(),
                "mem_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent
            }
        }
        
        filename = f"http_communication_optimization_report_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"优化报告已生成: {filename}")
        return filename


def main():
    """主函数"""
    optimizer = HTTPNodeCommunicationOptimizer()
    
    try:
        print("=== HTTP通信优化器启动 ===\n")
        
        # 运行优化
        optimal_node = optimizer.run_optimization("compute_intensive")
        
        print(f"\n=== 优化完成 ===")
        print(f"最优节点: {optimal_node}")
        
        # 生成报告
        optimizer.generate_report()
        
    except Exception as e:
        print(f"\n=== 优化失败 ===")
        print(f"错误: {str(e)}")
        return False
    
    return True


if __name__ == "__main__":
    main()
