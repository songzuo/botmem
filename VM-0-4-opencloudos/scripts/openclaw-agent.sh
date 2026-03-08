#!/bin/bash
# 升级版自主代理 - 直接使用Shell调用OpenClaw CLI
# 每个节点使用自己本地的OpenClaw智能体进行思考

NODE_NAME="${NODE_NAME:-unknown}"
NODE_ROLE="${NODE_ROLE:-worker}"

# 调用本地OpenClaw
call_openclaw() {
    local prompt="$1"
    source /root/.nvm/nvm.sh >/dev/null 2>&1 && nvm use 22 >/dev/null 2>&1
    /root/.nvm/versions/node/v22.22.0/bin/openclaw agent --agent main --local -m "$prompt" --thinking medium 2>&1
}

case "$1" in
    think)
        prompt="你是一个${NODE_ROLE}。请简洁思考：${2:-测试}"
        result=$(call_openclaw "$prompt")
        echo "$result"
        ;;
    exec)
        prompt="你是一个${NODE_ROLE}。请完成：${2:-测试}"
        result=$(call_openclaw "$prompt")
        echo "$result"
        ;;
    discuss)
        prompt="团队讨论：$2。你的角色是${NODE_ROLE}。请发表看法。"
        result=$(call_openclaw "$prompt")
        echo "$result"
        ;;
    status)
        echo "节点: $NODE_NAME | 角色: $NODE_ROLE | 智能体: OpenClaw"
        ;;
    *)
        echo "用法: $0 <think|exec|discuss|status> [参数]"
        ;;
esac
