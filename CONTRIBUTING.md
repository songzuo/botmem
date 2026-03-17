# 🤝 贡献指南 (Contributing Guide)

感谢你对 OpenClaw 11机协作系统感兴趣！我们欢迎任何形式的贡献，包括代码、文档、Bug 报告和功能建议。

---

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境搭建](#开发环境搭建)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [文档规范](#文档规范)
- [测试要求](#测试要求)
- [Pull Request 流程](#pull-request-流程)
- [问题报告](#问题报告)

---

## 行为准则

- **尊重他人**: 尊重所有贡献者，无论经验水平
- **建设性反馈**: 提供建设性的意见和建议
- **协作精神**: 保持开放和协作的态度
- **欢迎新贡献者**: 帮助新贡献者融入社区

---

## 如何贡献

### 你可以贡献的方式

1. **🐛 报告 Bug**: 发现问题时提交 Issue
2. **💡 提出建议**: 功能改进或新功能建议
3. **📝 改进文档**: 修正错误或补充文档
4. **🔧 修复 Bug**: 提交修复代码
5. **✨ 添加新功能**: 开发新功能
6. **🧪 编写测试**: 提高测试覆盖率
7. **🌍 翻译文档**: 多语言支持

---

## 开发环境搭建

### 前置要求

- **Node.js**: v22.0.0 或更高
- **Git**: 最新版本
- **OpenClaw**: 已安装并配置
- **SSH**: 用于连接远程机器

### 步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/songzuo/botmem.git
cd botmem
```

#### 2. 安装依赖

```bash
# 安装主项目依赖
npm install

# 安装子项目依赖
cd commander && npm install
cd ../xunshi-inspector && npm install
cd ../bot6 && npm install
```

#### 3. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置
nano .env
```

必需的环境变量:
```bash
# SSH 配置
SSH_HOST=your-server.com
SSH_USER=root
SSH_PASSWORD=your-password

# OpenClaw 配置
OPENCLAW_API_KEY=your-api-key
OPENCLAW_BASE_URL=https://api.openclaw.com
```

#### 4. 运行测试

```bash
# 运行所有测试
npm test

# 运行特定项目测试
cd xunshi-inspector && npm test
```

#### 5. 启动开发服务器

```bash
# 启动 bot6 (7zi 项目)
cd bot6
npm run dev

# 启动 commander
cd ../commander
node check_all.js
```

---

## 代码规范

### JavaScript/TypeScript

#### 1. 代码风格

我们使用 ESLint 和 Prettier 进行代码格式化:

```bash
# 检查代码风格
npm run lint

# 自动修复
npm run lint:fix
```

#### 2. 命名约定

- **文件名**: kebab-case (`check-health.js`, `deploy-all.js`)
- **类名**: PascalCase (`SSHConnectionPool`, `HealthChecker`)
- **函数/变量**: camelCase (`checkSSHHost`, `serverConfig`)
- **常量**: UPPER_SNAKE_CASE (`SSH_TIMEOUT`, `DEFAULT_PORT`)

#### 3. JSDoc 注释

所有公共函数必须有 JSDoc 注释:

```javascript
/**
 * 执行 SSH 命令并返回结果
 *
 * @param {Client} conn - SSH 连接实例
 * @param {string} command - 要执行的命令
 * @param {Object} options - 可选配置
 * @param {number} options.timeout - 命令执行超时时间（毫秒）
 * @param {boolean} options.mergeStderr - 是否将 stderr 合并到 stdout
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number|null}>} 命令执行结果
 * @throws {Error} 命令执行失败时抛出
 */
async function execCommand(conn, command, options = {}) {
  // 实现代码
}
```

#### 4. 错误处理

```javascript
// ✅ 好的做法
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  throw new Error(`Operation failed: ${error.message}`);
}

// ❌ 避免
try {
  await riskyOperation();
} catch (e) {
  // 空的 catch 块
}
```

#### 5. 异步代码

```javascript
// ✅ 使用 async/await
async function getData() {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// ✅ 处理并发
async function processItems(items) {
  const results = await Promise.all(
    items.map(item => processItem(item))
  );
  return results;
}
```

### Shell 脚本

- 使用 **shellcheck** 检查脚本:
  ```bash
  shellcheck your-script.sh
  ```

- 添加 Shebang:
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  ```

---

## 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 描述 | 示例 |
|------|------|------|
| **feat** | 新功能 | `feat(commander): 添加健康检查功能` |
| **fix** | Bug 修复 | `fix(inspector): 修复 SSH 连接超时问题` |
| **docs** | 文档更新 | `docs(readme): 更新安装指南` |
| **style** | 代码格式 (不影响功能) | `style(commander): 统一代码缩进` |
| **refactor** | 重构 | `refactor(health-check): 优化检查逻辑` |
| **perf** | 性能优化 | `perf(sync): 减少内存使用` |
| **test** | 测试相关 | `test(inspector): 添加 SSH 连接测试` |
| **chore** | 构建/工具链 | `chore(deps): 升级依赖版本` |

### 提交示例

```bash
# ✅ 好的提交
git commit -m "feat(commander): 添加磁盘空间检查

- 新增 check_disk.js 脚本
- 支持自定义告警阈值
- 集成到 check_all.js

Closes #123"

# ❌ 避免的提交
git commit -m "update code"
git commit -m "fix bug"
git commit -m "add stuff"
```

---

## 文档规范

### Markdown 文档

#### 1. 文件结构

```markdown
# 标题

> 简短描述

**版本**: 1.0.0
**更新日期**: 2026-03-17
**维护者**: 作者

---

## 目录

- [章节 1](#章节-1)
- [章节 2](#章节-2)

---

## 章节 1

内容...

---

## 章节 2

内容...

---

_文档结尾_
```

#### 2. 代码块

使用语法高亮:

```markdown
\```javascript
const example = 'hello world';
\```

\```bash
npm install
\```
```

#### 3. 表格

```markdown
| 列 1 | 列 2 | 列 3 |
|------|------|------|
| 数据 1 | 数据 2 | 数据 3 |
```

#### 4. 链接

```markdown
[链接文本](https://example.com)
[内部链接](#章节标题)
```

### JSDoc 注释

参考 [代码规范 - JSDoc 注释](#3-jsdoc-注释)

### API 文档

API 文档应包含:

1. **概述**: 功能描述
2. **认证**: 如何认证 (如需要)
3. **端点**: 所有 API 端点
4. **请求/响应格式**: 示例 JSON
5. **错误码**: 错误说明
6. **示例代码**: 使用示例

示例:
```markdown
## check_helpers 模块 API

### createConnection(config)

创建 SSH 连接。

**参数**:
- `config` (Object) - 可选的自定义配置
  - `host` (string) - SSH 主机地址
  - `port` (number) - SSH 端口，默认 22

**返回值**:
- `{conn, config}` - 包含连接实例和配置的对象

**示例**:
\```javascript
const { createConnection } = require('./utils/check_helpers');
const { conn } = createConnection({ host: 'example.com' });
\```
```

---

## 测试要求

### 测试框架

我们使用 **Jest** 作为测试框架。

### 测试覆盖率要求

| 项目类型 | 目标覆盖率 |
|---------|-----------|
| **核心模块** | 80%+ |
| **工具函数** | 90%+ |
| **UI 组件** | 60%+ |
| **整体项目** | 70%+ |

### 测试文件结构

```
project/
├── src/
│   ├── module.js
│   └── utils.js
└── tests/
    ├── module.test.js
    └── utils.test.js
```

### 测试示例

```javascript
// tests/check_helpers.test.js
const { createConnection, execCommand } = require('../utils/check_helpers');

describe('check_helpers', () => {
  describe('createConnection', () => {
    test('应成功创建连接', () => {
      const { conn, config } = createConnection({ host: 'test.com' });
      expect(conn).toBeDefined();
      expect(config.host).toBe('test.com');
    });

    test('应抛出错误当缺少必要配置', () => {
      expect(() => createConnection({})).toThrow('Invalid SSH config');
    });
  });

  describe('execCommand', () => {
    test('应执行命令并返回结果', async () => {
      const result = await execCommand(mockConn, 'echo hello');
      expect(result.stdout).toContain('hello');
      expect(result.exitCode).toBe(0);
    });
  });
});
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- check_helpers.test.js

# 生成覆盖率报告
npm test -- --coverage

# 监听模式
npm test -- --watch
```

---

## Pull Request 流程

### 1. 创建分支

```bash
# 从 main 分支创建新分支
git checkout -b feat/your-feature-name

# 或修复 bug
git checkout -b fix/your-bug-fix
```

### 2. 提交更改

```bash
# 添加更改的文件
git add .

# 提交 (遵循提交规范)
git commit -m "feat(module): 添加新功能"
```

### 3. 推送到远程

```bash
git push origin feat/your-feature-name
```

### 4. 创建 Pull Request

在 GitHub 上创建 PR，包含:

- **标题**: 清晰描述更改
- **描述**:
  - 更改了什么
  - 为什么更改
  - 相关 Issue (如有)
- **检查清单**:
  - [ ] 代码通过 lint 检查
  - [ ] 测试通过
  - [ ] 添加了必要的文档
  - [ ] 更新了 CHANGELOG.md

### 5. 代码审查

- 等待维护者审查
- 根据反馈进行修改
- 确保所有检查通过

### 6. 合并

- 维护者批准后合并
- 删除已合并的分支

---

## 问题报告

### 报告 Bug

提交 Issue 时，请包含:

1. **标题**: 清晰的问题描述
2. **描述**: 详细的复现步骤
3. **预期行为**: 期望发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - 操作系统
   - Node.js 版本
   - 相关模块版本
6. **日志**: 相关的错误日志
7. **复现代码**: 最小化的复现代码

**模板**:

```markdown
**问题描述**
[简短描述问题]

**复现步骤**
1. 执行命令 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**预期行为**
[预期发生什么]

**实际行为**
[实际发生了什么]

**环境**
- OS: [例如 Ubuntu 20.04]
- Node.js: [例如 v22.0.0]
- OpenClaw: [例如 1.2.3]

**日志**
[粘贴相关日志]
```

### 功能建议

提交功能建议时，请包含:

1. **问题/需求**: 你想解决什么问题
2. **建议方案**: 你建议的解决方案
3. **替代方案**: 你考虑过的其他方案
4. **上下文**: 为什么这个功能重要

---

## 获取帮助

- **文档**: 查看 [README.md](README.md) 和 [ARCHITECTURE.md](ARCHITECTURE.md)
- **问题**: 在 GitHub Issues 中提问
- **社区**: 加入 OpenClaw 社区讨论

---

## 许可证

通过贡献代码，你同意你的贡献将在与项目相同的许可证下发布 (MIT)。

---

感谢你的贡献！🎉

---

_本指南由 bot4 (Evolver/经理) 维护_