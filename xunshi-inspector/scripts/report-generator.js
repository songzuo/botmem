/**
 * 检查报告生成模块
 * 生成健康检查报告，支持多种格式输出
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.results = [];
  }

  /**
   * 添加检查结果
   */
  addResult(result) {
    this.results.push({
      timestamp: new Date().toISOString(),
      ...result
    });
  }

  /**
   * 生成 JSON 格式报告
   */
  generateJSON() {
    const report = {
      generated_at: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.results
    };
    return JSON.stringify(report, null, 2);
  }

  /**
   * 生成文本格式报告
   */
  generateText() {
    const summary = this.generateSummary();
    let report = '='.repeat(60) + '\n';
    report += '           巡视图检查报告 (Xunshi Inspector Report)\n';
    report += '='.repeat(60) + '\n';
    report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    report += '-'.repeat(60) + '\n';
    report += `总检查数: ${summary.total}\n`;
    report += `成功: ${summary.success} (${summary.successRate}%)\n`;
    report += `失败: ${summary.failed}\n`;
    report += `警告: ${summary.warnings}\n`;
    report += '-'.repeat(60) + '\n\n';

    report += '详细结果:\n';
    this.results.forEach((result, index) => {
      const status = result.status === 'ok' ? '✓' : result.status === 'warning' ? '⚠' : '✗';
      report += `${index + 1}. [${status}] ${result.name || result.host || 'Unknown'}\n`;
      if (result.message) {
        report += `   消息: ${result.message}\n`;
      }
      if (result.details) {
        report += `   详情: ${JSON.stringify(result.details)}\n`;
      }
      report += '\n';
    });

    report += '='.repeat(60) + '\n';
    return report;
  }

  /**
   * 生成摘要信息
   */
  generateSummary() {
    const total = this.results.length;
    const success = this.results.filter(r => r.status === 'ok').length;
    const failed = this.results.filter(r => r.status === 'error' || r.status === 'failed').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    return {
      total,
      success,
      failed,
      warnings,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0
    };
  }

  /**
   * 保存报告到文件
   */
  saveReport(filename, format = 'json') {
    const outputDir = path.join(__dirname, '..', 'reports');
    
    // 创建输出目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);
    const content = format === 'json' ? this.generateJSON() : this.generateText();
    
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * 清空结果
   */
  clear() {
    this.results = [];
  }
}

module.exports = new ReportGenerator();
