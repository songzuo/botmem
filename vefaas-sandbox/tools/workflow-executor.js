#!/usr/bin/env node

/**
 * Workflow Executor - 工作流编排执行器
 * 链式执行多个工具，生成综合报告和自动化任务
 * 
 * 使用方式:
 *   node workflow-executor.js --run daily-health      # 运行预定义工作流
 *   node workflow-executor.js --list                   # 列出所有工作流
 *   node workflow-executor.js --create --name=test --steps=step1,step2
 *   node workflow-executor.js --status                 # 查看执行状态
 *   node workflow-executor.js --composite health+backup  # 组合运行
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const WORKFLOW_FILE = path.join(__dirname, '..', 'state', 'workflows.json');
const LOG_FILE = path.join(__dirname, '..', 'state', 'workflow-executor.log');
const STATE_DIR = path.join(__dirname, '..', 'state');

// 确保目录存在
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// 预定义工作流模板
const WORKFLOW_TEMPLATES = {
  'daily-health': {
    name: '每日健康检查',
    description: '执行完整集群健康检查并生成报告',
    steps: [
      { tool: 'cluster-health-check.js', args: '--json' },
      { tool: 'api-health-check.js', args: '--brief' },
      { tool: 'resource-monitor.js', args: '--report' }
    ]
  },
  'api-diagnostics': {
    name: 'API诊断套件',
    description: '全面测试所有API Provider并生成诊断报告',
    steps: [
      { tool: 'api-health-check.js', args: '' },
      { tool: 'api-smart-router.js', args: '--test' },
      { tool: 'api-live-monitor.js', args: '--test' }
    ]
  },
  'backup-and-monitor': {
    name: '备份与监控',
    description: '配置备份 + 集群监控',
    steps: [
      { tool: 'config-backup-manager.js', args: '--backup' },
      { tool: 'cluster-monitor.js', args: '--report' }
    ]
  },
  'cost-analysis': {
    name: '成本分析',
    description: 'API成本追踪与分析',
    steps: [
      { tool: 'cost-tracker.js', args: '--report' },
      { tool: 'smart-model-selector.js', args: '--recommend' }
    ]
  },
  'log-audit': {
    name: '日志审计',
    description: '系统日志分析与错误检测',
    steps: [
      { tool: 'log-analyzer.js', args: '--hours=24 --json' },
      { tool: 'alert-manager.js', args: '--check' }
    ]
  }
};

// 加载工作流
function loadWorkflows() {
  let workflows = { ...WORKFLOW_TEMPLATES };
  if (fs.existsSync(WORKFLOW_FILE)) {
    try {
      const custom = JSON.parse(fs.readFileSync(WORKFLOW_FILE, 'utf8'));
      workflows = { ...workflows, ...custom };
    } catch (e) {}
  }
  return workflows;
}

// 保存工作流
function saveWorkflows(workflows) {
  fs.writeFileSync(WORKFLOW_FILE, JSON.stringify(workflows, null, 2));
}

// 日志记录
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  console.log(`[${level}] ${message}`);
}

// 执行单个工具
function executeTool(toolName, args = '') {
  const toolPath = path.join(__dirname, toolName);
  
  if (!fs.existsSync(toolPath)) {
    return { success: false, error: `Tool not found: ${toolName}` };
  }
  
  try {
    const cmd = `node ${toolPath} ${args}`;
    const output = execSync(cmd, { 
      encoding: 'utf8', 
      timeout: 60000,
      cwd: __dirname
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

// 运行工作流
async function runWorkflow(workflowName, options = {}) {
  const workflows = loadWorkflows();
  const workflow = workflows[workflowName];
  
  if (!workflow) {
    log(`工作流未找到: ${workflowName}`, 'ERROR');
    console.log(`\n可用工作流:\n${Object.keys(workflows).map(k => `  - ${k}`).join('\n')}`);
    return;
  }
  
  log(`开始执行工作流: ${workflowName} (${workflow.name})`);
  console.log(`\n📋 工作流: ${workflow.name}`);
  console.log(`📝 ${workflow.description}\n`);
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    const stepName = `${i + 1}. ${step.tool} ${step.args || ''}`.trim();
    
    console.log(`\n▶ 步骤 ${i + 1}/${workflow.steps.length}: ${step.tool}`);
    
    const stepStart = Date.now();
    const result = executeTool(step.tool, step.args);
    const stepDuration = ((Date.now() - stepStart) / 1000).toFixed(1);
    
    const stepResult = {
      step: stepName,
      tool: step.tool,
      args: step.args,
      success: result.success,
      duration: stepDuration + 's',
      output: result.output || result.error
    };
    
    results.push(stepResult);
    
    if (result.success) {
      console.log(`  ✅ 成功 (${stepDuration}s)`);
      if (options.verbose && result.output) {
        console.log(`  📄 输出:\n${result.output.substring(0, 500)}`);
      }
    } else {
      console.log(`  ❌ 失败: ${result.error}`);
      if (!options.continueOnError) {
        log(`工作流中断: ${workflowName}, 步骤失败: ${step.tool}`, 'ERROR');
        break;
      }
    }
  }
  
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 工作流完成: ${successCount}/${results.length} 步骤成功`);
  console.log(`⏱️  总耗时: ${totalDuration}s`);
  console.log(`${'='.repeat(50)}\n`);
  
  log(`工作流完成: ${workflowName}, 成功: ${successCount}/${results.length}, 耗时: ${totalDuration}s`);
  
  return { workflow: workflowName, results, totalDuration, successCount };
}

// 组合运行多个工作流
async function compositeRun(workflowNames, options = {}) {
  const workflows = loadWorkflows();
  const names = workflowNames.split('+');
  
  console.log(`\n🔄 组合运行: ${names.join(' + ')}\n`);
  
  const allResults = [];
  
  for (const name of names) {
    const trimmed = name.trim();
    if (!workflows[trimmed]) {
      console.log(`⚠️  工作流不存在: ${trimmed}`);
      continue;
    }
    
    const result = await runWorkflow(trimmed, { ...options, verbose: false });
    allResults.push(result);
  }
  
  const totalSuccess = allResults.reduce((sum, r) => sum + (r?.successCount || 0), 0);
  const totalSteps = allResults.reduce((sum, r) => sum + (r?.results?.length || 0), 0);
  
  console.log(`\n🎯 组合完成: ${totalSuccess}/${totalSteps} 步骤成功\n`);
  
  return allResults;
}

// 列出所有工作流
function listWorkflows() {
  const workflows = loadWorkflows();
  
  console.log('\n📋 可用工作流:\n');
  console.log('  预定义工作流:');
  for (const [key, wf] of Object.entries(WORKFLOW_TEMPLATES)) {
    console.log(`    ${key}`);
    console.log(`      名称: ${wf.name}`);
    console.log(`      描述: ${wf.description}`);
    console.log(`      步骤: ${wf.steps.length}个`);
  }
  
  // 自定义工作流
  const customKeys = Object.keys(workflows).filter(k => !WORKFLOW_TEMPLATES[k]);
  if (customKeys.length > 0) {
    console.log('\n  自定义工作流:');
    for (const key of customKeys) {
      const wf = workflows[key];
      console.log(`    ${key}`);
      console.log(`      名称: ${wf.name}`);
      console.log(`      步骤: ${wf.steps.length}个`);
    }
  }
  
  console.log('\n');
}

// 主程序
function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  let action = null;
  let workflowName = null;
  let compositeNames = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--run':
        action = 'run';
        workflowName = args[++i];
        break;
      case '--composite':
        action = 'composite';
        compositeNames = args[++i];
        break;
      case '--list':
        action = 'list';
        break;
      case '--status':
        action = 'status';
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--continue':
        options.continueOnError = true;
        break;
      default:
        if (arg.startsWith('--')) {
          // unknown option
        }
    }
  }
  
  switch (action) {
    case 'run':
      if (!workflowName) {
        console.log('用法: --run <工作流名称>');
        console.log('示例: --run daily-health');
        process.exit(1);
      }
      runWorkflow(workflowName, options);
      break;
      
    case 'composite':
      if (!compositeNames) {
        console.log('用法: --composite <工作流1+工作流2+...>');
        console.log('示例: --composite daily-health+cost-analysis');
        process.exit(1);
      }
      compositeRun(compositeNames, options);
      break;
      
    case 'list':
      listWorkflows();
      break;
      
    case 'status':
      const workflows = loadWorkflows();
      console.log('\n📊 工作流执行状态\n');
      console.log(`  预定义工作流: ${Object.keys(WORKFLOW_TEMPLATES).length}`);
      console.log(`  自定义工作流: ${Object.keys(workflows).length - Object.keys(WORKFLOW_TEMPLATES).length}`);
      console.log(`  日志文件: ${LOG_FILE}`);
      console.log();
      break;
      
    default:
      console.log(`
🔧 Workflow Executor - 工作流编排执行器

用法:
  node workflow-executor.js --run <工作流名>     运行指定工作流
  node workflow-executor.js --composite <工作流1+工作流2>  组合运行
  node workflow-executor.js --list               列出所有工作流
  node workflow-executor.js --status             查看状态
  node workflow-executor.js --verbose            详细输出
  node workflow-executor.js --continue           失败后继续

示例:
  node workflow-executor.js --run daily-health
  node workflow-executor.js --run api-diagnostics --verbose
  node workflow-executor.js --composite daily-health+cost-analysis
`);
  }
}

main();
