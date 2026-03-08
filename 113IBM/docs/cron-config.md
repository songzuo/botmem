# Claw-Mesh 定时任务配置
# 格式：cron 表达式 | 任务描述 | 目标代理

# ============ 系统代理 (每 15 分钟) ============
*/15 * * * * | 系统健康检查 | sys-agent
*/15 * * * * | 检查 Gateway 状态 | sys-agent
*/15 * * * * | 检查 PostgreSQL 状态 | sys-agent
*/15 * * * * | 检查代理服务状态 | sys-agent

# ============ 聊天代理 (每 10 分钟) ============
*/10 * * * * | 检查新消息 | chat-agent
*/10 * * * * | 处理待回复消息 | chat-agent

# ============ 加密货币代理 (每 30 分钟) ============
*/30 * * * * | Polymarket 余额检查 | crypto-agent
*/30 * * * * | Freqtrade 状态检查 | crypto-agent
*/30 * * * * | 加密货币价格更新 | crypto-agent

# ============ 每小时任务 ============
0 * * * * | 记忆整理 | memory-agent
0 * * * * | 项目变更检查 | code-agent
0 * * * * | 网页爬取 | web-agent
0 * * * * | 数据分析 | data-agent
0 * * * * | 文档同步 | doc-agent
0 * * * * | 学习新知识 | learn-agent
0 * * * * | 音频处理检查 | audio-agent
0 * * * * | 业务更新检查 | biz-agent

# ============ 每天任务 ============
0 02 * * * | 生成记忆摘要 | memory-agent
0 06 * * * | 系统健康日报 | sys-agent
0 08 * * * | 加密货币早报 | crypto-agent
0 09 * * * | 业务日报 | biz-agent
0 10 * * * | 代码审查报告 | code-agent
0 10 * * * | 文档变更报告 | doc-agent
0 15 * * * | 音频处理报告 | audio-agent
0 16 * * * | 代码进度更新 | code-agent
0 18 * * * | 业务晚报 | biz-agent
0 19 * * * | 数据日报 | data-agent
0 20 * * * | 加密货币晚报 | crypto-agent
0 21 * * * | 消息摘要 | chat-agent
0 22 * * * | 学习日报 | learn-agent

# ============ 每周任务 ============
0 03 * * 0 | 记忆归档 (周日) | memory-agent
0 09 * * 1 | 周度开发计划 (周一) | code-agent

# ============ 心跳检查 ============
0 */3 * * * | 三小时状态报告 | main-agent
