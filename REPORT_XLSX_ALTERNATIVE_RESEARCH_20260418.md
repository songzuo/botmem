# xlsx 依赖替代方案研究报告

**任务**: 研究 xlsx (^0.18.5) 替代方案  
**时间**: 2026-04-18  
**状态**: ✅ 研究完成

---

## 一、xlsx 使用情况

### 1.1 依赖声明

| 项目 | 依赖 |
|------|------|
| 根项目 `package.json` | `"xlsx": "^0.18.5"` |
| 7zi-frontend | 无 xlsx 依赖 |

### 1.2 实际使用位置

| 文件 | 用途 | 实际使用方式 |
|------|------|-------------|
| `src/lib/export/core/exporter.ts` | 通用导出模块 | `import('xlsx')` 动态导入，用于 Excel 格式导出 |
| `src/lib/audit-log/export-service.ts` | 审计日志导出 | case 'xlsx' 但实际回退到 CSV（未真正使用 xlsx）|
| `src/lib/types/analytics.ts` | 类型定义 | 仅类型引用 `ExportFormat = 'csv' \| 'xlsx' \| ...` |
| `src/lib/export/types.ts` | 类型定义 | 仅类型引用 `ExportFormat = 'csv' \| 'json' \| 'xlsx'` |
| `src/lib/audit-log/types.ts` | 类型定义 | 仅类型引用 `format: 'json' \| 'csv' \| 'xlsx'` |
| `7zi-frontend/src/app/api/data/import/route.ts` | 数据导入 API | **注释警告**：不要使用 xlsx 包（存在漏洞），建议用 exceljs |

### 1.3 核心使用代码 (`src/lib/export/core/exporter.ts`)

```typescript
private exportExcel(data: T[], config: ExportConfig<T>): ExportResult {
  // ...
  import('xlsx').then(XLSX => {
    // 创建工作表数据
    const worksheetData: unknown[][] = []
    // ...填充数据
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName || 'Sheet1')
    XLSX.writeFile(workbook, `${config.filename}.xlsx`)
  })
  // 返回模拟结果 - 实际异步写入尚未完成！
  return { success: true, filename: `${config.filename}.xlsx`, ... }
}
```

**关键问题**：此代码存在严重 bug——`import('xlsx').then()` 是异步的，但方法本身同步返回，导致实际文件可能未写完就返回了。

---

## 二、安全漏洞

| 漏洞 ID | 类型 | 严重度 | 状态 |
|---------|------|--------|------|
| GHSA-4r6h-8v6p-xvw6 | Prototype Pollution | 高 | **无修复版本** |
| GHSA-5pgg-2g8v-p4x9 | ReDoS | 高 | **无修复版本** |

SheetJS/xlsx 0.18.5 存在这两个漏洞，官方尚未发布修复版本。

---

## 三、替代方案对比

### 方案 A：exceljs

| 维度 | 评分 | 说明 |
|------|------|------|
| **API 兼容性** | ⭐⭐⭐ | 需要重构 `XLSX.utils.aoa_to_sheet` → `worksheet.addRow()` 等写法 |
| **功能完整性** | ⭐⭐⭐⭐⭐ | 完整支持样式、冻结行、自动筛选、公式等 |
| **安全性** | ⭐⭐⭐⭐⭐ | 无已知安全漏洞，维护活跃 |
| **迁移工作量** | 中等 | 约 7-11 小时（见之前分析报告） |
| **包大小** | ⚠️ 23MB | 较大，但已用动态导入，不影响初始包 |
| **当前使用** | ❌ 未使用 | 仅在 import route 注释中提及作为替代 |

**优势**：
- 功能完整（表头样式、冻结行、自动筛选、列宽、合并单元格等）
- 维护活跃，社区成熟
- 类型定义完善

**劣势**：
- 包体积大（23MB），但动态导入已缓解此问题
- API 与 xlsx 完全不同，需要完全重写

### 方案 B：xlsx (官方) + 安全使用

| 维度 | 评分 | 说明 |
|------|------|------|
| **API 兼容性** | ⭐⭐⭐⭐⭐ | 直接继续使用 |
| **功能完整性** | ⭐⭐⭐ | 无样式支持，无冻结/筛选 |
| **安全性** | ⭐ | 存在 Prototype Pollution 和 ReDoS 漏洞，无修复 |
| **迁移工作量** | 无 | 无需改动 |
| **包大小** | ⭐⭐⭐⭐ | ~300KB |

**结论**：不推荐，漏洞未修复，继续使用有安全风险。

### 方案 C：xlsx (使用 dist/xlsx.mjs)

| 维度 | 评分 | 说明 |
|------|------|------|
| **API 兼容性** | ⭐⭐⭐⭐⭐ | 同 xlsx |
| **功能完整性** | ⭐⭐⭐ | 同 xlsx |
| **安全性** | ⭐⭐ | 漏洞依然存在 |
| **迁移工作量** | 极小 | 改 import 路径即可 |

**结论**：不推荐，漏洞依然存在。

### 方案 D：xlsx-spreadsheet

| 维度 | 评分 | 说明 |
|------|------|------|
| **API 兼容性** | ⭐⭐ | 完全不同 API |
| **功能完整性** | ⭐⭐ | 仅基础读写，无样式 |
| **安全性** | 未知 | 小众库，缺乏安全审计 |
| **迁移工作量** | 高 | 需要学习新 API |
| **包大小** | ⭐⭐⭐⭐ | 轻量 |

**结论**：不推荐，功能太少，社区不活跃。

### 方案 E：csvtoexcel / other alternatives

| 库 | 状态 | 评估 |
|----|------|------|
| `xlsx-style` | 已废弃 | ❌ 不推荐 |
| `excel4node` | 维护较少 | 🟡 可考虑但非主流 |
| `exceljs` | 活跃维护 | ✅ 最佳替代 |

---

## 四、推荐方案

### 🥇 推荐：迁移到 exceljs

**理由**：
1. **安全性**：无已知漏洞，维护活跃
2. **功能完整**：支持所有当前需要的功能（样式、冻结行等）
3. **API 可行**：项目已有 exceljs 的相关注释和依赖建议
4. **动态导入**：exceljs 已使用动态导入，不影响 bundle 大小

### 迁移范围

| 文件 | 改动 |
|------|------|
| `src/lib/export/core/exporter.ts` | 重构 `exportExcel()` 方法，修复 bug |
| `src/lib/audit-log/export-service.ts` | 实现真正的 xlsx 导出（目前是伪实现） |
| `package.json` | 替换 xlsx → exceljs |
| 相关测试文件 | 更新 mock 和测试用例 |

---

## 五、迁移步骤

### Phase 1：准备 (1 小时)
```bash
# 1. 安装 exceljs
npm install exceljs@^4.4.0

# 2. 移除 xlsx
npm uninstall xlsx
```

### Phase 2：核心迁移 (4-6 小时)

#### 2.1 重构 `src/lib/export/core/exporter.ts`

```typescript
// 旧代码 (xlsx)
import('xlsx').then(XLSX => {
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  XLSX.writeFile(workbook, `${config.filename}.xlsx`)
})

// 新代码 (exceljs)
const ExcelJS = await import('exceljs')
const workbook = new ExcelJS.Workbook()
const worksheet = workbook.addWorksheet(config.sheetName || 'Sheet1')

// 添加表头
const headerRow = worksheet.addRow(fields.map(f => f.label))
headerRow.font = { bold: true }
headerRow.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' }
}

// 添加数据行
rows.forEach(row => {
  worksheet.addRow(fields.map(f => this.formatValue(row[f.key], f, row)))
})

// 列宽
worksheet.columns = fields.map(f => ({ width: f.width || 15 }))

// 冻结行
worksheet.views = [{ state: 'frozen', ySplit: 1 }]

// 自动筛选
worksheet.autoFilter = {
  from: { row: 1, column: 1 },
  to: { row: rows.length + 1, column: fields.length }
}

// 写入缓冲区
const buffer = await workbook.xlsx.writeBuffer()

// 修复：实际返回 buffer 而非 mock
return {
  success: true,
  filename: `${config.filename}.xlsx`,
  rowCount: rows.length,
  columnCount: fields.length,
  buffer  // 添加 buffer 到返回值
}
```

#### 2.2 修复 `exportExcel` 同步返回 bug

**当前问题**：`import('xlsx').then()` 是异步的，但方法同步返回 mock 结果。

**解决方案**：
```typescript
// 方案1：改为 async 方法
async exportExcel(data: T[], config: ExportConfig<T>): Promise<ExportResult> {
  const ExcelJS = await import('exceljs')
  // ... 完整实现
  return result
}

// 方案2：使用 await 语法糖
async exportExcel(data: T[], config: ExportConfig<T>): Promise<ExportResult> {
  try {
    const fields = this.getSelectedFields(config)
    const rows = this.processData(data, fields, config)
    const ExcelJS = await import('exceljs')
    // ... 实现
  }
}
```

#### 2.3 更新调用方

检查所有调用 `exportExcel` 的地方，确保使用 `await`：

```typescript
// 旧
const result = exporter.exportExcel(data, config)

// 新
const result = await exporter.exportExcel(data, config)
```

### Phase 3：审计日志迁移 (2-3 小时)

`src/lib/audit-log/export-service.ts` 中的 `exportAsXlsx` 目前是伪实现（回退到 CSV），需要真正实现：

```typescript
private async exportAsXlsx(
  events: AuditEvent[],
  outputPath: string,
  compress?: boolean
): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Audit Log')

  // 添加表头
  const headers = ['Timestamp', 'Action', 'User', 'Details']
  worksheet.addRow(headers)

  // 添加数据
  events.forEach(event => {
    worksheet.addRow([
      event.timestamp,
      event.action,
      event.userId,
      JSON.stringify(event.data)
    ])
  })

  const buffer = await workbook.xlsx.writeBuffer()
  await fs.writeFile(outputPath, buffer)
}
```

### Phase 4：测试验证 (2 小时)

```bash
# 运行导出相关测试
npm test -- --grep "export"

# 手动测试
node -e "
const { exportData } = require('./dist/lib/export')
// 测试 CSV/JSON/XLSX 导出
"
```

### Phase 5：清理 (1 小时)

- 确认 xlsx 完全移除：`grep -r "xlsx" package.json`
- 更新相关类型定义（如果需要）
- 更新文档

---

## 六、风险与注意事项

| 风险 | 缓解措施 |
|------|----------|
| 迁移后样式丢失 | exceljs 完整支持样式，不会丢失 |
| 包大小增加 | 使用动态导入，仅导出时加载 |
| 迁移过程中服务中断 | 准备回滚方案，保持 xlsx 临时可用 |
| exceljs 大文件性能 | 对于超大导出，考虑流式处理或分页 |

---

## 七、结论

**推荐方案**：迁移到 `exceljs` (^4.4.0)

**核心收益**：
- ✅ 消除安全漏洞（Prototype Pollution + ReDoS）
- ✅ 保持功能完整（样式、冻结、筛选）
- ✅ 修复当前代码中的异步 bug
- ✅ 维护活跃，社区支持好

**总工期**：约 10-15 小时

**立即行动**：
```bash
npm install exceljs@^4.4.0
npm uninstall xlsx
```
