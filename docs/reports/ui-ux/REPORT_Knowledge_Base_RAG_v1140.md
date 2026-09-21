# 知识库 RAG 系统技术方案报告 (v1.14.0)

**版本**: v1.14.0
**日期**: 2026-04-05
**作者**: 智能体世界专家
**项目路径**: `/root/.openclaw/workspace/7zi-frontend`

---

## 执行摘要

本报告分析了 7zi-frontend 项目 v1.14.0 的知识库 RAG（检索增强生成）系统技术方案。经过深入分析，发现项目已经具备了完整的 RAG 系统框架，包括文档处理管道、向量存储、智能检索和问答生成等核心模块。本方案将基于现有架构，提出改进建议和实施计划。

**核心发现**:
- ✅ 已有完整的 RAG 系统架构和类型定义
- ✅ 支持 Weaviate 向量数据库 + 本地存储
- ✅ 实现了混合检索（向量+关键词）和 RRF 排序算法
- ⚠️ 缺少实际依赖包（weaviate-client、pdf-parse 等）
- ⚠️ 文档解析器为占位实现
- ⚠️ 需要完善 Pinecone/Qdrant 支持

**推荐方案**: 基于现有架构，逐步完善功能，优先实现生产就绪的 Weaviate 方案，同时扩展 Pinecone/Qdrant 支持。

---

## 1. 现有系统分析

### 1.1 项目概况

| 项目属性 | 值 |
|---------|-----|
| 当前版本 | v1.13.0 |
| 目标版本 | v1.14.0 |
| 框架 | Next.js 16.2.2 + React 19.2.4 |
| 构建工具 | Turbopack (开发) / Webpack (生产) |
| 测试框架 | Vitest + Playwright |
| TypeScript | 5.3.0 |

### 1.2 现有代码结构

```
src/lib/knowledge/
├── types.ts                    # 核心类型定义 ✅ 完整
├── vector-store.ts             # 向量存储抽象接口 ✅ 完整
├── smart-retriever.ts          # 智能检索器 ✅ 完整
├── rag-qa.ts                   # RAG 问答器 ✅ 完整
├── document-pipeline.ts        # 文档处理管道 ✅ 完整
├── examples.ts                 # 示例代码
├── README.md                   # 详细文档 ✅ 完整
└── index.ts                    # 导出入口
```

### 1.3 核心模块分析

#### 1.3.1 向量存储模块 (`vector-store.ts`)

**实现状态**: ✅ 架构完整，需要安装依赖

```typescript
// 支持的向量数据库
- Weaviate ✅ (生产推荐)
- Local ✅ (开发/测试)
- Pinecone ⚠️ (接口定义，未实现)
- Qdrant ⚠️ (接口定义，未实现)
```

**核心功能**:
- ✅ 抽象接口 `IVectorStore`
- ✅ Weaviate 实现（代码完整，需 weaviate-client 包）
- ✅ 本地存储实现（内存 Map，用于开发）
- ✅ 批量操作支持
- ✅ 元数据过滤

**缺失功能**:
- ❌ Pinecone 实现
- ❌ Qdrant 实现
- ❌ Milvus 实现

#### 1.3.2 智能检索模块 (`smart-retriever.ts`)

**实现状态**: ✅ 完整

**核心算法**:
- ✅ 混合检索（向量 + 关键词）
- ✅ RRF (Reciprocal Rank Fusion) 排序
- ✅ 重排序（基于语义相似度）
- ✅ BM25 关键词搜索（可选实现）
- ✅ 可配置权重（vectorWeight, keywordWeight）

**检索流程**:
```
查询 → 生成嵌入 → 并行搜索 → RRF 融合 → 重排序 → 返回 Top-K
```

#### 1.3.3 RAG 问答模块 (`rag-qa.ts`)

**实现状态**: ✅ 完整

**核心功能**:
- ✅ 基于检索结果的答案生成
- ✅ 引用追溯（显示来源文档）
- ✅ 流式问答支持
- ✅ 置信度评估
- ✅ 引用报告生成

**答案生成流程**:
```
用户问题 → 检索相关文档 → 构建提示词 → 调用 LLM → 提取引用 → 计算置信度
```

#### 1.3.4 文档处理管道 (`document-pipeline.ts`)

**实现状态**: ⚠️ 架构完整，解析器为占位实现

**核心功能**:
- ✅ 多格式文档解析（架构）
- ⚠️ PDF 解析（占位实现）
- ⚠️ Word 解析（占位实现）
- ✅ HTML/Markdown/TXT 解析（完整）
- ✅ 递归分块策略
- ✅ 批量嵌入生成
- ✅ 可配置分块参数

**分块策略**:
- ✅ Recursive（递归，按段落分割）
- ⚠️ Semantic（语义，未实现）
- ✅ Fixed（固定大小）

### 1.4 依赖项分析

**已安装的 AI 相关依赖**:
```json
{
  "@xenova/transformers": "^2.17.2"  // 本地模型支持
}
```

**缺失的关键依赖**:
```json
{
  // 向量数据库
  "weaviate-client": "latest",           // Weaviate 客户端
  "@pinecone-database/pinecone": "latest", // Pinecone 客户端
  "@qdrant/js-client-rest": "latest",    // Qdrant 客户端

  // 文档解析
  "pdf-parse": "latest",                  // PDF 解析
  "mammoth": "latest",                    // Word 解析
  "jsdom": "^24.0.0"                      // HTML 解析（已安装）

  // 文本搜索
  "flexsearch": "latest",                 // 全文搜索引擎
  "fuse.js": "latest",                    // 模糊搜索
  "node-fetch": "latest",                 // HTTP 客户端

  // 嵌入生成
  "openai": "latest",                     // OpenAI API 客户端
  "@anthropic-ai/sdk": "latest"           // Anthropic API 客户端
}
```

### 1.5 现有测试覆盖

**已发现的测试文件**:
- ✅ `src/lib/ai/__tests__/ai-service.test.ts`
- ✅ `src/lib/ai/__tests__/ai-integration.test.ts`

**缺失的测试**:
- ❌ 知识库模块单元测试
- ❌ 集成测试
- ❌ E2E 测试

---

## 2. RAG 系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户界面层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  文档上传    │  │  知识库管理  │  │  智能问答    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API 层                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  REST API    │  │  WebSocket   │  │  Webhook     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        RAG 核心层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 文档处理     │  │  向量存储    │  │  智能检索    │         │
│  │              │  │              │  │              │         │
│  │ - 解析       │  │ - Weaviate   │  │ - 混合检索   │         │
│  │ - 分块       │  │ - Pinecone   │  │ - RRF 排序   │         │
│  │ - 嵌入       │  │ - Qdrant     │  │ - 重排序     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────┐             │
│  │                RAG 问答器                     │             │
│  │  - 答案生成  - 引用追溯  - 流式响应          │             │
│  └──────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        AI 服务层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  OpenAI      │  │  Anthropic   │  │  本地模型    │         │
│  │  (GPT-4)     │  │  (Claude)    │  │  (Transformers)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        数据层                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  向量数据库  │  │  元数据存储  │  │  文件存储    │         │
│  │  (Weaviate)  │  │  (SQLite)    │  │  (S3/OSS)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心模块详细设计

#### 2.2.1 文档处理管道

**流程图**:
```
文件上传 → MIME 检测 → 文档解析 → 文本清洗 → 分块 → 生成嵌入 → 存储索引
   ↓           ↓          ↓          ↓       ↓        ↓          ↓
 验证        类型识别   PDF/Word    去噪   递归分割  批量API    向量DB
```

**分块策略对比**:

| 策略 | 优点 | 缺点 | 推荐场景 |
|-----|------|------|---------|
| Recursive | 保持语义完整，性能好 | 可能切分在句子中间 | 通用场景 |
| Semantic | 语义边界准确 | 计算开销大 | 高质量场景 |
| Fixed | 性能最优 | 破坏语义 | 简单文档 |

**推荐配置**:
```typescript
{
  maxChunkSize: 1000,      // 字符数
  chunkOverlap: 200,       // 重叠字符数
  chunkingStrategy: 'recursive',
  supportedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/html',
    'text/plain'
  ]
}
```

#### 2.2.2 向量存储选型

**向量数据库对比**:

| 数据库 | 开源 | 托管 | 扩展性 | 性能 | 成本 | 推荐度 |
|--------|-----|------|--------|------|------|--------|
| **Weaviate** | ✅ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Pinecone | ❌ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Qdrant | ✅ | ✅ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Milvus | ✅ | ✅ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Chroma | ✅ | ✅ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**推荐方案**:
1. **生产环境**: Weaviate（自托管或托管服务）
2. **云原生**: Pinecone（最高性能，成本较高）
3. **成本敏感**: Qdrant（性价比高）
4. **开发/测试**: LocalVectorStore（内存存储）

**Weaviate 优势**:
- ✅ 完全开源（Apache 2.0）
- ✅ 内置向量化和模块化架构
- ✅ 丰富的过滤和聚合能力
- ✅ 支持多租户
- ✅ GraphQL 和 REST API
- ✅ 良好的 TypeScript 支持

#### 2.2.3 检索算法设计

**混合检索架构**:
```
查询
  ├─→ 向量检索（余弦相似度）
  │   └─→ Top-20 结果
  │
  ├─→ 关键词检索（BM25）
  │   └─→ Top-20 结果
  │
  └─→ RRF 融合
      ├─→ 加权融合（vectorWeight: 0.7, keywordWeight: 0.3）
      ├─→ 排序
      └─→ 重排序（语义相似度）
          └─→ Top-K 结果
```

**RRF (Reciprocal Rank Fusion) 算法**:
```
score(chunks) = Σ (1 / (k + rank_i(chunks))) * weight_i

其中：
- k: 常数，通常为 60
- rank_i: 在第 i 个检索方法中的排名
- weight_i: 第 i 个方法的权重
```

**检索参数调优建议**:
```typescript
{
  topK: 10,                // 返回结果数量
  minScore: 0.1,           // 最小相关分数
  vectorWeight: 0.7,       // 向量检索权重（0.5-0.8）
  keywordWeight: 0.3,      // 关键词检索权重（0.2-0.5）
  useRerank: true,         // 启用重排序
  rrfK: 60,                // RRF 参数
  embeddingModel: 'text-embedding-3-small',  // 嵌入模型
  embeddingDimension: 1536  // 嵌入维度
}
```

#### 2.2.4 知识图谱构建（未来）

**知识图谱集成方案**:

```
文档 → 实体提取 → 关系抽取 → 图数据库 → 图检索 → RAG 增强
  ↓         ↓          ↓          ↓          ↓         ↓
NLP    spaCy/LangChain   GPT-4    Neo4j      Cypher   混合检索
```

**推荐技术栈**:
- **图数据库**: Neo4j（开源）、Amazon Neptune（托管）
- **实体提取**: spaCy、LangChain Entity Extractor
- **关系抽取**: GPT-4、Claude 3.5
- **图检索**: GraphRAG、GraphRAG-Local

**实施阶段**:
- Phase 1 (v1.15): 基础实体提取和存储
- Phase 2 (v1.16): 关系抽取和图检索
- Phase 3 (v1.17): GraphRAG 集成

### 2.3 性能优化设计

#### 2.3.1 批处理优化

```typescript
// 批量嵌入生成（每批 100 个）
async function generateEmbeddingsBatch(
  chunks: DocumentChunk[],
  batchSize: number = 100
): Promise<DocumentChunk[]> {
  const results: DocumentChunk[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await openai.embeddings.create({
      input: batch.map(c => c.content),
      model: 'text-embedding-3-small'
    });

    results.push(...batch.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddings.data[idx].embedding
    })));
  }

  return results;
}
```

#### 2.3.2 缓存策略

```typescript
// 嵌入缓存
class EmbeddingCache {
  private cache: Map<string, number[]> = new Map();
  private ttl: number = 3600000; // 1 小时

  async get(text: string): Promise<number[] | null> {
    const key = this.hash(text);
    const cached = this.cache.get(key);

    if (cached) {
      return cached;
    }

    return null;
  }

  async set(text: string, embedding: number[]): Promise<void> {
    const key = this.hash(text);
    this.cache.set(key, embedding);

    // 设置过期时间
    setTimeout(() => {
      this.cache.delete(key);
    }, this.ttl);
  }

  private hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
```

#### 2.3.3 并发控制

```typescript
// 并发处理多个文档
async function processDocumentsConcurrent(
  files: File[],
  concurrency: number = 5
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(file => processDocument(file))
    );

    results.push(...batchResults);
  }

  return results;
}
```

---

## 3. 技术栈建议

### 3.1 推荐技术方案

#### 3.1.1 核心依赖

```json
{
  "dependencies": {
    // 向量数据库客户端
    "weaviate-ts-client": "^1.10.0",
    "@pinecone-database/pinecone": "^5.0.0",
    "@qdrant/js-client-rest": "^1.13.0",

    // 文档解析
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.8.0",
    "@google-cloud/documentai": "^8.0.0",

    // 文本搜索
    "flexsearch": "^0.7.31",
    "fuse.js": "^7.0.0",

    // AI 服务
    "openai": "^4.67.0",
    "@anthropic-ai/sdk": "^0.30.1",
    "@xenova/transformers": "^2.17.2",

    // 工具库
    "natural": "^8.0.1",
    "compromise": "^14.14.0",
    "uuid": "^10.0.0",
    "zod": "^4.3.6"
  }
}
```

#### 3.1.2 开发依赖

```json
{
  "devDependencies": {
    // 测试
    "vitest": "^4.1.2",
    "@vitest/coverage-v8": "^4.1.2",
    "playwright": "^1.59.1",

    // 类型定义
    "@types/natural": "^6.0.0",

    // 性能分析
    "lighthouse": "^12.0.0"
  }
}
```

### 3.2 部署架构

#### 3.2.1 开发环境

```
本地开发机
├── Next.js 开发服务器
├── Weaviate (Docker)
├── 本地向量存储（内存）
└── OpenAI API（外部）
```

**Docker Compose 配置**:
```yaml
version: '3.8'
services:
  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true
      - PERSISTENCE_DATA_PATH=/var/lib/weaviate
      - ENABLE_MODULES=text2vec-openai
      - DEFAULT_VECTORIZER_MODULE=text2vec-openai
      - OPENAI_APIKEY=${OPENAI_API_KEY}
    volumes:
      - weaviate-data:/var/lib/weaviate

volumes:
  weaviate-data:
```

#### 3.2.2 生产环境

```
7zi.com 服务器
├── Next.js 应用（PM2）
├── Weaviate（独立容器）
├── PostgreSQL（元数据）
├── Redis（缓存）
└── Nginx（反向代理）
```

**部署方案**:
- **应用服务器**: PM2 进程管理
- **向量数据库**: Weaviate Docker 容器
- **元数据存储**: PostgreSQL 15
- **缓存**: Redis 7
- **负载均衡**: Nginx

### 3.3 成本估算

#### 3.3.1 开发成本（一次性）

| 项目 | 成本（USD） |
|-----|-----------|
| 开发工时（8-12 周）| $12,000 - $18,000 |
| 测试和调试 | $2,000 - $3,000 |
| 文档编写 | $1,000 - $1,500 |
| **总计** | **$15,000 - $22,500** |

#### 3.3.2 运营成本（月度）

| 项目 | 方案 A（自托管）| 方案 B（托管）| 说明 |
|-----|---------------|--------------|------|
| 服务器 | $50 - $100 | - | 7zi.com 服务器 |
| Weaviate | $0 | $70 - $500 | 自托管 vs 托管 |
| OpenAI API | $50 - $200 | $50 - $200 | 嵌入 + 问答 |
| 存储 | $10 - $30 | $10 - $30 | 向量数据 |
| 带宽 | $20 - $50 | $20 - $50 | 数据传输 |
| **总计** | **$130 - $380** | **$150 - $780** | 自托管更经济 |

#### 3.3.3 API 调用成本估算

假设每月 10,000 次问答，每次平均检索 5 个文档：

| 服务 | 单价 | 用量 | 月成本 |
|-----|-----|------|--------|
| OpenAI Embeddings | $0.00002 / 1K tokens | 500K tokens | $10 |
| OpenAI GPT-4 | $0.03 / 1K tokens | 2M tokens | $60 |
| **总计** | | | **$70** |

### 3.4 开发周期估算

| 阶段 | 周数 | 里程碑 |
|-----|------|--------|
| 第 1 周 | 1 | 需求确认和架构设计 |
| 第 2-3 周 | 2 | 依赖安装和基础设施搭建 |
| 第 4-6 周 | 3 | 文档处理管道实现 |
| 第 7-9 周 | 3 | 向量存储和检索实现 |
| 第 10-11 周 | 2 | RAG 问答和 UI 集成 |
| 第 12 周 | 1 | 测试、优化和部署 |
| **总计** | **12 周** | |

**敏捷开发建议**:
- 每 2 周一个 Sprint
- 每周代码审查
- 持续集成和部署
- 用户反馈迭代

---

## 4. 实现计划

### 4.1 分阶段实施计划

#### Phase 1: 基础设施和依赖（第 1-2 周）

**目标**: 搭建开发环境，安装必要依赖

**任务**:
- [ ] 安装 Weaviate 客户端
- [ ] 安装文档解析库（pdf-parse, mammoth）
- [ ] 安装文本搜索库（flexsearch）
- [ ] 配置 OpenAI API 密钥
- [ ] 搭建 Weaviate 开发环境（Docker）
- [ ] 编写单元测试框架
- [ ] 配置 CI/CD 流程

**交付物**:
- Docker Compose 配置文件
- 环境变量配置模板
- 依赖安装脚本
- 单元测试骨架

**验收标准**:
- Weaviate 容器可正常启动
- 可成功调用 OpenAI API
- 单元测试框架可运行

#### Phase 2: 文档处理管道（第 3-5 周）

**目标**: 实现完整的文档解析、分块和嵌入生成

**任务**:
- [ ] 实现 PDF 解析器（pdf-parse）
- [ ] 实现 Word 解析器（mammoth）
- [ ] 实现 Markdown/HTML 解析器
- [ ] 优化递归分块策略
- [ ] 实现批量嵌入生成
- [ ] 添加文档元数据提取
- [ ] 编写单元测试和集成测试
- [ ] 性能基准测试

**交付物**:
- 完整的文档处理器
- 单元测试覆盖率 > 80%
- 性能基准报告
- API 文档

**验收标准**:
- 支持解析 PDF、Word、Markdown、HTML
- 分块准确率 > 90%
- 嵌入生成成功率 > 95%
- 处理 10MB 文档 < 30 秒

#### Phase 3: 向量存储和检索（第 6-8 周）

**目标**: 完成向量数据库集成和智能检索

**任务**:
- [ ] 实现 Weaviate 集成
- [ ] 实现 Pinecone 集成（可选）
- [ ] 实现 Qdrant 集成（可选）
- [ ] 实现混合检索算法
- [ ] 优化 RRF 排序参数
- [ ] 实现重排序逻辑
- [ ] 添加 BM25 搜索（flexsearch）
- [ ] 编写集成测试
- [ ] 性能优化

**交付物**:
- 多向量数据库支持
- 智能检索器
- 集成测试套件
- 性能优化报告

**验收标准**:
- 支持至少 2 个向量数据库
- 检索准确率 > 85%
- 检索响应时间 < 500ms
- 支持元数据过滤

#### Phase 4: RAG 问答和 UI 集成（第 9-11 周）

**目标**: 完成问答系统和前端集成

**任务**:
- [ ] 实现 RAG 问答器
- [ ] 实现流式问答
- [ ] 实现引用追溯
- [ ] 实现置信度评估
- [ ] 设计问答 UI 组件
- [ ] 集成文档上传界面
- [ ] 集成知识库管理界面
- [ ] 添加实时搜索
- [ ] 编写 E2E 测试
- [ ] 性能优化

**交付物**:
- 完整的 RAG 问答系统
- 前端 UI 组件
- E2E 测试套件
- 用户手册

**验收标准**:
- 问答准确率 > 80%
- 引用准确率 > 90%
- 流式响应延迟 < 2 秒
- UI 响应流畅

#### Phase 5: 测试、优化和部署（第 12 周）

**目标**: 全面测试、性能优化和生产部署

**任务**:
- [ ] 完整回归测试
- [ ] 性能压力测试
- [ ] 安全审计
- [ ] 代码审查和重构
- [ ] 文档完善
- [ ] 部署到生产环境
- [ ] 监控和告警配置
- [ ] 用户培训

**交付物**:
- 测试报告
- 性能报告
- 部署文档
- 用户手册

**验收标准**:
- 所有测试通过
- 性能指标达标
- 无高危安全漏洞
- 成功部署到生产环境

### 4.2 每周里程碑

| 周次 | 里程碑 | 交付物 |
|-----|-------|--------|
| 第 1 周 | 需求确认和架构设计 | 架构设计文档 |
| 第 2 周 | 基础设施搭建 | Docker 配置、依赖安装 |
| 第 3 周 | 文档解析器实现 | PDF/Word 解析器 |
| 第 4 周 | 分块策略实现 | 递归分块器 |
| 第 5 周 | 嵌入生成实现 | 批量嵌入生成器 |
| 第 6 周 | 向量存储集成 | Weaviate 集成 |
| 第 7 周 | 检索算法实现 | 混合检索器 |
| 第 8 周 | 检索优化 | RRF 和重排序 |
| 第 9 周 | RAG 问答实现 | 问答器核心 |
| 第 10 周 | UI 组件开发 | 上传和问答界面 |
| 第 11 周 | 集成测试 | E2E 测试套件 |
| 第 12 周 | 部署上线 | 生产环境 |

### 4.3 风险评估

#### 4.3.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| 向量数据库性能不达标 | 中 | 高 | 提前进行性能测试，准备备选方案（Pinecone） |
| 文档解析器处理大文件失败 | 中 | 中 | 实现流式处理，添加超时机制 |
| OpenAI API 限流 | 高 | 中 | 实现重试机制，使用多 API Key |
| 嵌入成本超预算 | 中 | 中 | 实现缓存策略，优化分块大小 |
| 检索准确率不达标 | 中 | 高 | A/B 测试不同算法，调整参数 |

#### 4.3.2 进度风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| 需求变更导致返工 | 中 | 高 | 敏捷开发，快速迭代 |
| 第三方依赖不稳定 | 低 | 中 | 选择成熟稳定的库，实现备用方案 |
| 测试时间不足 | 中 | 中 | 提前编写测试，持续集成 |
| 人员流动 | 低 | 高 | 代码文档完善，知识共享 |

#### 4.3.3 成本风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| API 成本超预算 | 中 | 中 | 实现缓存，监控用量 |
| 服务器成本增加 | 低 | 低 | 监控资源使用，按需扩展 |
| 维护成本超预期 | 中 | 中 | 自主可控技术栈，完善文档 |

#### 4.3.4 安全风险

| 风险 | 概率 | 影响 | 缓解措施 |
|-----|------|------|---------|
| API 密钥泄露 | 低 | 高 | 环境变量存储，权限控制 |
| 数据泄露 | 低 | 高 | 数据加密，访问控制 |
| XSS/CSRF 攻击 | 中 | 中 | 输入验证，CSRF Token |
| 依赖漏洞 | 中 | 中 | 定期更新，安全扫描 |

---

## 5. 评估指标和测试计划

### 5.1 评估指标

#### 5.1.1 性能指标

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| 文档解析速度 | < 30 秒 / 10MB | 端到端计时 |
| 嵌入生成速度 | < 100ms / 文档 | API 响应时间 |
| 检索响应时间 | < 500ms | P95 响应时间 |
| 问答响应时间 | < 2 秒 | 端到端计时 |
| 并发处理能力 | 100 QPS | 负载测试 |

#### 5.1.2 准确性指标

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| 检索准确率 | > 85% | 人工标注评估 |
| 检索召回率 | > 80% | 完整匹配评估 |
| 问答准确率 | > 80% | 人工评分 |
| 引用准确率 | > 90% | 来源验证 |
| 分块准确率 | > 90% | 语义边界验证 |

#### 5.1.3 可靠性指标

| 指标 | 目标 | 测量方法 |
|-----|------|---------|
| 系统可用性 | > 99.5% | 运行时间统计 |
| API 成功率 | > 99% | 错误日志统计 |
| 数据一致性 | 100% | 校验和验证 |
| 错误恢复时间 | < 5 分钟 | 故障演练 |

### 5.2 测试计划

#### 5.2.1 单元测试

**测试范围**:
- 文档解析器（PDF、Word、Markdown、HTML）
- 分块策略（递归、语义、固定）
- 向量存储操作（增删改查）
- 检索算法（混合、RRF、重排序）
- 问答生成（答案、引用、置信度）

**测试工具**:
- Vitest
- @testing-library/react
- @testing-library/user-event

**覆盖率目标**:
- 语句覆盖率: > 80%
- 分支覆盖率: > 70%
- 函数覆盖率: > 90%

#### 5.2.2 集成测试

**测试范围**:
- 文档处理管道端到端
- 向量数据库集成
- 检索和问答流程
- API 端点集成

**测试方法**:
- Jest + Supertest（API 测试）
- 测试数据库（Weaviate Test Container）
- Mock 外部服务

#### 5.2.3 E2E 测试

**测试场景**:
1. 文档上传和解析
2. 知识库搜索
3. 智能问答
4. 引用追溯

**测试工具**:
- Playwright
- Playwright Test

**测试用例示例**:
```typescript
// 示例：文档上传测试
test('should upload and process document', async ({ page }) => {
  await page.goto('/knowledge');
  await page.click('button:has-text("上传文档")');
  await page.setInputFiles('input[type="file"]', 'test.pdf');
  await page.waitForSelector('text=解析完成');
  await expect(page.locator('.document-list')).toContainText('test.pdf');
});

// 示例：问答测试
test('should answer question with context', async ({ page }) => {
  await page.goto('/knowledge/chat');
  await page.fill('input[name="question"]', '什么是 RAG？');
  await page.click('button:has-text("提问")');
  await page.waitForSelector('.answer-content');
  await expect(page.locator('.sources')).toBeVisible();
});
```

#### 5.2.4 性能测试

**测试工具**:
- k6（负载测试）
- Lighthouse（前端性能）
- WebPageTest（页面加载）

**性能基准**:
- 文档解析: 10MB < 30s
- 嵌入生成: 100 个文档 < 10s
- 向量搜索: P95 < 500ms
- 问答响应: P95 < 2s

#### 5.2.5 安全测试

**测试工具**:
- OWASP ZAP
- Snyk（依赖扫描）
- SonarQube（代码质量）

**安全检查**:
- API 认证和授权
- 输入验证和清理
- XSS/CSRF 防护
- 依赖漏洞扫描
- 代码质量检查

### 5.3 监控和告警

#### 5.3.1 监控指标

**系统指标**:
- CPU/内存使用率
- API 响应时间
- 错误率
- 请求量

**业务指标**:
- 文档上传量
- 问答请求量
- 检索准确率（抽样）
- 用户满意度

#### 5.3.2 告警规则

| 指标 | 阈值 | 告警方式 |
|-----|------|---------|
| API 错误率 | > 5% | 邮件 + Telegram |
| 响应时间 P95 | > 2s | 邮件 |
| CPU 使用率 | > 80% | Telegram |
| 内存使用率 | > 85% | Telegram |
| API 配额 | < 20% | 邮件 |
| 检索准确率 | < 80% | 邮件 |

---

## 6. 代码架构图（文字描述）

### 6.1 整体模块关系

```
┌──────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ /api/documents  │  │  /api/knowledge │  │  /api/chat   │ │
│  │                 │  │                 │  │               │ │
│  │ - POST upload   │  │ - GET search    │  │ - POST ask   │ │
│  │ - GET list     │  │ - POST add      │  │ - GET stream │ │
│  │ - DELETE :id  │  │ - DELETE :id    │  │               │ │
│  └────────┬────────┘  └────────┬────────┘  └───────┬───────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ↓                    ↓                    ↓
┌──────────────────────────────────────────────────────────────────┐
│                     Service Layer                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   DocumentService                          ││
│  │  - parseDocument()  - chunkDocument()  - addToIndex()     ││
│  └─────────────────────────┬───────────────────────────────────┘│
│                            │                                     │
│  ┌─────────────────────────┼───────────────────────────────────┐│
│  │                   KnowledgeService                          ││
│  │  - search()  - addDocument()  - deleteDocument()          ││
│  └─────────────────────────┬───────────────────────────────────┘│
│                            │                                     │
│  ┌─────────────────────────┼───────────────────────────────────┐│
│  │                      RAGService                            ││
│  │  - ask()  - askStream()  - getSources()                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    Core Modules                                  │
│                                                                  │
│  ┌───────────────────┐  ┌───────────────────┐                   │
│  │DocumentProcessor │  │  VectorStore     │                   │
│  │                   │  │                   │                   │
│  │ - parse()        │  │ - addChunks()    │                   │
│  │ - chunk()        │  │ - search()       │                   │
│  │ - embed()        │  │ - delete()       │                   │
│  └───────────────────┘  └─────────┬─────────┘                   │
│                                  │                             │
│  ┌───────────────────┐           │                             │
│  │  SmartRetriever  │           │                             │
│  │                   │           │                             │
│  │ - retrieve()      │           │                             │
│  │ - rerank()       │           │                             │
│  └─────────┬─────────┘           │                             │
│            │                     │                             │
│  ┌─────────┴─────────┐  ┌───────┴─────────┐                   │
│  │      RAGQA        │  │  WeaviateClient│                   │
│  │                   │  │                   │                   │
│  │ - ask()          │  │ - query()       │                   │
│  │ - askStream()    │  │ - insert()      │                   │
│  │ - extractSources │  │ - delete()      │                   │
│  └───────────────────┘  └───────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 数据流

```
用户上传文档
     │
     ▼
┌─────────────────┐
│ DocumentService │
└────────┬────────┘
         │ parse()
         ▼
┌─────────────────────┐
│  DocumentProcessor │
│                     │
│ 1. 检测 MIME 类型  │
│ 2. 解析文档内容    │
│ 3. 分块处理       │
└────────┬────────────┘
         │ chunk()
         ▼
┌─────────────────────┐
│ 文本分块           │
│ (递归分块策略)     │
└────────┬────────────┘
         │ generateEmbeddings()
         ▼
┌─────────────────────┐
│  Embedding API     │
│ (OpenAI/Cohere)   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   VectorStore      │
│ (Weaviate/Pinecone)│
└────────┬────────────┘
         │ addChunks()
         ▼
┌─────────────────────┐
│ 索引存储完成       │
└─────────────────────┘


用户提问
     │
     ▼
┌─────────────────┐
│   RAGService   │
└────────┬────────┘
         │ ask()
         ▼
┌─────────────────────┐
│  SmartRetriever    │
│                     │
│ 1. 生成查询嵌入    │
│ 2. 向量搜索        │
│ 3. 关键词搜索      │
│ 4. RRF 融合        │
│ 5. 重排序          │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  获取 Top-K 结果    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│     RAGQA          │
│                     │
│ 1. 构建提示词      │
│ 2. 调用 LLM        │
│ 3. 提取引用        │
│ 4. 计算置信度      │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ 返回答案和引用      │
└─────────────────────┘
```

### 6.3 核心类图

```
IVectorStore (interface)
├── +initialize(): Promise<void>
├── +addChunks(chunks: DocumentChunk[]): Promise<void>
├── +deleteDocument(documentId: string): Promise<void>
├── +search(queryEmbedding: number[], topK: number, filters?: Record): Promise<VectorSearchResult[]>
├── +batchSearch(queryEmbeddings: number[][], topK: number, filters?: Record): Promise<VectorSearchResult[][]>
├── +getChunk(chunkId: string): Promise<DocumentChunk | null>
├── +getDocumentChunks(documentId: string): Promise<DocumentChunk[]>
└── +dropCollection(): Promise<void>
        ▲
        │
        ├──────────────────┐
        │                  │
WeaviateVectorStore   LocalVectorStore

DocumentProcessor
├── +parseDocument(file: File, mimeType: string, metadata?: Record): Promise<Document>
├── +chunkDocument(document: Document): Promise<DocumentChunk[]>
└── +generateEmbeddings(chunks: DocumentChunk[], model: string): Promise<DocumentChunk[]>

SmartRetriever
├── +retrieve(options: RetrievalOptions): Promise<HybridSearchResult[]>
├── -vectorSearch(embedding: number[], topK: number, filters?: Record): Promise<VectorSearchResult[]>
├── -keywordSearch(query: string, topK: number, filters?: Record): Promise<VectorSearchResult[]>
├── -reciprocalRankFusion(vectorResults: VectorSearchResult[], keywordResults: VectorSearchResult[]): HybridSearchResult[]
└── -rerankResults(query: string, results: HybridSearchResult[]): Promise<HybridSearchResult[]>

RAGQA
├── +ask(question: string, options?: RetrievalOptions): Promise<RAGAnswer>
├── +askStream(question: string, options?: RetrievalOptions): AsyncGenerator<string>
├── -buildPrompt(question: string, chunks: HybridSearchResult[]): string
├── -callLLM(prompt: string): Promise<{answer: string, usage?: Usage}>
├── -extractCitations(chunks: HybridSearchResult[]): Source[]
└── -calculateConfidence(chunks: HybridSearchResult[], answer: string): number

CitationTracer
├── +extractCitations(answer: string, sources: Source[]): string[]
├── +traceSourceChunks(answer: string, chunks: HybridSearchResult[]): TracedChunk[]
└── +generateCitationReport(answer: RAGAnswer): string
```

---

## 7. 总结与建议

### 7.1 总结

本技术方案对 7zi-frontend 项目 v1.14.0 的知识库 RAG 系统进行了全面分析，主要发现如下：

**优势**:
1. 已有完整的 RAG 系统架构设计和类型定义
2. 实现了核心算法（混合检索、RRF、重排序）
3. 文档解析和分块策略架构完善
4. 支持 Weaviate 和本地向量存储
5. 完整的 RAG 问答和引用追溯功能

**不足**:
1. 缺少实际的依赖包（weaviate-client、pdf-parse 等）
2. 文档解析器为占位实现
3. Pinecone/Qdrant 集成未完成
4. 缺少单元测试和集成测试
5. 知识图谱功能未实现

### 7.2 实施建议

**立即行动**（v1.14.0）:
1. 安装必要依赖包
2. 完成 Weaviate 集成
3. 实现 PDF/Word 文档解析
4. 添加单元测试覆盖
5. 部署到测试环境

**短期规划**（v1.15.0）:
1. 实现 Pinecone/Qdrant 集成
2. 优化检索算法
3. 添加语义分块
4. 实现文档版本管理

**长期规划**（v1.16+）:
1. 知识图谱集成
2. 多模态支持（图片、表格）
3. GraphRAG 集成
4. A/B 测试框架

### 7.3 关键成功因素

1. **准确率目标**: 检索准确率 > 85%，问答准确率 > 80%
2. **性能目标**: 检索响应 < 500ms，问答响应 < 2s
3. **可靠性目标**: 系统可用性 > 99.5%
4. **成本控制**: 月度运营成本 < $500

---

**报告完成**

- 创建时间: 2026-04-05
- 版本: v1.0
- 状态: 最终稿
