# Feedback 图片上传功能修复报告

**日期**: 2026-04-26  
**修复人**: Bug修复专家子代理  
**任务**: 修复 Feedback 系统图片上传功能

---

## 问题背景

`src/lib/feedback/` 中的图片上传功能不完整：
- POST `/api/feedback` 时只存储文件名，没有实际上传到存储服务
- 没有实现 multipart/form-data 格式的解析
- `CreateFeedbackDto` 中 `images` 类型为 `File[]`，但 API 路由使用 `request.json()` 只能接收 JSON，无法处理文件上传

---

## 修复内容

### 1. 新增存储服务 `src/lib/feedback/storage.ts`

创建了完整的文件上传服务，提供以下功能：

- **文件类型验证**: 仅允许 `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/gif`
- **文件大小验证**: 默认最大 10MB（可通过 `FEEDBACK_MAX_FILE_SIZE` 环境变量配置）
- **文件保存**: 保存到 `public/uploads/feedback/` 目录
- **URL 生成**: 返回公开访问的 URL 格式 `/uploads/feedback/{uuid}.{ext}`
- **多文件上传**: `uploadFiles()` 支持批量上传
- **文件删除**: `deleteFile()` 支持删除已上传文件

关键函数：
```typescript
uploadFile(file: File): Promise<UploadedFile>
uploadFiles(files: File[]): Promise<UploadedFile[]>
deleteFile(url: string): Promise<boolean>
getUploadConfig(): { maxFileSize, allowedTypes, uploadDir }
```

### 2. 修改 API 路由 `src/app/api/feedback/route.ts`

#### 2.1 支持 multipart/form-data

修改 `POST` 处理器，根据 `Content-Type`  header 决定解析方式：

```typescript
if (contentType.includes('multipart/form-data')) {
  // 使用 formData() 解析
  const formData = await request.formData()
  // 从 formData 提取字段
  body = {
    type: formData.get('type') as FeedbackType,
    rating: parseInt(formData.get('rating') as string, 10),
    // ...
  }
  // 上传图片文件
  const { uploadFiles } = await import('@/lib/feedback/storage')
  uploadedImages = await uploadFiles(validFiles)
} else {
  // 保持原有的 JSON 解析
  body = await request.json()
}
```

#### 2.2 图片处理逻辑重构

**修复前**（只存文件名）：
```typescript
if (images && images.length > 0) {
  for (const image of images) {
    // 只存储 image.name，没有实际上传
    url: `/uploads/feedback/${attachmentId}`,
  }
}
```

**修复后**（完整上传流程）：
```typescript
// 处理 multipart 上传的文件（优先）
if (uploadedImages.length > 0) {
  allImages = uploadedImages.map(img => ({...}))
}
// 处理 JSON body 中的图片（兼容旧接口）
else if (images && images.length > 0) {
  allImages = images.map(...)
}
// 存入数据库
for (const image of allImages) {
  db.exec(`INSERT INTO feedback_attachments ...`, [attachmentId, feedbackId, image.filename, image.url, ...])
}
```

---

## 修改的文件

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `src/lib/feedback/storage.ts` | 新增 | 完整的文件上传存储服务 |
| `src/app/api/feedback/route.ts` | 修改 | 支持 multipart/form-data，实现实际上传 |

---

## API 兼容性

### JSON 格式（保持向后兼容）
```json
POST /api/feedback
Content-Type: application/json

{
  "type": "bug",
  "rating": 5,
  "title": "Test",
  "description": "Description",
  "images": [{"name": "test.jpg", "size": 1000, "type": "image/jpeg"}]
}
```

### multipart/form-data 格式（新增）
```
POST /api/feedback
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="type"
bug

--boundary
Content-Disposition: form-data; name="rating"
5

--boundary
Content-Disposition: form-data; name="title"
Test

--boundary
Content-Disposition: form-data; name="description"
Description

--boundary
Content-Disposition: form-data; name="images"; filename="test.jpg"
Content-Type: image/jpeg
[binary data]

--boundary--
```

---

## 验证方式

### 1. 单元测试
```bash
# 测试存储服务
npx jest src/lib/feedback/storage.test.ts

# 测试 API 路由
npx jest src/app/api/feedback/route.test.ts
```

### 2. 手动测试

**使用 curl 测试 multipart 上传**：
```bash
curl -X POST http://localhost:3000/api/feedback \
  -F "type=bug" \
  -F "rating=5" \
  -F "title=Test Bug Report" \
  -F "description=This is a test" \
  -F "images=@/path/to/image.jpg"
```

**验证文件是否上传到目录**：
```bash
ls -la public/uploads/feedback/
```

**验证数据库记录**：
```bash
sqlite3 data/app.db "SELECT * FROM feedback_attachments;"
```

### 3. 检查点

- [ ] multipart/form-data 请求能成功上传图片
- [ ] 图片文件保存到 `public/uploads/feedback/` 目录
- [ ] `feedback_attachments` 表中 `url` 字段包含正确的公开 URL
- [ ] JSON 格式请求仍然正常工作（向后兼容）
- [ ] 非法文件类型被拒绝
- [ ] 超出大小限制的文件被拒绝

---

## 注意事项

1. **生产环境存储**: 当前实现使用本地文件系统（`public/uploads/`），适用于单机部署。生产环境建议使用云存储（如 Cloudflare R2, AWS S3），可通过扩展 `storage.ts` 实现

2. **文件清理**: 删除 feedback 时未自动删除已上传的文件，后续可添加 `deleteFile()` 调用

3. **安全考虑**: 
   - 已实现文件类型白名单
   - 已实现文件大小限制
   - 建议生产环境添加图片内容验证（不只是 MIME 类型）
