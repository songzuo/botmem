#!/usr/bin/env node

/**
 * auto_generate_report.js - 健康检查报告自动生成脚本
 *
 * 功能：
 * - 自动运行健康检查
 * - 生成 JSON 格式报告
 * - 包含时间戳、状态摘要、详细信息
 * - 保存到 reports/ 目录
 *
 * 使用方法：
 *   node auto_generate_report.js
 *   node auto_generate_report.js --output reports/health_$(date +%Y%m%d_%H%M%S).json
 *
 * 选项：
 *   --output <path>  指定输出文件路径（默认：reports/health_report_YYYYMMDD_HHMMSS.json）
 *   --no-check       跳过健康检查，仅重新格式化现有报告
 *   --quiet          静默模式，仅输出文件路径
 */

const fs = require('fs');
const path = require('path');

// 导入健康检查模块
const { checkHealth, healthResults } = require('./check_health');

// 默认配置
const DEFAULT_REPORTS_DIR = path.join(__dirname, 'reports');
const DEFAULT_OUTPUT_PATTERN = 'health_report_{timestamp}.json';

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    output: null,
    noCheck: false,
    quiet: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--no-check':
        options.noCheck = true;
        break;
      case '--quiet':
      case '-q':
        options.quiet = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
      default:
        console.error(`未知参数: ${arg}`);
        console.error('使用 --help 查看帮助');
        process.exit(1);
    }
  }

  return options;
}

/**
 * 打印使用说明
 */
function printUsage() {
  console.log(`
健康检查报告自动生成工具

使用方法:
  node auto_generate_report.js [选项]

选项:
  --output, -o <path>    指定输出文件路径
  --no-check              跳过健康检查，仅重新格式化现有报告
  --quiet, -q             静默模式，仅输出文件路径
  --help, -h              显示此帮助信息

示例:
  # 使用默认设置生成报告
  node auto_generate_report.js

  # 指定输出文件路径
  node auto_generate_report.js --output reports/custom_report.json

  # 静默模式
  node auto_generate_report.js --quiet

  # 仅格式化现有报告（不重新检查）
  node auto_generate_report.js --no-check
`);
}

/**
 * 确保报告目录存在
 */
function ensureReportsDir(outputPath) {
  const dir = path.dirname(outputPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 生成报告文件名
 */
function generateReportFilename(pattern = DEFAULT_OUTPUT_PATTERN) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return pattern.replace('{timestamp}', timestamp);
}

/**
 * 格式化报告数据
 */
function formatReport(data) {
  return {
    metadata: {
      generatedAt: data.timestamp || new Date().toISOString(),
      version: '1.0.0',
      generator: 'auto_generate_report.js'
    },
    summary: {
      overall: data.summary.unhealthy === 0 ? 'HEALTHY' : 'UNHEALTHY',
      total: data.summary.total,
      healthy: data.summary.healthy,
      unhealthy: data.summary.unhealthy,
      warnings: data.summary.warnings,
      cached: data.summary.cached,
      healthRate: data.summary.total > 0
        ? ((data.summary.healthy / data.summary.total) * 100).toFixed(2) + '%'
        : 'N/A'
    },
    system: data.system || {},
    nginx: data.nginx || {},
    ports: data.ports || {},
    sites: data.sites || [],
    trends: data.trends || {}
  };
}

/**
 * 保存报告到文件
 */
function saveReport(report, outputPath) {
  try {
    ensureReportsDir(outputPath);

    const reportData = JSON.stringify(report, null, 2);
    fs.writeFileSync(outputPath, reportData, 'utf8');

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(2);

    return {
      success: true,
      path: outputPath,
      sizeKB: sizeKB
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 打印报告摘要
 */
function printReportSummary(report, outputPath, quiet = false) {
  if (quiet) {
    console.log(outputPath);
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('健康检查报告生成完成');
  console.log('='.repeat(60));
  console.log(`报告路径: ${outputPath}`);
  console.log(`生成时间: ${report.metadata.generatedAt}`);
  console.log('\n状态摘要:');
  console.log(`  总体状态: ${report.summary.overall}`);
  console.log(`  健康率: ${report.summary.healthRate}`);
  console.log(`  检查项: ${report.summary.total} (正常: ${report.summary.healthy}, 异常: ${report.summary.unhealthy}, 警告: ${report.summary.warnings})`);

  if (report.summary.cached > 0) {
    console.log(`  缓存命中: ${report.summary.cached}`);
  }

  // 显示异常站点
  const unhealthySites = report.sites.filter(s => !s.healthy);
  if (unhealthySites.length > 0) {
    console.log('\n异常站点:');
    unhealthySites.forEach(site => {
      console.log(`  ✗ ${site.name} (${site.url})`);
      if (site.error) {
        console.log(`    错误: ${site.error}`);
      } else if (site.statusCode) {
        console.log(`    状态码: ${site.statusCode}`);
      }
    });
  }

  // 显示警告站点
  const warningSites = report.sites.filter(s => s.healthy && s.slow);
  if (warningSites.length > 0) {
    console.log('\n警告站点 (响应缓慢):');
    warningSites.forEach(site => {
      console.log(`  ⚠ ${site.name} (${site.responseTime?.toFixed(0) || 0}ms)`);
    });
  }

  console.log('='.repeat(60));
}

/**
 * 加载现有报告
 */
function loadExistingReport() {
  const reportPath = path.join(__dirname, 'health_report.json');

  if (!fs.existsSync(reportPath)) {
    console.error('找不到现有的健康报告: health_report.json');
    console.error('请先运行健康检查或使用默认模式');
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch (error) {
    console.error('读取现有报告失败:', error.message);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const options = parseArgs();

    // 确定输出文件路径
    let outputPath;
    if (options.output) {
      outputPath = options.output;
      // 如果输出路径是相对路径，相对于项目根目录
      if (!path.isAbsolute(outputPath) && !outputPath.startsWith('reports/')) {
        outputPath = path.join(__dirname, outputPath);
      } else if (!path.isAbsolute(outputPath)) {
        outputPath = path.join(__dirname, outputPath);
      }
    } else {
      ensureReportsDir(DEFAULT_REPORTS_DIR);
      outputPath = path.join(DEFAULT_REPORTS_DIR, generateReportFilename());
    }

    // 获取报告数据
    let rawData;

    if (options.noCheck) {
      console.log('加载现有健康报告...');
      rawData = loadExistingReport();
    } else {
      console.log('运行健康检查...');
      const exitCode = await checkHealth();

      if (exitCode !== 0) {
        console.warn('\n健康检查发现异常，但仍会生成报告');
      }
    }

    // 格式化报告
    const formattedReport = formatReport(rawData);

    // 保存报告
    const result = saveReport(formattedReport, outputPath);

    if (!result.success) {
      console.error('保存报告失败:', result.error);
      process.exit(1);
    }

    // 打印摘要
    printReportSummary(formattedReport, outputPath, options.quiet);

    // 如果不是静默模式，保存最新报告路径到文件
    if (!options.quiet) {
      const latestReportPath = path.join(DEFAULT_REPORTS_DIR, 'latest_report.txt');
      fs.writeFileSync(latestReportPath, outputPath);

      console.log(`\n✓ 报告已保存 (${result.sizeKB} KB)`);

      // 显示最近报告列表
      try {
        const reportsDir = DEFAULT_REPORTS_DIR;
        const files = fs.readdirSync(reportsDir)
          .filter(f => f.endsWith('.json') && f !== 'latest_report.txt')
          .map(f => ({
            name: f,
            path: path.join(reportsDir, f),
            time: fs.statSync(path.join(reportsDir, f)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time)
          .slice(0, 5); // 只显示最近5个

        if (files.length > 1) {
          console.log(`\n最近的报告 (共 ${files.length} 个):`);
          files.forEach((f, i) => {
            const prefix = i === 0 ? '→' : ' ';
            const time = new Date(f.time).toLocaleString('zh-CN');
            console.log(`  ${prefix} ${f.name} (${time})`);
          });
        }
      } catch (error) {
        // 忽略列出报告的错误
      }
    }

  } catch (error) {
    console.error('\n生成报告失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  generateReport: main,
  formatReport,
  saveReport,
  printReportSummary
};
