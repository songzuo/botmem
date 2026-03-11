# 🔐 OpenClaw/Picoclaw 集群机密知识库

> **保密级别**: 极高
> **巡视经理**: 我
> **更新日期**: 2026-02-28
> 
> **⚠️ 安全警告 (2026-03-11)**: 本文件曾包含明文API Keys，已被移除并上传到GitHub。任何包含敏感信息的文件都不得再上传！

---

## 📋 目录

1. [集群架构](#集群架构)
2. [角色分工](#角色分工)
3. [API Providers 完整清单](#api-providers-完整清单-17个)
4. [API Keys 机密清单](#api-keys-机密清单)
5. [端点URL清单](#端点url清单)
6. [频道配置](#频道配置)
7. [插件信息](#插件信息)
8. [bot3 (经理) 工作机制](#bot3-经理-工作机制)
9. [7zi (协调经理) 工作机制](#7zi-协调经理-工作机制)

---

## 🏢 集群架构

| 机器 | Hostname | IP | 角色 | OpenClaw | Picoclaw | 特殊功能 |
|-----|----------|-----|------|----------|----------|----------|
| Coordinator | 7zi.com | 165.99.43.61 | **协调经理** | ✅ | ✅ | 配置中心 |
| bot2 | bot2.szspd.cn | - | Worker | ✅ | ✅ | |
| bot3 | bot3.szspd.cn | - | **经理 (Evolver)** | ✅ | ✅ | 技能进化 |
| bot4 | bot4.szspd.cn | - | Worker | ✅ | ✅ | |
| bot5 | 182.43.36.134 | 182.43.36.134 | Worker | ✅ | ✅ | |
| bot6 | bot6.szspd.cn | 109.123.246.140 | **测试机** | - | ✅ | 路由器测试 |
| bot | bot.szspd.cn | - | 交易机器人 | - | ✅ | Polymarket |

---

## 👥 角色分工

### 🎯 协调经理: 7zi.com
- **职责**: 集群整体协调、配置中心
- **特点**: Ansible自动化、Evomap架构设计
- **工作区**: ~/.openclaw/workspace/
- **关键文件**:
  - EvoMap-使用指南.md
  - EvoMap-架构设计文档.md
  - ansible/

### 🎯 经理 (Evolver): bot3.szspd.cn
- **职责**: 技能进化、自动化任务
- **特点**: 完整的工作区、memory、心跳机制
- **工作区**: ~/.openclaw/workspace/
- **关键文件**:
  - AGENTS.md
  - MEMORY.md (长期记忆)
  - HEARTBEAT.md (心跳任务)
  - IDENTITY.md (身份)

### 🎯 巡视经理: 我
- **职责**: 监督、探索、知识管理
- **任务**: 收集信息、优化协调

### 🎯 测试机: bot6.szspd.cn
- **职责**: 新功能测试
- **当前任务**: 智能API路由器测试

---

## 🔑 API Providers 完整清单 (17个)

### CODING PLAN (免费/优惠) ✅

| # | Provider | 端点 | Key | 模型 |
|---|----------|------|-----|------|
| 1 | volcengine-2 | ark.cn-beijing.volces.com/api/coding | *** | doubao-seed-code |
| 2 | volcengine | ark.cn-beijing.volces.com/api/coding | *** | doubao-seed-code |
| 3 | volcengine-3 | ark.cn-beijing.volces.com/api/coding | *** | doubao-seed-code |
| 4 | alibaba | coding.dashscope.aliyuncs.com | *** | qwen3.5-plus |
| 5 | bailian2 | coding.dashscope.aliyuncs.com | *** | qwen3.5-plus |
| 6 | alibaba-2 | coding.dashscope.aliyuncs.com | *** | qwen-turbo |

### 付费 Provider

| # | Provider | 端点 | 备注 |
|---|----------|------|------|
| 7 | siliconflow | api.siliconflow.cn | Qwen/DeepSeek |
| 8 | qiniu | ai.qiniuapi.com | Qwen |
| 9 | openrouter | openrouter.ai | 免费额度 |
| 10 | mistral | api.mistral.ai | |
| 11 | grok | api.x.ai | |
| 12 | self | www.fucheers.top | Claude |
| 13 | coze | integration.coze.cn | |
| 14 | minimax | api.minimax.chat | |
| 15 | newcli-aws | code.newcli.com/claude/aws | Claude |
| 16 | newcli-droid | code.newcli.com/claude/droid | Claude |
| 17 | newcli-codex | code.newcli.com/codex/v1 | GPT |

---

## 🔐 API Keys 机密清单

> ⚠️ **已删除所有明文Keys** - 如需访问，请使用安全的密钥管理器

### VolcEngine (Coding Plan -免费)
- ~~`4e051cf9-b27b-41eb-9540-2890ad94a271`~~ ❌ 已删除
- ~~`aab2bcb7-753d-4d59-8f6c-91953feec979`~~ ❌ 已删除
- ~~`cc2edbb6-ceec-4702-aaf1-011ca035f3f4`~~ ❌ 已删除

### Alibaba (Coding Plan - 优惠)
- ~~`sk-sp-365714cef25a45df8e9b3948641695e6`~~ ❌ 已删除
- ~~`sk-sp-4d4f86d364934d48b80423f72b5495d1`~~ ❌ 已删除

### NewCLI (共享Key)
- ~~`sk-ant-oat01-FLSPC7gvHvAn7sKUcwxXo5RVdNGwU_apQ6fQO3w72OPPbPN21rxo4w9EcGgRXkWsjfP4vEKHfflenh5hJROSdJYKi7K9qAA`~~ ❌ 已删除

### 其他
- ~~SiliconFlow: `sk-tkzfpovkbzxpumqpnxsecrqzkjdythmlqgecbljqzhrfehwa`~~ ❌ 已删除
- ~~Qiniu: `sk-67421f9e478a7ee81fa98ea06a5bceda4958db419dec37c432057916f4b05961`~~ ❌ 已删除
- ~~MiniMax: `sk-cp--HJ367Hzkp0OAqaY88Wzzcxp1Z9VSdMi7HDiWzp78sdqrnIXH9nmNVuoGiiHxpyoS0PSzb_V5R31ZEchtAGTODFDfGeR-xk8eW_I2GLxvDOotOh7Bjc1QA8`~~ ❌ 已删除

---

## 🔧 bot3 (经理) 工作机制

### HEARTBEAT 任务 (每分钟执行)

1. **断点续传检查** (最高优先级)
   - checkpoint_manager.py recover
   - task_scheduler.py recover

2. **集群SSH连通性快检**
   - 检查所有节点: 7zi.com, bot, bot2, bot3, bot4, bot5

3. **内存/磁盘异常检测**
   - 内存 > 85% → 报告
   - 磁盘 > 85% → 报告

4. **evomap进程清理**
   - 进程数 > 20 → 自动清理

### 自主决策权限
- ✅ 进程清理、内存优化、节点恢复、日常维护、断点恢复
- ❌ 外部通信、金钱操作、配置修改需请示

---

## 🔧 7zi (协调经理) 工作机制

### 主要工作
- Ansible自动化部署
- Evomap架构设计
- 配置中心管理

### 关键项目
- ~/workspace/ansible/ - Ansible配置
- ~/workspace/EvoMap-*.md - Evomap文档

---

## 📊 测试机 (bot6) 状态

### 智能API路由器
- **端口**: 11435
- **Provider数**: 17 (全部)
- **状态**: ✅ 运行中
- **测试结果**: 17/17 Provider健康

### 路由策略
1. 优先使用CODING PLAN (免费)
2. 按优先级排序
3. 自动故障切换
4. 每15秒健康探测

---

## 📢 频道配置

### 已发现配置
- ~~Telegram: 3个bot tokens (7zi)~~ ⚠️ 已删除
- DingTalk: 1个插件 (ddingtalk v2.5.1)

> ⚠️ DingTalk有2个厂家 - 需进一步调查

---

## 📌 密码统一

> ⚠️ **已删除** - SSH密码等敏感信息不得记录在明文文件中

---

*本知识库为最高机密，仅供内部管理使用*
*巡视经理 2026-02-28*
*安全更新 2026-03-11: 已移除所有明文敏感信息*