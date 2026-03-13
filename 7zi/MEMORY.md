# 永久记忆

## 核心规则

### 配置管理规则

**任何修改OpenClaw、Picoclaw或其他Claw配置的操作，必须使用命令行工具，绝不允许直接修改配置文件。**

原因：
1. 直接修改配置文件容易导致格式错误
2. 命令行工具会自动进行验证和迁移
3. 更容易追踪变更历史
4. 避免因版本差异导致的兼容性问题

**正确做法**：
- 使用 `openclaw config set ...` 设置配置
- 使用 `openclaw config unset ...` 取消配置
- 使用 `openclaw models set ...` 设置模型
- 使用 `openclaw doctor --fix` 修复和迁移配置
- 使用 `openclaw config validate` 验证配置

**错误做法**：
- ❌ 直接编辑 `~/.openclaw/openclaw.json`
- ❌ 直接修改任何 `.json` 配置文件
- ❌ 使用 sed/awk 等工具直接修改配置文件

---

*最后更新: 2026-03-05*
