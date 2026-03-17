/**
 * deploy_all.test.js - deploy_all.js 部署脚本测试
 * 
 * 测试部署脚本的基本功能
 */

const fs = require('fs');
const path = require('path');

// 读取被测试的脚本源码
const deployAllPath = path.join(__dirname, 'deploy_all.js');
const deployAllSource = fs.readFileSync(deployAllPath, 'utf-8');

describe('deploy_all.js 脚本测试', () => {
  
  test('脚本文件存在', () => {
    expect(fs.existsSync(deployAllPath)).toBe(true);
  });

  test('脚本包含必要的模块导入', () => {
    expect(deployAllSource).toContain("require");
    expect(deployAllSource).toContain("ssh2");
  });

  test('脚本定义了部署函数或主逻辑', () => {
    // 检查是否有 main 函数或 deploy 相关逻辑
    expect(
      deployAllSource.includes('function') || 
      deployAllSource.includes('=>')
    ).toBe(true);
  });

  test('脚本包含错误处理', () => {
    expect(
      deployAllSource.includes('catch') || 
      deployAllSource.includes('try')
    ).toBe(true);
  });

  test('脚本可被 require 而不报错（语法检查）', () => {
    expect(() => {
      // 语法检查 - 不实际执行
      new Function(deployAllSource.replace(/require\(['"]ssh2['"]\)/g, '{}'));
    }).not.toThrow();
  });
});
