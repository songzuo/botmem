#!/bin/bash
# OpenClaw/Picoclaw 自动切换模型 Wrapper
# 当API调用失败时自动切换到下一个可用模型

OPENCLAW_PATH="/root/.local/share/pnpm/openclaw"
NVM_SETUP="source /root/.nvm/nvm.sh && nvm use 22 && "

# 可用模型列表 (按优先级)
MODELS=(
    "volcengine-2/doubao-seed-code"
    "alibaba/qwen3.5-plus"
)

# 配置文件
CONFIG_FILE="/root/.openclaw/openclaw.json"

get_current_model() {
    $NVM_SETUP $OPENCLAW_PATH config get models.default 2>/dev/null | tail -1
}

set_model() {
    local model=$1
    $NVM_SETUP $OPENCLAW_PATH config set models.default "$model" --json 2>/dev/null
    echo "Switched to $model"
}

# 测试模型是否可用
test_model() {
    local model=$1
    local provider=$(echo $model | cut -d'/' -f1)

    # 简单测试
    if [[ "$provider" == "volcengine-2" ]]; then
        curl -s -X POST "https://ark.cn-beijing.volces.com/api/coding/v1/chat/completions" \
            -H "Authorization: Bearer 4e051cf9-b27b-41eb-9540-2890ad94a271" \
            -H "Content-Type: application/json" \
            -d '{"model":"doubao-seed-code","messages":[{"role":"user","content":"hi"}],"max_tokens":10}' \
            2>/dev/null | grep -q "choices" && return 0
    elif [[ "$provider" == "alibaba" ]]; then
        curl -s -X POST "https://coding.dashscope.aliyuncs.com/v1/chat/completions" \
            -H "Authorization: Bearer sk-sp-365714cef25a45df8e9b3948641695e6" \
            -H "Content-Type: application/json" \
            -d '{"model":"qwen3.5-plus","messages":[{"role":"user","content":"hi"}],"max_tokens":10}' \
            2>/dev/null | grep -q "choices" && return 0
    fi
    return 1
}

# 主函数 - 执行命令，失败时自动切换
exec_with_fallback() {
    local args="$@"
    local max_retries=3
    local retry=0
    local current_idx=0

    while [[ $retry -lt $max_retries ]]; do
        local model="${MODELS[$current_idx]}"

        # 设置模型
        set_model "$model"
        sleep 0.5

        # 执行命令
        $NVM_SETUP $OPENCLAW_PATH $args 2>&1

        local exit_code=$?

        # 检查是否有错误
        if [[ $exit_code -eq 0 ]]; then
            # 简单检查输出是否有error
            return 0
        fi

        echo "Model $model failed, trying next..." >&2
        current_idx=$(( (current_idx + 1) % ${#MODELS[@]} ))
        retry=$((retry + 1))
    done

    echo "All models failed" >&2
    return 1
}

# 如果直接运行此脚本
if [[ "$0" == "${BASH_SOURCE[0]}" ]]; then
    if [[ $# -eq 0 ]]; then
        echo "Usage: $0 <openclaw args>"
        echo "Example: $0 agent --agent main --local -m 'hello'"
        exit 1
    fi
    exec_with_fallback "$@"
fi
