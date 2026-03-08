#!/usr/bin/env node

/**
 * API Performance Benchmark Tool
 * Benchmarks multiple API providers with identical prompts to compare performance
 * 
 * Usage:
 *   node api-perf-benchmark.js --test               # Run benchmark test
 *   node api-perf-benchmark.js --compare           # Compare all providers
 *   node api-perf-benchmark.js --report            # Generate detailed report
 *   node api-perf-benchmark.js --watch             # Continuous monitoring mode
 *   node api-perf-benchmark.js --quick             # Quick 3-second test
 *   node api-perf-benchmark.js --export            # Export results to JSON
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const CONFIG_PATH = '/workspace/projects/workspace/scripts/cluster-workers.json';
const STATE_DIR = '/workspace/projects/workspace/state';
const BENCHMARK_STATE = path.join(STATE_DIR, 'api-benchmark.json');

// Default test prompts for different scenarios
const TEST_PROMPTS = {
  short: "Say 'hello' in one word.",
  medium: "Describe what an AI assistant does in 2-3 sentences.",
  long: "Write a short paragraph about the future of AI."
};

class APIPerfBenchmark {
  constructor() {
    this.providers = [];
    this.results = [];
    this.config = null;
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      this.config = JSON.parse(configData);
      this.providers = this.config.apiProviders || [];
      console.log(`📊 Loaded ${this.providers.length} API providers from config`);
    } catch (e) {
      console.error('❌ Failed to load config:', e.message);
      // Fallback to environment or defaults
      this.providers = [];
    }
  }

  async makeRequest(provider, prompt, model = null) {
    const startTime = Date.now();
    let status = 'unknown';
    let error = null;
    let response = null;
    let tokens = 0;

    const url = new URL(provider.endpoint);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const requestBody = {
      model: model || provider.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    };

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + (url.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.keys[0]}`,
        'User-Agent': 'OpenClaw-Benchmark/1.0'
      },
      timeout: 30000
    };

    return new Promise((resolve) => {
      const req = httpModule.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const latency = Date.now() - startTime;
          status = res.statusCode;

          try {
            if (res.statusCode === 200) {
              const parsed = JSON.parse(data);
              response = parsed.content?.[0]?.text || parsed.choices?.[0]?.message?.content || '';
              tokens = parsed.usage?.total_tokens || 0;
            } else {
              error = `HTTP ${res.statusCode}: ${data.substring(0, 100)}`;
            }
          } catch (e) {
            error = `Parse error: ${e.message}`;
          }

          resolve({
            provider: provider.name,
            latency,
            status,
            error,
            response: response ? response.substring(0, 200) : '',
            tokens,
            timestamp: new Date().toISOString()
          });
        });
      });

      req.on('error', (e) => {
        resolve({
          provider: provider.name,
          latency: Date.now() - startTime,
          status: 0,
          error: e.message,
          response: '',
          tokens: 0,
          timestamp: new Date().toISOString()
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          provider: provider.name,
          latency: 30000,
          status: 0,
          error: 'Timeout',
          response: '',
          tokens: 0,
          timestamp: new Date().toISOString()
        });
      });

      req.write(JSON.stringify(requestBody));
      req.end();
    });
  }

  async runBenchmark(promptType = 'medium', iterations = 1) {
    console.log(`\n🚀 Running API Performance Benchmark`);
    console.log(`   Prompt type: ${promptType}, Iterations: ${iterations}`);
    console.log('─'.repeat(50));

    const prompt = TEST_PROMPTS[promptType] || TEST_PROMPTS.medium;
    const results = [];

    for (const provider of this.providers) {
      console.log(`\n📡 Testing ${provider.name}...`);
      
      for (let i = 0; i < iterations; i++) {
        const result = await this.makeRequest(provider, prompt);
        results.push(result);
        
        const icon = result.status === 200 ? '✅' : '❌';
        console.log(`   ${icon} ${provider.name} #${i + 1}: ${result.latency}ms, tokens: ${result.tokens}, status: ${result.status}`);
        
        if (i < iterations - 1) {
          await new Promise(r => setTimeout(r, 1000)); // Delay between iterations
        }
      }
    }

    this.results = results;
    return results;
  }

  generateReport() {
    console.log('\n📈 BENCHMARK REPORT');
    console.log('═'.repeat(60));

    // Group by provider
    const byProvider = {};
    for (const r of this.results) {
      if (!byProvider[r.provider]) {
        byProvider[r.provider] = { results: [], totalLatency: 0, successCount: 0, totalTokens: 0 };
      }
      byProvider[r.provider].results.push(r);
      if (r.status === 200) {
        byProvider[r.provider].successCount++;
        byProvider[r.provider].totalLatency += r.latency;
        byProvider[r.provider].totalTokens += r.tokens;
      }
    }

    const rankings = [];
    for (const [name, data] of Object.entries(byProvider)) {
      const avgLatency = data.successCount > 0 ? Math.round(data.totalLatency / data.successCount) : 99999;
      const successRate = Math.round((data.successCount / data.results.length) * 100);
      
      rankings.push({
        provider: name,
        avgLatency,
        successRate,
        totalTokens: data.totalTokens,
        avgTokens: data.successCount > 0 ? Math.round(data.totalTokens / data.successCount) : 0
      });
    }

    // Sort by latency
    rankings.sort((a, b) => a.avgLatency - b.avgLatency);

    console.log('\n🏆 Rankings (by average latency):\n');
    console.log('   Provider      | Avg Latency | Success | Avg Tokens');
    console.log('   ' + '─'.repeat(50));
    
    for (const r of rankings) {
      const icon = r.successRate >= 80 ? '✅' : r.successRate >= 50 ? '⚠️' : '❌';
      console.log(`   ${r.provider.padEnd(13)} | ${r.avgLatency.toString().padEnd(11)}ms | ${icon} ${r.successRate.toString().padEnd(6)}% | ${r.avgTokens}`);
    }

    const best = rankings[0];
    if (best && best.successRate >= 50) {
      console.log(`\n💡 Best provider: ${best.provider} (${best.avgLatency}ms avg latency)`);
    }

    return { rankings, byProvider };
  }

  saveResults() {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    
    const data = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: this.generateReport()
    };
    
    fs.writeFileSync(BENCHMARK_STATE, JSON.stringify(data, null, 2));
    console.log(`\n💾 Results saved to ${BENCHMARK_STATE}`);
  }

  async watchMode(intervalMs = 60000) {
    console.log(`\n👀 Starting continuous benchmark mode (every ${intervalMs/1000}s)`);
    console.log('   Press Ctrl+C to stop\n');
    
    let count = 0;
    const watch = async () => {
      count++;
      console.log(`\n[${new Date().toLocaleTimeString()}] Benchmark #${count}`);
      await this.runBenchmark('short', 1);
      this.generateReport();
      this.saveResults();
    };
    
    // Run immediately then interval
    await watch();
    return setInterval(watch, intervalMs);
  }
}

// CLI
const args = process.argv.slice(2);
const benchmark = new APIPerfBenchmark();

const commands = {
  '--test': async () => {
    benchmark.loadConfig();
    await benchmark.runBenchmark('medium', 1);
    benchmark.generateReport();
  },
  '--compare': async () => {
    benchmark.loadConfig();
    await benchmark.runBenchmark('medium', 2);
    benchmark.generateReport();
    benchmark.saveResults();
  },
  '--report': () => {
    if (fs.existsSync(BENCHMARK_STATE)) {
      const data = JSON.parse(fs.readFileSync(BENCHMARK_STATE, 'utf8'));
      console.log('\n📊 Last Benchmark Results');
      console.log(`   Time: ${data.timestamp}`);
      console.log(`   Runs: ${data.results.length}\n`);
      benchmark.results = data.results;
      benchmark.generateReport();
    } else {
      console.log('❌ No benchmark data found. Run --test first.');
    }
  },
  '--quick': async () => {
    benchmark.loadConfig();
    await benchmark.runBenchmark('short', 1);
    benchmark.generateReport();
  },
  '--export': () => {
    if (fs.existsSync(BENCHMARK_STATE)) {
      console.log(fs.readFileSync(BENCHMARK_STATE, 'utf8'));
    } else {
      console.log('❌ No benchmark data to export.');
    }
  },
  '--watch': async () => {
    benchmark.loadConfig();
    await benchmark.watchMode(60000);
  }
};

(async () => {
  const cmd = args[0] || '--test';
  
  if (commands[cmd]) {
    await commands[cmd]();
  } else if (cmd === '--help' || cmd === '-h') {
    console.log(`
API Performance Benchmark Tool
===============================
Usage: node api-perf-benchmark.js [command]

Commands:
  --test      Run a single benchmark test (default)
  --compare   Run benchmark with 2 iterations per provider
  --report    Show last benchmark results
  --quick     Quick test with short prompt
  --export    Export results as JSON
  --watch     Continuous monitoring mode (every 60s)
  --help      Show this help message
`);
  } else {
    console.log(`Unknown command: ${cmd}`);
    console.log('Run --help for usage information');
  }
})();
