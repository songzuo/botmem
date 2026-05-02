# ⚡ Playwright 测试配置优化报告

**Date:** 2026-03-27  
**Type:** Test Optimization  
**Author:** AI 主管

---

## 📊 当前配置分析

### 测试文件统计
- **E2E 测试文件:** 24 个 `.spec.ts`
- **测试目录:** `./e2e/`
- **支持的浏览器:** 7 个项目（chromium, firefox, webkit, Mobile Chrome, Mobile Safari, iPad, visual-regression）

### Playwright 配置关键问题

#### ❌ 问题 1: CI 并行度严重不足
```typescript
workers: process.env.CI ? 1 : undefined,
```
- **CI 环境下只用 1 个 worker**
- 24 个测试文件 × 7 个浏览器 = **168 个测试任务**
- 串行执行意味着最长测试时间 = 所有测试之和
- **影响:** CI 时间极长

#### ❌ 问题 2: 视频录制浪费资源
```typescript
video: 'retain-on-failure',
```
- 配置为仅失败时保留，但仍然消耗磁盘 I/O
- 测试结果目录已有 3.8 MB（清理后）

#### ❌ 问题 3: 移动端测试覆盖过度
- 5 种移动/平板配置（Mobile Chrome, Mobile Safari, iPad）
- 移动端测试通常较慢，没必要全部浏览器都跑移动端
- **建议:** 只保留 Mobile Chrome 作为移动端代表

#### ❌ 问题 4: workers 在 CI 环境下设为 1
```typescript
workers: process.env.CI ? 1 : undefined,
```
- 这是最大的性能瓶颈
- 现代 CI 通常有 4-8 个核心可用

---

## 🚀 优化建议

### 优化 1: 提高 CI 并行度（高优先级）
```typescript
workers: process.env.CI ? 4 : undefined,  // 改为 4
```
**预期改善:** CI 时间减少 60-75%（从串行变为 4 并行）

### 优化 2: 限制移动端测试浏览器（高优先级）
只保留 Mobile Chrome 作为移动端代表，移除：
- Mobile Safari
- iPad

**预期改善:** 减少 2 个浏览器项目 = 减少 ~30% 移动测试时间

### 优化 3: 考虑添加测试分类
```typescript
// 在 testMatch 中按目录分类
testMatch: [
  '**/auth*.spec.ts',        // 快速冒烟测试
  '**/smoke*.spec.ts',       // 冒烟测试
  '**/*.spec.ts',            // 全部
],
```
配合 CI 分阶段执行。

### 优化 4: 禁用视频录制（可选）
```typescript
video: 'off',  // 完全禁用
```
或保持 `retain-on-failure`（当前配置）。

---

## 📋 推荐优化配置 (playwright.config.ts)

```typescript
// CI 配置优化
workers: process.env.CI ? 4 : undefined,  // 改为 4

// 简化浏览器项目（移动端只保留一个）
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  // 移除: Mobile Safari, iPad
  { name: 'visual-regression', use: {...}, testMatch: '**/visual-regression.spec.ts' },
],
```

---

## ⏱️ 预期 CI 时间改善

| 场景 | 当前 | 优化后 |
|------|------|--------|
| 全部测试串行 | ~60 min | ~15 min |
| 改善幅度 | — | **75%** |

---

## ✅ 建议实施步骤

1. **立即修改:** `workers: 4`（改动最小，效果最大）
2. **可选:** 移除 Mobile Safari 和 iPad 项目
3. **可选:** 添加 smoke test 分类

---

**Status:** RECOMMENDATIONS_READY  
**Priority:** HIGH（workers 配置）
