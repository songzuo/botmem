#!/usr/bin/env python3
"""
网络拓扑图生成器 - 可视化HTTP-based通信网络
"""

import json
import time
import matplotlib.pyplot as plt
import networkx as nx
from datetime import datetime


class NetworkTopologyGenerator:
    """网络拓扑图生成器"""
    
    def __init__(self):
        self.nodes = []
        self.edges = []
        self.network_stats = {}
        self.topology_graph = nx.DiGraph()
    
    def load_http_network_stats(self):
        """加载HTTP网络统计数据"""
        # 查找最新的HTTP网络统计文件
        import os
        
        stats_files = []
        for filename in os.listdir('.'):
            if filename.startswith('http_network_stats_') and filename.endswith('.json'):
                stats_files.append(filename)
        
        if not stats_files:
            print("未找到HTTP网络统计数据文件，需要先运行HTTP通信优化器")
            return False
        
        # 使用最新的统计文件
        stats_files.sort(key=lambda x: int(x.split('_')[-1].split('.')[0]), reverse=True)
        latest_file = stats_files[0]
        
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                self.network_stats = json.load(f)
            print(f"加载HTTP网络统计数据: {latest_file}")
            return True
        except Exception as e:
            print(f"加载HTTP网络统计数据失败: {str(e)}")
            return False
    
    def load_cluster_config(self):
        """加载集群配置"""
        try:
            with open('cluster-workers.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
                self.nodes = config.get("nodes", [])
            return True
        except FileNotFoundError:
            print("未找到cluster-workers.json，使用默认配置")
            self.nodes = [
                {"host": "7zi.com", "role": "coordinator", "cpu": 8, "ram_mb": 16000, "type": "compute"},
                {"host": "bot.szspd.cn", "role": "worker", "cpu": 2, "ram_mb": 1870, "type": "monitor"},
                {"host": "bot2.szspd.cn", "role": "worker", "cpu": 2, "ram_mb": 1870, "type": "search"},
                {"host": "bot3.szspd.cn", "role": "worker", "cpu": 4, "ram_mb": 3655, "type": "develop"},
                {"host": "bot4.szspd.cn", "role": "worker", "cpu": 2, "ram_mb": 2000, "type": "document"},
                {"host": "bot5.szspd.cn", "role": "worker", "cpu": 1, "ram_mb": 1963, "type": "security"}
            ]
            return True
    
    def create_network_topology(self):
        """创建网络拓扑图"""
        if not self.nodes or not self.network_stats:
            print("缺少节点配置或网络统计数据")
            return False
        
        # 为每个节点添加属性
        for node in self.nodes:
            host = node["host"]
            stats = next((s for s in self.network_stats if s["node"] == host), {})
            
            # 获取节点性能分数
            performance_score = node.get("cpu", 0) * (node.get("ram_mb", 0) / 1024)
            
            # 获取响应时间
            response_time = stats.get("http_response_time_ms", float('inf'))
            
            # 节点状态
            reachable = stats.get("http_reachable") or stats.get("https_reachable")
            
            # 添加节点到图中
            self.topology_graph.add_node(host,
                role=node.get("role", "unknown"),
                cpu=node.get("cpu", 0),
                ram_gb=node.get("ram_mb", 0) / 1024,
                type=node.get("type", "unknown"),
                reachable=reachable,
                response_time_ms=response_time,
                performance_score=performance_score,
                services=stats.get("services_available", []),
                protocols=[]
            )
            
            # 添加支持的协议
            if stats.get("http_reachable"):
                self.topology_graph.nodes[host]["protocols"].append("http")
            if stats.get("https_reachable"):
                self.topology_graph.nodes[host]["protocols"].append("https")
            if stats.get("http_proxy_reachable"):
                self.topology_graph.nodes[host]["protocols"].append("http_proxy")
        
        # 创建通信路径（根据响应时间和角色）
        coordinator_node = None
        worker_nodes = []
        
        # 识别协调者和工作节点
        for node in self.nodes:
            if node.get("role") == "coordinator":
                coordinator_node = node["host"]
            else:
                worker_nodes.append(node["host"])
        
        # 创建协调者到工作节点的通信路径
        if coordinator_node:
            for worker in worker_nodes:
                worker_stats = next((s for s in self.network_stats if s["node"] == worker), {})
                
                if self.topology_graph.nodes[worker].get("reachable"):
                    response_time = worker_stats.get("http_response_time_ms", float('inf'))
                    
                    self.topology_graph.add_edge(coordinator_node, worker,
                        type="coordination",
                        weight=response_time,
                        response_time_ms=response_time
                    )
        
        # 创建工作节点之间的通信路径（可选，根据任务需要）
        for i, worker1 in enumerate(worker_nodes):
            for j, worker2 in enumerate(worker_nodes[i+1:], i+1):
                if (self.topology_graph.nodes[worker1].get("reachable") and
                    self.topology_graph.nodes[worker2].get("reachable")):
                    
                    # 计算通信权重
                    worker1_stats = next((s for s in self.network_stats if s["node"] == worker1), {})
                    worker2_stats = next((s for s in self.network_stats if s["node"] == worker2), {})
                    
                    weight = (worker1_stats.get("http_response_time_ms", float('inf')) +
                             worker2_stats.get("http_response_time_ms", float('inf'))) / 2
                    
                    self.topology_graph.add_edge(worker1, worker2,
                        type="worker_to_worker",
                        weight=weight,
                        response_time_ms=weight
                    )
        
        return True
    
    def visualize_topology(self, output_file="network_topology.png"):
        """可视化网络拓扑"""
        if not self.topology_graph or len(self.topology_graph.nodes()) == 0:
            print("拓扑图为空")
            return False
        
        plt.figure(figsize=(15, 12))
        
        # 确定节点位置（层次布局）
        pos = {}
        level_spacing = 3
        node_spacing = 2
        
        # 放置协调者节点
        coordinator_node = None
        worker_nodes = []
        
        for host, attrs in self.topology_graph.nodes(data=True):
            if attrs.get("role") == "coordinator":
                coordinator_node = host
            else:
                worker_nodes.append(host)
        
        if coordinator_node:
            pos[coordinator_node] = (0, level_spacing)
        
        # 放置工作节点
        for i, worker in enumerate(worker_nodes):
            x = (i - (len(worker_nodes) - 1) / 2) * node_spacing
            pos[worker] = (x, 0)
        
        # 颜色编码
        colors = []
        for node, attrs in self.topology_graph.nodes(data=True):
            if not attrs.get("reachable"):
                colors.append('#ffcccc')  # 红色（不可达）
            elif attrs.get("role") == "coordinator":
                colors.append('#ccffcc')  # 绿色（协调者）
            elif attrs.get("response_time_ms", float('inf')) < 100:
                colors.append('#ccffff')  # 青色（快速响应）
            elif attrs.get("response_time_ms", float('inf')) < 500:
                colors.append('#dddddd')  # 灰色（正常响应）
            else:
                colors.append('#ffffcc')  # 黄色（慢响应）
        
        # 绘制节点
        nx.draw_networkx_nodes(self.topology_graph, pos,
            node_size=[(attrs.get("performance_score", 0) + 1) * 100 for _, attrs in self.topology_graph.nodes(data=True)],
            node_color=colors,
            alpha=0.8,
            edgecolors='#333333',
            linewidths=1
        )
        
        # 绘制边（根据类型调整粗细和颜色）
        coordination_edges = [(u, v) for u, v, d in self.topology_graph.edges(data=True) if d.get("type") == "coordination"]
        worker_edges = [(u, v) for u, v, d in self.topology_graph.edges(data=True) if d.get("type") == "worker_to_worker"]
        
        # 协调者到工作节点的边（更粗）
        nx.draw_networkx_edges(self.topology_graph, pos,
            edgelist=coordination_edges,
            width=2,
            edge_color='#006600',
            alpha=0.7,
            arrows=True
        )
        
        # 工作节点之间的边（更细）
        nx.draw_networkx_edges(self.topology_graph, pos,
            edgelist=worker_edges,
            width=1,
            edge_color='#666666',
            alpha=0.5,
            arrows=True
        )
        
        # 标签
        labels = {}
        for node, attrs in self.topology_graph.nodes(data=True):
            labels[node] = (f"{node}\\n{attrs.get('cpu')}C/{attrs.get('ram_gb', 0):.1f}G\\n"
                          f"{'✅' if attrs.get('reachable') else '❌'}\\n"
                          f"RT: {attrs.get('response_time_ms', 0):.0f}ms")
        
        nx.draw_networkx_labels(self.topology_graph, pos,
            labels=labels,
            font_size=10,
            font_weight='bold'
        )
        
        # 绘制边标签（响应时间）
        edge_labels = {}
        for u, v, d in self.topology_graph.edges(data=True):
            if d.get("response_time_ms") and d.get("response_time_ms") < float('inf'):
                edge_labels[(u, v)] = f"{d['response_time_ms']:.0f}ms"
        
        nx.draw_networkx_edge_labels(self.topology_graph, pos,
            edge_labels=edge_labels,
            font_size=8
        )
        
        # 标题
        plt.title("HTTP-Based Cluster Network Topology\\n(SSH Unreachable, HTTP Communication Optimized)",
                  fontsize=16, pad=20)
        
        # 图例
        legend_elements = [
            plt.Line2D([0], [0], marker='o', color='w', label='Coordinator',
                     markerfacecolor='#ccffcc', markersize=15),
            plt.Line2D([0], [0], marker='o', color='w', label='Fast Response (<100ms)',
                     markerfacecolor='#ccffff', markersize=15),
            plt.Line2D([0], [0], marker='o', color='w', label='Normal Response (<500ms)',
                     markerfacecolor='#dddddd', markersize=15),
            plt.Line2D([0], [0], marker='o', color='w', label='Slow Response (>500ms)',
                     markerfacecolor='#ffffcc', markersize=15),
            plt.Line2D([0], [0], marker='o', color='w', label='Unreachable',
                     markerfacecolor='#ffcccc', markersize=15)
        ]
        
        plt.legend(handles=legend_elements, loc='upper right', bbox_to_anchor=(1.3, 1),
                  fontsize=12)
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"网络拓扑图已保存到: {output_file}")
        
        return True
    
    def generate_topology_report(self):
        """生成拓扑报告"""
        if not self.topology_graph:
            return False
        
        report = {
            "report_name": "HTTP网络拓扑优化报告",
            "timestamp": time.time(),
            "nodes_count": len(self.topology_graph.nodes()),
            "edges_count": len(self.topology_graph.edges()),
            "coordinator_node": None,
            "worker_nodes": [],
            "topology_summary": {},
            "node_details": [],
            "communication_paths": []
        }
        
        # 找出协调者和工作节点
        for host, attrs in self.topology_graph.nodes(data=True):
            node_report = {
                "host": host,
                "role": attrs.get("role", "unknown"),
                "cpu": attrs.get("cpu", 0),
                "ram_gb": attrs.get("ram_gb", 0),
                "response_time_ms": attrs.get("response_time_ms", float('inf')),
                "reachable": attrs.get("reachable", False),
                "performance_score": attrs.get("performance_score", 0)
            }
            
            if attrs.get("role") == "coordinator":
                report["coordinator_node"] = node_report
            else:
                report["worker_nodes"].append(node_report)
        
        # 计算网络统计
        report["topology_summary"]["average_response_time_ms"] = statistics.mean(
            attrs.get("response_time_ms", float('inf'))
            for _, attrs in self.topology_graph.nodes(data=True)
            if attrs.get("response_time_ms", float('inf')) < float('inf')
        )
        
        report["topology_summary"]["fastest_response_ms"] = min(
            attrs.get("response_time_ms", float('inf'))
            for _, attrs in self.topology_graph.nodes(data=True)
            if attrs.get("response_time_ms", float('inf')) < float('inf')
        )
        
        report["topology_summary"]["healthiest_nodes"] = [
            host for host, attrs in self.topology_graph.nodes(data=True)
            if attrs.get("reachable") and attrs.get("response_time_ms", float('inf')) < 500
        ]
        
        report["topology_summary"]["unreachable_nodes"] = [
            host for host, attrs in self.topology_graph.nodes(data=True)
            if not attrs.get("reachable")
        ]
        
        # 记录通信路径
        for u, v, attrs in self.topology_graph.edges(data=True):
            report["communication_paths"].append({
                "from": u,
                "to": v,
                "type": attrs.get("type", "unknown"),
                "response_time_ms": attrs.get("response_time_ms", float('inf'))
            })
        
        report["node_details"] = [
            {"host": host, **attrs}
            for host, attrs in self.topology_graph.nodes(data=True)
        ]
        
        filename = "network_topology_report.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"拓扑报告已生成: {filename}")
        
        return report
    
    def run_full_analysis(self):
        """运行完整分析"""
        print("=== 网络拓扑分析 ===\n")
        
        # 加载配置和数据
        if not self.load_cluster_config():
            return False
        
        if not self.load_http_network_stats():
            print("运行HTTP通信优化器获取网络统计数据...")
            from http_communication_optimizer import HTTPNodeCommunicationOptimizer
            optimizer = HTTPNodeCommunicationOptimizer()
            optimizer.test_http_connectivity()
        
        # 创建拓扑
        if not self.create_network_topology():
            return False
        
        # 可视化拓扑
        if not self.visualize_topology():
            return False
        
        # 生成报告
        self.generate_topology_report()
        
        return True


if __name__ == "__main__":
    import statistics
    
    try:
        analyzer = NetworkTopologyGenerator()
        analyzer.run_full_analysis()
        
        print("\n=== 拓扑分析完成 ===")
        
    except Exception as e:
        print(f"拓扑分析失败: {str(e)}")
        import traceback
        print(f"详细错误信息: {traceback.format_exc()}")
