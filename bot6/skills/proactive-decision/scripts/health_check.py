#!/usr/bin/env python3
"""系统健康检查脚本"""

import subprocess
import json
from datetime import datetime

def run_cmd(cmd):
    """执行命令并返回输出"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()
    except:
        return ""

def check_disk():
    """检查磁盘使用率"""
    output = run_cmd("df -h / | tail -1")
    if output:
        parts = output.split()
        usage = parts[4].replace('%', '')
        return int(usage)
    return 0

def check_memory():
    """检查内存使用率"""
    output = run_cmd("free | grep Mem")
    if output:
        parts = output.split()
        total = int(parts[1])
        used = int(parts[2])
        return round(used / total * 100)
    return 0

def check_load():
    """检查 CPU 负载"""
    output = run_cmd("cat /proc/loadavg")
    if output:
        load1 = float(output.split()[0])
        return load1
    return 0

def check_docker():
    """检查 Docker 状态"""
    result = run_cmd("docker ps --format '{{.Names}}' 2>/dev/null")
    containers = result.split('\n') if result else []
    return len([c for c in containers if c])

def check_npm_vulnerabilities():
    """检查 npm 安全漏洞"""
    result = run_cmd("npm audit --json 2>/dev/null")
    if result:
        try:
            data = json.loads(result)
            return data.get('metadata', {}).get('vulnerabilities', {}).get('total', 0)
        except:
            pass
    return 0

def generate_report():
    """生成健康报告"""
    print("🔍 系统健康检查")
    print("=" * 40)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    issues = []
    suggestions = []
    
    # 磁盘检查
    disk = check_disk()
    status = "✅" if disk < 80 else "⚠️" if disk < 90 else "❌"
    print(f"{status} 磁盘使用: {disk}%")
    if disk >= 80:
        issues.append(f"磁盘使用率 {disk}%")
        suggestions.append("清理缓存和临时文件")
    
    # 内存检查
    mem = check_memory()
    status = "✅" if mem < 80 else "⚠️" if mem < 90 else "❌"
    print(f"{status} 内存使用: {mem}%")
    if mem >= 80:
        issues.append(f"内存使用率 {mem}%")
        suggestions.append("检查内存泄漏或重启服务")
    
    # CPU 检查
    load = check_load()
    status = "✅" if load < 2 else "⚠️" if load < 4 else "❌"
    print(f"{status} CPU 负载: {load}")
    
    # Docker 检查
    containers = check_docker()
    print(f"🐳 Docker 容器: {containers} 个运行中")
    
    # npm 检查
    vulns = check_npm_vulnerabilities()
    if vulns > 0:
        status = "⚠️"
        issues.append(f"npm 安全漏洞: {vulns} 个")
        suggestions.append("运行 npm audit fix")
    else:
        status = "✅"
    print(f"{status} npm 安全漏洞: {vulns}")
    
    print()
    
    # 健康评分
    score = 100
    if disk >= 80: score -= 15
    if disk >= 90: score -= 15
    if mem >= 80: score -= 15
    if mem >= 90: score -= 15
    if load >= 2: score -= 10
    if vulns > 0: score -= min(vulns * 5, 20)
    
    print(f"📊 健康评分: {score}/100")
    
    if issues:
        print()
        print("⚠️ 发现问题:")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
        
        print()
        print("💡 建议操作:")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"  {i}. {suggestion}")
    else:
        print()
        print("✅ 系统状态良好")
    
    return score

if __name__ == "__main__":
    generate_report()