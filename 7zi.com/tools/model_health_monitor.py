#!/usr/bin/env python3
"""
model_health_monitor.py - 模型健康监控和自动切换
实现 MultiModelSwitcher + Proactive 功能
"""

import subprocess
import json
import time
from datetime import datetime

WORKSPACE = "/root/.openclaw/workspace"
HEALTH_LOG = f"{WORKSPACE}/logs/model_health.log"

# 模型配置
MODELS = {
    "primary": "custom1/glm-5",
    "fallbacks": [
        "bailian/qwen3.5-plus",
        "minimax/MiniMax-M2.5",
        "volcengine-1/glm-4-7"
    ]
}

def log(msg):
    timestamp = datetime.now().isoformat()
    line = f"[{timestamp}] {msg}"
    print(line)
    try:
        with open(HEALTH_LOG, "a") as f:
            f.write(line + "\n")
    except:
        pass

def check_model_health(model_name):
    """测试模型是否正常工作"""
    try:
        # 简单的测试请求
        result = subprocess.run(
            ["openclaw", "models", "test", model_name],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0
    except Exception as e:
        log(f"模型 {model_name} 测试失败: {str(e)}")
        return False

def get_current_model():
    """获取当前使用的模型"""
    try:
        with open(f"{WORKSPACE}/../openclaw.json", "r") as f:
            config = json.load(f)
            return config.get("model", MODELS["primary"])
    except:
        return MODELS["primary"]

def switch_model(new_model):
    """切换到新模型"""
    try:
        result = subprocess.run(
            ["openclaw", "config", "set", f"model={new_model}"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            log(f"✅ 成功切换到模型: {new_model}")
            return True
        else:
            log(f"❌ 切换模型失败: {result.stderr}")
            return False
    except Exception as e:
        log(f"❌ 切换模型异常: {str(e)}")
        return False

def monitor_and_switch():
    """监控模型健康并自动切换"""
    log("=== 开始模型健康检查 ===")
    
    current = get_current_model()
    log(f"当前模型: {current}")
    
    # 检查当前模型
    if check_model_health(current):
        log(f"✅ 当前模型健康: {current}")
        return True
    
    log(f"⚠️ 当前模型异常: {current}")
    
    # 尝试 fallback 模型
    for fallback in MODELS["fallbacks"]:
        log(f"尝试切换到备用模型: {fallback}")
        
        if check_model_health(fallback):
            if switch_model(fallback):
                log(f"✅ 成功切换到健康模型: {fallback}")
                
                # 通知其他系统
                notify_model_switch(current, fallback)
                return True
        else:
            log(f"❌ 备用模型也不健康: {fallback}")
    
    log("❌ 所有模型都无法使用！")
    return False

def notify_model_switch(old_model, new_model):
    """通知其他系统模型切换"""
    try:
        # 写入状态文件
        status = {
            "event": "model_switch",
            "old_model": old_model,
            "new_model": new_model,
            "timestamp": datetime.now().isoformat()
        }
        
        with open(f"{WORKSPACE}/logs/model_switch.log", "a") as f:
            f.write(json.dumps(status) + "\n")
        
        log(f"已记录模型切换事件")
    except Exception as e:
        log(f"记录切换事件失败: {str(e)}")

if __name__ == "__main__":
    import os
    os.makedirs(f"{WORKSPACE}/logs", exist_ok=True)
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--monitor":
        monitor_and_switch()
    else:
        print("用法: python3 model_health_monitor.py --monitor")
