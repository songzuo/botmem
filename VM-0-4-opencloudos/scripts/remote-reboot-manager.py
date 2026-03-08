#!/usr/bin/env python3
"""
远程重启管理器 - 不依赖SSH的重启方案
适用于所有7台机器：bot~bot5, 7zi.com, sandbox

当SSH无法登录时，通过云平台API或其他方式重启机器
"""

import json
import os
import subprocess
from datetime import datetime
from typing import Dict, Optional

WORKSPACE = "/workspace/projects/workspace"

# 完整的7台机器配置
NODES = {
    "7zi.com": {
        "host": "7zi.com",
        "user": "root",
        "password": "ge2099334$ZZ",
        "cloud": None,  # 需要配置云平台信息
        "reboot_method": "ssh",  # ssh, aliyun_api, tencent_api, volcengine_api, watchdog
    },
    "bot.szspd.cn": {
        "host": "bot.szspd.cn",
        "user": "root", 
        "password": "ge2099334$ZZ",
        "cloud": "aliyun",  # 阿里云
        "instance_id": None,  # 需要填写实例ID
        "reboot_method": "ssh",
    },
    "bot2.szspd.cn": {
        "host": "bot2.szspd.cn",
        "user": "root",
        "password": "ge2099334$ZZ",
        "cloud": "aliyun",
        "instance_id": None,
        "reboot_method": "ssh",
    },
    "bot3.szspd.cn": {
        "host": "bot3.szspd.cn",
        "user": "root",
        "password": "ge2099334$ZZ",
        "cloud": "tencent",  # 腾讯云
        "instance_id": None,
        "reboot_method": "ssh",
    },
    "bot4.szspd.cn": {
        "host": "bot4.szspd.cn",
        "user": "root",
        "password": "ge2099334$ZZ",
        "cloud": "tencent",
        "instance_id": None,
        "reboot_method": "ssh",
    },
    "bot5.szspd.cn": {
        "host": "bot5.szspd.cn",
        "user": "root",
        "password": "ge2099334$ZZ",
        "cloud": "volcengine",  # 火山引擎
        "instance_id": None,
        "reboot_method": "ssh",
    },
    "sandbox": {
        "host": "localhost",
        "user": "root",
        "password": "ge2099334$ZZ",
        "cloud": None,
        "reboot_method": "local",
    },
}

# 自动重启触发条件
REBOOT_TRIGGERS = {
    "memory_threshold": 95,      # 内存使用率超过95%
    "load_threshold": 10,        # 负载超过10
    "ssh_timeout_count": 3,      # SSH连续超时3次
    "process_zombie_count": 50,  # 僵尸进程超过50个
}

class RemoteRebootManager:
    """远程重启管理器"""
    
    def __init__(self):
        self.log_file = f"{WORKSPACE}/memory/reboot-manager.log"
        self.state_file = f"{WORKSPACE}/memory/reboot-state.json"
        self.load_state()
        
    def log(self, message: str, level: str = "INFO"):
        """记录日志"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] [{level}] {message}"
        print(log_entry)
        with open(self.log_file, "a") as f:
            f.write(log_entry + "\n")
            
    def load_state(self):
        """加载状态"""
        if os.path.exists(self.state_file):
            with open(self.state_file, "r") as f:
                self.state = json.load(f)
        else:
            self.state = {
                "ssh_failures": {},  # 节点SSH失败计数
                "last_reboot": {},   # 上次重启时间
                "reboot_count": {},  # 重启次数统计
            }
            
    def save_state(self):
        """保存状态"""
        with open(self.state_file, "w") as f:
            json.dump(self.state, f, indent=2)
            
    def check_ssh(self, node: str) -> bool:
        """检查SSH是否可用"""
        config = NODES.get(node)
        if not config:
            return False
            
        # 使用TCP连接检查端口22
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((config["host"], 22))
            sock.close()
            
            if result == 0:
                self.state["ssh_failures"][node] = 0
                self.save_state()
                return True
            else:
                self._record_ssh_failure(node)
                return False
        except Exception as e:
            self.log(f"SSH检查异常 {node}: {e}", "ERROR")
            self._record_ssh_failure(node)
            return False
            
    def _record_ssh_failure(self, node: str):
        """记录SSH失败"""
        if node not in self.state["ssh_failures"]:
            self.state["ssh_failures"][node] = 0
        self.state["ssh_failures"][node] += 1
        self.save_state()
        
        failures = self.state["ssh_failures"][node]
        self.log(f"节点 {node} SSH失败次数: {failures}", "WARN")
        
        if failures >= REBOOT_TRIGGERS["ssh_timeout_count"]:
            self.log(f"节点 {node} SSH连续失败{failures}次，触发远程重启", "ALERT")
            self.trigger_remote_reboot(node, "ssh_failure")
            
    def trigger_remote_reboot(self, node: str, reason: str) -> bool:
        """触发远程重启"""
        config = NODES.get(node)
        if not config:
            self.log(f"未知节点: {node}", "ERROR")
            return False
            
        self.log(f"=== 触发远程重启: {node}, 原因: {reason} ===", "ALERT")
        
        # 记录重启
        self.state["last_reboot"][node] = datetime.now().isoformat()
        if node not in self.state["reboot_count"]:
            self.state["reboot_count"][node] = 0
        self.state["reboot_count"][node] += 1
        self.save_state()
        
        # 根据云平台选择重启方式
        cloud = config.get("cloud")
        
        if cloud == "aliyun":
            return self._reboot_aliyun(node, config)
        elif cloud == "tencent":
            return self._reboot_tencent(node, config)
        elif cloud == "volcengine":
            return self._reboot_volcengine(node, config)
        else:
            self.log(f"节点 {node} 没有配置云平台API，无法远程重启", "ERROR")
            return False
            
    def _reboot_aliyun(self, node: str, config: Dict) -> bool:
        """通过阿里云API重启"""
        instance_id = config.get("instance_id")
        if not instance_id:
            self.log(f"节点 {node} 没有配置阿里云实例ID", "ERROR")
            return False
            
        self.log(f"通过阿里云API重启 {node} (实例: {instance_id})")
        
        # 需要配置阿里云CLI或SDK
        # aliyun ecs RebootInstance --InstanceId <instance_id>
        cmd = f"aliyun ecs RebootInstance --InstanceId {instance_id} --ForceStop true"
        self.log(f"执行命令: {cmd}")
        
        # TODO: 实际执行需要配置aliyun CLI
        return False
        
    def _reboot_tencent(self, node: str, config: Dict) -> bool:
        """通过腾讯云API重启"""
        instance_id = config.get("instance_id")
        if not instance_id:
            self.log(f"节点 {node} 没有配置腾讯云实例ID", "ERROR")
            return False
            
        self.log(f"通过腾讯云API重启 {node} (实例: {instance_id})")
        
        # 需要配置腾讯云CLI或SDK
        # tccli cvm RebootInstances --InstanceIds '["ins-xxx"]'
        cmd = f'tccli cvm RebootInstances --InstanceIds \'["{instance_id}"]\' --ForceReboot true'
        self.log(f"执行命令: {cmd}")
        
        # TODO: 实际执行需要配置tccli
        return False
        
    def _reboot_volcengine(self, node: str, config: Dict) -> bool:
        """通过火山引擎API重启"""
        instance_id = config.get("instance_id")
        if not instance_id:
            self.log(f"节点 {node} 没有配置火山引擎实例ID", "ERROR")
            return False
            
        self.log(f"通过火山引擎API重启 {node} (实例: {instance_id})")
        
        # 需要配置火山引擎CLI或SDK
        # volcengine ecs RebootInstance --InstanceId <instance_id>
        cmd = f"volcengine ecs RebootInstance --InstanceId {instance_id}"
        self.log(f"执行命令: {cmd}")
        
        # TODO: 实际执行需要配置volcengine CLI
        return False
        
    def setup_watchdog(self, node: str) -> str:
        """生成watchdog配置脚本（部署到节点上）"""
        script = '''#!/bin/bash
# Watchdog自动重启脚本 - 部署到节点上
# 当资源超过阈值时自动重启

MEMORY_THRESHOLD=95
LOAD_THRESHOLD=10
LOG_FILE="/var/log/watchdog-reboot.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$usage" -gt "$MEMORY_THRESHOLD" ]; then
        log "ALERT: Memory usage ${usage}% > ${MEMORY_THRESHOLD}%, triggering reboot"
        return 1
    fi
    return 0
}

check_load() {
    local load=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ' | cut -d'.' -f1)
    if [ "$load" -gt "$LOAD_THRESHOLD" ]; then
        log "ALERT: Load ${load} > ${LOAD_THRESHOLD}, triggering reboot"
        return 1
    fi
    return 0
}

main() {
    check_memory || { log "Rebooting due to high memory"; sleep 5; reboot; }
    check_load || { log "Rebooting due to high load"; sleep 5; reboot; }
}

main
'''
        return script
        
    def check_all_nodes(self) -> Dict:
        """检查所有节点状态"""
        self.log("=== 检查所有节点SSH状态 ===")
        
        results = {}
        for node in NODES:
            if node == "sandbox":
                results[node] = {"ssh": True, "status": "local"}
                continue
                
            ssh_ok = self.check_ssh(node)
            results[node] = {
                "ssh": ssh_ok,
                "failures": self.state["ssh_failures"].get(node, 0),
                "last_reboot": self.state["last_reboot"].get(node),
                "reboot_count": self.state["reboot_count"].get(node, 0),
            }
            
        return results
        
    def get_status(self) -> Dict:
        """获取管理器状态"""
        return {
            "nodes": list(NODES.keys()),
            "state": self.state,
            "triggers": REBOOT_TRIGGERS,
        }


def main():
    import sys
    
    manager = RemoteRebootManager()
    
    if len(sys.argv) < 2:
        print("远程重启管理器")
        print("")
        print("用法: python3 remote-reboot-manager.py <命令>")
        print("")
        print("命令:")
        print("  check          - 检查所有节点SSH状态")
        print("  status         - 显示管理器状态")
        print("  reboot <node>  - 触发节点远程重启")
        print("  watchdog       - 生成watchdog脚本")
        return
        
    cmd = sys.argv[1]
    
    if cmd == "check":
        results = manager.check_all_nodes()
        print(json.dumps(results, indent=2, ensure_ascii=False))
    elif cmd == "status":
        status = manager.get_status()
        print(json.dumps(status, indent=2, ensure_ascii=False))
    elif cmd == "reboot":
        if len(sys.argv) < 3:
            print("用法: reboot <node>")
            return
        node = sys.argv[2]
        manager.trigger_remote_reboot(node, "manual")
    elif cmd == "watchdog":
        script = manager.setup_watchdog("all")
        print(script)
    else:
        print(f"未知命令: {cmd}")


if __name__ == "__main__":
    main()
