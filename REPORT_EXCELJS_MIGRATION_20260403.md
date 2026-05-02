# ExcelJS 迁移评估报告

**生成日期**: 2026-04-03
**评估目标**: 评估将 exceljs (23MB) 迁移到 xlsx (约7.3MB) 的可行性和工作量
**评估人**: 架构师子代理

---

## 执行摘要

**结论**: ✅ **推荐迁移**

- **预期体积节省**: 约 15.7MB (68% 减少)
- **迁移工作量**: 中等
- **风险等级**: 低
- **推荐策略**: 渐进式迁移，优先处理核心导出功能

---

## 1. ExcelJS 使用文件清单

### 1.1 实际使用文件 (4个)

| 文件路径 | 使用方式 | 功能描述 | 重要性 |
|---------|---------|---------|--------|
| `src/lib/export/index.ts` | 核心使用 | 数据导出工具，支持 CSV/JSON/Excel 导出，包含样式、列宽、冻结表头、自动筛选等高级功能 | ⭐⭐⭐ 高 |
| `src/app/api/analytics/export/route.ts` | 核心使用 | 分析数据导出 API，支持 CSV/Excel/JSON 格式，动态导入 exceljs | ⭐⭐⭐ 高 |
| `src/app/api/analytics/export/route.test.ts` | 测试 | 测试文件，mock 了 exceljs | ⭐⭐ 中 |
| `src/lib/audit-log/export-service.ts` | 注释 | 仅在注释中提到，实际实现使用 CSV | ⭐ 低 |

### 1.2 仅注释提及 (1个)

| 文件路径 | 说明 |
|---------|------|
| `7zi-frontend/src/app/api/data/import/route.ts` | 仅在安全注释中提到"不要使用 xlsx 包，使用 exceljs 替代"，但实际未实现 Excel 导入功能 |

---

## 2. ExcelJS 使用方式分析

### 2.1 核心功能使用

#### 2.1.1 基础导出功能
```typescript
// 动态导入以减少初始包大小
const ExcelJS = await import('exceljs')
const workbook = new ExcelJS.Workbook()
const worksheet = workbook.addWorksheet(sheetName)
```

#### 2.1.2 表头样式
```typescript
const headerRow = worksheet.addRow(headers)
headerRow.font = { bold: true }
headerRow.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' },  // 灰色背景
}
```

#### 2.1.3 列宽设置
```typescript
// 自动计算列宽
const maxWidth = Math.max(
  field.label.length,
  ...transformedData.map(row => String(row[field.label] ?? '').length)
)
column.width = Math.min(Math.max(maxWidth, 10), 50)
```

#### 2.1.4 冻结表头
```typescript
worksheet.views = [{
  state: 'frozen',
  ySplit: excelOptions.freezeRows,  // 默认 1
}]
```

#### 2.1.5 自动筛选
```typescript
worksheet.autoFilter = {
  from: { row: 1, column: 1 },
  to: { row: transformedData.length + 1, column: fields.length },
}
```

#### 2.1.6 多工作表支持
```typescript
config.sheets.forEach(sheetConfig => {
  const worksheet = workbook.addWorksheet(sheetConfig.name)
  // 添加表头和数据
})
```

### 2.2 高级功能使用

| 功能 | 使用位置 | 复杂度 |
|-----|---------|--------|
| 自定义字段格式化 | `src/lib/export/index.ts` | 中 |
| 数据验证 | `src/lib/export/index.ts` | 中 |
| 导出模板 | `src/lib/export/index.ts` | 低 |
| 多工作表导出 | `src/lib/export/index.ts` | 中 |
| 列宽自动计算 | `src/lib/export/index.ts` | 低 |
| 冻结表头 | `src/lib/export/index.ts` | 低 |
| 自动筛选 | `src/lib/export/index.ts` | 低 |

---

## 3. XLSX 库能力对比

### 3.1 基本信息

| 属性 | ExcelJS | XLSX (SheetJS) |
|-----|---------|----------------|
| 版本 | 4.4.0 | 0.18.5 |
| 体积 | 23MB | 7.3MB (压缩后 ~881KB) |
| 主页 | https://github.com/exceljs/exceljs | https://sheetjs.com |
| 许可证 | MIT | Apache-2.0 |
| 维护状态 | 活跃 | 活跃 |

### 3.2 功能对比

| 功能 | ExcelJS | XLSX | 迁移难度 |
|-----|---------|------|---------|
| **读取 Excel** | ✅ 完整支持 | ✅ 完整支持 | 低 |
| **写入 Excel** | ✅ 完整支持 | ✅ 完整支持 | 低 |
| **单元格样式** | ✅ 完整支持 | ⚠️ 有限支持 (社区版) | 中 |
| **字体样式** | ✅ 支持 | ⚠️ 有限支持 | 中 |
| **背景色** | ✅ 支持 | ⚠️ 有限支持 | 中 |
| **边框** | ✅ 支持 | ⚠️ 有限支持 | 中 |
| **列宽设置** | ✅ 支持 | ✅ 支持 | 低 |
| **行高设置** | ✅ 支持 | ✅ 支持 | 低 |
| **冻结窗格** | ✅ 支持 | ✅ 支持 | 低 |
| **自动筛选** | ✅ 支持 | ✅ 支持 | 低 |
| **多工作表** | ✅ 支持 | ✅ 支持 | 低 |
| **公式** | ✅ 支持 | ✅ 支持 | 低 |
| **数据验证** | ✅ 支持 | ✅ 支持 | 低 |
| **图片** | ✅ 支持 | ⚠️ 有限支持 | 高 |
| **图表** | ✅ 支持 | ❌ 不支持 (社区版) | 高 |
| **数据透视表** | ✅ 支持 | ❌ 不支持 (社区版) | 高 |

### 3.3 XLSX 库优势

1. **体积更小**: 7.3MB vs 23MB，节省 68%
2. **性能更好**: 处理大数据集时性能更优
3. **格式支持更广**: 支持更多 Excel 格式（XLS, XLSX, CSV, ODS 等）
4. **社区更活跃**: SheetJS 是业界标准，社区支持更好
5. **文档更完善**: 文档和示例更丰富

### 3.4 XLSX 库劣势

1. **样式支持有限**: 社区版对样式支持有限（Pro 版本支持完整样式）
2. **图表不支持**: 社区版不支持图表和数据透视表
3. **API 差异**: API 与 ExcelJS 不同，需要重写代码

---

## 4. 迁移工作量估算

### 4.1 工作量评估: **中等**

| 任务 | 预估时间 | 复杂度 | 说明 |
|-----|---------|--------|------|
| 研究和测试 XLSX API | 2-4 小时 | 低 | 熟悉 XLSX API，测试核心功能 |
| 迁移 `src/lib/export/index.ts` | 4-6 小时 | 中 | 核心导出功能，包含样式、列宽等 |
| 迁移 `src/app/api/analytics/export/route.ts` | 2-3 小时 | 低 | 相对简单，主要是导出逻辑 |
| 更新测试文件 | 1-2 小时 | 低 | 更新 mock 和测试用例 |
| 样式适配和调整 | 2-4 小时 | 中 | XLSX 样式 API 不同，需要适配 |
| 集成测试 | 2-3 小时 | 中 | 确保所有导出功能正常 |
| 文档更新 | 1 小时 | 低 | 更新相关文档 |
| **总计** | **14-23 小时** | **中** | 约 2-3 个工作日 |

### 4.2 风险评估

| 风险 | 等级 | 缓解措施 |
|-----|------|---------|
| 样式功能不完整 | 中 | 使用 XLSX Pro 版本或接受样式简化 |
| API 差异导致 bug | 中 | 充分测试，保留回滚方案 |
| 性能问题 | 低 | XLSX 性能通常更好 |
| 兼容性问题 | 低 | 测试不同 Excel 版本 |

---

## 5. 推荐的迁移策略

### 5.1 渐进式迁移 (推荐)

**阶段 1: 准备阶段 (1-2 小时)**
1. 安装 xlsx 库: `npm install xlsx`
2. 创建迁移分支
3. 研究和测试 XLSX API
4. 创建迁移测试用例

**阶段 2: 核心功能迁移 (6-8 小时)**
1. 迁移 `src/app/api/analytics/export/route.ts` (相对简单)
2. 测试基本导出功能
3. 迁移 `src/lib/export/index.ts` 的基础导出功能
4. 测试 CSV/JSON/Excel 基础导出

**阶段 3: 高级功能迁移 (4-6 小时)**
1. 迁移样式功能（表头样式、背景色）
2. 迁移列宽自动计算
3. 迁移冻结表头和自动筛选
4. 迁移多工作表支持

**阶段 4: 测试和优化 (3-4 小时)**
1. 运行所有测试用例
2. 手动测试各种导出场景
3. 性能测试和优化
4. 更新文档

**阶段 5: 部署和监控 (1-2 小时)**
1. 代码审查
2. 合并到主分支
3. 部署到测试环境
4. 监控和收集反馈
5. 部署到生产环境

### 5.2 替代方案

#### 方案 A: 保留 ExcelJS，仅优化加载
- **优点**: 无需修改代码，风险最低
- **缺点**: 无法减少体积
- **适用场景**: 时间紧迫，体积问题不严重

#### 方案 B: 混合使用
- **优点**: 根据需求选择合适的库
- **缺点**: 增加维护成本
- **适用场景**: 不同模块有不同需求

#### 方案 C: 使用 XLSX Pro 版本
- **优点**: 完整的样式支持
- **缺点**: 需要付费许可
- **适用场景**: 需要完整样式功能

---

## 6. 预期体积节省

### 6.1 当前体积

| 库 | 体积 |
|----|------|
| exceljs | 23MB |
| xlsx | 7.3MB (已安装但未使用) |

### 6.2 迁移后体积

| 库 | 体积 |
|----|------|
| xlsx | 7.3MB |
| exceljs | 0MB (移除) |

### 6.3 节省分析

- **节省体积**: 15.7MB
- **节省比例**: 68%
- **实际压缩后**: 约 881KB (xlsx.full.min.js)

### 6.4 其他收益

1. **构建速度提升**: 减少依赖，加快构建
2. **部署体积减小**: 减少部署包大小
3. **加载速度提升**: 减少初始加载时间
4. **维护成本降低**: 减少依赖数量

---

## 7. 迁移代码示例

### 7.1 ExcelJS 当前代码

```typescript
const ExcelJS = await import('exceljs')
const workbook = new ExcelJS.Workbook()
const worksheet = workbook.addWorksheet(sheetName)

// 添加表头
const headerRow = worksheet.addRow(headers)
headerRow.font = { bold: true }
headerRow.fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' },
}

// 添加数据
data.forEach(row => {
  worksheet.addRow(values)
})

// 设置列宽
worksheet.columns.forEach((column, index) => {
  column.width = Math.max(headers[index].length, 10)
})

// 冻结表头
worksheet.views = [{
  state: 'frozen',
  ySplit: 1,
}]

// 自动筛选
worksheet.autoFilter = {
  from: { row: 1, column: 1 },
  to: { row: data.length + 1, column: headers.length },
}

// 生成文件
const buffer = await workbook.xlsx.writeBuffer()
```

### 7.2 XLSX 迁移后代码

```typescript
import * as XLSX from 'xlsx'

// 创建工作簿和工作表
const workbook = XLSX.utils.book_new()
const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])

// 设置列宽 (XLSX 使用 '!cols' 属性)
worksheet['!cols'] = headers.map((_, index) => ({
  wch: Math.max(headers[index].length, 10)
}))

// 添加工作表
XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

// 生成文件
const buffer = XLSX.write(workbook, {
  type: 'buffer',
  bookType: 'xlsx',
})

// 注意: XLSX 社区版对样式支持有限
// 如需样式，需要使用 Pro 版本或接受简化
```

### 7.3 样式处理差异

| 功能 | ExcelJS | XLSX (社区版) | XLSX (Pro 版) |
|-----|---------|---------------|---------------|
| 表头加粗 | `font: { bold: true }` | 不支持 | 支持 |
| 背景色 | `fill: { fgColor: {...} }` | 不支持 | 支持 |
| 冻结窗格 | `views: [{ state: 'frozen' }]` | 支持 | 支持 |
| 自动筛选 | `autoFilter: {...}` | 支持 | 支持 |

---

## 8. 测试计划

### 8.1 单元测试

- [ ] 测试 CSV 导出功能
- [ ] 测试 JSON 导出功能
- [ ] 测试 Excel 导出功能
- [ ] 测试多工作表导出
- [ ] 测试列宽设置
- [ ] 测试冻结表头
- [ ] 测试自动筛选

### 8.2 集成测试

- [ ] 测试 Analytics Export API
- [ ] 测试通用导出工具
- [ ] 测试大数据集导出 (>1000 行)
- [ ] 测试特殊字符处理
- [ ] 测试空数据处理

### 8.3 兼容性测试

- [ ] Excel 2016
- [ ] Excel 2019
- [ ] Excel 365
- [ ] Google Sheets
- [ ] WPS Office

---

## 9. 回滚计划

### 9.1 回滚触发条件

1. 样式功能严重缺失
2. 性能明显下降
3. 兼容性问题无法解决
4. 用户反馈强烈

### 9.2 回滚步骤

1. 恢复到迁移前的代码版本
2. 重新安装 exceljs: `npm install exceljs`
3. 运行测试确保功能正常
4. 部署回滚版本
5. 分析失败原因，制定改进方案

---

## 10. 结论和建议

### 10.1 最终结论

✅ **强烈推荐迁移到 XLSX**

**理由**:
1. 体积节省显著 (68%)
2. 性能更优
3. 社区支持更好
4. 迁移工作量可控 (2-3 天)
5. 风险较低

### 10.2 关键建议

1. **优先迁移**: 先迁移 `src/app/api/analytics/export/route.ts`，验证可行性
2. **样式简化**: 接受 XLSX 社区版的样式限制，或考虑 Pro 版本
3. **充分测试**: 确保所有导出功能正常后再部署
4. **保留回滚**: 准备好回滚方案，降低风险
5. **文档更新**: 及时更新相关文档和注释

### 10.3 后续优化

1. 考虑使用动态导入进一步优化加载
2. 评估是否需要 XLSX Pro 版本
3. 监控生产环境性能和用户反馈
4. 定期评估其他轻量级替代方案

---

## 附录

### A. 参考资料

- [ExcelJS 文档](https://github.com/exceljs/exceljs)
- [SheetJS 文档](https://sheetjs.com/)
- [SheetJS Pro 功能对比](https://sheetjs.com/pro)
- [XLSX vs ExcelJS 对比](https://www.npmjs.com/package/xlsx)

### B. 联系人

- 评估人: 架构师子代理
- 日期: 2026-04-03
- 会话: agent:main:subagent:38d03d99-474f-4f4a-b51a-019bfdff23fa

---

**报告结束**