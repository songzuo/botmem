# 2026-09-13 05:13 — bookslot 老数据清场 (主人 05:13 指令)

## 主人问题
"老数据发完就清空队列 不需要重复发 现在重复发了 哪怕是老数据 也说明我们的系统还是有故障"

## 主人真意
- 队列里的老消息**推完即清**, 不要保留为已发送记录
- 如果 iLink 一直不通, 老消息不要永远 retry, 24h 后清掉
- 系统不应该有"老数据堆栈" = 故障的可见证据

## 修法

### 1. 删 queue/sent/ 16 条历史老数据
```bash
# 备份到 /tmp/queue_sent_backup_YYYYMMDD_HHMMSS/
cp /var/lib/bookslot/queue/sent/*.json /tmp/queue_sent_backup_*/
rm -f /var/lib/bookslot/queue/sent/*.json
```

### 2. 改 flush_queue: 推成功直接删, 不再 archive
- 旧 logic: `os.replace(fpath, archive_path)` → 保留为已发送记录
- 新 logic: `os.remove(fpath)` → 直接删
- 主旨: Telegram 已经推过主人一次 (submission 时), 不需要 queue retry 时再推
- 主人说 "老数据也说明故障" = 系统不应该有"历史消息还能被查"的错觉

### 3. 加 24h 自动清
```python
QUEUE_MAX_AGE_SECONDS = 24 * 3600

# In flush_queue:
age = now - os.path.getmtime(fpath)
if age > QUEUE_MAX_AGE_SECONDS:
    os.remove(fpath)
    # log {"status": "discarded_stale", "age_seconds": int(age)}
    continue
```
- 24h 老的 queue 文件自动 discard
- retry.log 留痕
- 防止 iLink 永久 disable 时 queue 永远堆

### 4. 修 flush_queue 返值 + retry.py
- 旧: `return sent, failed` (2-tuple)
- 新: `return sent, failed, discarded` (3-tuple)
- retry.py 兼容两种返值 (检测 len)

## 测试验证 (05:14)
- 25h 老文件 → `discarded_stale` 自动清 ✅
- FinalVerify 第一次 (新 content) → 推 ✅
- FinalVerify 第二次 (同 content) → `deduped` ✅
- queue/sent/ 现在 0 条 ✅
- queue 5 条 (都是新提交) ✅

## 与之前 dedup 的关系
- dedup (5:06 加): 同 content 不重推
- queue clean (5:13 加): 推完就清 + 24h 自动清
- 两个互补: dedup 防止重复推送, queue clean 防止历史堆栈

## 备份位置
- bookslot.py: `/opt/bookslot/bookslot.py.bak_pre_dedup_20260913_050546`
- bookslot_retry.py: 无备份 (改动小, 兼容 logic)
- 老 queue 数据: `/tmp/queue_sent_backup_20260913_05*`

## 教训 (主人反复强调)
1. "老数据"在主人眼里 = 故障证据, 不是"历史" = 立刻清
2. 系统不应该让主人看到"还有 N 条没处理"
3. dedup + auto-clean 是两个互补的清理机制
4. 24h 是个合理窗口 (业务客户不可能 24h 没回复, 老的都是僵尸)
