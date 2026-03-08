#!/usr/bin/env node

/**
 * Workflow Orchestrator - 自动化工作流编排器
 * 
 * 功能：
 * - 定义和执行自动化工作流
 * - 支持步骤串联、条件分支、错误处理
 * - 可与 task-scheduler 配合实现复杂自动化
 * 
 * 使用方式：
 * node workflow-orchestrator.js --list
 * node workflow-orchestrator.js --run daily-health
 * node workflow-orchestrator.js --run backup-and-monitor
 * node workflow-orchestrator.js --add --name=test-workflow --steps='[{"tool":"echo","args":"hello"}]'
 * node workflow-orchestrator.js --delete test-workflow
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const WORKFLOWS_FILE = path.join(__dirname, 'workflows.json');
const LOG_DIR = path.join(__dirname, '..', 'state', 'workflow-logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 加载工作流定义
function loadWorkflows() {
  if (!fs.existsSync(WORKFLOWS_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(WORKFLOWS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// 保存工作流定义
function saveWorkflows(workflows) {
  fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
}

// 记录执行日志
function logExecution(workflowName, status, steps, duration) {
  const logFile = path.join(LOG_DIR, `${workflowName}-${Date.now()}.log`);
  const log = {
    workflow: workflowName,
    status,
    timestamp: new Date().toISOString(),
    duration: `${duration}ms`,
    steps: steps.map(s => ({
      tool: s.tool,
      status: s.status,
      output: s.output?.substring(0, 500),
      error: s.error?.substring(0, 500)
    }))
  };
  fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  return logFile;
}

// 执行单个工具步骤
async function executeStep(step, context) {
  const { tool, args = [], opts = {} } = step;
  let output = '';
  let error = null;
  let status = 'success';

  try {
    console.log(`  🔄 执行步骤: ${tool} ${args.join(' ')}`);
    
    // 处理内置命令
    if (tool === 'echo') {
      output = args.join(' ').replace(/\{(\w+)\}/g, (_, k) => context[k] || `{${k}}`);
    } else if (tool === 'sleep') {
      await new Promise(r => setTimeout(r, parseInt(args[0]) || 1000));
      output = `Slept ${args[0] || 1}s`;
    } else if (tool === 'date') {
      output = new Date().toISOString();
    } else if (tool === 'context') {
      output = JSON.stringify(context, null, 2);
    } else if (tool === 'set') {
      const [key, value] = args;
      context[key] = value || 'true';
      output = `Set ${key}=${value}`;
    } else if (tool === 'condition') {
      const [expr, trueVal, falseVal] = args;
      try {
        const result = new Function('context', `with(context) { return ${expr}; }`)(context);
        output = result ? trueVal : falseVal;
      } catch (e) {
        output = falseVal;
      }
    } else if (tool === 'notify') {
      // 内置通知功能 - 打印到控制台
      output = `📢 通知: ${args.join(' ')}`;
      console.log(`  ${output}`);
    } else {
      // 执行外部工具
      const toolPath = path.join(__dirname, tool);
      if (fs.existsSync(toolPath)) {
        const result = execSync(`node ${toolPath} ${args.join(' ')}`, {
          encoding: 'utf8',
          timeout: opts.timeout || 60000,
          cwd: __dirname
        });
        output = result;
      } else if (fs.existsSync(path.join(__dirname, '..', tool))) {
        const result = execSync(`node ${path.join(__dirname, '..', tool)} ${args.join(' ')}`, {
          encoding: 'utf8',
          timeout: opts.timeout || 60000,
          cwd: __dirname
        });
        output = result;
      } else {
        // 尝试作为shell命令执行
        const result = execSync(`${tool} ${args.join(' ')}`, {
          encoding: 'utf8',
          timeout: opts.timeout || 60000
        });
        output = result;
      }
    }
    
    console.log(`  ✅ 完成: ${output.substring(0, 100)}`);
  } catch (e) {
    error = e.message;
    status = 'error';
    console.log(`  ❌ 错误: ${error}`);
  }

  return { tool, args: args.join(' '), status, output, error };
}

// 执行工作流
async function runWorkflow(workflowName, manualContext = {}) {
  const workflows = loadWorkflows();
  const workflow = workflows[workflowName];
  
  if (!workflow) {
    console.error(`❌ 工作流不存在: ${workflowName}`);
    console.log(`可用工作流: ${Object.keys(workflows).join(', ') || '无'}`);
    process.exit(1);
  }

  console.log(`\n🚀 开始执行工作流: ${workflowName}`);
  console.log(`📝 描述: ${workflow.description || '无'}\n`);
  
  const startTime = Date.now();
  const context = { 
    ...workflow.context || {},
    ...manualContext,
    _startTime: new Date().toISOString(),
    _workflow: workflowName
  };
  
  const steps = workflow.steps || [];
  let stepResults = [];
  let shouldContinue = true;

  for (let i = 0; i < steps.length && shouldContinue; i++) {
    const step = steps[i];
    console.log(`\n📋 步骤 ${i + 1}/${steps.length}: ${step.tool}`);
    
    const result = await executeStep(step, context);
    stepResults.push(result);
    
    // 更新上下文
    if (result.output) {
      context[`_step_${i}_output`] = result.output;
      // 如果步骤有 name，将输出存为变量
      if (step.name) {
        context[step.name] = result.output.trim();
      }
    }
    
    // 错误处理
    if (result.status === 'error') {
      if (workflow.onError === 'continue') {
        console.log(`  ⚠️  错误继续执行 (onError=continue)`);
      } else if (workflow.onError === 'stop') {
        console.log(`  🛑 停止执行 (onError=stop)`);
        shouldContinue = false;
      } else {
        // 默认停止
        shouldContinue = false;
      }
    }
    
    // 条件跳过
    if (step.if) {
      try {
        const condition = new Function('context', `with(context) { return ${step.if}; }`)(context);
        if (!condition) {
          console.log(`  ⏭️  条件不满足，跳过步骤`);
          shouldContinue = false;
          break;
        }
      } catch (e) {
        console.log(`  ⚠️  条件评估错误: ${e.message}`);
      }
    }
  }

  const duration = Date.now() - startTime;
  const status = stepResults.every(s => s.status === 'success') ? 'success' : 'partial';
  
  console.log(`\n✅ 工作流完成: ${workflowName} (${duration}ms)`);
  console.log(`📊 步骤结果: ${stepResults.filter(s => s.status === 'success').length}/${steps.length} 成功`);
  
  const logFile = logExecution(workflowName, status, stepResults, duration);
  console.log(`📝 日志: ${logFile}`);
  
  return { status, steps: stepResults, context, duration };
}

// 列出所有工作流
function listWorkflows() {
  const workflows = loadWorkflows();
  const names = Object.keys(workflows);
  
  if (names.length === 0) {
    console.log('📋 暂无定义的工作流');
    console.log('\n使用 --add 创建新工作流');
    return;
  }
  
  console.log('📋 已定义的工作流:\n');
  names.forEach(name => {
    const w = workflows[name];
    console.log(`  ${name}`);
    console.log(`    描述: ${w.description || '无'}`);
    console.log(`    步骤: ${w.steps?.length || 0} 个`);
    console.log(`    错误处理: ${w.onError || 'stop'}`);
    console.log();
  });
}

// 添加新工作流
function addWorkflow(name, description, steps) {
  const workflows = loadWorkflows();
  
  if (workflows[name]) {
    console.log(`⚠️  工作流 ${name} 已存在，使用 --update 或 --delete`);
    return;
  }
  
  workflows[name] = {
    description,
    steps: typeof steps === 'string' ? JSON.parse(steps) : steps,
    createdAt: new Date().toISOString(),
    onError: 'stop'
  };
  
  saveWorkflows(workflows);
  console.log(`✅ 工作流 ${name} 已创建`);
}

// 删除工作流
function deleteWorkflow(name) {
  const workflows = loadWorkflows();
  
  if (!workflows[name]) {
    console.log(`⚠️  工作流 ${name} 不存在`);
    return;
  }
  
  delete workflows[name];
  saveWorkflows(workflows);
  console.log(`✅ 工作流 ${name} 已删除`);
}

// 显示工作流详情
function showWorkflow(name) {
  const workflows = loadWorkflows();
  const workflow = workflows[name];
  
  if (!workflow) {
    console.log(`❌ 工作流不存在: ${name}`);
    return;
  }
  
  console.log(`\n📋 工作流: ${name}`);
  console.log(`描述: ${workflow.description || '无'}`);
  console.log(`错误处理: ${workflow.onError || 'stop'}`);
  console.log(`创建时间: ${workflow.createdAt || '未知'}`);
  console.log(`\n步骤:`);
  
  (workflow.steps || []).forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.tool} ${step.args?.join(' ')}`);
    if (step.if) console.log(`     条件: ${step.if}`);
    if (step.name) console.log(`     变量: ${step.name}`);
  });
}

// CLI 入口
function main() {
  const args = process.argv.slice(2);
  const commands = {
    '--list': () => listWorkflows(),
    '--run': (name) => runWorkflow(name),
    '--add': () => {
      const nameIdx = args.indexOf('--name') + 1;
      const descIdx = args.indexOf('--description') + 1;
      const stepsIdx = args.indexOf('--steps') + 1;
      
      if (!nameIdx || !stepsIdx) {
        console.log('用法: --add --name=xxx --description="描述" --steps=\'[{"tool":"echo","args":["hello"]}]\'');
        return;
      }
      
      const name = args[nameIdx];
      const description = descIdx ? args[descIdx] : '';
      const steps = JSON.parse(args[stepsIdx]);
      
      addWorkflow(name, description, steps);
    },
    '--delete': (name) => deleteWorkflow(name),
    '--show': (name) => showWorkflow(name),
    '--help': () => {
      console.log(`
🔧 Workflow Orchestrator - 工作流编排器

用法:
  node workflow-orchestrator.js --list                    列出所有工作流
  node workflow-orchestrator.js --run <name>                执行工作流
  node workflow-orchestrator.js --show <name>               显示工作流详情
  node workflow-orchestrator.js --add --name=xxx --steps='[{"tool":"echo","args":["hello"]}]'
  node workflow-orchestrator.js --delete <name>             删除工作流

内置工具:
  echo <text>              - 输出文本
  sleep <ms>               - 延迟
  date                     - 当前时间
  set <key> <value>        - 设置变量
  condition <expr> <true> <false> - 条件表达式
  notify <message>         - 通知

示例工作流定义:
{
  "description": "每日健康检查",
  "onError": "continue",
  "steps": [
    {"tool": "echo", "args": ["开始健康检查"]},
    {"tool": "cluster-health-check.js", "args": ["--simple"], "name": "health_result"},
    {"tool": "condition", "args": ["health_result.includes('PASS')", "notify 健康检查通过", "notify 健康检查失败"]}
  ]
}
`);
    }
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (commands[arg]) {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        commands[arg](nextArg);
      } else {
        commands[arg]();
      }
      return;
    }
  }
  
  // 默认显示帮助
  commands['--help']();
}

// 初始化默认工作流
function initDefaultWorkflows() {
  const workflows = loadWorkflows();
  
  if (!workflows['daily-health']) {
    workflows['daily-health'] = {
      description: '每日集群健康检查',
      onError: 'continue',
      steps: [
        { tool: 'echo', args: ['🏥 开始每日健康检查'] },
        { tool: 'date', name: 'check_time' },
        { tool: 'cluster-health-check.js', args: ['--simple'], name: 'health_result' },
        { tool: 'echo', args: ['检查完成: {health_result}'] }
      ],
      createdAt: new Date().toISOString()
    };
  }
  
  if (!workflows['api-diagnostic']) {
    workflows['api-diagnostic'] = {
      description: 'API Provider 诊断',
      onError: 'continue',
      steps: [
        { tool: 'echo', args: ['🔍 开始API诊断'] },
        { tool: 'api-diagnoser.js', name: 'diag_result' },
        { tool: 'echo', args: ['诊断结果: {diag_result}'] }
      ],
      createdAt: new Date().toISOString()
    };
  }
  
  saveWorkflows(workflows);
}

// 初始化
initDefaultWorkflows();

// 运行
main();
