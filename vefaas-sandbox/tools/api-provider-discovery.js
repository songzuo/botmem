#!/usr/bin/env node

/**
 * API Provider Discovery Tool
 * 自动发现和验证可用的 AI API Provider
 * 
 * 功能:
 * - 测试已知 API Provider 列表
 * - 验证端点和认证
 * - 发现新的可用 Provider
 * - 生成配置建议
 * 
 * 使用方式:
 *   node api-provider-discovery.js              # 发现所有 Provider
 *   node api-provider-discovery.js --test       # 测试所有 Provider
 *   node api-provider-discovery.js --add        # 添加新 Provider
 *   node api-provider-discovery.js --report     # 生成 JSON 报告
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置路径
const CONFIG_DIR = path.join(__dirname, '../.openclaw');
const STATE_DIR = path.join(__dirname, '../state/api-discovery');
const CLUSTER_CONFIG = path.join(__dirname, '../scripts/cluster-workers.json');

// 已知 API Provider 列表
const KNOWN_PROVIDERS = [
  {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrls: [
      'https://api.openai.com/v1',
      'https://api.openai.com'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    pricing: '$2.50-15.00/1M tokens'
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic (Claude)',
    baseUrls: [
      'https://api.anthropic.com',
      'https://api.anthropic.com/v1'
    ],
    endpoints: ['/messages'],
    authType: 'api-key',
    header: 'x-api-key',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
    pricing: '$3.00-15.00/1M tokens'
  },
  {
    name: 'azure-openai',
    displayName: 'Azure OpenAI',
    baseUrls: [
      'https://{resource}.openai.azure.com/openai/deployments/{deployment}'
    ],
    endpoints: ['/chat/completions?api-version=2024-02-01'],
    authType: 'azure',
    models: ['gpt-4', 'gpt-35-turbo'],
    pricing: '$1.50-12.50/1M tokens'
  },
  {
    name: 'google-genai',
    displayName: 'Google Gemini',
    baseUrls: [
      'https://generativelanguage.googleapis.com/v1beta'
    ],
    endpoints: ['/models/{model}:generateContent'],
    authType: 'api-key',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    pricing: '$0.00-1.25/1M tokens'
  },
  {
    name: 'deepseek',
    displayName: 'DeepSeek',
    baseUrls: [
      'https://api.deepseek.com/v1',
      'https://api.deepseek.com'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['deepseek-chat', 'deepseek-coder'],
    pricing: '$0.14-0.28/1M tokens'
  },
  {
    name: 'moonshot',
    displayName: 'Moonshot AI (月之暗面)',
    baseUrls: [
      'https://api.moonshot.cn/v1'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['kimi-k2', 'kimi-latest'],
    pricing: '$0.50-1.50/1M tokens'
  },
  {
    name: 'zhipu',
    displayName: 'Zhipu AI (智谱清言)',
    baseUrls: [
      'https://open.bigmodel.cn/api/paas/v4'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['glm-4-plus', 'glm-4-flash', 'glm-4'],
    pricing: '$0.05-1.00/1M tokens'
  },
  {
    name: 'tencent-hunyuan',
    displayName: 'Tencent Hunyuan (腾讯混元)',
    baseUrls: [
      'https://hunyuan.tencentcloudapi.com'
    ],
    endpoints: ['/ChatCompletion'],
    authType: 'secret-id',
    models: ['hunyuan-latest', 'hunyuan-pro'],
    pricing: '$0.50/1M tokens'
  },
  {
    name: 'aliyun-qwen',
    displayName: 'Alibaba Qwen (阿里云通义)',
    baseUrls: [
      'https://dashscope.aliyuncs.com/api/v1'
    ],
    endpoints: ['/services/aigc/text-generation/generation'],
    authType: 'bearer',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    pricing: '$0.20-2.00/1M tokens'
  },
  {
    name: 'baidu-ernie',
    displayName: 'Baidu ERNIE (百度文心)',
    baseUrls: [
      'https://qianfan.baidubce.com/v2'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['ernie-4.0-8k', 'ernie-3.5-8k'],
    pricing: '$1.20-12.00/1M tokens'
  },
  {
    name: 'spark',
    displayName: 'iFlytek Spark (讯飞星火)',
    baseUrls: [
      'https://spark-api.xf-yun.com/v3.5'
    ],
    endpoints: ['/chat'],
    authType: 'app-id',
    models: ['Spark4.0 Ultra', 'Spark3.5 Pro'],
    pricing: '$0.50-2.00/1M tokens'
  },
  {
    name: 'siliconflow',
    displayName: 'SiliconFlow',
    baseUrls: [
      'https://api.siliconflow.cn/v1'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['Qwen2-72B-Instruct', 'DeepSeek-V2-Chat'],
    pricing: '$0.10-0.50/1M tokens'
  },
  {
    name: 'together-ai',
    displayName: 'Together AI',
    baseUrls: [
      'https://api.together.xyz/v1'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['meta-llama/Llama-3.3-70B-Instruct', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    pricing: '$0.20-1.00/1M tokens'
  },
  {
    name: 'novita',
    displayName: 'Novita AI',
    baseUrls: [
      'https://api.novita.ai/v1'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['meta-llama/Llama-3.1-70B-Instruct'],
    pricing: '$0.30-1.20/1M tokens'
  },
  {
    name: 'langgenius',
    displayName: 'LangGenius (Dify)',
    baseUrls: [
      'https://api.langgenius.ai/v1'
    ],
    endpoints: ['/chat/completions'],
    authType: 'bearer',
    models: ['gpt-4o', 'claude-3-sonnet'],
    pricing: '自托管'
  }
];

// 当前集群中配置的 Provider
let currentProviders = [];

function loadClusterConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CLUSTER_CONFIG, 'utf8'));
    currentProviders = config.apiProviders || [];
    return config;
  } catch (e) {
    console.log('⚠️ 无法读取集群配置');
    return { apiProviders: [] };
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          latency: latency,
          error: null
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        status: 0,
        data: '',
        latency: Date.now() - startTime,
        error: e.code || e.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        data: '',
        latency: 10000,
        error: 'ETIMEDOUT'
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testProvider(provider, apiKey = null) {
  const results = {
    name: provider.name,
    displayName: provider.displayName,
    baseUrls: provider.baseUrls,
    status: 'unknown',
    latency: null,
    error: null,
    workingEndpoint: null,
    testedAt: new Date().toISOString()
  };

  // 尝试每个 baseUrl
  for (const baseUrl of provider.baseUrls) {
    for (const endpoint of provider.endpoints) {
      try {
        const url = baseUrl + endpoint.replace('{model}', provider.models?.[0] || 'gpt-4');
        
        // 构建测试请求
        const headers = {};
        if (provider.authType === 'bearer' && apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        } else if (provider.authType === 'api-key' && apiKey) {
          headers[provider.header || 'x-api-key'] = apiKey;
        }

        // 发送测试请求
        let testUrl = url;
        let testMethod = 'GET';
        let testBody = null;

        // 对于聊天端点，发送 POST 请求
        if (endpoint.includes('chat') || endpoint.includes('messages') || endpoint.includes('generateContent')) {
          testMethod = 'POST';
          testBody = JSON.stringify({
            model: provider.models?.[0] || 'gpt-4',
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
          });
          headers['Content-Type'] = 'application/json';
        }

        const res = await makeRequest(testUrl, {
          method: testMethod,
          headers: headers,
          body: testBody
        });

        if (res.status >= 200 && res.status < 300) {
          results.status = 'working';
          results.latency = res.latency;
          results.workingEndpoint = url;
          return results;
        } else if (res.status >= 400 && res.status < 500) {
          // 认证错误说明端点可达，只是认证问题
          if (!results.latency || res.latency < results.latency) {
            results.status = 'auth-error';
            results.latency = res.latency;
            results.error = `HTTP ${res.status}`;
            results.workingEndpoint = url;
          }
        } else if (res.status > 0) {
          // 其他错误
          if (!results.latency) {
            results.status = 'error';
            results.latency = res.latency;
            results.error = `HTTP ${res.status}`;
          }
        }
      } catch (e) {
        if (!results.error) {
          results.status = 'error';
          results.error = e.message;
        }
      }
    }
  }

  if (results.status === 'unknown') {
    results.status = 'unreachable';
    results.error = '无法连接到任何端点';
  }

  return results;
}

async function discoverProviders() {
  console.log('\n🔍 API Provider 发现工具');
  console.log('='.repeat(50));
  
  const config = loadClusterConfig();
  console.log(`\n📋 已知 Provider 数量: ${KNOWN_PROVIDERS.length}`);
  console.log(`📋 当前配置 Provider: ${currentProviders.length}`);
  
  // 确保输出目录存在
  ensureDir(STATE_DIR);

  const results = [];
  const existingNames = currentProviders.map(p => p.name);

  console.log('\n🧪 开始测试 Provider...\n');

  for (const provider of KNOWN_PROVIDERS) {
    const isConfigured = existingNames.includes(provider.name);
    const statusIcon = isConfigured ? '🔷' : '⚪';
    
    process.stdout.write(`${statusIcon} 测试 ${provider.displayName} (${provider.name})... `);
    
    const result = await testProvider(provider, null);
    
    const latencyStr = result.latency ? `${result.latency}ms` : '-';
    let statusText = '';
    
    switch (result.status) {
      case 'working':
        statusText = '✅ 可用';
        break;
      case 'auth-error':
        statusText = '🔐 端点可达 (需API Key)';
        break;
      case 'error':
        statusText = `❌ ${result.error || '错误'}`;
        break;
      case 'unreachable':
        statusText = '🚫 不可达';
        break;
      default:
        statusText = '❓ 未知';
    }
    
    console.log(`${statusText} [${latencyStr}]`);
    
    results.push({
      ...provider,
      ...result,
      isConfigured: isConfigured
    });
  }

  // 保存结果
  const reportPath = path.join(STATE_DIR, `discovery-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 报告已保存: ${reportPath}`);

  // 统计
  const working = results.filter(r => r.status === 'working').length;
  const authError = results.filter(r => r.status === 'auth-error').length;
  const error = results.filter(r => r.status === 'error' || r.status === 'unreachable').length;

  console.log('\n📊 统计:');
  console.log(`   ✅ 完全可用: ${working}`);
  console.log(`   🔐 需API Key: ${authError}`);
  console.log(`   ❌ 不可用: ${error}`);

  // 建议
  if (authError > 0) {
    const suggestions = results
      .filter(r => r.status === 'auth-error')
      .map(r => `   - ${r.displayName}: 添加 API Key 即可使用`);
    
    console.log('\n💡 可配置的 Provider (需要 API Key):');
    suggestions.forEach(s => console.log(s));
  }

  return results;
}

async function generateConfigSuggestion(results) {
  // 找出可用的 Provider
  const available = results.filter(r => r.status === 'working' || r.status === 'auth-error');
  
  if (available.length === 0) {
    console.log('\n❌ 没有找到可用的 API Provider');
    console.log('建议: 手动检查网络连接或使用代理');
    return;
  }

  console.log('\n📝 建议添加到 cluster-workers.json 的配置:\n');
  
  // 选择前3个可用的 Provider
  const top3 = available.slice(0, 3);
  
  top3.forEach((provider, index) => {
    console.log(`\n# ${index + 1}. ${provider.displayName}`);
    console.log(`{`);
    console.log(`  "name": "${provider.name}",`);
    console.log(`  "priority": ${index + 1},`);
    console.log(`  "keys": ["YOUR-API-KEY-HERE"],`);
    console.log(`  "endpoint": "${provider.baseUrls[0]}",`);
    console.log(`  "model": "${provider.models?.[0] || 'default'}"`);
    console.log(`}`);
  });

  // 生成配置代码片段
  const configSnippet = {
    apiProviders: top3.map((p, i) => ({
      name: p.name,
      priority: i + 1,
      keys: ['YOUR-API-KEY-HERE'],
      endpoint: p.baseUrls[0],
      model: p.models?.[0] || 'default'
    }))
  };

  const snippetPath = path.join(STATE_DIR, 'suggested-config.json');
  fs.writeFileSync(snippetPath, JSON.stringify(configSnippet, null, 2));
  console.log(`\n📄 配置片段已保存: ${snippetPath}`);
}

function showReport() {
  const files = fs.readdirSync(STATE_DIR)
    .filter(f => f.startsWith('discovery-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log('❌ 没有发现报告');
    console.log('请先运行: node api-provider-discovery.js');
    return;
  }

  const latest = path.join(STATE_DIR, files[0]);
  const data = JSON.parse(fs.readFileSync(latest, 'utf8'));

  console.log(`\n📊 最新发现报告: ${files[0]}`);
  console.log('='.repeat(50));

  data.forEach(p => {
    const icon = p.status === 'working' ? '✅' : 
                 p.status === 'auth-error' ? '🔐' : '❌';
    console.log(`${icon} ${p.displayName}: ${p.status} (${p.latency || '-'}ms)`);
  });
}

// CLI 解析
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
🔍 API Provider Discovery Tool

用法:
  node api-provider-discovery.js              发现并测试所有 Provider
  node api-provider-discovery.js --report     查看最新发现报告
  node api-provider-discovery.js --suggest    生成配置建议
  node api-provider-discovery.js --help       显示帮助

测试结果状态:
  ✅ working     - 完全可用
  🔐 auth-error  - 端点可达，需要 API Key
  ❌ error       - 错误
  ❌ unreachable - 无法连接
`);
  process.exit(0);
}

if (args.includes('--report')) {
  showReport();
  process.exit(0);
}

if (args.includes('--suggest')) {
  loadClusterConfig();
  const files = fs.readdirSync(STATE_DIR)
    .filter(f => f.startsWith('discovery-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length > 0) {
    const latest = JSON.parse(fs.readFileSync(path.join(STATE_DIR, files[0]), 'utf8'));
    generateConfigSuggestion(latest);
  } else {
    console.log('❌ 请先运行发现测试');
  }
  process.exit(0);
}

// 运行发现
discoverProviders()
  .then(results => {
    generateConfigSuggestion(results);
    console.log('\n✨ 发现完成!');
  })
  .catch(e => {
    console.error('❌ 错误:', e.message);
    process.exit(1);
  });
