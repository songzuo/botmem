/**
 * check_health.js - 站点健康检查脚本
 *
 * 功能：
 * - 检查所有部署站点的 HTTP 响应状态
 * - 检查站点端口是否正常监听
 * - 检查 Nginx 配置是否正确
 * - 输出详细的健康报告
 *
 * 使用方法：
 *   node check_health.js
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const helpers = require('./utils/check_helpers');

// 缓存配置
const CACHE_DIR = '/root/.openclaw/workspace/commander/cache';
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存有效期
const HEALTH_REPORT_PATH = '/root/.openclaw/workspace/commander/health_report.json';
const PREVIOUS_REPORT_PATH = '/root/.openclaw/workspace/commander/health_report_previous.json';

// 默认 SSH 配置（向后兼容）
const defaultServerConfig = {
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000,
  compress: true
};

// 加载配置文件
let serverConfig;
let usingDefaultConfig = false;

try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    // 合并配置，使用默认值作为后备
    serverConfig = {
      ...defaultServerConfig,
      ...config
    };

    console.log('✓ 已加载配置文件: config.json');
  } else {
    // 配置文件不存在，使用默认值并显示警告
    serverConfig = defaultServerConfig;
    usingDefaultConfig = true;

    console.log('\n⚠ 警告: 未找到 config.json 文件');
    console.log('   正在使用默认配置（向后兼容）');
    console.log('   建议创建 config.json 文件以提高安全性');
    console.log('   复制 config.json.example 并填写实际配置\n');
  }
} catch (error) {
  console.error('✗ 配置文件加载失败:', error.message);
  console.error('   正在使用默认配置');
  serverConfig = defaultServerConfig;
  usingDefaultConfig = true;
}

// 站点配置
const sites = [
  { name: '7zi.com (main)', url: 'http://127.0.0.1:3010', port: 3010 },
  { name: 'cv.7zi.com', url: 'https://cv.7zi.com', ssl: true },
  { name: 'sign.7zi.com', url: 'https://sign.7zi.com', ssl: true },
  { name: 'china.7zi.com', url: 'https://china.7zi.com', ssl: true },
  { name: 'song.7zi.com', url: 'https://song.7zi.com', ssl: true },
  { name: 'ppt.7zi.com', url: 'https://ppt.7zi.com', ssl: true },
  { name: 'today.7zi.com', url: 'https://today.7zi.com', ssl: true },
  { name: 'wechat.7zi.com', url: 'https://wechat.7zi.com', ssl: true },
  { name: 'good.7zi.com', url: 'https://good.7zi.com', ssl: true }
];

// 需要检查的端口
const ports = [80, 443, 3010];

// 健康检查结果
const healthResults = {
  timestamp: new Date().toISOString(),
  system: {},
  nginx: {},
  ports: {},
  sites: [],
  summary: {
    total: 0,
    healthy: 0,
    unhealthy: 0,
    warnings: 0,
    cached: 0
  }
};

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * 确保缓存目录存在
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * 获取缓存键
 */
function getCacheKey(url) {
  return `site_${Buffer.from(url).toString('base64')}.json`;
}

/**
 * 从缓存读取数据
 */
function getCachedResult(url) {
  try {
    const cacheKey = getCacheKey(url);
    const cachePath = path.join(CACHE_DIR, cacheKey);

    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const now = Date.now();

    // 检查缓存是否过期
    if (now - cacheData.timestamp > CACHE_TTL) {
      fs.unlinkSync(cachePath); // 删除过期缓存
      return null;
    }

    return cacheData;
  } catch (error) {
    console.log(colorize(`缓存读取失败: ${error.message}`, 'gray'));
    return null;
  }
}

/**
 * 保存数据到缓存
 */
function setCachedResult(url, result) {
  try {
    ensureCacheDir();
    const cacheKey = getCacheKey(url);
    const cachePath = path.join(CACHE_DIR, cacheKey);

    const cacheData = {
      timestamp: Date.now(),
      url: url,
      result: result
    };

    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.log(colorize(`缓存写入失败: ${error.message}`, 'gray'));
  }
}

/**
 * 带超时的 Promise 包装
 */
function withTimeout(promise, timeoutMs, operationName) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} 超时 (${timeoutMs}ms)`));
      }, timeoutMs);
    })
  ]);
}

/**
 * 带重试的函数执行
 */
async function withRetry(fn, maxRetries = 1, retryDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        console.log(colorize(`  ⚠ 重试 ${attempt + 1}/${maxRetries}...`, 'yellow'));
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError;
}

/**
 * 计算趋势数据
 */
function calculateTrends(currentData, previousData) {
  if (!previousData || !previousData.sites) {
    return null;
  }

  const trends = {
    sites: {},
    summary: {}
  };

  // 为每个站点计算趋势
  currentData.sites.forEach(site => {
    const prevSite = previousData.sites.find(s => s.url === site.url);

    if (prevSite) {
      trends.sites[site.url] = {
        responseTimeChange: site.responseTime ? site.responseTime - (prevSite.responseTime || 0) : null,
        statusChanged: (site.healthy !== prevSite.healthy),
        previousStatus: prevSite.healthy ? 'healthy' : 'unhealthy',
        currentStatus: site.healthy ? 'healthy' : 'unhealthy'
      };
    }
  });

  // 计算摘要趋势
  trends.summary = {
    healthyChange: currentData.summary.healthy - previousData.summary.healthy,
    unhealthyChange: currentData.summary.unhealthy - previousData.summary.unhealthy,
    warningChange: currentData.summary.warnings - (previousData.summary.warnings || 0)
  };

  return trends;
}

/**
 * 保存当前报告为上一次报告
 */
function savePreviousReport() {
  try {
    if (fs.existsSync(HEALTH_REPORT_PATH)) {
      fs.copyFileSync(HEALTH_REPORT_PATH, PREVIOUS_REPORT_PATH);
    }
  } catch (error) {
    console.log(colorize(`保存历史报告失败: ${error.message}`, 'gray'));
  }
}

/**
 * 加载上一次的报告
 */
function loadPreviousReport() {
  try {
    if (fs.existsSync(PREVIOUS_REPORT_PATH)) {
      return JSON.parse(fs.readFileSync(PREVIOUS_REPORT_PATH, 'utf8'));
    }
  } catch (error) {
    console.log(colorize(`加载历史报告失败: ${error.message}`, 'gray'));
  }
  return null;
}

/**
 * 检查系统状态
 */
async function checkSystemStatus(conn) {
  console.log('\n' + colorize('=== 系统状态检查 ===', 'blue'));

  try {
    // 检查 Nginx 服务状态
    const nginxResult = await helpers.checkService(conn, 'nginx');
    healthResults.system.nginx = {
      running: nginxResult.running,
      status: nginxResult.status
    };

    if (nginxResult.running) {
      console.log(colorize('✓ Nginx 服务运行正常', 'green'));
    } else {
      console.log(colorize('✗ Nginx 服务未运行', 'red'));
      healthResults.summary.unhealthy++;
    }

    // 检查系统负载
    const loadResult = await helpers.checkLoad(conn);
    console.log(colorize('系统负载:', 'gray'), helpers.getOutputString(loadResult).trim());
    healthResults.system.load = helpers.getOutputString(loadResult).trim();

    // 检查磁盘使用
    const diskResult = await helpers.checkDiskUsage(conn, '/web');
    console.log(colorize('/web 磁盘使用:', 'gray'), helpers.getOutputString(diskResult).trim());
    healthResults.system.disk = helpers.getOutputString(diskResult).trim();

  } catch (error) {
    console.log(colorize(`✗ 系统检查失败: ${error.message}`, 'red'));
    healthResults.summary.unhealthy++;
  }
}

/**
 * 检查 Nginx 配置
 */
async function checkNginxConfig(conn) {
  console.log('\n' + colorize('=== Nginx 配置检查 ===', 'blue'));

  try {
    // 测试 Nginx 配置
    const testResult = await helpers.execCommand(conn, 'nginx -t 2>&1');
    const testOutput = helpers.getOutputString(testResult);

    if (testOutput.includes('successful') || testResult.exitCode === 0) {
      console.log(colorize('✓ Nginx 配置测试通过', 'green'));
      healthResults.nginx.configValid = true;
    } else {
      console.log(colorize('✗ Nginx 配置测试失败', 'red'));
      console.log(testOutput);
      healthResults.nginx.configValid = false;
      healthResults.nginx.error = testOutput;
      healthResults.summary.unhealthy++;
    }

    // 检查 Nginx 进程
    const nginxProcessResult = await helpers.checkProcess(conn, 'nginx');
    const nginxProcesses = helpers.getOutputString(nginxProcessResult);
    const nginxCount = (nginxProcesses.match(/\n/g) || []).length;

    healthResults.nginx.processCount = nginxCount;
    console.log(colorize(`Nginx 主进程数: ${nginxCount}`, nginxCount > 0 ? 'green' : 'red'));

    // 检查配置文件
    const sitesResult = await helpers.execCommand(conn, 'ls -la /etc/nginx/sites-enabled/ 2>/dev/null');
    const sites = helpers.getOutputString(sitesResult);
    const siteCount = (sites.match(/\n/g) || []).length - 1; // -1 for header

    healthResults.nginx.siteConfigs = siteCount > 0 ? siteCount : 0;
    console.log(colorize(`已启用站点配置: ${healthResults.nginx.siteConfigs}`, 'gray'));

  } catch (error) {
    console.log(colorize(`✗ Nginx 配置检查失败: ${error.message}`, 'red'));
    healthResults.summary.unhealthy++;
  }
}

/**
 * 检查端口监听状态
 */
async function checkPortStatus(conn) {
  console.log('\n' + colorize('=== 端口监听检查 ===', 'blue'));

  try {
    const portResult = await helpers.checkPorts(conn, ports);
    const portOutput = helpers.getOutputString(portResult);
    const lines = portOutput.trim().split('\n').filter(line => line.trim());

    // 解析端口状态
    ports.forEach(port => {
      const isListening = lines.some(line => line.includes(`:${port}`));
      healthResults.ports[port] = {
        listening: isListening,
        info: isListening ? 'listening' : 'not listening'
      };

      if (isListening) {
        console.log(colorize(`✓ 端口 ${port}: 监听中`, 'green'));
        healthResults.summary.healthy++;
      } else {
        console.log(colorize(`✗ 端口 ${port}: 未监听`, 'red'));
        healthResults.summary.unhealthy++;
      }
    });

    // 显示详细端口信息
    console.log('\n端口详情:');
    lines.forEach(line => {
      console.log(colorize(`  ${line}`, 'gray'));
    });

  } catch (error) {
    console.log(colorize(`✗ 端口检查失败: ${error.message}`, 'red'));
    healthResults.summary.unhealthy++;
  }
}

/**
 * 检查单个站点
 */
async function checkSingleSite(conn, site, useCache = true) {
  const healthResult = {
    name: site.name,
    url: site.url,
    healthy: false,
    cached: false
  };

  // 检查缓存
  if (useCache) {
    const cached = getCachedResult(site.url);
    if (cached && cached.result) {
      console.log(colorize(`  📦 ${site.name}: 使用缓存数据`, 'blue'));
      return {
        ...healthResult,
        ...cached.result,
        cached: true
      };
    }
  }

  try {
    // 带重试和超时的检查
    const checkFn = async () => {
      const curlCmd = `curl -s -o /dev/null -w "%{http_code}|%{time_total}|%{size_download}" ${site.url}`;
      const curlResult = await helpers.execCommand(conn, curlCmd, { timeout: 10000 });
      const curlOutput = helpers.getOutputString(curlResult).trim();

      if (curlOutput && curlOutput.includes('|')) {
        const [statusCode, totalTime, sizeDownload] = curlOutput.split('|');

        return {
          statusCode: parseInt(statusCode),
          responseTime: parseFloat(totalTime) * 1000,
          sizeDownload: parseInt(sizeDownload)
        };
      } else {
        throw new Error('No response from server');
      }
    };

    const result = await withTimeout(
      withRetry(checkFn, 1, 1000),
      15000,
      `检查 ${site.name}`
    );

    const isHealthy = result.statusCode >= 200 && result.statusCode < 400;
    const isSlow = result.responseTime > 3000;

    const finalResult = {
      ...healthResult,
      ...result,
      healthy: isHealthy,
      slow: isSlow,
      cached: false
    };

    // 缓存成功的结果
    if (isHealthy) {
      setCachedResult(site.url, finalResult);
    }

    return finalResult;
  } catch (error) {
    return {
      ...healthResult,
      error: error.message,
      healthy: false,
      cached: false
    };
  }
}

/**
 * 检查站点 HTTP 响应状态（并发版本）
 */
async function checkSiteHealth(conn) {
  console.log('\n' + colorize('=== 站点健康检查 (并发模式) ===', 'blue'));

  // 创建所有站点的检查任务
  const checkPromises = sites.map(site => checkSingleSite(conn, site));

  // 使用 Promise.all 并发执行所有检查
  const results = await Promise.all(checkPromises);

  // 处理结果
  results.forEach(siteResult => {
    healthResults.summary.total++;
    healthResults.sites.push(siteResult);

    if (siteResult.cached) {
      healthResults.summary.cached++;
      console.log(colorize(`📦 ${siteResult.name}: ${siteResult.statusCode} (缓存)`, 'blue'));
      if (siteResult.healthy) {
        healthResults.summary.healthy++;
      } else {
        healthResults.summary.unhealthy++;
      }
    } else if (siteResult.healthy) {
      if (siteResult.slow) {
        console.log(colorize(`⚠ ${siteResult.name}: ${siteResult.statusCode} (${siteResult.responseTime.toFixed(0)}ms)`, 'yellow'));
        healthResults.summary.warnings++;
      } else {
        console.log(colorize(`✓ ${siteResult.name}: ${siteResult.statusCode} (${siteResult.responseTime.toFixed(0)}ms)`, 'green'));
      }
      healthResults.summary.healthy++;
    } else {
      console.log(colorize(`✗ ${siteResult.name}: ${siteResult.error || '失败'}`, 'red'));
      healthResults.summary.unhealthy++;
    }
  });

  // 统计缓存命中
  const cachedCount = results.filter(r => r.cached).length;
  if (cachedCount > 0) {
    console.log(`\n缓存命中: ${cachedCount}/${results.length}`);
  }
}

/**
 * 生成健康报告摘要
 */
function generateSummary() {
  console.log('\n' + colorize('=== 健康检查摘要 ===', 'blue'));
  console.log(`总检查项: ${healthResults.summary.total}`);
  console.log(colorize(`正常: ${healthResults.summary.healthy}`, 'green'));
  console.log(colorize(`异常: ${healthResults.summary.unhealthy}`, 'red'));
  if (healthResults.summary.warnings > 0) {
    console.log(colorize(`警告: ${healthResults.summary.warnings}`, 'yellow'));
  }

  const healthRate = healthResults.summary.total > 0
    ? (healthResults.summary.healthy / healthResults.summary.total * 100).toFixed(1)
    : 0;
  console.log(`健康率: ${healthRate}%`);

  // 加载历史报告并计算趋势
  const previousReport = loadPreviousReport();
  const trends = calculateTrends(healthResults, previousReport);

  // 添加趋势到报告
  if (trends) {
    healthResults.trends = trends;

    console.log('\n' + colorize('=== 趋势分析 ===', 'blue'));

    // 显示摘要趋势
    if (trends.summary.healthyChange !== 0) {
      const change = trends.summary.healthyChange;
      const sign = change > 0 ? '+' : '';
      console.log(colorize(`健康数量变化: ${sign}${change}`, change >= 0 ? 'green' : 'red'));
    }

    if (trends.summary.unhealthyChange !== 0) {
      const change = trends.summary.unhealthyChange;
      const sign = change > 0 ? '+' : '';
      console.log(colorize(`异常数量变化: ${sign}${change}`, change <= 0 ? 'green' : 'red'));
    }

    // 显示状态变化
    const statusChanges = Object.entries(trends.sites).filter(([_, data]) => data.statusChanged);
    if (statusChanges.length > 0) {
      console.log('\n状态变化:');
      statusChanges.forEach(([url, data]) => {
        const siteName = healthResults.sites.find(s => s.url === url)?.name || url;
        const arrow = data.currentStatus === 'healthy' ? '→' : '←';
        console.log(colorize(
          `  ${siteName}: ${data.previousStatus} ${arrow} ${data.currentStatus}`,
          data.currentStatus === 'healthy' ? 'green' : 'red'
        ));
      });
    }
  }

  const overallStatus = healthResults.summary.unhealthy === 0 ? 'healthy' : 'unhealthy';
  console.log(`\n总体状态: ${colorize(overallStatus.toUpperCase(), overallStatus === 'healthy' ? 'green' : 'red')}`);

  // 保存 JSON 报告到文件
  try {
    // 先保存当前报告为历史
    savePreviousReport();

    // 保存新的报告
    fs.writeFileSync(HEALTH_REPORT_PATH, JSON.stringify(healthResults, null, 2));
    console.log(`\n详细报告已保存到: ${HEALTH_REPORT_PATH}`);

    // 清理过期缓存
    try {
      ensureCacheDir();
      const cacheFiles = fs.readdirSync(CACHE_DIR);
      const now = Date.now();
      let cleaned = 0;

      cacheFiles.forEach(file => {
        const cachePath = path.join(CACHE_DIR, file);
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

        if (now - cacheData.timestamp > CACHE_TTL) {
          fs.unlinkSync(cachePath);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`清理过期缓存: ${cleaned} 个文件`);
      }
    } catch (cleanupError) {
      console.log(colorize(`清理缓存失败: ${cleanupError.message}`, 'gray'));
    }
  } catch (error) {
    console.log(`\n保存报告失败: ${error.message}`);
  }

  return healthResults.summary.unhealthy === 0 ? 0 : 1;
}

/**
 * 主函数
 */
async function main() {
  const conn = new Client();

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log(colorize('SSH 连接成功', 'green'));
      console.log(colorize(`检查时间: ${healthResults.timestamp}`, 'gray'));

      try {
        // 执行各项检查
        await checkSystemStatus(conn);
        await checkNginxConfig(conn);
        await checkPortStatus(conn);
        await checkSiteHealth(conn);

        // 生成摘要
        const exitCode = generateSummary();

        conn.end();
        resolve(exitCode);
      } catch (error) {
        console.log(colorize(`\n健康检查失败: ${error.message}`, 'red'));
        conn.end();
        reject(error);
      }
    }).on('error', (err) => {
      console.log(colorize(`SSH 连接错误: ${err.message}`, 'red'));
      reject(err);
    }).connect(serverConfig);
  });
}

// 运行检查
if (require.main === module) {
  main()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkHealth: main, healthResults };