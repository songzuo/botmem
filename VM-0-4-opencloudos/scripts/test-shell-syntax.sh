#!/bin/bash

# 测试 self-healing.sh 的语法
echo "Testing self-healing.sh syntax..."
bash -n /root/.openclaw/workspace/scripts/self-healing.sh
if [ $? -eq 0 ]; then
    echo "✅ self-healing.sh syntax is correct"
else
    echo "❌ self-healing.sh syntax error"
fi

# 测试 self-healing-true-autonomous.sh 的语法
echo -e "\nTesting self-healing-true-autonomous.sh syntax..."
bash -n /root/.openclaw/workspace/scripts/self-healing-true-autonomous.sh
if [ $? -eq 0 ]; then
    echo "✅ self-healing-true-autonomous.sh syntax is correct"
else
    echo "❌ self-healing-true-autonomous.sh syntax error"
fi

# 测试其他脚本的语法
echo -e "\nTesting other shell scripts..."
scripts=(
    "/root/.openclaw/workspace/scripts/self-driving-system.sh"
    "/root/.openclaw/workspace/scripts/monitor-tasks.sh"
    "/root/.openclaw/workspace/scripts/health-checker.sh"
    "/root/.openclaw/workspace/scripts/cluster-check.sh"
    "/root/.openclaw/workspace/scripts/check-nodes.sh"
    "/root/.openclaw/workspace/scripts/check-nodes-fast.sh"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        echo -e "\nTesting $script..."
        bash -n "$script"
        if [ $? -eq 0 ]; then
            echo "✅ $script syntax is correct"
        else
            echo "❌ $script syntax error"
        fi
    else
        echo -e "\n⚠️  $script not found"
    fi
done
