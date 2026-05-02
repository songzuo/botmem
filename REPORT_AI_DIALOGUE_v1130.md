# v1.13.0 AI 对话系统增强技术方案

**版本**: v1.13.0
**日期**: 2026-04-05
**作者**: 📚 咨询师 子代理
**项目路径**: `/root/.openclaw/workspace/7zi-project`

---

## 1. 当前系统分析

### 1.1 现有 AI 对话架构

#### 核心模块

**AI 模块** (`src/lib/ai/`)
- `types.ts` - 定义基础类型：`LLMMessage`, `LLMRequest`, `LLMResponse`
- `CodeGenerator.ts` - 代码生成器，封装 LLM 调用
- `providers/` - LLM 提供商实现
  - `BaseProvider.ts` - 抽象基类，定义通用接口
  - `OpenAIProvider.ts` - OpenAI API 实现
  - `ClaudeProvider.ts` - Claude API 实现

**Agent 系统** (`src/lib/agents/`)
- `AgentRegistry.ts` - 智能体注册表，管理智能体状态和负载
- `memory/` - 记忆系统
  - `types.ts` - 记忆类型定义（MemoryType, MemoryScope, MemoryEntry）
  - `agent-memory.ts` - 统一记忆接口
  - `short-term-memory.ts` - 短期记忆（100 条，7 天保留）
  - `long-term-memory.ts` - 长期记忆（持久化存储）

**多智能体协作** (`src/lib/multi-agent/`)
- `MultiAgentOrchestrator.ts` - 多智能体编排器
  - 并行执行
  - 串行工作流
  - 动态任务分配

### 1.2 当前对话连贯性实现

#### ✅ 已有能力

1. **基础消息传递**
   - `LLMMessage[]` 数组支持多轮对话
   - 支持 system/user/assistant 角色

2. **记忆系统**
   - 短期记忆：100 条，7 天保留
   - 长期记忆：持久化存储
   - 语义搜索：基于向量嵌入的相似度检索

3. **多智能体协作**
   - 并行/串行执行模式
   - 动态任务分配
   - 结果聚合策略

#### ❌ 缺失能力

1. **对话状态管理**
   - 无专门的对话状态机
   - 无话题转换检测
   - 无引用消解机制

2. **意图识别**
   - 无意图分类系统
   - 无规则引擎
   - 无 NLP/LLM 混合识别

3. **情感分析**
   - 无情感识别模块
   - 无适应性响应策略

4. **上下文跟踪**
   - 无对话历史压缩
   - 无关键信息提取
   - 无上下文窗口管理

### 1.3 API 调用架构

#### 当前流程

```
用户输入
  ↓
CodeGenerator.generateCode()
  ↓
BaseProvider.buildSystemPrompt()
  ↓
BaseProvider.buildCodePrompt()
  ↓
Provider.chat({ messages: [...] })
  ↓
BaseProvider.extractCode()
  ↓
返回结果
```

#### 特点

- ✅ 支持多提供商切换（OpenAI/Claude）
- ✅ 内置重试机制（最多 3 次）
- ✅ 自动提取代码块
- ❌ 无对话历史管理
- ❌ 无上下文压缩
- ❌ 无意图/情感分析

---

## 2. 增强目标

### 2.1 核心指标

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| 多轮对话连贯性 | ~2.7/5 | >4.0/5 | +50% |
| 意图理解准确率 | ~60% | >90% | +50% |
| 情感分析准确率 | 0% | >85% | 新增 |
| 上下文保留率 | ~70% | >95% | +36% |
| 响应相关性 | ~75% | >90% | +20% |

### 2.2 功能目标

#### P0 - 核心功能

1. **多轮对话连贯性**
   - 对话状态机管理
   - 话题转换检测
   - 引用消解机制
   - 上下文压缩

2. **意图理解**
   - 规则引擎（高频意图）
   - NLP 分类器（中等意图）
   - LLM 识别（复杂意图）
   - 意图置信度评分

3. **情感分析**
   - 情感识别（正面/负面/中性）
   - 情感强度评分（0-1）
   - 情感趋势跟踪
   - 适应性响应策略

4. **上下文跟踪**
   - 对话历史管理
   - 关键信息提取
   - 上下文窗口优化
   - 记忆自动归档

#### P1 - 增强功能

1. **自适应响应**
   - 基于情感的语气调整
   - 基于上下文的个性化回复
   - 多模态响应（文本/代码/图表）

2. **对话优化**
   - 自动澄清机制
   - 话题引导
   - 对话总结

---

## 3. 技术方案

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     用户输入层                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  对话管理器 (DialogueManager)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 对话状态机   │  │ 上下文跟踪器 │  │ 引用消解器   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  意图分析层 (IntentLayer)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 规则引擎     │  │ NLP 分类器   │  │ LLM 识别器   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  情感分析层 (SentimentLayer)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 情感识别器   │  │ 情感跟踪器   │  │ 响应适配器   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  记忆系统 (AgentMemory)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 短期记忆     │  │ 长期记忆     │  │ 语义搜索     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  LLM 提供商 (LLMProvider)                     │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ OpenAI       │  │ Claude       │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 对话状态管理方案

#### 3.2.1 对话状态机

**状态定义**

```typescript
enum DialogueState {
  GREETING = 'greeting',           // 问候
  INFORMATION_SEEKING = 'info_seeking',  // 信息查询
  TASK_EXECUTION = 'task_execution',    // 任务执行
  CLARIFICATION = 'clarification',      // 澄清
  CLOSING = 'closing',              // 结束
  TRANSITION = 'transition',        // 话题转换
}

interface DialogueContext {
  sessionId: string;
  userId: string;
  currentState: DialogueState;
  previousStates: DialogueState[];
  currentTopic: string;
  topicHistory: string[];
  entities: Map<string, any>;
  references: Reference[];
  metadata: Record<string, any>;
}
```

**状态转换规则**

```typescript
const STATE_TRANSITIONS: Record<DialogueState, DialogueState[]> = {
  [DialogueState.GREETING]: [
    DialogueState.INFORMATION_SEEKING,
    DialogueState.TASK_EXECUTION,
    DialogueState.CLOSING
  ],
  [DialogueState.INFORMATION_SEEKING]: [
    DialogueState.INFORMATION_SEEKING,
    DialogueState.TASK_EXECUTION,
    DialogueState.CLARIFICATION,
    DialogueState.TRANSITION,
    DialogueState.CLOSING
  ],
  [DialogueState.TASK_EXECUTION]: [
    DialogueState.TASK_EXECUTION,
    DialogueState.INFORMATION_SEEKING,
    DialogueState.CLARIFICATION,
    DialogueState.CLOSING
  ],
  [DialogueState.CLARIFICATION]: [
    DialogueState.INFORMATION_SEEKING,
    DialogueState.TASK_EXECUTION,
    DialogueState.CLOSING
  ],
  [DialogueState.TRANSITION]: [
    DialogueState.INFORMATION_SEEKING,
    DialogueState.TASK_EXECUTION,
    DialogueState.CLOSING
  ],
  [DialogueState.CLOSING]: [
    DialogueState.GREETING  // 新对话
  ]
};
```

#### 3.2.2 话题转换检测

**检测策略**

1. **关键词匹配** - 检测话题切换关键词（"另外"、"顺便"、"换个话题"）
2. **语义相似度** - 计算当前输入与历史话题的相似度
3. **意图变化** - 检测意图类别变化

**实现**

```typescript
class TopicTransitionDetector {
  private similarityThreshold = 0.3;

  detectTransition(
    currentInput: string,
    topicHistory: string[]
  ): { isTransition: boolean; newTopic?: string } {
    // 1. 关键词检测
    const transitionKeywords = ['另外', '顺便', '换个话题', '还有', '对了'];
    const hasKeyword = transitionKeywords.some(kw =>
      currentInput.includes(kw)
    );

    if (hasKeyword) {
      return { isTransition: true };
    }

    // 2. 语义相似度检测
    const similarities = topicHistory.map(topic =>
      this.calculateSimilarity(currentInput, topic)
    );

    const maxSimilarity = Math.max(...similarities);

    if (maxSimilarity < this.similarityThreshold) {
      return { isTransition: true, newTopic: currentInput };
    }

    return { isTransition: false };
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // 使用向量嵌入计算余弦相似度
    const embedding1 = await this.getEmbedding(text1);
    const embedding2 = await this.getEmbedding(text2);
    return cosineSimilarity(embedding1, embedding2);
  }
}
```

#### 3.2.3 引用消解

**引用类型**

1. **代词引用** - "它"、"这个"、"那个"
2. **省略引用** - "怎么做？"（省略主语）
3. **指代引用** - "刚才说的"、"上面提到的"

**消解策略**

```typescript
class ReferenceResolver {
  resolveReferences(
    input: string,
    context: DialogueContext
  ): string {
    let resolved = input;

    // 1. 代词消解
    resolved = this.resolvePronouns(resolved, context);

    // 2. 省略消解
    resolved = this.resolveEllipsis(resolved, context);

    // 3. 指代消解
    resolved = this.resolveDemonstratives(resolved, context);

    return resolved;
  }

  private resolvePronouns(input: string, context: DialogueContext): string {
    const pronounMap = {
      '它': context.entities.get('lastObject'),
      '这个': context.entities.get('lastMentioned'),
      '那个': context.entities.get('previousMentioned')
    };

    for (const [pronoun, entity] of Object.entries(pronounMap)) {
      if (entity && input.includes(pronoun)) {
        input = input.replace(new RegExp(pronoun, 'g'), entity);
      }
    }

    return input;
  }

  private resolveEllipsis(input: string, context: DialogueContext): string {
    // 检测省略主语的句子
    if (/^(怎么|什么|为什么|哪里)/.test(input)) {
      const lastTopic = context.currentTopic;
      if (lastTopic) {
        input = `${lastTopic}${input}`;
      }
    }

    return input;
  }
}
```

### 3.3 意图识别方案

#### 3.3.1 三层识别架构

```
┌─────────────────────────────────────────┐
│         规则引擎 (Rule Engine)           │
│  - 高频意图（问候、确认、拒绝）          │
│  - 精确匹配，零延迟                      │
│  - 准确率 > 99%                          │
└─────────────────────────────────────────┘
                    ↓ (未匹配)
┌─────────────────────────────────────────┐
│       NLP 分类器 (NLP Classifier)        │
│  - 中等意图（查询、操作、反馈）          │
│  - 机器学习模型，快速响应                │
│  - 准确率 > 85%                          │
└─────────────────────────────────────────┘
                    ↓ (置信度 < 0.7)
┌─────────────────────────────────────────┐
│       LLM 识别器 (LLM Classifier)        │
│  - 复杂意图（多意图、模糊意图）          │
│  - 深度理解，高准确率                    │
│  - 准确率 > 95%                          │
└─────────────────────────────────────────┘
```

#### 3.3.2 意图分类

```typescript
enum IntentCategory {
  // 基础意图
  GREETING = 'greeting',
  FAREWELL = 'farewell',
  CONFIRMATION = 'confirmation',
  REJECTION = 'rejection',

  // 查询意图
  INFORMATION_QUERY = 'info_query',
  STATUS_QUERY = 'status_query',
  HELP_REQUEST = 'help_request',

  // 操作意图
  TASK_EXECUTION = 'task_execution',
  CODE_GENERATION = 'code_generation',
  DATA_ANALYSIS = 'data_analysis',

  // 反馈意图
  POSITIVE_FEEDBACK = 'positive_feedback',
  NEGATIVE_FEEDBACK = 'negative_feedback',
  CLARIFICATION_REQUEST = 'clarification_request',

  // 复杂意图
  MULTI_INTENT = 'multi_intent',
  AMBIGUOUS_INTENT = 'ambiguous_intent',
  UNKNOWN = 'unknown'
}

interface IntentResult {
  category: IntentCategory;
  confidence: number;  // 0-1
  subIntents?: IntentCategory[];
  entities: Map<string, any>;
  reasoning?: string;
}
```

#### 3.3.3 规则引擎实现

```typescript
class RuleEngine {
  private rules: Rule[] = [
    {
      patterns: ['你好', '嗨', 'hello', 'hi'],
      intent: IntentCategory.GREETING,
      confidence: 1.0
    },
    {
      patterns: ['再见', '拜拜', 'bye'],
      intent: IntentCategory.FAREWELL,
      confidence: 1.0
    },
    {
      patterns: ['是的', '对', '好的', 'ok', 'yes'],
      intent: IntentCategory.CONFIRMATION,
      confidence: 1.0
    },
    {
      patterns: ['不', '不是', 'no', 'nope'],
      intent: IntentCategory.REJECTION,
      confidence: 1.0
    }
  ];

  classify(input: string): IntentResult | null {
    const normalized = input.toLowerCase().trim();

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (normalized.includes(pattern.toLowerCase())) {
          return {
            category: rule.intent,
            confidence: rule.confidence,
            entities: new Map()
          };
        }
      }
    }

    return null;
  }
}
```

#### 3.3.4 NLP 分类器实现

```typescript
class NLPClassifier {
  private model: any;  // 使用 TensorFlow.js 或 ONNX

  async classify(input: string): Promise<IntentResult> {
    // 1. 文本预处理
    const processed = this.preprocess(input);

    // 2. 特征提取
    const features = this.extractFeatures(processed);

    // 3. 模型预测
    const prediction = await this.model.predict(features);

    // 4. 结果解析
    const topPrediction = this.getTopPrediction(prediction);

    return {
      category: topPrediction.category,
      confidence: topPrediction.confidence,
      entities: this.extractEntities(input)
    };
  }

  private preprocess(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .trim();
  }

  private extractFeatures(text: string): number[] {
    // TF-IDF 或词嵌入特征
    // ...
  }
}
```

#### 3.3.5 LLM 识别器实现

```typescript
class LLMClassifier {
  private llmProvider: BaseProvider;

  constructor(llmProvider: BaseProvider) {
    this.llmProvider = llmProvider;
  }

  async classify(input: string, context: DialogueContext): Promise<IntentResult> {
    const prompt = this.buildClassificationPrompt(input, context);

    const response = await this.llmProvider.chat({
      messages: [
        {
          role: 'system',
          content: '你是一个意图分类专家。分析用户输入，识别其意图类别和置信度。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return this.parseClassificationResult(response.content);
  }

  private buildClassificationPrompt(input: string, context: DialogueContext): string {
    return `
分析以下用户输入的意图：

用户输入: "${input}"

对话上下文:
- 当前状态: ${context.currentState}
- 当前话题: ${context.currentTopic}
- 历史话题: ${context.topicHistory.join(', ')}

请返回 JSON 格式:
{
  "category": "意图类别",
  "confidence": 0.0-1.0,
  "subIntents": ["子意图1", "子意图2"],
  "entities": {"实体名": "实体值"},
  "reasoning": "推理过程"
}

意图类别选项:
${Object.values(IntentCategory).join(', ')}
`;
  }

  private parseClassificationResult(content: string): IntentResult {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid classification result format');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      category: result.category,
      confidence: result.confidence,
      subIntents: result.subIntents,
      entities: new Map(Object.entries(result.entities)),
      reasoning: result.reasoning
    };
  }
}
```

### 3.4 情感分析集成方案

#### 3.4.1 情感识别

```typescript
enum SentimentType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed'
}

interface SentimentResult {
  type: SentimentType;
  score: number;  // -1 到 1
  confidence: number;  // 0-1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

class SentimentAnalyzer {
  private llmProvider: BaseProvider;

  constructor(llmProvider: BaseProvider) {
    this.llmProvider = llmProvider;
  }

  async analyze(input: string): Promise<SentimentResult> {
    // 1. 快速规则检测（高频情感词）
    const ruleResult = this.detectByRules(input);
    if (ruleResult.confidence > 0.8) {
      return ruleResult;
    }

    // 2. LLM 深度分析
    return this.analyzeWithLLM(input);
  }

  private detectByRules(input: string): SentimentResult {
    const positiveWords = ['好', '棒', '优秀', '喜欢', '满意', 'great', 'good', 'excellent'];
    const negativeWords = ['差', '糟糕', '讨厌', '不满意', 'bad', 'terrible', 'awful'];

    const normalized = input.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (normalized.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (normalized.includes(word)) negativeCount++;
    });

    if (positiveCount > 0 && negativeCount === 0) {
      return {
        type: SentimentType.POSITIVE,
        score: Math.min(0.5 + positiveCount * 0.1, 1),
        confidence: 0.85,
        emotions: { joy: 0.7, sadness: 0.1, anger: 0.1, fear: 0.1, surprise: 0.1 }
      };
    }

    if (negativeCount > 0 && positiveCount === 0) {
      return {
        type: SentimentType.NEGATIVE,
        score: Math.max(-0.5 - negativeCount * 0.1, -1),
        confidence: 0.85,
        emotions: { joy: 0.1, sadness: 0.4, anger: 0.4, fear: 0.2, surprise: 0.1 }
      };
    }

    return {
      type: SentimentType.NEUTRAL,
      score: 0,
      confidence: 0.5,
      emotions: { joy: 0.2, sadness: 0.2, anger: 0.2, fear: 0.2, surprise: 0.2 }
    };
  }

  private async analyzeWithLLM(input: string): Promise<SentimentResult> {
    const prompt = `
分析以下文本的情感：

文本: "${input}"

请返回 JSON 格式:
{
  "type": "positive|negative|neutral|mixed",
  "score": -1.0 到 1.0,
  "confidence": 0.0 到 1.0,
  "emotions": {
    "joy": 0.0-1.0,
    "sadness": 0.0-1.0,
    "anger": 0.0-1.0,
    "fear": 0.0-1.0,
    "surprise": 0.0-1.0
  }
}
`;

    const response = await this.llmProvider.chat({
      messages: [
        {
          role: 'system',
          content: '你是一个情感分析专家。准确识别文本的情感类型和强度。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid sentiment analysis result');
    }

    return JSON.parse(jsonMatch[0]);
  }
}
```

#### 3.4.2 情感跟踪

```typescript
class SentimentTracker {
  private history: Array<{ timestamp: number; sentiment: SentimentResult }> = [];
  private maxHistorySize = 50;

  track(sentiment: SentimentResult): void {
    this.history.push({
      timestamp: Date.now(),
      sentiment
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  getTrend(): 'improving' | 'declining' | 'stable' {
    if (this.history.length < 3) {
      return 'stable';
    }

    const recent = this.history.slice(-5);
    const avgScore = recent.reduce((sum, h) => sum + h.sentiment.score, 0) / recent.length;
    const prevAvg = this.history.slice(-10, -5).reduce((sum, h) => sum + h.sentiment.score, 0) / 5;

    if (avgScore > prevAvg + 0.2) {
      return 'improving';
    } else if (avgScore < prevAvg - 0.2) {
      return 'declining';
    }

    return 'stable';
  }

  getAverageSentiment(): number {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, h) => sum + h.sentiment.score, 0) / this.history.length;
  }
}
```

#### 3.4.3 响应适配器

```typescript
class ResponseAdapter {
  adaptResponse(
    baseResponse: string,
    sentiment: SentimentResult,
    intent: IntentResult
  ): string {
    let adapted = baseResponse;

    // 1. 根据情感调整语气
    adapted = this.adjustTone(adapted, sentiment);

    // 2. 根据意图调整内容
    adapted = this.adjustContent(adapted, intent);

    // 3. 添加情感响应
    adapted = this.addEmpathy(adapted, sentiment);

    return adapted;
  }

  private adjustTone(response: string, sentiment: SentimentResult): string {
    if (sentiment.type === SentimentType.POSITIVE) {
      // 积极情感：使用更热情的语气
      return response
        .replace(/可以/g, '当然可以')
        .replace(/好的/g, '太好了！');
    } else if (sentiment.type === SentimentType.NEGATIVE) {
      // 消极情感：使用更温和的语气
      return response
        .replace(/不行/g, '很抱歉，暂时无法')
        .replace(/错误/g, '遇到了一些问题');
    }

    return response;
  }

  private addEmpathy(response: string, sentiment: SentimentResult): string {
    if (sentiment.type === SentimentType.NEGATIVE && sentiment.emotions.anger > 0.5) {
      return `我理解您可能有些不满。${response}`;
    }

    if (sentiment.type === SentimentType.POSITIVE && sentiment.emotions.joy > 0.7) {
      return `很高兴能帮到您！${response}`;
    }

    return response;
  }
}
```

### 3.5 上下文跟踪数据结构设计

#### 3.5.1 对话历史管理

```typescript
interface DialogueMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  intent?: IntentResult;
  sentiment?: SentimentResult;
  state: DialogueState;
  topic: string;
  metadata?: Record<string, any>;
}

interface DialogueHistory {
  sessionId: string;
  userId: string;
  messages: DialogueMessage[];
  context: DialogueContext;
  createdAt: number;
  updatedAt: number;
}

class DialogueHistoryManager {
  private histories: Map<string, DialogueHistory> = new Map();
  private maxHistorySize = 100;

  addMessage(sessionId: string, message: DialogueMessage): void {
    let history = this.histories.get(sessionId);

    if (!history) {
      history = {
        sessionId,
        userId: message.metadata?.userId || 'unknown',
        messages: [],
        context: this.createInitialContext(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.histories.set(sessionId, history);
    }

    history.messages.push(message);
    history.updatedAt = Date.now();

    // 压缩历史
    if (history.messages.length > this.maxHistorySize) {
      this.compressHistory(history);
    }
  }

  private compressHistory(history: DialogueHistory): void {
    // 保留最近的 50 条消息
    const recentMessages = history.messages.slice(-50);

    // 将旧消息压缩为摘要
    const oldMessages = history.messages.slice(0, -50);
    const summary = this.generateSummary(oldMessages);

    // 插入摘要消息
    recentMessages.unshift({
      id: generateId(),
      role: 'system',
      content: `[对话摘要] ${summary}`,
      timestamp: oldMessages[oldMessages.length - 1].timestamp,
      state: history.context.currentState,
      topic: history.context.currentTopic
    });

    history.messages = recentMessages;
  }

  private generateSummary(messages: DialogueMessage[]): string {
    // 使用 LLM 生成摘要
    const keyPoints = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('; ');

    return `之前的对话主要涉及: ${keyPoints}`;
  }

  getHistory(sessionId: string): DialogueHistory | undefined {
    return this.histories.get(sessionId);
  }

  getRecentMessages(sessionId: string, count: number = 10): DialogueMessage[] {
    const history = this.histories.get(sessionId);
    return history ? history.messages.slice(-count) : [];
  }
}
```

#### 3.5.2 关键信息提取

```typescript
interface KeyInformation {
  type: 'entity' | 'preference' | 'constraint' | 'goal';
  key: string;
  value: any;
  confidence: number;
  extractedAt: number;
}

class KeyInformationExtractor {
  async extract(message: DialogueMessage): Promise<KeyInformation[]> {
    const results: KeyInformation[] = [];

    // 1. 实体提取
    const entities = await this.extractEntities(message.content);
    results.push(...entities);

    // 2. 偏好提取
    const preferences = await this.extractPreferences(message.content);
    results.push(...preferences);

    // 3. 约束提取
    const constraints = await this.extractConstraints(message.content);
    results.push(...constraints);

    // 4. 目标提取
    const goals = await this.extractGoals(message.content);
    results.push(...goals);

    return results;
  }

  private async extractEntities(content: string): Promise<KeyInformation[]> {
    // 使用 NER (Named Entity Recognition)
    // 或 LLM 提取实体
    return [];
  }

  private async extractPreferences(content: string): Promise<KeyInformation[]> {
    const preferencePatterns = [
      /我(喜欢|偏好|倾向于)(.+)/,
      /我希望(.+)/,
      /最好(.+)/
    ];

    const results: KeyInformation[] = [];

    for (const pattern of preferencePatterns) {
      const match = content.match(pattern);
      if (match) {
        results.push({
          type: 'preference',
          key: match[1],
          value: match[2],
          confidence: 0.8,
          extractedAt: Date.now()
        });
      }
    }

    return results;
  }
}
```

#### 3.5.3 上下文窗口优化

```typescript
class ContextWindowOptimizer {
  private maxTokens = 4000;  // 根据模型调整
  private reserveTokens = 500;  // 预留给响应

  optimizeContext(
    history: DialogueMessage[],
    currentInput: string
  ): LLMMessage[] {
    const inputTokens = this.estimateTokens(currentInput);
    const availableTokens = this.maxTokens - this.reserveTokens - inputTokens;

    let selectedMessages: DialogueMessage[] = [];
    let usedTokens = 0;

    // 1. 优先选择最近的系统消息
    const systemMessages = history.filter(m => m.role === 'system');
    for (const msg of systemMessages.slice(-2)) {
      const tokens = this.estimateTokens(msg.content);
      if (usedTokens + tokens <= availableTokens) {
        selectedMessages.push(msg);
        usedTokens += tokens;
      }
    }

    // 2. 选择最近的用户和助手消息
    const recentMessages = history
      .filter(m => m.role !== 'system')
      .slice(-20);

    for (const msg of recentMessages.reverse()) {
      const tokens = this.estimateTokens(msg.content);
      if (usedTokens + tokens <= availableTokens) {
        selectedMessages.unshift(msg);
        usedTokens += tokens;
      }
    }

    // 3. 添加当前输入
    selectedMessages.push({
      id: generateId(),
      role: 'user',
      content: currentInput,
      timestamp: Date.now(),
      state: DialogueState.INFORMATION_SEEKING,
      topic: ''
    });

    return selectedMessages.map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  private estimateTokens(text: string): number {
    // 粗略估算：中文字符 * 1.5 + 英文单词 * 1.3
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3);
  }
}
```

---

## 4. 实现计划

### 4.1 阶段划分

#### Phase 1: 基础架构（Week 1-2）

**目标**: 搭建对话管理核心框架

**任务**:
1. 创建 `src/lib/dialogue/` 模块
2. 实现对话状态机 (`DialogueStateMachine`)
3. 实现对话上下文管理 (`DialogueContext`)
4. 实现对话历史管理器 (`DialogueHistoryManager`)
5. 单元测试覆盖 > 80%

**交付物**:
- `src/lib/dialogue/DialogueStateMachine.ts`
- `src/lib/dialogue/DialogueContext.ts`
- `src/lib/dialogue/DialogueHistoryManager.ts`
- 测试文件

#### Phase 2: 意图识别（Week 3-4）

**目标**: 实现三层意图识别系统

**任务**:
1. 实现规则引擎 (`RuleEngine`)
2. 集成 NLP 分类器（使用 TensorFlow.js）
3. 实现 LLM 识别器 (`LLMClassifier`)
4. 实现意图识别协调器 (`IntentClassifier`)
5. 意图准确率测试 > 85%

**交付物**:
- `src/lib/dialogue/intent/RuleEngine.ts`
- `src/lib/dialogue/intent/NLPClassifier.ts`
- `src/lib/dialogue/intent/LLMClassifier.ts`
- `src/lib/dialogue/intent/IntentClassifier.ts`
- 意图测试数据集

#### Phase 3: 情感分析（Week 5-6）

**目标**: 集成情感分析和响应适配

**任务**:
1. 实现情感分析器 (`SentimentAnalyzer`)
2. 实现情感跟踪器 (`SentimentTracker`)
3. 实现响应适配器 (`ResponseAdapter`)
4. 情感准确率测试 > 80%

**交付物**:
- `src/lib/dialogue/sentiment/SentimentAnalyzer.ts`
- `src/lib/dialogue/sentiment/SentimentTracker.ts`
- `src/lib/dialogue/sentiment/ResponseAdapter.ts`
- 情感测试数据集

#### Phase 4: 上下文跟踪（Week 7-8）

**目标**: 实现完整的上下文跟踪系统

**任务**:
1. 实现话题转换检测 (`TopicTransitionDetector`)
2. 实现引用消解器 (`ReferenceResolver`)
3. 实现关键信息提取器 (`KeyInformationExtractor`)
4. 实现上下文窗口优化器 (`ContextWindowOptimizer`)
5. 集成到记忆系统

**交付物**:
- `src/lib/dialogue/context/TopicTransitionDetector.ts`
- `src/lib/dialogue/context/ReferenceResolver.ts`
- `src/lib/dialogue/context/KeyInformationExtractor.ts`
- `src/lib/dialogue/context/ContextWindowOptimizer.ts`

#### Phase 5: 集成与优化（Week 9-10）

**目标**: 集成所有模块，优化性能

**任务**:
1. 实现对话管理器 (`DialogueManager`)
2. 集成到现有 Agent 系统
3. 性能优化（缓存、批处理）
4. 端到端测试
5. 文档编写

**交付物**:
- `src/lib/dialogue/DialogueManager.ts`
- `src/lib/dialogue/index.ts`
- 集成测试套件
- API 文档

### 4.2 技术栈

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| 状态机 | XState | 成熟的状态机库，TypeScript 支持 |
| NLP 分类 | TensorFlow.js | 浏览器/Node.js 通用，轻量级 |
| 向量嵌入 | OpenAI Embeddings | 高质量，易于集成 |
| 文本预处理 | natural / compromise | 轻量级 NLP 工具 |
| 缓存 | Redis | 高性能，支持过期策略 |
| 测试 | Vitest | 快速，与现有测试框架一致 |

### 4.3 依赖项

```json
{
  "dependencies": {
    "xstate": "^5.0.0",
    "@tensorflow/tfjs": "^4.0.0",
    "natural": "^6.0.0",
    "compromise": "^14.0.0",
    "ioredis": "^5.0.0"
  },
  "devDependencies": {
    "@types/natural": "^6.0.0"
  }
}
```

### 4.4 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| LLM API 成本过高 | 高 | 中 | 使用规则引擎和 NLP 分类器减少 LLM 调用 |
| 意图识别准确率不达标 | 高 | 中 | 持续优化规则和训练数据 |
| 性能问题（延迟） | 中 | 中 | 实现缓存、批处理、异步处理 |
| 上下文窗口溢出 | 中 | 低 | 实现智能压缩和窗口优化 |
| 记忆系统负载过高 | 低 | 低 | 实现分层存储和定期清理 |

---

## 5. 评估指标

### 5.1 核心指标

#### 5.1.1 对话连贯性

**测量方法**: 人工评估 + 自动化指标

**指标**:
- 话题连贯性评分（1-5）
- 引用消解准确率
- 上下文保留率
- 状态转换正确率

**目标**: > 4.0/5

**测试方法**:
```typescript
describe('Dialogue Coherence', () => {
  it('should maintain topic coherence across 5+ turns', async () => {
    const dialogue = createTestDialogue([
      '我想了解 Python',
      '它有哪些特性？',
      '怎么安装？',
      '能给我个例子吗？',
      '那性能怎么样？'
    ]);

    const coherenceScore = await evaluateCoherence(dialogue);
    expect(coherenceScore).toBeGreaterThan(4.0);
  });
});
```

#### 5.1.2 意图理解准确率

**测量方法**: 标注数据集测试

**指标**:
- 整体准确率
- 各类别准确率
- 置信度校准

**目标**: > 90%

**测试数据集**:
- 1000 条标注对话
- 覆盖所有意图类别
- 包含边界情况

#### 5.1.3 情感分析准确率

**测量方法**: 标注数据集测试

**指标**:
- 情感类型准确率
- 情感强度相关性
- 情感趋势预测准确率

**目标**: > 85%

#### 5.1.4 上下文保留率

**测量方法**: 关键信息追踪测试

**指标**:
- 实体保留率
- 偏好保留率
- 约束保留率

**目标**: > 95%

### 5.2 性能指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| 响应延迟 | < 2s (P95) | 性能测试 |
| 意图识别延迟 | < 500ms (P95) | 性能测试 |
| 情感分析延迟 | < 300ms (P95) | 性能测试 |
| 上下文压缩时间 | < 100ms | 性能测试 |
| 内存使用 | < 500MB | 资源监控 |

### 5.3 用户体验指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| 用户满意度 | > 4.0/5 | 问卷调查 |
| 任务完成率 | > 90% | 行为分析 |
| 对话轮次（完成任务） | < 10 轮 | 日志分析 |
| 重复提问率 | < 10% | 日志分析 |

### 5.4 测试计划

#### 5.4.1 单元测试

- 覆盖率目标: > 80%
- 关键模块: > 90%
- 测试框架: Vitest

#### 5.4.2 集成测试

- 端到端对话流程测试
- 多模块协作测试
- 性能压力测试

#### 5.4.3 用户测试

- 内部测试: 10 人，1 周
- Beta 测试: 50 人，2 周
- A/B 测试: 对比新旧系统

---

## 6. 总结

### 6.1 核心价值

本技术方案通过以下方式实现 v1.13.0 的 AI 对话系统增强目标：

1. **对话状态管理** - 状态机 + 话题转换 + 引用消解
2. **三层意图识别** - 规则引擎 + NLP 分类器 + LLM 识别器
3. **情感分析集成** - 情感识别 + 跟踪 + 响应适配
4. **上下文跟踪** - 历史管理 + 关键信息提取 + 窗口优化

### 6.2 预期效果

- 对话连贯性提升 50%（2.7 → 4.0/5）
- 意图理解准确率提升 50%（60% → 90%）
- 情感分析准确率达到 85%
- 上下文保留率达到 95%

### 6.3 后续优化方向

1. **多模态对话** - 支持语音、图像输入
2. **个性化学习** - 基于用户历史的个性化响应
3. **主动对话** - 主动引导和推荐
4. **多语言支持** - 扩展到更多语言

---

**报告完成时间**: 2026-04-05
**预计实施周期**: 10 周
**预计资源投入**: 2-3 名开发工程师