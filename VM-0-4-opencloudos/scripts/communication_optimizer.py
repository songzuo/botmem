#!/usr/bin/env python3
"""
节点通信优化器 - 实现基于网络状况的智能通信策略
"""

import json
import time
import subprocess
import statistics
import socket
import redis
import psutil


class NodeCommunicationOptimizer:
    """节点通信优化器"""
    
    def __init__(self):
        self.nodes = self.load_nodes_config()
        self.network_stats = {}
        self.optimization_strategies = {
            "network_intensive": self._optimize_network_intensive,
            "compute_intensive": self._optimize_compute_intensive,
            "lightweight": self._optimize_lightweight
        }
    
    def load_nodes_config(self):
        """加载节点配置"""
        try:
            with open('cluster-workers.json', 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return {
                "7zi.com": {"cores": 8, "ram_gb": 16, "type": "compute"},
                "bot.szspd.cn": {"cores": 2, "ram_gb": 1.8, "type": "monitor"},
                "bot2.szspd.cn": {"cores": 2, "ram_gb": 1.8, "type": "search"},
                "bot3.szspd.cn": {"cores": 4, "ram_gb": 3.6, "type": "develop"},
                "bot4.szspd.cn": {"cores": 2, "ram_gb": 2, "type": "document"},
                "bot5.szspd.cn": {"cores": 1, "ram_gb": 2, "type": "security"}
            }
    
    def test_network_connectivity(self):
        """测试网络连通性"""
        self.network_stats = {}
        
        for node in self.nodes:
            stats = {
                "node": node,
                "timestamp": time.time(),
                "ssh_reachable": False,
                "redis_reachable": False,
                "ping_delays_ms": [],
                "ping_min_ms": None,
                "ping_max_ms": None,
                "ping_avg_ms": None,
                "ping_std_ms": None,
                "ssh_connect_time_ms": None
            }
            
            # 测试SSH连通性
            try:
                start_time = time.time()
                result = subprocess.run(
                    ['ssh', node, 'echo', 'connected'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=10,
                    check=True
                )
                stats["ssh_reachable"] = True
                stats["ssh_connect_time_ms"] = (time.time() - start_time) * 1000
            except Exception:
                pass
            
            # 测试Redis连通性
            try:
                conn = redis.StrictRedis(
                    host=node,
                    port=6379,
                    socket_timeout=5,
                    decode_responses=True
                )
                conn.ping()
                stats["redis_reachable"] = True
            except Exception:
                pass
            
            # 测试ping延迟
            try:
                output = subprocess.check_output(
                    ['ping', '-c', '5', '-W', '1', node],
                    universal_newlines=True
                )
                
                delays = []
                for line in output.split('\n'):
                    if 'time=' in line:
                        time_part = line.split('time=')[-1].split(' ')[0]
                        if time_part.replace('.', '', 1).isdigit():
                            delays.append(float(time_part))
                
                if delays:
                    stats["ping_delays_ms"] = delays
                    stats["ping_min_ms"] = min(delays)
                    stats["ping_max_ms"] = max(delays)
                    stats["ping_avg_ms"] = statistics.mean(delays)
                    if len(delays) > 1:
                        stats["ping_std_ms"] = statistics.stdev(delays)
                    else:
                        stats["ping_std_ms"] = 0.0
                
            except Exception:
                pass
            
            self.network_stats[node] = stats
        
        self.save_network_stats()
    
    def save_network_stats(self):
        """保存网络统计数据"""
        filename = f"network_stats_{int(time.time())}.json"
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(list(self.network_stats.values()), f, indent=2, ensure_ascii=False)
            print(f"网络统计数据已保存到: {filename}")
        except Exception as e:
            print(f"保存网络统计数据失败: {str(e)}")
    
    def _optimize_network_intensive(self, task):
        """优化网络密集型任务的通信"""
        # 找到网络延迟最低的可用节点
        best_node = None
        min_latency = float('inf')
        
        for node, stats in self.network_stats.items():
            if stats["ssh_reachable"] and stats["ping_avg_ms"] and stats["ping_avg_ms"] < min_latency:
                best_node = node
                min_latency = stats["ping_avg_ms"]
        
        return best_node
    
    def _optimize_compute_intensive(self, task):
        """优化计算密集型任务的通信"""
        # 找到性能最佳的节点
        best_node = None
        best_performance = 0
        
        for node, config in self.nodes.items():
            if self.network_stats.get(node, {}).get("ssh_reachable"):
                performance_score = config["cores"] * config["ram_gb"]
                if performance_score > best_performance:
                    best_node = node
                    best_performance = performance_score
        
        return best_node
    
    def _optimize_lightweight(self, task):
        """优化轻量级任务的通信"""
        # 找到资源利用率最低的节点
        best_node = None
        min_load = float('inf')
        
        for node in self.nodes:
            if self.network_stats.get(node, {}).get("ssh_reachable"):
                try:
                    # 获取CPU和内存利用率
                    output = subprocess.check_output(
                        ['ssh', node, 'python3 -c "import psutil; print(psutil.cpu_percent()); print(psutil.virtual_memory().percent)"'],
                        shell=True,
                        universal_newlines=True
                    )
                    cpu_usage, mem_usage = map(float, output.strip().split('\n'))
                    total_load = (cpu_usage + mem_usage) / 2
                    
                    if total_load < min_load:
                        best_node = node
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
    
    def optimize_ssh_config(self):
        """优化SSH配置"""
        ssh_config_path = "~/.ssh/config"
        config_entries = [
            "ServerAliveInterval 60",
            "ServerAliveCountMax 3",
            "ConnectTimeout 10",
            "ControlMaster auto",
            "ControlPath ~/.ssh/control:%h:%p:%r",
            "ControlPersist 600"
        ]
        
        try:
            with open(ssh_config_path, 'r', encoding='utf-8') as f:
                existing_config = f.read()
        except FileNotFoundError:
            existing_config = ""
        
        # 添加缺失的配置
        for config in config_entries:
            if config not in existing_config:
                try:
                    with open(ssh_config_path, 'a', encoding='utf-8') as f:
                        f.write(f"\n{config}")
                except Exception as e:
                    print(f"无法优化SSH配置: {str(e)}")
    
    def optimize_redis_connections(self):
        """优化Redis连接配置"""
        for node, stats in self.network_stats.items():
            if stats["ssh_reachable"] and not stats["redis_reachable"]:
                try:
                    # 检查并优化Redis配置
                    subprocess.run(
                        ['ssh', node, 
                         'echo "bind 0.0.0.0" >> /etc/redis/redis.conf ; '
                         'echo "protected-mode no" >> /etc/redis/redis.conf ; '
                         'systemctl restart redis-server'],
                        shell=True,
                        check=True
                    )
                    print(f"优化Redis配置: {node}")
                except Exception as e:
                    print(f"优化Redis配置失败 {node}: {str(e)}")
    
    def health_check(self):
        """健康检查"""
        self.test_network_connectivity()
        
        healthy_nodes = []
        for node, stats in self.network_stats.items():
            # 健康条件
            is_healthy = (
                stats["ssh_reachable"] and
                stats.get("ping_avg_ms", float('inf')) < 300 and
                stats.get("ssh_connect_time_ms", float('inf')) < 1000
            )
            
            if is_healthy:
                healthy_nodes.append(node)
                print(f"✅ {node} - 健康")
            else:
                print(f"❌ {node} - 不健康: {self._format_health_issues(node, stats)}")
        
        return healthy_nodes
    
    def _format_health_issues(self, node, stats):
        """格式化健康问题"""
        issues = []
        
        if not stats["ssh_reachable"]:
            issues.append("SSH不可达")
        if not stats["redis_reachable"]:
            issues.append("Redis不可达")
        if stats.get("ping_avg_ms", 0) >= 300:
            issues.append(f"延迟过高 ({stats['ping_avg_ms']:.1f}ms)")
        if stats.get("ssh_connect_time_ms", 0) >= 1000:
            issues.append(f"连接超时 ({stats['ssh_connect_time_ms']:.1f}ms)")
        
        return ", ".join(issues)
    
    def run_optimization(self, task_type="lightweight"):
        """运行优化"""
        print(f"正在优化 {task_type} 任务的通信策略...")
        
        # 健康检查
        healthy_nodes = self.health_check()
        
        # 获取最优节点
        optimal_node = self.get_optimal_node(task_type)
        
        if optimal_node and optimal_node in healthy_nodes:
            print(f"选择最优节点: {optimal_node}")
            
            # 优化通信策略
            self.optimize_ssh_config()
            
            return optimal_node
        else:
            raise Exception("未找到健康的可通信节点")
    
    def generate_report(self):
        """生成优化报告"""
        report = {
            "timestamp": time.time(),
            "nodes_checked": len(self.network_stats),
            "healthy_nodes": [node for node, stats in self.network_stats.items() if stats["ssh_reachable"]],
            "nodes_config": self.nodes,
            "network_stats": self.network_stats,
            "system_info": {
                "cpu_usage": psutil.cpu_percent(),
                "mem_usage": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent
            }
        }
        
        filename = f"communication_optimization_report_{int(time.time())}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"优化报告已生成: {filename}")
        return filename


def main():
    """主函数"""
    optimizer = NodeCommunicationOptimizer()
    
    try:
        print("=== 节点通信优化器启动 ===\n")
        
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
