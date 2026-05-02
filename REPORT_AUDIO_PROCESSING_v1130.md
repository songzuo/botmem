# v1.13.0 音频处理能力技术方案

**版本**: v1.13.0
**日期**: 2026-04-05
**负责人**: 🌟 智能体世界专家 子代理
**项目路径**: `/root/.openclaw/workspace/7zi-project`

---

## 1. 技术选型

### 1.1 STT (语音转文字) API 对比

| API | 准确率 | 实时支持 | 多语言 | 说话人分离 | 成本 | 推荐度 |
|-----|--------|----------|--------|------------|------|--------|
| **OpenAI Whisper** | 95%+ | ✅ (流式) | ✅ (99种) | ❌ (需额外处理) | 低 | ⭐⭐⭐⭐⭐ |
| **Google Speech-to-Text** | 95%+ | ✅ (流式) | ✅ (125种) | ✅ (Speaker Diarization) | 中 | ⭐⭐⭐⭐ |
| **Azure Speech Service** | 95%+ | ✅ (流式) | ✅ (100种) | ✅ (Speaker Identification) | 中 | ⭐⭐⭐⭐ |
| **阿里云智能语音** | 94%+ | ✅ (实时) | ✅ (中英为主) | ✅ (声纹识别) | 低 | ⭐⭐⭐⭐ |
| **腾讯云语音识别** | 94%+ | ✅ (实时) | ✅ (中英为主) | ✅ (说话人分离) | 低 | ⭐⭐⭐⭐ |

### 1.2 推荐方案

#### **主选方案: OpenAI Whisper API**

**优势:**
- ✅ 准确率最高 (95%+)
- ✅ 支持流式处理 (WebSocket)
- ✅ 多语言支持 (99种语言，包括中英文)
- ✅ 成本低廉 ($0.006/分钟)
- ✅ API 简单易用
- ✅ 社区生态成熟

**劣势:**
- ❌ 原生不支持说话人分离 (需额外处理)
- ❌ 需要网络连接

**解决方案:**
- 说话人分离使用 **pyannote.audio** 或 **Google Speech-to-Text** 的 Diarization 功能
- 会议摘要使用现有 LLM (OpenAI/Claude) 生成

#### **备选方案: Google Speech-to-Text**

**优势:**
- ✅ 原生支持说话人分离 (Speaker Diarization)
- ✅ 实时流式处理
- ✅ 多语言支持 (125种)
- ✅ 准确率高 (95%+)

**劣势:**
- ❌ 成本较高 ($0.024/分钟)
- ❌ API 复杂度较高

### 1.3 说话人分离方案

| 方案 | 准确率 | 实时支持 | 成本 | 推荐度 |
|-----|--------|----------|------|--------|
| **pyannote.audio** | 90%+ | ❌ (离线) | 免费 | ⭐⭐⭐⭐⭐ |
| **Google Diarization** | 92%+ | ✅ | 中 | ⭐⭐⭐⭐ |
| **Azure Speaker ID** | 93%+ | ✅ | 中 | ⭐⭐⭐⭐ |
| **阿里云声纹识别** | 90%+ | ✅ | 低 | ⭐⭐⭐⭐ |

**推荐: pyannote.audio (离线) + Whisper (在线)**
- Whisper 处理 STT
- pyannote.audio 处理说话人分离
- 成本最低，准确率最高

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     7zi Multi-Agent System                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Audio Processing Module                     │
│  (新增模块: src/lib/audio/)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  WebSocket Server (实时音频流)                       │    │
│  │  - 音频流接收                                        │    │
│  │  - 实时转录推送                                      │    │
│  │  - 会话管理                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                                │
│                              ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  STT Service (语音转文字)                            │    │
│  │  - Whisper API (实时/批量)                          │    │
│  │  - Google Speech (备选)                             │    │
│  │  - 阿里云/腾讯云 (备选)                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                                │
│                              ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Speaker Diarization (说话人分离)                    │    │
│  │  - pyannote.audio (离线)                            │    │
│  │  - Google Diarization (实时)                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                                │
│                              ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Meeting Summarizer (会议摘要)                       │    │
│  │  - 使用现有 LLM Provider                            │    │
│  │  - 生成会议纪要                                      │    │
│  │  - 提取行动项                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                                │
│                              ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Voice Command Parser (语音指令解析)                 │    │
│  │  - NLP 意图识别                                      │    │
│  │  - 参数提取                                          │    │
│  │  - 与 Multi-Agent 集成                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块结构

```
src/lib/audio/
├── index.ts                      # 导出所有模块
├── types.ts                      # 类型定义
├── stt/
│   ├── index.ts                  # STT 服务入口
│   ├── WhisperSTT.ts             # Whisper API 实现
│   ├── GoogleSTT.ts              # Google Speech 实现
│   ├── AliyunSTT.ts              # 阿里云实现
│   └── TencentSTT.ts             # 腾讯云实现
├── diarization/
│   ├── index.ts                  # 说话人分离入口
│   ├── PyannoteDiarization.ts    # pyannote.audio 实现
│   └── GoogleDiarization.ts      # Google Diarization 实现
├── realtime/
│   ├── index.ts                  # 实时处理入口
│   ├── WebSocketServer.ts        # WebSocket 服务器
│   ├── AudioStreamProcessor.ts   # 音频流处理器
│   └── StreamBuffer.ts           # 流缓冲区
├── summarization/
│   ├── index.ts                  # 会议摘要入口
│   ├── MeetingSummarizer.ts      # 会议摘要生成器
│   └── ActionItemExtractor.ts    # 行动项提取器
├── command/
│   ├── index.ts                  # 语音指令入口
│   ├── VoiceCommandParser.ts     # 语音指令解析器
│   └── IntentRecognizer.ts       # 意图识别器
└── utils/
    ├── AudioConverter.ts         # 音频格式转换
    ├── AudioValidator.ts         # 音频验证
    └── TextPostProcessor.ts      # 文本后处理
```

### 2.3 数据流

#### 实时转录流程

```
客户端 (WebSocket)
    │
    ├─ 1. 连接建立
    │
    ├─ 2. 发送音频流 (PCM/WAV)
    │
    ▼
WebSocketServer
    │
    ├─ 3. 接收音频数据
    │
    ├─ 4. 缓冲区累积 (VAD 检测)
    │
    ▼
AudioStreamProcessor
    │
    ├─ 5. 格式转换 (PCM → WAV)
    │
    ├─ 6. 调用 STT API (Whisper)
    │
    ▼
STT Service
    │
    ├─ 7. 返回转录文本
    │
    ├─ 8. 实时推送给客户端
    │
    ▼
客户端 (显示转录结果)
```

#### 批量处理流程

```
上传音频文件
    │
    ├─ 1. 文件验证
    │
    ├─ 2. 格式转换
    │
    ▼
STT Service (批量模式)
    │
    ├─ 3. 完整音频转录
    │
    ├─ 4. 说话人分离 (可选)
    │
    ▼
Meeting Summarizer
    │
    ├─ 5. 生成会议摘要
    │
    ├─ 6. 提取行动项
    │
    ▼
返回完整结果
```

---

## 3. 实现方案

### 3.1 阶段一: 基础 STT 能力 (P0 - Week 1-2)

**目标**: 实现基本的语音转文字功能

**任务**:
1. 创建 `src/lib/audio/` 目录结构
2. 实现 WhisperSTT 服务
3. 实现批量音频转录
4. 添加音频格式转换工具
5. 编写单元测试

**代码示例**:

```typescript
// src/lib/audio/stt/WhisperSTT.ts
import { LLMProvider } from '../../ai/types';

export interface WhisperConfig {
  apiKey: string;
  model?: 'whisper-1' | 'whisper-large-v3';
  language?: string; // 'zh', 'en', 'auto'
  temperature?: number;
}

export interface STTRequest {
  audioFile: Buffer | string; // 文件路径或 Buffer
  language?: string;
  format?: 'wav' | 'mp3' | 'm4a' | 'flac';
}

export interface STTResponse {
  text: string;
  language: string;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export class WhisperSTT {
  private config: WhisperConfig;

  constructor(config: WhisperConfig) {
    this.config = {
      model: 'whisper-1',
      language: 'auto',
      temperature: 0,
      ...config
    };
  }

  async transcribe(request: STTRequest): Promise<STTResponse> {
    // 实现 Whisper API 调用
    // 返回转录结果
  }

  async transcribeBatch(requests: STTRequest[]): Promise<STTResponse[]> {
    // 批量处理
  }
}
```

### 3.2 阶段二: 实时转录流 (P0 - Week 3-4)

**目标**: 实现 WebSocket 实时音频流处理

**任务**:
1. 实现 WebSocketServer
2. 实现 AudioStreamProcessor
3. 实现 VAD (Voice Activity Detection)
4. 实现实时转录推送
5. 添加流式测试

**代码示例**:

```typescript
// src/lib/audio/realtime/WebSocketServer.ts
import { WebSocketServer as WS } from 'ws';
import { AudioStreamProcessor } from './AudioStreamProcessor';

export interface WebSocketConfig {
  port: number;
  path?: string;
}

export class AudioWebSocketServer {
  private server: WS;
  private processor: AudioStreamProcessor;

  constructor(config: WebSocketConfig) {
    this.server = new WS({ port: config.port, path: config.path });
    this.processor = new AudioStreamProcessor();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', async (data) => {
        // 处理音频数据
        const result = await this.processor.processAudio(data);
        ws.send(JSON.stringify(result));
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  start() {
    console.log(`WebSocket server started on port ${this.server.options.port}`);
  }
}
```

### 3.3 阶段三: 说话人分离 (P1 - Week 5-6)

**目标**: 实现多说话人识别和标记

**任务**:
1. 集成 pyannote.audio (Python 子进程)
2. 或使用 Google Diarization API
3. 实现说话人标记
4. 添加说话人分离测试

**代码示例**:

```typescript
// src/lib/audio/diarization/PyannoteDiarization.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DiarizationRequest {
  audioFile: string;
  numSpeakers?: number;
}

export interface DiarizationSegment {
  start: number;
  end: number;
  speaker: string;
}

export interface DiarizationResponse {
  segments: DiarizationSegment[];
  numSpeakers: number;
}

export class PyannoteDiarization {
  private pythonScript: string;

  constructor(pythonScript: string) {
    this.pythonScript = pythonScript;
  }

  async diarize(request: DiarizationRequest): Promise<DiarizationResponse> {
    const command = `python ${this.pythonScript} ${request.audioFile}`;
    const { stdout } = await execAsync(command);
    return JSON.parse(stdout);
  }
}
```

### 3.4 阶段四: 会议摘要 (P0 - Week 7)

**目标**: 自动生成会议纪要和行动项

**任务**:
1. 实现会议摘要生成器
2. 实现行动项提取器
3. 集成现有 LLM Provider
4. 添加摘要测试

**代码示例**:

```typescript
// src/lib/audio/summarization/MeetingSummarizer.ts
import { CodeGenerator } from '../../ai/CodeGenerator';

export interface MeetingSummaryRequest {
  transcript: string;
  speakers?: Record<string, string>; // 说话人映射
}

export interface MeetingSummary {
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  participants: string[];
  duration: number;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
}

export class MeetingSummarizer {
  private llm: CodeGenerator;

  constructor(llm: CodeGenerator) {
    this.llm = llm;
  }

  async summarize(request: MeetingSummaryRequest): Promise<MeetingSummary> {
    const prompt = this.buildPrompt(request.transcript);
    const response = await this.llm.generate({
      prompt,
      language: 'zh',
      requirements: [
        '生成会议摘要',
        '提取关键要点',
        '识别行动项',
        '标注负责人和截止日期'
      ]
    });

    return this.parseResponse(response);
  }

  private buildPrompt(transcript: string): string {
    return `
请分析以下会议转录内容，生成结构化的会议摘要：

${transcript}

请按以下格式输出：
1. 会议标题
2. 会议摘要 (200-300字)
3. 关键要点 (3-5条)
4. 行动项 (任务、负责人、截止日期、优先级)
5. 参与人员
`;
  }

  private parseResponse(response: string): MeetingSummary {
    // 解析 LLM 返回的 JSON
    return JSON.parse(response);
  }
}
```

### 3.5 阶段五: 语音指令解析 (P1 - Week 8)

**目标**: 自然语言语音指令理解

**任务**:
1. 实现意图识别器
2. 实现参数提取器
3. 集成 Multi-Agent 系统
4. 添加指令测试

**代码示例**:

```typescript
// src/lib/audio/command/VoiceCommandParser.ts
import { IntentRecognizer } from './IntentRecognizer';

export interface VoiceCommand {
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface ParsedCommand {
  command: VoiceCommand;
  originalText: string;
}

export class VoiceCommandParser {
  private intentRecognizer: IntentRecognizer;

  constructor() {
    this.intentRecognizer = new IntentRecognizer();
  }

  async parse(text: string): Promise<ParsedCommand> {
    const command = await this.intentRecognizer.recognize(text);
    return {
      command,
      originalText: text
    };
  }

  async execute(command: VoiceCommand) {
    // 集成到 Multi-Agent 系统
    // 根据意图调用相应的 Agent
  }
}
```

---

## 4. 依赖清单

### 4.1 Node.js 依赖

```json
{
  "dependencies": {
    // WebSocket
    "ws": "^8.16.0",
    "@types/ws": "^8.5.10",

    // 音频处理
    "fluent-ffmpeg": "^2.1.2",
    "@types/fluent-ffmpeg": "^2.1.24",

    // 文件处理
    "form-data": "^4.0.0",
    "@types/form-data": "^4.0.0",

    // OpenAI SDK
    "openai": "^4.28.0",

    // 工具库
    "uuid": "^9.0.1",
    "@types/uuid": "^9.0.8"
  }
}
```

### 4.2 Python 依赖 (说话人分离)

```bash
# requirements.txt
pyannote.audio==3.1.1
torch>=2.0.0
torchaudio>=2.0.0
pyyaml>=6.0
```

### 4.3 系统依赖

```bash
# FFmpeg (音频转换)
sudo apt-get install ffmpeg

# Python 3.10+
sudo apt-get install python3.10 python3-pip
```

### 4.4 API 密钥

需要配置以下环境变量:

```bash
# OpenAI API (Whisper)
OPENAI_API_KEY=sk-...

# Google Speech (备选)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# 阿里云 (备选)
ALIYUN_ACCESS_KEY_ID=...
ALIYUN_ACCESS_KEY_SECRET=...

# 腾讯云 (备选)
TENCENT_SECRET_ID=...
TENCENT_SECRET_KEY=...
```

---

## 5. 开发计划

### 5.1 时间线 (8周)

| 阶段 | 任务 | 周期 | 优先级 | 负责人 |
|-----|------|------|--------|--------|
| **阶段一** | 基础 STT 能力 | Week 1-2 | P0 | ⚡ Executor |
| **阶段二** | 实时转录流 | Week 3-4 | P0 | ⚡ Executor |
| **阶段三** | 说话人分离 | Week 5-6 | P1 | ⚡ Executor |
| **阶段四** | 会议摘要 | Week 7 | P0 | 📚 咨询师 |
| **阶段五** | 语音指令解析 | Week 8 | P1 | 📚 咨询师 |
| **测试** | 集成测试 | Week 8 | P0 | 🧪 测试员 |
| **文档** | API 文档 | Week 8 | P0 | 🏗️ 架构师 |

### 5.2 里程碑

- **Week 2**: ✅ 基础 STT 功能可用
- **Week 4**: ✅ 实时转录流可用
- **Week 6**: ✅ 说话人分离可用
- **Week 7**: ✅ 会议摘要生成可用
- **Week 8**: ✅ 语音指令解析可用
- **Week 8**: ✅ v1.13.0 发布

### 5.3 交付物

1. **代码模块**
   - `src/lib/audio/` 完整实现
   - 单元测试覆盖率 >80%
   - 集成测试通过

2. **文档**
   - API 文档 (`docs/audio-processing.md`)
   - 使用指南 (`docs/audio-usage.md`)
   - 部署指南 (`docs/audio-deployment.md`)

3. **示例**
   - 实时转录示例
   - 批量处理示例
   - 会议摘要示例

---

## 6. 风险评估

### 6.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|----------|
| **Whisper API 准确率不达标** | 高 | 中 | 备选 Google/Azure API |
| **实时转录延迟过高** | 高 | 中 | 优化缓冲策略，使用流式 API |
| **说话人分离准确率低** | 中 | 中 | 使用 pyannote.audio (离线) 或 Google Diarization |
| **WebSocket 连接不稳定** | 中 | 低 | 实现重连机制，心跳检测 |
| **音频格式兼容性问题** | 低 | 中 | 使用 FFmpeg 统一转换 |

### 6.2 成本风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|----------|
| **API 调用成本过高** | 中 | 中 | 使用 Whisper (低成本)，批量处理优化 |
| **存储成本增加** | 低 | 低 | 定期清理临时文件，压缩存储 |

### 6.3 集成风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|----------|
| **与现有系统冲突** | 中 | 低 | 模块化设计，独立部署 |
| **Python 子进程管理复杂** | 中 | 中 | 使用进程池，监控子进程健康 |

### 6.4 安全风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|----------|
| **音频数据泄露** | 高 | 低 | 加密传输，权限控制 |
| **API 密钥泄露** | 高 | 低 | 环境变量，密钥轮换 |

---

## 7. 总结

### 7.1 推荐技术栈

- **STT**: OpenAI Whisper API (主选) + Google Speech (备选)
- **说话人分离**: pyannote.audio (离线) + Google Diarization (实时)
- **实时流**: WebSocket + Node.js
- **会议摘要**: 现有 LLM Provider (OpenAI/Claude)
- **语音指令**: NLP 意图识别 + Multi-Agent 集成

### 7.2 工作量估算

- **总工作量**: 8 周
- **开发人员**: 2 人 (⚡ Executor + 📚 咨询师)
- **测试人员**: 1 人 (🧪 测试员)
- **文档人员**: 1 人 (🏗️ 架构师)

### 7.3 成本估算

- **开发成本**: 8 人周
- **API 成本**:
  - Whisper: $0.006/分钟 × 1000分钟/月 = $6/月
  - Google: $0.024/分钟 × 1000分钟/月 = $24/月
- **服务器成本**: 现有服务器，无需额外

### 7.4 下一步行动

1. ✅ **立即开始**: 创建 `src/lib/audio/` 目录结构
2. ✅ **Week 1**: 实现 WhisperSTT 基础功能
3. ✅ **Week 2**: 完成批量转录功能
4. ✅ **Week 3**: 开始 WebSocket 实时流开发
5. ✅ **Week 8**: 发布 v1.13.0

---

**报告完成时间**: 2026-04-05
**下一步**: 等待主人审批，开始实施