# 🧪 测试健康报告 v2
**日期:** 2026-04-14
**项目:** 7zi-frontend
**测试框架:** Vitest

---

## 📊 总体概览

| 指标 | 数值 |
|------|------|
| 总测试套件 | ~50+ |
| 总测试用例 | 637+ |
| ✅ 通过 | ~580+ |
| ❌ 失败 | ~47 |
| ⏱️ 执行时间 | ~5-7 分钟 |

---

## 🔴 失败测试详情

### 1. `src/lib/pwa/__tests__/web-push-service.test.ts`
**失败: 6/23 tests**

| 测试 | 状态 | 说明 |
|------|------|------|
| should initialize successfully when Service Worker is supported | ❌ retry x1 | Service Worker 初始化失败 |
| should return false when Push API is not supported | ❌ retry x1 | Push API 检测问题 |
| should return false when Service Worker is not supported | ❌ retry x1 | Service Worker 检测问题 |
| should return denied when not supported | ❌ retry x1 | 权限状态检测问题 |
| should subscribe to push notifications | ❌ retry x1 | 订阅失败 |
| should return null on error | ❌ retry x1 | 错误处理问题 |

**根因:** Service Worker / Push API Mock 环境不完整

---

### 2. `src/lib/performance/__tests__/cache-strategy.test.ts`
**失败: 9/16 tests**

| 测试 | 状态 | 说明 |
|------|------|------|
| returns default config for unknown URLs | ❌ retry x1 | 缓存策略返回默认值 |
| returns cached response if available and not expired | ❌ retry x1 | 缓存读取问题 |
| fetches from network if cache miss | ❌ retry x1 | 网络请求模拟问题 |
| fetches from network first | ❌ retry x1 | 网络优先策略 |
| falls back to cache on network failure | ❌ retry x1 | 降级策略 |
| returns cached response immediately | ❌ retry x1 | 缓存响应时间 |
| updates cache in background | ❌ retry x1 | 后台更新 |
| fetches from network on cache miss | ❌ retry x1 | 缓存未命中 |
| preloads multiple assets into cache | ❌ retry x1 | 预加载功能 |

**根因:** Cache API Mock 不完整，网络请求模拟问题

---

### 3. `src/lib/search/__tests__/suggestions.spec.ts`
**失败: 8/35 tests**

| 测试 | 状态 | 说明 |
|------|------|------|
| 有查询应该返回匹配的建议 | ❌ retry x1 | 搜索匹配 |
| 应该包含不同类型的建议 | ❌ retry x1 | 建议类型 |
| 应该处理空查询 | ❌ retry x1 | 空查询处理 |
| 空历史应该返回空数组 | ❌ retry x1 | 历史为空时 |
| 应该更新工作流数据 | ❌ retry x1 | 工作流更新 |
| 应该更新任务数据 | ❌ retry x1 | 任务更新 |
| 应该更新节点数据 | ❌ retry x1 | 节点更新 |
| 应该支持同时更新多种数据 | ❌ retry x1 | 批量更新 |

**根因:** 搜索索引/数据模拟不完整

---

### 4. `src/lib/ai/dialogue/__tests__/integration.test.ts`
**失败: 2/24 tests**

| 测试 | 状态 | 说明 |
|------|------|------|
| 应该识别不同的意图 | ❌ retry x1 | 意图识别准确率问题 |
| 应该分析不同的情感 | ❌ retry x1 | 情感分析问题 |

**根因:** AI 模块测试依赖模型输出，随机性导致偶发失败

---

### 5. `src/lib/ai/dialogue/__tests__/SentimentAnalyzer.test.ts`
**失败: 15/34 tests**

**大量中文情感分析测试失败:**
- 应该识别中文正面情感
- 应该识别中文负面情感
- 应该识别英文负面情感
- 应该计算情感强度
- 应该识别强度修饰词
- 应该处理否定词
- 应该反转情感极性
- 应该基于词数提高置信度
- 应该批量分析多个内容
- 应该分析情感趋势
- 应该计算情感分布
- 应该添加正面词
- 应该添加负面词
- 应该添加强度修饰词
- 应该添加否定词

**根因:** 中文情感词典/分词不完整，情感分析逻辑问题

---

### 6. `src/lib/validation/__tests__/validators.test.ts`
**失败: 4/42 tests**

所有失败测试均为 `should skip if empty` - 4个不同的验证器

**根因:** 空值跳过逻辑不一致

---

### 7. `tests/integration/websocket-room-system.test.ts`
**失败: 1/30 tests**

| 测试 | 状态 | 说明 |
|------|------|------|
| should handle large member counts | ❌ retry x1 | 大成员数量处理 |

**根因:** 成员数量边界测试

---

### 8. `tests/features/audio-processor.test.ts`
**失败: 1/22 tests**

| 测试 | 状态 | 说明 |
|------|------|------|
| 应该成功停止录音 | ❌ retry x1 | 停止录音状态转换 |

**根因:** 音频处理器状态管理问题

---

### 9. `src/components/feedback/__tests__/MultiStepFeedbackForm.test.tsx`
**失败: 6 tests** (TestingLibraryElementError)

| 测试 | 状态 | 说明 |
|------|------|------|
| should navigate between steps | ❌ | 无法找到 feedback.actions.next |
| should show validation errors | ❌ | 无法找到表单元素 |
| should auto-save draft | ❌ | 自动保存逻辑 |
| should load draft from localStorage on mount | ❌ | 无法找到 feedback.actions.next |
| should call onCancel when cancel button is clicked | ❌ | 无法找到 feedback.actions.cancel |

**根因:** i18n 翻译键未正确加载，测试查找的文本不存在

---

## 🟡 空测试套件 (0 tests)

以下测试文件存在但没有任何测试：
- `tests/api/error-handling.test.ts`
- `tests/api-integration/notifications.test.ts`
- `tests/features/knowledge-rag.test.ts`
- `tests/features/mobile-components.test.ts`

---

## 📈 对比上次报告 (v1)

### 已改善 ✅
- validation.test.ts (44 tests) - 已全部通过
- ShortcutTooltip.test.tsx (10 tests) - 已全部通过
- offline-storage.test.ts (12 tests) - 已全部通过
- security-upgrade-verify.test.ts (2 tests) - 已全部通过
- notifications/stats/route.test.ts (5 tests) - 已全部通过
- AudioProcessor.test.ts 部分 - 部分改善

### 新增失败 🆕
- MultiStepFeedbackForm.test.tsx - 新发现6个失败
- suggestions.spec.ts - 新发现8个失败 (之前可能未统计)

### 持续失败 ⚠️
- SentimentAnalyzer.test.ts (15个中文情感测试)
- cache-strategy.test.ts (9个缓存策略测试)
- web-push-service.test.ts (6个PWA测试)

---

## 🔧 建议修复优先级

### P0 - 立即修复
1. **MultiStepFeedbackForm.test.tsx** - i18n 翻译键问题，测试框架问题
2. **validators.test.ts** - 空值跳过逻辑修复

### P1 - 本周修复
3. **SentimentAnalyzer.test.ts** - 中文情感词典补全
4. **cache-strategy.test.ts** - Cache API Mock 完善
5. **web-push-service.test.ts** - Service Worker Mock 完善

### P2 - 计划修复
6. **suggestions.spec.ts** - 搜索模拟数据完善
7. **audio-processor.test.ts** - 音频状态转换修复
8. **dialogue/integration.test.ts** - AI 测试稳定性

---

## 📝 备注

1. HEARTBEAT.md 提到 `serialize-javascript RCE vulnerability` 需要 override
2. jest→vi migration 还有 18 个 ShortcutManager 测试待处理
3. TypeScript 错误涉及 14 个文件
4. 版本不匹配: package.json 1.13.0 vs docs 1.14.0

---

**报告生成时间:** 2026-04-14 17:05 GMT+2
