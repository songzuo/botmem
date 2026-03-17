/**
 * 报告生成器模块测试
 */

const fs = require('fs');
const path = require('path');

// 直接使用导出的单例
const ReportGenerator = require('../scripts/report-generator');

describe('ReportGenerator', () => {
  // 每个测试前重置状态
  beforeEach(() => {
    ReportGenerator.clear();
  });

  describe('addResult', () => {
    test('应添加检查结果到列表', () => {
      ReportGenerator.addResult({ name: 'test-host', status: 'ok', message: 'Success' });
      expect(ReportGenerator.results.length).toBe(1);
    });

    test('应自动添加时间戳', () => {
      ReportGenerator.addResult({ name: 'test-host', status: 'ok' });
      expect(ReportGenerator.results[0].timestamp).toBeDefined();
      expect(ReportGenerator.results[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('应保留原始结果的所有字段', () => {
      const originalResult = {
        name: 'test',
        status: 'ok',
        message: 'test message',
        details: { key: 'value' },
        customField: 'custom value'
      };

      ReportGenerator.addResult(originalResult);

      expect(ReportGenerator.results[0].name).toBe('test');
      expect(ReportGenerator.results[0].status).toBe('ok');
      expect(ReportGenerator.results[0].message).toBe('test message');
      expect(ReportGenerator.results[0].details).toEqual({ key: 'value' });
      expect(ReportGenerator.results[0].customField).toBe('custom value');
    });

    test('应支持添加多个结果', () => {
      ReportGenerator.addResult({ name: 'host1', status: 'ok' });
      ReportGenerator.addResult({ name: 'host2', status: 'error' });
      ReportGenerator.addResult({ name: 'host3', status: 'warning' });

      expect(ReportGenerator.results.length).toBe(3);
    });
  });

  describe('generateJSON', () => {
    test('应生成有效的 JSON 字符串', () => {
      ReportGenerator.addResult({ name: 'host1', status: 'ok' });
      ReportGenerator.addResult({ name: 'host2', status: 'error' });

      const json = ReportGenerator.generateJSON();
      const parsed = JSON.parse(json);

      expect(parsed.summary).toBeDefined();
      expect(parsed.results).toHaveLength(2);
    });

    test('应正确计算摘要', () => {
      ReportGenerator.addResult({ name: 'host1', status: 'ok' });
      ReportGenerator.addResult({ name: 'host2', status: 'ok' });
      ReportGenerator.addResult({ name: 'host3', status: 'error' });
      ReportGenerator.addResult({ name: 'host4', status: 'warning' });

      const json = ReportGenerator.generateJSON();
      const parsed = JSON.parse(json);

      expect(parsed.summary.total).toBe(4);
      expect(parsed.summary.success).toBe(2);
      expect(parsed.summary.failed).toBe(1);
      expect(parsed.summary.warnings).toBe(1);
      expect(parsed.summary.successRate).toBe(50);
    });

    test('应包含生成时间', () => {
      const json = ReportGenerator.generateJSON();
      const parsed = JSON.parse(json);

      expect(parsed.generated_at).toBeDefined();
      expect(parsed.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('空结果时应生成有效报告', () => {
      const json = ReportGenerator.generateJSON();
      const parsed = JSON.parse(json);

      expect(parsed.summary.total).toBe(0);
      expect(parsed.summary.success).toBe(0);
      expect(parsed.summary.successRate).toBe(0);
      expect(parsed.results).toEqual([]);
    });

    test('应正确序列化嵌套对象', () => {
      ReportGenerator.addResult({
        name: 'test',
        status: 'ok',
        details: {
          cpu: { usage: 50, cores: 4 },
          memory: { total: 8000, used: 4000 }
        }
      });

      const json = ReportGenerator.generateJSON();
      const parsed = JSON.parse(json);

      expect(parsed.results[0].details.cpu.usage).toBe(50);
      expect(parsed.results[0].details.memory.used).toBe(4000);
    });
  });

  describe('generateText', () => {
    test('应生成格式化的文本报告', () => {
      ReportGenerator.addResult({ name: 'test-host', status: 'ok', message: 'All good' });

      const text = ReportGenerator.generateText();

      expect(text).toContain('巡视图检查报告');
      expect(text).toContain('test-host');
      expect(text).toContain('✓');
    });

    test('应显示正确的状态符号', () => {
      ReportGenerator.addResult({ name: 'ok-test', status: 'ok' });
      ReportGenerator.addResult({ name: 'warning-test', status: 'warning' });
      ReportGenerator.addResult({ name: 'error-test', status: 'error' });
      ReportGenerator.addResult({ name: 'failed-test', status: 'failed' });

      const text = ReportGenerator.generateText();

      expect(text).toContain('[✓] ok-test');
      expect(text).toContain('[⚠] warning-test');
      expect(text).toContain('[✗] error-test');
      expect(text).toContain('[✗] failed-test');
    });

    test('应使用 host 字段作为后备名称', () => {
      ReportGenerator.addResult({ host: 'backup-host', status: 'ok', message: 'test' });

      const text = ReportGenerator.generateText();

      expect(text).toContain('backup-host');
    });

    test('应显示 Unknown 当没有名称字段时', () => {
      ReportGenerator.addResult({ status: 'ok', message: 'test' });

      const text = ReportGenerator.generateText();

      expect(text).toContain('Unknown');
    });

    test('应包含消息和详情', () => {
      ReportGenerator.addResult({
        name: 'test',
        status: 'ok',
        message: 'test message',
        details: { key: 'value' }
      });

      const text = ReportGenerator.generateText();

      expect(text).toContain('test message');
      expect(text).toContain('key');
    });

    test('空结果时应生成有效报告', () => {
      const text = ReportGenerator.generateText();

      expect(text).toContain('巡视图检查报告');
      expect(text).toContain('总检查数: 0');
      expect(text).toContain('成功: 0 (0%)');
    });
  });

  describe('generateSummary', () => {
    test('应正确统计各种状态', () => {
      ReportGenerator.addResult({ status: 'ok' });
      ReportGenerator.addResult({ status: 'ok' });
      ReportGenerator.addResult({ status: 'error' });
      ReportGenerator.addResult({ status: 'warning' });
      ReportGenerator.addResult({ status: 'failed' });

      const summary = ReportGenerator.generateSummary();

      expect(summary.total).toBe(5);
      expect(summary.success).toBe(2);
      expect(summary.failed).toBe(2);
      expect(summary.warnings).toBe(1);
      expect(summary.successRate).toBe(40);
    });

    test('应计算正确的成功率', () => {
      ReportGenerator.addResult({ status: 'ok' });
      ReportGenerator.addResult({ status: 'ok' });
      ReportGenerator.addResult({ status: 'ok' });

      const summary = ReportGenerator.generateSummary();

      expect(summary.successRate).toBe(100);
    });

    test('应处理混合状态', () => {
      ReportGenerator.addResult({ status: 'ok' });
      ReportGenerator.addResult({ status: 'warning' });
      ReportGenerator.addResult({ status: 'error' });

      const summary = ReportGenerator.generateSummary();

      expect(summary.total).toBe(3);
      expect(summary.success).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.warnings).toBe(1);
      expect(summary.successRate).toBe(33);
    });
  });

  describe('saveReport', () => {
    const reportsDir = path.join(__dirname, '..', 'reports');

    afterEach(() => {
      // 清理测试生成的报告文件
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir);
        files.forEach(file => {
          if (file.startsWith('test-report-')) {
            fs.unlinkSync(path.join(reportsDir, file));
          }
        });
      }
    });

    test('应保存 JSON 报告到文件', () => {
      ReportGenerator.addResult({ name: 'test', status: 'ok' });

      const filePath = ReportGenerator.saveReport('test-report.json', 'json');

      expect(fs.existsSync(filePath)).toBe(true);
      expect(filePath).toContain('reports/test-report.json');

      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.results.length).toBe(1);
    });

    test('应保存文本报告到文件', () => {
      ReportGenerator.addResult({ name: 'test', status: 'ok' });

      const filePath = ReportGenerator.saveReport('test-report.txt', 'text');

      expect(fs.existsSync(filePath)).toBe(true);
      expect(filePath).toContain('reports/test-report.txt');

      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('巡视图检查报告');
    });

    test('应创建 reports 目录如果不存在', () => {
      const tempReportsDir = path.join(__dirname, '..', 'reports');
      if (fs.existsSync(tempReportsDir)) {
        fs.rmSync(tempReportsDir, { recursive: true, force: true });
      }

      ReportGenerator.addResult({ name: 'test', status: 'ok' });
      const filePath = ReportGenerator.saveReport('test-report.json', 'json');

      expect(fs.existsSync(tempReportsDir)).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);

      fs.unlinkSync(filePath);
    });

    test('应覆盖同名文件', () => {
      ReportGenerator.addResult({ name: 'test1', status: 'ok' });
      ReportGenerator.saveReport('test-report.json', 'json');

      ReportGenerator.clear();
      ReportGenerator.addResult({ name: 'test2', status: 'error' });
      ReportGenerator.saveReport('test-report.json', 'json');

      const content = fs.readFileSync(
        path.join(reportsDir, 'test-report.json'),
        'utf8'
      );
      const parsed = JSON.parse(content);
      expect(parsed.results[0].name).toBe('test2');
    });
  });

  describe('clear', () => {
    test('应清空所有结果', () => {
      ReportGenerator.addResult({ name: 'test1', status: 'ok' });
      ReportGenerator.addResult({ name: 'test2', status: 'ok' });

      ReportGenerator.clear();

      expect(ReportGenerator.results.length).toBe(0);
    });

    test('应允许多次清空', () => {
      ReportGenerator.addResult({ name: 'test', status: 'ok' });
      ReportGenerator.clear();
      ReportGenerator.clear();
      ReportGenerator.clear();

      expect(ReportGenerator.results.length).toBe(0);
    });
  });
});
