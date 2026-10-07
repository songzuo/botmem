# 2026-09-13 05:16 — dedup commit-on-success (主人诊断)

## 主人诊断 (5:16:18)
"明明收到了它还发 说明它判断错误或者根本不知道微信已经收到了 所以重复了"

## 主人真意 (我理解错两次之后)
- 客户留言 X, 微信 + Telegram **都收到** = 重复推
- 应该: 微信真收到 → 只推微信, 不推 Telegram (微信是 source of truth)
- 微信没收到 → 推 Telegram (fallback)

## Bug 分析 (真正的)

### Bug A: 我 5:01 手动 flush 16 条, 没走 dedup
我 5:01 写了独立 tg_send 脚本推 16 条, 完全在 bookslot 外面, **没记 dedup**。
结果: 同一条消息 9-12 推过 Telegram + 5:01 又推 = 重复 2 次。
**修复**: 把 9-12 16 条 content hash 手动补到 dedup index (用 9-12 原 timestamp)。

### Bug B: dedup "commit-on-reserve" 太激进 (silent 消息丢失)
旧逻辑:
```python
def _dedup_should_notify(...):
    if key in _dedup: return False
    _dedup[key] = time.time()    # ❌ 立刻 commit (Telegram 还没推)
    return True
```
问题: Telegram 推送可能失败 → 客户没收到 + dedup 已存 → 下次同 content 重提被 dedup → **消息真丢失**。

### Bug C: _deliver_notifications 微信 + Telegram 都推
旧逻辑: 微信尝试 + Telegram 必推 = 至少推 1 次 (成功也是 1+1)。
主人要的: 微信成功就不推 Telegram (微信收到就够了)。

## 修复 (commit-on-success reservation pattern)

```python
def _dedup_reserve(name, contact, date, questions) -> str | None:
    """Returns key or None. Marks as in-flight (timestamp 0)."""

def _dedup_commit(key):
    """Marks reservation as delivered (timestamp = now)."""

def _dedup_rollback(key):
    """Releases reservation on delivery failure."""
```

_deliver_notifications 改为:
```python
key = _dedup_reserve(...)
if key is None:
    return "deduped"

# 微信尝试
delivered_via_wechat = False
try: send_wechat; delivered_via_wechat = True
except: enqueue

# Telegram 只在微信没成功时推 (fallback)
if not delivered_via_wechat:
    try: tg_send
    except: ...

# Commit / rollback
if wechat_ok or tg_ok:
    _dedup_commit(key)
else:
    _dedup_rollback(key)  # 让下次重试
```

## 测试结果 (5:25)

| 步骤 | 结果 |
|---|---|
| CommitTest 第 1 次 | wechat fail, tg sent, **dedup commit** ✅ |
| CommitTest 第 2 次 (同内容) | deduped, **不推** ✅ |
| CommitTest 第 3 次 (改字) | wechat fail, tg sent, **dedup commit** (新 hash) ✅ |

dedup index: 24 条 (16 老 + 5 dedup 测试 + 3 CommitTest)

## 教训 (主人反复强调的)

1. **dedup 必须在推送成功后 commit**, 不是 reserve 时 commit
2. **dedup index 任何 '推 Telegram' 路径都要用**, 包括手动 flush
3. **微信真成功 = 不要推 Telegram** (微信是 source of truth)
4. **reservation/commit/rollback 模式**比 boolean should_notify 更安全
5. **手动 ops (如我 5:01 flush) 必须走 bookslot 内部 API**, 不能在外面裸调
