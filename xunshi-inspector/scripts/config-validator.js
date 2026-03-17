/**
 * 配置文件验证模块
 * 验证 inspector 配置的完整性和正确性
 */

const fs = require('fs');
const path = require('path');

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 验证项目配置文件
   */
  validateProjectConfig(configPath = './config.json') {
    this.errors = [];
    this.warnings = [];
    
    try {
      if (!fs.existsSync(configPath)) {
        this.warnings.push(`配置文件不存在: ${configPath}，使用默认配置`);
        return { valid: true, errors: [], warnings: this.warnings, config: this.getDefaultConfig() };
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return this.validateConfig(config);
    } catch (error) {
      this.errors.push(`配置文件读取失败: ${error.message}`);
      return { valid: false, errors: this.errors, warnings: this.warnings, config: null };
    }
  }

  /**
   * 验证配置对象
   */
  validateConfig(config) {
    // 必需字段
    const requiredFields = ['name', 'version'];
    for (const field of requiredFields) {
      if (!config[field]) {
        this.errors.push(`缺少必需字段: ${field}`);
      }
    }

    // 可选字段验证
    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
      this.errors.push('timeout 必须是正数');
    }

    if (config.retries && (typeof config.retries !== 'number' || config.retries < 0)) {
      this.errors.push('retries 必须是正整数');
    }

    if (config.hosts && !Array.isArray(config.hosts)) {
      this.errors.push('hosts 必须是数组');
    }

    // 警告
    if (!config.timeout) {
      this.warnings.push('未设置 timeout，使用默认值 30000ms');
    }

    if (!config.retries) {
      this.warnings.push('未设置 retries，使用默认值 3');
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      config: this.errors.length === 0 ? config : null
    };
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      name: 'xunshi-inspector',
      version: '1.0.0',
      timeout: 30000,
      retries: 3,
      hosts: [],
      logging: {
        level: 'info',
        format: 'json'
      }
    };
  }
}

module.exports = new ConfigValidator();
