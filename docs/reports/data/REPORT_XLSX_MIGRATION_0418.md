# XLSX → ExcelJS 迁移报告

**日期**: 2026-04-18
**状态**: ✅ 完成
**执行者**: Executor 子代理

---

## 背景

- `xlsx` (SheetJS) ^0.18.5 存在**原型污染**和 **ReDoS** 安全漏洞，无官方补丁
- 迁移目标：`exceljs`@^4.4.0（已安装）
- 关键 bug：`exporter.ts` 中 `exportExcel()` 使用 `import('xlsx').then()`（异步）但方法同步返回

---

## 变更文件

| 文件 | 操作 |
|------|------|
| `src/lib/export/core/exporter.ts` | 重写 `exportExcel()` 方法，改为 async/await + exceljs |
| `src/lib/export/xlsx-wrapper.ts` | 顶层 `import * as XLSX from 'xlsx'` 替换为 exceljs 实现 |
| `src/lib/import/parsers/excel-parser.ts` | `import('xlsx')` 全部替换为 `import('exceljs')` |
| `src/app/api/analytics/export/route.ts` | 恢复 exceljs 直接调用（移除 xlsx-wrapper 引用） |
| `package.json` | `xlsx` 移除，`exceljs` 添加 |

---

## 核心修复：异步 Bug

### 修复前（exporter.ts）

```typescript
private exportExcel(data, config): ExportResult {
  import('xlsx').then(XLSX => {
    // 异步操作...
    XLSX.writeFile(workbook, `${config.filename}.xlsx`)
  })
  // BUG: 方法立即返回，不等待 xlsx 完成
  return { success: true, filename: `${config.filename}.xlsx` }
}
```

### 修复后

```typescript
private async exportExcel(data, config): Promise<ExportResult> {
  const ExcelJS = await import('exceljs')
  // ... 同步代码现在正确等待
  const excelBuffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([excelBuffer], { type: '...' })
  return { success: true, blob, filename: `${config.filename}.xlsx` }
}
```

---

## 依赖变更

```
- xlsx@0.18.5      (安全漏洞：原型污染 + ReDoS)
+ exceljs@4.4.0    (无已知安全漏洞)
```

---

## 构建验证

```
▲ Next.js 16.2.4 (Turbopack)
✓ Compiled successfully in 79s
✓ Generating static pages (81/81)
```

所有路由编译成功，无 xlsx 相关的 Module not found 错误。

---

## 遗留说明

以下文件仍引用 `xlsx` 字符串（仅作格式标识，非实际导入）：

- `src/lib/export/types.ts` — `ExportFormat` 类型定义中的 `'xlsx'` 字面量
- `src/lib/audit-log/export-service.ts` — xlsx 格式分支（CSV fallback 实现）
- `src/lib/import/import-service.ts` — xlsx 格式识别
- UI 组件中的 `format: 'xlsx'` 下拉选项

这些是**格式名称标识**，不涉及实际包导入，无需修改。

---

## 功能对比

| 功能 | xlsx (旧) | exceljs (新) |
|------|-----------|--------------|
| 表头样式（粗体/背景） | ❌ 不支持 | ✅ 支持 |
| 列宽设置 | 有限 | ✅ 支持 |
| 冻结行/列 | ❌ | ✅ |
| 自动筛选 | ❌ | ✅ |
| 动态导入 | ✅ | ✅ |
| Blob 生成 | ❌ (只能写文件) | ✅ (writeBuffer) |

---

## 测试建议

建议测试以下导出功能：
- `/api/analytics/export` — Excel 格式导出
- `/api/data/export` — 数据导出
- 前端 ExportPanel 组件 — UI 导出功能
