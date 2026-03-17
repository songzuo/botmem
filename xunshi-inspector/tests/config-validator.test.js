/**
 * 配置文件验证模块测试
 */

const ConfigValidator = require('../scripts/config-validator');
const fs = require('fs');
const path = require('path');

describe('ConfigValidator', () => {
  const testConfigPath = path.join(__dirname, 'test-config.json');

  beforeEach(() => {
    // 重置验证器状态
    ConfigValidator.errors = [];
    ConfigValidator.warnings = [];
  });

  afterEach(() => {
    // 清理测试文件
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('validateProjectConfig', () => {
    test('应返回默认配置当文件不存在时', () => {
      const result = ConfigValidator.validateProjectConfig('/nonexistent/path.json');
      expect(result.valid).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config.name).toBe('xunshi-inspector');
      expect(result.warnings).toContainEqual(expect.stringContaining('配置文件不存在'));
    });

    test('应验证有效的配置文件', () => {
      const validConfig = {
        name: 'test-inspector',
        version: '1.0.0',
        timeout: 5000,
        retries: 5,
        hosts: ['localhost']
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(validConfig));
      const result = ConfigValidator.validateProjectConfig(testConfigPath);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.config.name).toBe('test-inspector');
    });

    test('应检测缺少必需字段', () => {
      const invalidConfig = {
        timeout: 5000
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(invalidConfig));
      const result = ConfigValidator.validateProjectConfig(testConfigPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('缺少必需字段: name');
      expect(result.errors).toContain('缺少必需字段: version');
    });

    test('应检测无效的 timeout 值', () => {
      const invalidConfig = {
        name: 'test',
        version: '1.0.0',
        timeout: -100
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(invalidConfig));
      const result = ConfigValidator.validateProjectConfig(testConfigPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout 必须是正数');
    });

    test('应检测 timeout 为非数字', () => {
      const invalidConfig = {
        name: 'test',
        version: '1.0.0',
        timeout: 'invalid'
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(invalidConfig));
      const result = ConfigValidator.validateProjectConfig(testConfigPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('timeout 必须是正数');
    });

    test('应生成警告当字段缺失时', () => {
      const partialConfig = {
        name: 'test',
        version: '1.0.0'
      };

      fs.writeFileSync(testConfigPath, JSON.stringify(partialConfig));
      const result = ConfigValidator.validateProjectConfig(testConfigPath);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('未设置 timeout，使用默认值 30000ms');
      expect(result.warnings).toContain('未设置 retries，使用默认值 3');
    });

    test('应处理 JSON 解析错误', () => {
      fs.writeFileSync(testConfigPath, 'invalid json {{{');
      const result = ConfigValidator.validateProjectConfig(testConfigPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('配置文件读取失败');
    });

    test('应处理无效的 JSON 格式', () => {
      fs.writeFileSync(testConfigPath, '{ broken: json }');
      const result = ConfigValidator.validateProjectConfig(testConfigPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('配置文件读取失败');
    });
  });

  describe('validateConfig', () => {
    test('应验证包含所有必需字段的配置', () => {
      const validConfig = {
        name: 'test',
        version: '1.0.0'
      };

      const result = ConfigValidator.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('应验证 hosts 为数组', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        hosts: 'not-an-array'
      };

      const result = ConfigValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('hosts 必须是数组');
    });

    test('应接受有效的 hosts 数组', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        hosts: ['host1', 'host2']
      };

      const result = ConfigValidator.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('应验证 retries 为正整数', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        retries: -1
      };

      const result = ConfigValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('retries 必须是正整数');
    });

    test('应验证 retries 为非数字', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        retries: 'invalid'
      };

      const result = ConfigValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('retries 必须是正整数');
    });

    test('应接受零作为有效的 retries 值', () => {
      const config = {
        name: 'test',
        version: '1.0.0',
        retries: 0
      };

      const result = ConfigValidator.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('应验证多个错误', () => {
      ConfigValidator.errors = [];
      ConfigValidator.warnings = [];
      const config = {
        hosts: 'invalid',
        timeout: -1,
        retries: 'invalid'
      };

      const result = ConfigValidator.validateConfig(config);
      // 注意：由于是单例，errors 会累积，但我们只需要验证包含预期的错误
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors).toContain('缺少必需字段: name');
      expect(result.errors).toContain('缺少必需字段: version');
      expect(result.errors).toContain('timeout 必须是正数');
    });
  });

  describe('getDefaultConfig', () => {
    test('应返回正确的默认配置', () => {
      const defaults = ConfigValidator.getDefaultConfig();

      expect(defaults.name).toBe('xunshi-inspector');
      expect(defaults.version).toBe('1.0.0');
      expect(defaults.timeout).toBe(30000);
      expect(defaults.retries).toBe(3);
      expect(Array.isArray(defaults.hosts)).toBe(true);
      expect(defaults.logging).toBeDefined();
      expect(defaults.logging.level).toBe('info');
      expect(defaults.logging.format).toBe('json');
    });

    test('应返回独立的配置对象', () => {
      const config1 = ConfigValidator.getDefaultConfig();
      const config2 = ConfigValidator.getDefaultConfig();

      config1.name = 'modified';
      expect(config2.name).toBe('xunshi-inspector');
    });
  });
});
