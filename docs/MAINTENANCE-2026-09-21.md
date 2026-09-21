# 仓库整理说明（2026-09-21）

本次对仓库做了一次结构性整理。**任何正在同步本仓库的机器，请先读这几点。**

## 1. 根目录散落报告已归档

原根目录堆积 **1203 个 `*.md`** 过程性报告（AI 开发团队 2026-03 ~ 2026-05 产出），
不符合项目原始规划 —— 根目录应只保留规范文件，源码在 `src/`，文档在 `docs/`，工具在 `scripts/`。

现按主题迁入 `docs/reports/<16 个分组>/`，索引见 [`docs/reports/INDEX.md`](./reports/INDEX.md)。
根目录 `.md` 由 **1203 → 18**，根目录条目总数由 **1244 → 54**。

> 若有脚本按根目录路径引用这些报告，请改到 `docs/reports/` 下对应分组。
> `README.md` 中指向被移动文件的链接也需要同步更新。

## 2. node_modules 已取消跟踪

仓库 `.gitignore` 第 2-3 行本就声明 `node_modules/` 与 `**/node_modules/` 应被忽略，
但历史提交已入库的依赖目录仍被 git 持续跟踪。实测：全仓 **75,749** 个被跟踪文件中，
**73,145 个（96.6%）位于 `node_modules`**：

| 位置 | 文件数 |
| --- | ---: |
| `mem9/openclaw-plugin` | 37,027 |
| `mem9/dashboard/app` | 19,870 |
| `bot6/projects` | 6,868 |
| `bot6/moltbook-gateway` | 5,395 |
| `VM-0-4-opencloudos/skills` | 2,622 |
| 其他 | 1,363 |

已用 `git rm --cached` 从索引移除（**磁盘文件保留，本次没有删除任何文件**）。

- ⚠️ **其他机器下一次 `git pull` 会把它们从自己的工作树中删除**（git 的正常行为）；
  若某台机器依赖该工作副本运行程序，请到对应目录执行 `npm install` / `pnpm install` 复原。
- 之后 `.gitignore` 会让 `node_modules` 保持不被跟踪，不会再被 `git add -A` 提交回来。

结果：git 跟踪文件 **75,749 → 2,604**。

## 3. 密钥与运行时状态文件移出跟踪

已停止跟踪（文件本身保留在磁盘）：

- `.env`
- `claw-mesh-state.json`
- `heartbeat-state.json`
- `server-monitor.json`
- `bot6/memory/claw-mesh-state.json`
- `bot5/memory/heartbeat-state.json`

这些状态文件每次同步都会变（`lastUpdate` 时间戳），是历史噪音的主要来源。

## 4. ⚠️ 必须轮换的凭据

本仓库是**公开仓库**，`.env` 曾被提交，以下值应视为已泄露：

```
JWT_SECRET
CSRF_SECRET
ADMIN_PASSWORD
RESEND_API_KEY
SLACK_WEBHOOK_URL
REDIS_URL
```

另外 `claw-mesh-sync.sh` 中**硬编码了一个 GitHub PAT**（`ghp_...`），并被写入各机器的
git remote URL。**应立刻在 GitHub 上吊销该 Token 并重新签发。**

清理 git 历史需要改写提交（`git filter-repo` + 强制推送），会影响所有镜像，
请确认后单独执行 —— 仅把文件移出跟踪**不会**清除历史中的凭据。

## 5. bot6 侧定时任务变更

已停用（**注释而非删除，可随时恢复**）：

| 原计划 | 脚本 | 停用原因 |
| --- | --- | --- |
| `*/4 * * * *` | `claw-mesh-sync.sh` | 每 4 分钟一次提交，但自 **2026-05-12** 起无任何真实内容变更（30 天 9,519 次提交，改的都是它自己的状态文件） |
| `*/5 * * * *` | `claw-mesh-watchdog.sh` | 所监控的 `openclaw-gateway` 长期不存在，每 5 分钟重试 3 次并刷失败日志 |
| `10 */4 * * *` | `sync-from-peer.sh` | 目标脚本不存在，每次执行报 `No such file or directory` |
| `0 */8 * * *` | `upload-memory.sh` | 同上（该脚本在 `/root/.openclaw/backups/20260308_182709/data/scripts_backup/` 有备份） |

crontab 备份：`/root/crontab-backup-20260921.txt`。
回滚点标签：`pre-reorg-20260921`（整理前 HEAD）。

## 6. 尚未处理，需人工决策

- **其他机器仍在推送同类噪音**：`bot5` 仍以每 5~15 分钟一次的频率提交
  （提交信息形如 `bot5: Claw-Mesh 同步 ...`），需要在其各自机器上做同样的收敛。
- **仓库内混放了多个项目副本**：`7zi/`、`7zi.com/`、`projects/`、`mem9/`、
  `moltbook-gateway/`、`claw-mesh-deploy/`、`commander/`、`inspector/`、
  `xunshi-inspector/`、`VM-0-4-opencloudos/`、`_app_backup_disabled/`。
  其中 `commander/` 与 `xunshi-inspector/` 在原规划中已属"应删除的未使用目录"。
  是"归档到 `archive/`"还是"直接移除"，取决于它们是否还有其他机器依赖。
- **提交历史膨胀**：累计 65,487 次提交，其中绝大多数为同步噪音。
