#!/usr/bin/env node

/**
 * Workspace Health Reporter
 * 
 * 定期生成工作区健康报告，包括：
 * - 系统资源使用情况
 * - 内存文件分析
 * - 活跃工具统计
 * - 潜在问题检测
 * 
 * 用法: node workspace-health-reporter.js [--json] [--verbose]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = '/workspace/projects/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const TOOLS_DIR = path.join(WORKSPACE, 'tools');

// 解析命令行参数
const args = process.argv.slice(2);
const outputJson = args.includes('--json');
const verbose = args.includes('--verbose');

// 获取系统资源信息
function getSystemResources() {
  try {
    const disk = execSync('df -h /workspace/projects/workspace | tail -1', { encoding: 'utf8' }).trim().split(/\s+/);
    const mem = execSync('free -h', { encoding: 'utf8' }).trim().split('\n')[1].split(/\s+/);
    const cpu = require('os').cpus().length;
    
    return {
      cpu: {
        cores: cpu,
        load: require('os').loadavg()[0].toFixed(2)
      },
      memory: {
        total: mem[1],
        used: mem[2],
        free: mem[3],
        usagePercent: Math.round((parseMem(mem[2]) / parseMem(mem[1])) * 100)
      },
      disk: {
        total: disk[1],
        used: disk[2],
        available: disk[3],
        usagePercent: parseInt(disk[4])
      }
    };
  } catch (e) {
    return { error: e.message };
  }
}

function parseMem(str) {
  const match = str.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

// 获取内存文件统计
function getMemoryStats() {
  try {
    const files = fs.readdirSync(MEMORY_DIR).filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));
    const stats = files.map(f => {
      const filePath = path.join(MEMORY_DIR, f);
      const stat = fs.statSync(filePath);
      return {
        name: f,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        age: Date.now() - stat.mtime.getTime()
      };
    }).sort((a, b) => b.modified.localeCompare(a.modified));

    // 计算更新频率
    const now = Date.now();
    const recentFiles = stats.filter(f => now - new Date(f.modified).getTime() < 24 * 60 * 60 * 1000);
    
    return {
      totalFiles: files.length,
      recentUpdates: recentFiles.length,
      lastUpdate: stats[0]?.modified || null,
      files: stats.slice(0, 5).map(f => ({ name: f.name, modified: f.modified, size: f.size }))
    };
  } catch (e) {
    return { error: e.message };
  }
}

// 获取工具统计
function getToolsStats() {
  try {
    const files = fs.readdirSync(TOOLS_DIR).filter(f => f.endsWith('.js') || f.endsWith('.py'));
    const totalSize = files.reduce((sum, f) => {
      const stat = fs.statSync(path.join(TOOLS_DIR, f));
      return sum + stat.size;
    }, 0);

    // 分类统计
    const categories = {
      monitoring: files.filter(f => /monitor|health|check/i.test(f)).length,
      api: files.filter(f => /api|router/i.test(f)).length,
      automation: files.filter(f => /auto|workflow|agent/i.test(f)).length,
      backup: files.filter(f => /backup|restore/i.test(f)).length,
      analytics: files.filter(f => /analytics|usage|tracker/i.test(f)).length
    };

    return {
      totalTools: files.length,
      totalSize: (totalSize / 1024).toFixed(2) + ' KB',
      categories,
      newest: files.sort((a, b) => {
        return fs.statSync(path.join(TOOLS_DIR, b)).mtime - fs.statSync(path.join(TOOLS_DIR, a)).mtime;
      }).slice(0, 3).map(f => ({ name: f, modified: fs.statSync(path.join(TOOLS_DIR, f)).mtime.toISOString() }))
    };
  } catch (e) {
    return { error: e.message };
  }
}

// 检测潜在问题
function detectIssues(resources, memory) {
  const issues = [];
  
  if (resources.disk?.usagePercent > 85) {
    issues.push({
      severity: 'warning',
      type: 'disk',
      message: `磁盘使用率较高: ${resources.disk.usagePercent}%`
    });
  }
  
  if (resources.memory?.usagePercent > 80) {
    issues.push({
      severity: 'warning',
      type: 'memory',
      message: `内存使用率较高: ${resources.memory.usagePercent}%`
    });
  }

  if (!memory.lastUpdate) {
    issues.push({
      severity: 'info',
      type: 'memory',
      message: '没有找到内存文件更新'
    });
  }

  return issues;
}

// 生成报告
function generateReport() {
  const resources = getSystemResources();
  const memory = getMemoryStats();
  const tools = getToolsStats();
  const issues = detectIssues(resources, memory);

  const report = {
    timestamp: new Date().toISOString(),
    workspace: WORKSPACE,
    resources,
    memory,
    tools,
    issues,
    summary: {
      healthScore: calculateHealthScore(resources, issues),
      status: issues.length === 0 ? 'healthy' : issues.some(i => i.severity === 'warning') ? 'degraded' : 'warning'
    }
  };

  return report;
}

function calculateHealthScore(resources, issues) {
  let score = 100;
  
  if (resources.disk?.usagePercent > 70) score -= 10;
  if (resources.disk?.usagePercent > 85) score -= 20;
  if (resources.memory?.usagePercent > 70) score -= 10;
  if (resources.memory?.usagePercent > 85) score -= 20;
  
  issues.forEach(issue => {
    if (issue.severity === 'warning') score -= 15;
    if (issue.severity === 'info') score -= 5;
  });
  
  return Math.max(0, score);
}

// 格式化输出
function formatReport(report) {
  const lines = [];
  const separator = '='.repeat(50);
  
  lines.push(separator);
  lines.push(`📊 工作区健康报告 - ${new Date(report.timestamp).toLocaleString('zh-CN')}`);
  lines.push(separator);
  
  lines.push('\n🏥 健康状态: ' + 
    (report.summary.status === 'healthy' ? '✅ 健康' : 
     report.summary.status === 'degraded' ? '⚠️ 一般' : '❌ 警告') +
    ` (${report.summary.healthScore}/100)`);
  
  lines.push('\n💻 系统资源:');
  lines.push(`  CPU: ${report.resources.cpu?.cores} 核, 负载: ${report.resources.cpu?.load}`);
  lines.push(`  内存: ${report.resources.memory?.used}/${report.resources.memory?.total} (${report.resources.memory?.usagePercent}%)`);
  lines.push(`  磁盘: ${report.resources.disk?.used}/${report.resources.disk?.total} (${report.resources.disk?.usagePercent}%)`);
  
  lines.push('\n📝 内存文件:');
  lines.push(`  总数: ${report.memory.totalFiles}`);
  lines.push(`  24小时内更新: ${report.memory.recentUpdates}`);
  lines.push(`  最新: ${report.memory.lastUpdate ? new Date(report.memory.lastUpdate).toLocaleString('zh-CN') : '无'}`);
  
  lines.push('\n🛠️ 工具统计:');
  lines.push(`  总数: ${report.tools.totalTools}`);
  lines.push(`  大小: ${report.tools.totalSize}`);
  if (verbose) {
    lines.push('  分类统计:');
    Object.entries(report.tools.categories).forEach(([cat, count]) => {
      lines.push(`    ${cat}: ${count}`);
    });
  }
  
  if (report.issues.length > 0) {
    lines.push('\n⚠️ 发现的问题:');
    report.issues.forEach(issue => {
      lines.push(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
    });
  } else {
    lines.push('\n✨ 没有发现的问题');
  }
  
  lines.push('\n' + separator);
  
  return lines.join('\n');
}

// 主程序
const report = generateReport();

if (outputJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(formatReport(report));
}

// 如果有严重问题，退出码非0
const hasCritical = report.issues.some(i => i.severity === 'critical');
process.exit(hasCritical ? 2 : report.issues.filter(i => i.severity === 'warning').length > 2 ? 1 : 0);
