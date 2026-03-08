#!/usr/bin/env node

/**
 * Tool Health Validator
 * Tests and validates all tools in the tools directory
 * 
 * Usage:
 *   node tool-health-validator.js              # Run all tests
 *   node tool-health-validator.js --quick     # Quick syntax check only
 *   node tool-health-validator.js --report     # Generate detailed report
 *   node tool-health-validator.js --watch      # Continuous monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOOLS_DIR = path.join(__dirname);
const STATE_DIR = path.join(__dirname, '..', 'state', 'tool-validation');
const REPORT_FILE = path.join(STATE_DIR, 'latest-report.json');

// Ensure state directory exists
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// Parse arguments
const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isReport = args.includes('--report');
const isWatch = args.includes('--watch');
const isVerbose = args.includes('--verbose');

// Categories of tools to test
const TOOL_CATEGORIES = {
  'api': ['api-', 'smart-'],
  'cluster': ['cluster-', 'resource-'],
  'automation': ['workflow', 'task-', 'autonomous'],
  'monitoring': ['monitor', 'health', 'alert'],
  'analytics': ['cost', 'session', 'log', 'memory'],
  'utility': ['config', 'evomap']
};

// Get list of JS tools
function getToolFiles() {
  const files = fs.readdirSync(TOOLS_DIR)
    .filter(f => f.endsWith('.js') && !f.startsWith('tool-health'))
    .filter(f => {
      const stat = fs.statSync(path.join(TOOLS_DIR, f));
      return stat.isFile();
    });
  return files;
}

// Test tool syntax by parsing
function testSyntax(toolPath) {
  try {
    require.resolve(toolPath);
    return { success: true, error: null };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Test tool by loading and checking help
function testToolExecution(toolName) {
  const toolPath = path.join(TOOLS_DIR, toolName);
  const results = {
    name: toolName,
    path: toolPath,
    syntax: null,
    help: null,
    execution: null,
    category: null,
    timestamp: new Date().toISOString()
  };

  // Test syntax - read file and check for obvious errors
  try {
    const content = fs.readFileSync(toolPath, 'utf8');
    // Check for basic syntax issues (not perfect but catches obvious problems)
    const lines = content.split('\n');
    let braceCount = 0;
    let parenCount = 0;
    let hasMain = false;
    
    for (const line of lines) {
      // Count braces
      for (const char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
      }
      // Check for main function
      if (line.includes('function main') || line.includes('const main') || line.includes('main()')) {
        hasMain = true;
      }
    }
    
    // Basic checks
    if (braceCount !== 0) {
      results.syntax = { success: false, error: `Brace mismatch: ${braceCount}` };
    } else if (parenCount !== 0) {
      results.syntax = { success: false, error: `Parenthesis mismatch: ${parenCount}` };
    } else if (content.length < 100) {
      results.syntax = { success: false, error: 'File too small' };
    } else {
      results.syntax = { success: true };
    }
  } catch (e) {
    results.syntax = { success: false, error: e.message };
    return results;
  }

  // Determine category
  for (const [cat, prefixes] of Object.entries(TOOL_CATEGORIES)) {
    if (prefixes.some(p => toolName.startsWith(p) || toolName.includes(p))) {
      results.category = cat;
      break;
    }
  }
  if (!results.category) results.category = 'other';

  // Try to get help (if not quick mode)
  if (!isQuick) {
    try {
      const helpOutput = execSync(`node "${toolPath}" --help 2>&1`, {
        timeout: 3000,  // 3 second timeout
        encoding: 'utf8'
      });
      results.help = { success: true, output: helpOutput.substring(0, 200) };
    } catch (e) {
      // --help might not exist or tool might fail
      const output = e.stdout || e.stderr || '';
      if (output.includes('help') || output.includes('Usage') || output.includes('options')) {
        results.help = { success: true, output: output.substring(0, 200) };
      } else if (e.message && e.message.includes('timeout')) {
        results.help = { success: false, error: 'Timeout' };
      } else {
        results.help = { success: false, error: output.substring(0, 100) };
      }
    }
  }

  return results;
}

// Run full validation
function runValidation() {
  console.log('🔍 Tool Health Validator');
  console.log('='.repeat(50));
  
  const tools = getToolFiles();
  console.log(`📁 Found ${tools.length} tools to validate\n`);
  
  const results = {
    total: tools.length,
    passed: 0,
    failed: 0,
    warnings: 0,
    tools: [],
    categories: {},
    timestamp: new Date().toISOString()
  };

  // Test each tool
  for (const tool of tools) {
    process.stdout.write(`Testing ${tool}... `);
    
    const result = testToolExecution(tool);
    results.tools.push(result);
    
    if (result.syntax && result.syntax.success) {
      results.passed++;
      console.log('✅');
    } else {
      results.failed++;
      console.log('❌');
      if (isVerbose && result.syntax.error) {
        console.log(`   Error: ${result.syntax.error}`);
      }
    }
    
    // Track by category
    const cat = result.category || 'other';
    if (!results.categories[cat]) {
      results.categories[cat] = { total: 0, passed: 0, failed: 0 };
    }
    results.categories[cat].total++;
    if (result.syntax && result.syntax.success) {
      results.categories[cat].passed++;
    } else {
      results.categories[cat].failed++;
    }
  }

  // Save report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tools: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n🔴 Failed Tools:');
    results.tools
      .filter(t => !t.syntax || !t.syntax.success)
      .forEach(t => {
        console.log(`  - ${t.name}`);
        if (isVerbose && t.syntax && t.syntax.error) {
          console.log(`    Error: ${t.syntax.error.substring(0, 80)}`);
        }
      });
  }
  
  console.log('\n📂 By Category:');
  for (const [cat, stats] of Object.entries(results.categories)) {
    const status = stats.failed > 0 ? '⚠️' : '✅';
    console.log(`  ${status} ${cat}: ${stats.passed}/${stats.total}`);
  }
  
  console.log(`\n📄 Report saved to: ${REPORT_FILE}`);
  
  // Health score
  const score = Math.round((results.passed / results.total) * 100);
  console.log(`\n🏥 Health Score: ${score}/100`);
  
  if (score >= 90) console.log('Status: ✅ Excellent');
  else if (score >= 70) console.log('Status: 🟡 Good');
  else console.log('Status: 🔴 Needs Attention');
  
  return results;
}

// Show report
function showReport() {
  if (!fs.existsSync(REPORT_FILE)) {
    console.log('❌ No report found. Run validation first.');
    return;
  }
  
  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
  
  console.log('📊 Tool Health Report');
  console.log('='.repeat(50));
  console.log(`Generated: ${report.timestamp}`);
  console.log(`Total Tools: ${report.total}`);
  console.log(`Health Score: ${Math.round((report.passed / report.total) * 100)}/100\n`);
  
  // List all tools with status
  console.log('📋 Tool Status:');
  for (const tool of report.tools) {
    const status = tool.syntax && tool.syntax.success ? '✅' : '❌';
    const cat = tool.category || 'other';
    console.log(`  ${status} ${tool.name} [${cat}]`);
  }
  
  console.log('\n📂 Category Summary:');
  for (const [cat, stats] of Object.entries(report.categories)) {
    console.log(`  ${cat}: ${stats.passed}/${stats.total} passed`);
  }
}

// Main
function main() {
  if (isReport) {
    showReport();
    return;
  }
  
  if (isWatch) {
    console.log('🔄 Continuous validation mode (Ctrl+C to stop)...\n');
    const interval = isWatch * 1000 || 60000;
    const run = () => {
      console.log(`\n⏰ ${new Date().toISOString()}`);
      runValidation();
    };
    run();
    setInterval(run, interval);
    return;
  }
  
  runValidation();
}

main();
