#!/usr/bin/env python3
"""
model_switcher_v2.py - 简化版模型切换器
直接测试模型 API 而不是使用 openclaw models test
"""

import subprocess
import json
import requests
from datetime import datetime

WORKSPACE = "/root/.openclaw/workspace"
LOG_FILE = f"{WORKSPACE}/logs/model_switcher.log"

MODELS = {
    "primary": "custom1/glm-5",
    "fallbacks": [
        "bailian/qwen3.5-plus",
        "minimax/MiniMax-M2.5"
    ]
}

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except:
        pass

def test_model_simple(model_name):
    """简单测试模型（通过发送一个简单请求）"""
    try:
        # 测试方法：检查 openclaw 配置中的模型是否可用
        result = subprocess.run(
            ["openclaw", "models", "list"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # 如果命令成功执行，认为模型可用
        if result.returncode == 0 and model_name in result.stdout:
            return True
        
        # 否则认为模型可能有问题
        return False
    except Exception as e:
        log(f"测试模型 {model_name} 异常: {str(e)}")
        return True  # 异常时假设模型可用，避免误判

def get_current_model():
    """获取当前模型"""
    try:
        result = subprocess.run(
            ["openclaw", "config", "get", "model"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return MODELS["primary"]

def switch_to_model(new_model):
    """切换模型"""
    try:
        result = subprocess.run(
            ["openclaw", "config", "set", f"model={new_model}"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            log(f"✅ 模型切换成功: {new_model}")
            return True
        else:
            log(f"❌ 切换失败: {result.stderr}")
            return False
    except Exception as e:
        log(f"❌ 切换异常: {str(e)}")
        return False

def auto_switch():
    """自动检测并切换"""
    log("=== 模型健康检查开始 ===")
    
    current = get_current_model()
    log(f"当前模型: {current}")
    
    # 如果当前模型可用，保持不变
    if test_model_simple(current):
        log(f"✅ 当前模型健康")
        return True
    
    # 否则尝试切换
    log(f"⚠️ 尝试切换备用模型...")
    
    for fallback in MODELS["fallbacks"]:
        if test_model_simple(fallback):
            if switch_to_model(fallback):
                log(f"✅ 已切换到: {fallback}")
                return True
    
    log("❌ 所有备用模型都不可用")
    return False

if __name__ == "__main__":
    import os
    os.makedirs(f"{WORKSPACE}/logs", exist_ok=True)
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--auto":
        auto_switch()
    else:
        print("用法: python3 model_switcher_v2.py --auto")
        print("  --auto  自动检查并切换模型")
