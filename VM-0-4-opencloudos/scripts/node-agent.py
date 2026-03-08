#!/usr/bin/env python3
"""
OpenClaw 轻量化节点Agent
- 连接主管机Redis接收任务
- 调用本地Evomap执行任务
- 上报状态和进化数据
- 支持远程重启指令（不依赖SSH）
"""

import subprocess
import json
import time
import socket
import os
import sys
from datetime import datetime

# 配置
REDIS_HOST = os.environ.get('REDIS_HOST', '主管机IP')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', 'openclaw2026')
NODE_ID = socket.gethostname()
HEARTBEAT_INTERVAL = 30
TASK_CHANNEL = 'openclaw:tasks'
STATUS_CHANNEL = 'openclaw:status'
REBOOT_CHANNEL = 'openclaw:reboot'

# 尝试导入redis
try:
    import redis
except ImportError:
    print("Installing redis-py...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'redis', '-q'], check=True)
    import redis

class NodeAgent:
    def __init__(self):
        self.redis_client = None
        self.running = True
        self.connect_redis()
    
    def connect_redis(self):
        """连接Redis"""
        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD,
                decode_responses=True,
                socket_timeout=10,
                socket_connect_timeout=5
            )
            self.redis_client.ping()
            self.log(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
            return True
        except Exception as e:
            self.log(f"Redis connection failed: {e}")
            return False
    
    def log(self, msg):
        """日志输出"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] [{NODE_ID}] {msg}")
    
    def get_system_status(self):
        """获取系统状态"""
        try:
            # 内存
            mem_info = subprocess.run(['free', '-m'], capture_output=True, text=True)
            mem_lines = mem_info.stdout.strip().split('\n')
            mem_parts = mem_lines[1].split()
            mem_total = int(mem_parts[1])
            mem_used = int(mem_parts[2])
            mem_percent = round(mem_used / mem_total * 100, 1)
            
            # CPU负载
            load_info = subprocess.run(['cat', '/proc/loadavg'], capture_output=True, text=True)
            load = load_info.stdout.strip().split()[0]
            
            # 磁盘
            disk_info = subprocess.run(['df', '-h', '/'], capture_output=True, text=True)
            disk_parts = disk_info.stdout.strip().split('\n')[1].split()
            disk_percent = disk_parts[4]
            
            # Evomap进程数
            evomap_count = subprocess.run(['pgrep', '-c', '-f', 'evomap'], capture_output=True, text=True)
            evomap_procs = int(evomap_count.stdout.strip()) if evomap_count.returncode == 0 else 0
            
            return {
                'node_id': NODE_ID,
                'timestamp': datetime.now().isoformat(),
                'mem_percent': mem_percent,
                'load': float(load),
                'disk_percent': disk_percent,
                'evomap_procs': evomap_procs,
                'status': 'online'
            }
        except Exception as e:
            return {'node_id': NODE_ID, 'error': str(e), 'status': 'error'}
    
    def report_status(self):
        """上报状态到Redis"""
        try:
            status = self.get_system_status()
            self.redis_client.hset(f'node:{NODE_ID}', mapping=status)
            self.redis_client.publish(STATUS_CHANNEL, json.dumps(status))
            self.log(f"Status reported: mem={status.get('mem_percent')}%")
        except Exception as e:
            self.log(f"Status report failed: {e}")
    
    def execute_task(self, task):
        """执行任务"""
        task_type = task.get('type')
        self.log(f"Executing task: {task_type}")
        
        result = {'node_id': NODE_ID, 'task_id': task.get('id'), 'timestamp': datetime.now().isoformat()}
        
        try:
            if task_type == 'shell':
                cmd = task.get('command')
                # 安全检查
                dangerous = ['rm -rf /', 'mkfs', 'format', 'shutdown', '> /dev/sda']
                if any(d in cmd for d in dangerous):
                    result['status'] = 'rejected'
                    result['error'] = 'Dangerous command blocked'
                else:
                    proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
                    result['status'] = 'success' if proc.returncode == 0 else 'failed'
                    result['stdout'] = proc.stdout[:1000]
                    result['stderr'] = proc.stderr[:500]
                    result['returncode'] = proc.returncode
            
            elif task_type == 'evomap':
                # 调用Evomap
                evomap_cmd = task.get('command', 'status')
                proc = subprocess.run(['evomap', evomap_cmd], capture_output=True, text=True, timeout=120)
                result['status'] = 'success' if proc.returncode == 0 else 'failed'
                result['output'] = proc.stdout[:2000]
            
            elif task_type == 'cleanup':
                # 清理重复进程
                subprocess.run(['pkill', '-o', '-f', 'openclaw-evomap.js'], capture_output=True)
                subprocess.run(['pkill', '-o', '-f', 'evomap-auto-task.js'], capture_output=True)
                result['status'] = 'success'
                result['message'] = 'Cleanup completed'
            
            elif task_type == 'reboot':
                # 远程重启
                self.log("Reboot command received, rebooting in 5 seconds...")
                result['status'] = 'rebooting'
                self.redis_client.publish(STATUS_CHANNEL, json.dumps(result))
                time.sleep(5)
                subprocess.run(['reboot'], capture_output=True)
            
            else:
                result['status'] = 'unknown_task'
        
        except subprocess.TimeoutExpired:
            result['status'] = 'timeout'
        except Exception as e:
            result['status'] = 'error'
            result['error'] = str(e)
        
        # 上报结果
        try:
            self.redis_client.publish(f'openclaw:results:{NODE_ID}', json.dumps(result))
        except:
            pass
        
        return result
    
    def listen_tasks(self):
        """监听任务队列"""
        try:
            pubsub = self.redis_client.pubsub()
            pubsub.subscribe(TASK_CHANNEL, f'openclaw:tasks:{NODE_ID}', REBOOT_CHANNEL)
            
            for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        task = json.loads(message['data'])
                        # 检查是否是发给本节点的任务
                        target = task.get('target', 'all')
                        if target == 'all' or target == NODE_ID:
                            self.execute_task(task)
                    except json.JSONDecodeError:
                        pass
        except Exception as e:
            self.log(f"Task listener error: {e}")
    
    def run(self):
        """主循环"""
        import threading
        
        # 启动任务监听线程
        task_thread = threading.Thread(target=self.listen_tasks, daemon=True)
        task_thread.start()
        
        self.log("Agent started, listening for tasks...")
        
        # 主循环：定期上报状态
        while self.running:
            self.report_status()
            time.sleep(HEARTBEAT_INTERVAL)

if __name__ == '__main__':
    agent = NodeAgent()
    agent.run()
