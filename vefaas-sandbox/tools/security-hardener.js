#!/usr/bin/env node

/**
 * Security Hardening Tool
 * Addresses critical security issues found in OpenClaw security audit
 * 
 * Issues addressed:
 * - Control UI device auth disabled
 * - Small models requiring sandboxing
 * - Extensions without plugins.allow
 * - Workspace permissions
 * 
 * Usage:
 *   node security-hardener.js --audit          # Run security audit
 *   node security-hardener.js --fix             # Auto-fix issues
 *   node security-hardener.js --fix --dry-run   # Preview fixes
 *   node security-hardener.js --report          # Generate report
 *   node security-hardener.js --watch          # Continuous monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_DIR = '/workspace/projects/workspace';
const OPENCLAW_DIR = process.env.HOME + '/.openclaw';
const STATE_DIR = '/workspace/projects/workspace/state';

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(msg, color = RESET) {
  console.log(color + msg + RESET);
}

function logSuccess(msg) { log('✅ ' + msg, GREEN); }
function logError(msg) { log('❌ ' + msg, RED); }
function logWarn(msg) { log('⚠️  ' + msg, YELLOW); }
function logInfo(msg) { log('ℹ️  ' + msg, BLUE); }

// Parse command line args
const args = process.argv.slice(2);
const flags = {
  audit: args.includes('--audit'),
  fix: args.includes('--fix'),
  dryRun: args.includes('--dry-run'),
  report: args.includes('--report'),
  watch: args.includes('--watch'),
  verbose: args.includes('--verbose')
};

const WATCH_INTERVAL = 60000; // 1 minute

/**
 * Read OpenClaw configuration
 */
function readConfig() {
  const configPath = path.join(OPENCLAW_DIR, 'config.yaml');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return { path: configPath, content };
  } catch (e) {
    logError('Failed to read config: ' + e.message);
    return null;
  }
}

/**
 * Check workspace permissions
 */
function checkWorkspacePermissions() {
  const issues = [];
  
  try {
    const stats = fs.statSync(CONFIG_DIR);
    const mode = (stats.mode & 0o777).toString(8);
    
    if (mode !== '700' && mode !== '700') {
      issues.push({
        type: 'permission',
        severity: 'warning',
        current: mode,
        recommended: '700',
        message: `Workspace dir is readable by others (mode=${mode})`
      });
    }
  } catch (e) {
    issues.push({
      type: 'permission',
      severity: 'error',
      message: 'Cannot stat workspace directory'
    });
  }
  
  return issues;
}

/**
 * Check plugins.allow configuration
 */
function checkPluginsAllow() {
  const issues = [];
  const config = readConfig();
  
  if (!config) {
    issues.push({
      type: 'plugins',
      severity: 'warning',
      message: 'Cannot read config to check plugins.allow'
    });
    return issues;
  }
  
  // Check for extensions directory
  const extensionsDir = path.join(CONFIG_DIR, 'extensions');
  if (fs.existsSync(extensionsDir)) {
    const extensions = fs.readdirSync(extensionsDir);
    
    if (extensions.length > 0 && !config.content.includes('plugins:') && 
        !config.content.includes('plugins.allow')) {
      issues.push({
        type: 'plugins',
        severity: 'critical',
        message: `Extensions exist (${extensions.length}) but plugins.allow is not set`,
        extensions
      });
    }
  }
  
  return issues;
}

/**
 * Check control UI device auth
 */
function checkControlUIAuth() {
  const issues = [];
  const config = readConfig();
  
  if (!config) {
    return issues;
  }
  
  if (config.content.includes('dangerouslyDisableDeviceAuth=true')) {
    issues.push({
      type: 'control-ui',
      severity: 'critical',
      message: 'Control UI device auth disabled - dangerous for production',
      recommendation: 'Set gateway.controlUi.dangerouslyDisableDeviceAuth=false'
    });
  }
  
  return issues;
}

/**
 * Check model sandboxing requirements
 */
function checkModelSandboxing() {
  const issues = [];
  const config = readConfig();
  
  if (!config) {
    return issues;
  }
  
  // Check for small models in config
  const smallModelPatterns = [
    /Qwen2\.5-72B/,
    /Qwen2-72B/,
    /llama.*70b/i,
    /mixtral.*8x7b/i,
    /.*-72B/
  ];
  
  if (config.content.match(/model.*fallbacks/i)) {
    const hasSmallModel = smallModelPatterns.some(p => p.test(config.content));
    const hasSandbox = config.content.includes('sandbox') && 
                       config.content.includes('all');
    
    if (hasSmallModel && !hasSandbox) {
      issues.push({
        type: 'sandboxing',
        severity: 'critical',
        message: 'Small models detected but sandboxing not enabled for all sessions',
        recommendation: 'Set agents.defaults.sandbox.mode="all" or disable small model fallbacks'
      });
    }
  }
  
  return issues;
}

/**
 * Check multi-user setup risks
 */
function checkMultiUserRisks() {
  const issues = [];
  const config = readConfig();
  
  if (!config) {
    return issues;
  }
  
  // Check for open policies
  if (config.content.includes('dmPolicy="open"') || 
      config.content.includes('allowFrom: "*"')) {
    issues.push({
      type: 'multi-user',
      severity: 'warning',
      message: 'Potential multi-user setup detected with open policies',
      recommendation: 'Consider setting agents.defaults.sandbox.mode="all" and restricting tools'
    });
  }
  
  return issues;
}

/**
 * Fix workspace permissions
 */
function fixWorkspacePermissions(dryRun = false) {
  if (dryRun) {
    logInfo('DRY RUN: Would chmod 700 ' + CONFIG_DIR);
    return { success: true, dryRun: true };
  }
  
  try {
    fs.chmodSync(CONFIG_DIR, 0o700);
    logSuccess('Fixed workspace permissions to 700');
    return { success: true };
  } catch (e) {
    logError('Failed to fix permissions: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Fix plugins.allow configuration
 */
function fixPluginsAllow(extensions, dryRun = false) {
  const configPath = path.join(OPENCLAW_DIR, 'config.yaml');
  
  if (!fs.existsSync(configPath)) {
    return { success: false, error: 'Config file not found' };
  }
  
  let content = fs.readFileSync(configPath, 'utf8');
  const pluginIds = extensions.map(ext => {
    const extPath = path.join(CONFIG_DIR, 'extensions', ext, 'package.json');
    if (fs.existsSync(extPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(extPath, 'utf8'));
        return pkg.name || ext;
      } catch (e) {
        return ext;
      }
    }
    return ext;
  });
  
  const pluginsConfig = `plugins:
  allow:
${pluginIds.map(id => `    - ${id}`).join('\n')}`;
  
  if (content.includes('plugins:')) {
    // Replace existing plugins section
    content = content.replace(/plugins:[\s\S]*?(?=\n\w|$)/m, pluginsConfig);
  } else {
    // Add plugins section
    content += '\n' + pluginsConfig;
  }
  
  if (dryRun) {
    logInfo('DRY RUN: Would add plugins.allow to config');
    return { success: true, dryRun: true };
  }
  
  try {
    fs.writeFileSync(configPath, content);
    logSuccess('Added plugins.allow to config');
    return { success: true };
  } catch (e) {
    logError('Failed to update config: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Fix control UI device auth
 */
function fixControlUIAuth(dryRun = false) {
  const configPath = path.join(OPENCLAW_DIR, 'config.yaml');
  
  if (!fs.existsSync(configPath)) {
    return { success: false, error: 'Config file not found' };
  }
  
  let content = fs.readFileSync(configPath, 'utf8');
  
  if (content.includes('dangerouslyDisableDeviceAuth=true')) {
    if (dryRun) {
      logInfo('DRY RUN: Would disable dangerouslyDisableDeviceAuth');
      return { success: true, dryRun: true };
    }
    
    content = content.replace(/dangerouslyDisableDeviceAuth=true/g, 'dangerouslyDisableDeviceAuth=false');
    
    try {
      fs.writeFileSync(configPath, content);
      logSuccess('Disabled dangerouslyDisableDeviceAuth');
      return { success: true };
    } catch (e) {
      logError('Failed to update config: ' + e.message);
      return { success: false, error: e.message };
    }
  }
  
  return { success: true, message: 'Already disabled or not present' };
}

/**
 * Fix model sandboxing
 */
function fixModelSandboxing(dryRun = false) {
  const configPath = path.join(OPENCLAW_DIR, 'config.yaml');
  
  if (!fs.existsSync(configPath)) {
    return { success: false, error: 'Config file not found' };
  }
  
  let content = fs.readFileSync(configPath, 'utf8');
  let modified = false;
  
  // Add sandbox mode if not present
  if (!content.includes('sandbox:') && !content.includes('sandbox.mode')) {
    const sandboxConfig = `agents:
  defaults:
    sandbox:
      mode: all`;
    
    if (content.includes('agents:')) {
      content = content.replace(/agents:\s*defaults:/m, sandboxConfig + '\n    defaults:');
    } else {
      content += '\n' + sandboxConfig;
    }
    modified = true;
  }
  
  // Add tool restrictions
  if (!content.includes('tools.deny')) {
    const toolsConfig = `tools:
  deny:
    - group:web
    - browser`;
    
    content += '\n' + toolsConfig;
    modified = true;
  }
  
  if (dryRun) {
    logInfo('DRY RUN: Would add sandbox mode and tool restrictions');
    return { success: true, dryRun: true };
  }
  
  if (modified) {
    try {
      fs.writeFileSync(configPath, content);
      logSuccess('Added sandbox mode and tool restrictions');
      return { success: true };
    } catch (e) {
      logError('Failed to update config: ' + e.message);
      return { success: false, error: e.message };
    }
  }
  
  return { success: true, message: 'Already configured' };
}

/**
 * Run full security audit
 */
function runAudit() {
  log('\n🔍 Running Security Audit...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    issues: [],
    score: 100,
    checks: []
  };
  
  // Run all checks
  const checks = [
    { name: 'Workspace Permissions', fn: checkWorkspacePermissions },
    { name: 'Plugins Allow', fn: checkPluginsAllow },
    { name: 'Control UI Auth', fn: checkControlUIAuth },
    { name: 'Model Sandboxing', fn: checkModelSandboxing },
    { name: 'Multi-user Risks', fn: checkMultiUserRisks }
  ];
  
  for (const check of checks) {
    const issues = check.fn();
    results.checks.push({ name: check.name, issues });
    results.issues.push(...issues);
    
    // Calculate score
    for (const issue of issues) {
      if (issue.severity === 'critical') results.score -= 25;
      else if (issue.severity === 'warning') results.score -= 10;
    }
  }
  
  results.score = Math.max(0, results.score);
  
  // Print results
  log(`\n📊 Security Score: ${results.score}/100\n`);
  
  if (results.issues.length === 0) {
    logSuccess('No security issues found!');
  } else {
    log(`Found ${results.issues.length} issue(s):\n`);
    
    for (const issue of results.issues) {
      const color = issue.severity === 'critical' ? RED : 
                    issue.severity === 'warning' ? YELLOW : RESET;
      log(`[${issue.severity.toUpperCase()}] ${issue.type}: ${issue.message}`, color);
      
      if (issue.recommendation) {
        log(`  → ${issue.recommendation}`, BLUE);
      }
    }
  }
  
  return results;
}

/**
 * Fix all issues
 */
function fixIssues(dryRun = false) {
  if (dryRun) {
    log('\n🔧 DRY RUN - Previewing fixes...\n');
  } else {
    log('\n🔧 Fixing security issues...\n');
  }
  
  const results = {
    fixed: [],
    failed: [],
    dryRun
  };
  
  // Get current issues
  const workspaceIssues = checkWorkspacePermissions();
  const pluginsIssues = checkPluginsAllow();
  const controlUIIssues = checkControlUIAuth();
  const sandboxIssues = checkModelSandboxing();
  
  // Fix workspace permissions
  if (workspaceIssues.length > 0) {
    const result = fixWorkspacePermissions(dryRun);
    if (result.success) results.fixed.push('workspace-permissions');
    else results.failed.push('workspace-permissions: ' + result.error);
  }
  
  // Fix plugins.allow
  if (pluginsIssues.length > 0) {
    const extensions = pluginsIssues[0]?.extensions || [];
    const result = fixPluginsAllow(extensions, dryRun);
    if (result.success) results.fixed.push('plugins-allow');
    else results.failed.push('plugins-allow: ' + result.error);
  }
  
  // Fix control UI auth
  if (controlUIIssues.length > 0) {
    const result = fixControlUIAuth(dryRun);
    if (result.success) results.fixed.push('control-ui-auth');
    else results.failed.push('control-ui-auth: ' + result.error);
  }
  
  // Fix sandboxing
  if (sandboxIssues.length > 0) {
    const result = fixModelSandboxing(dryRun);
    if (result.success) results.fixed.push('model-sandboxing');
    else results.failed.push('model-sandboxing: ' + result.error);
  }
  
  // Print results
  if (dryRun) {
    log('\n📋 Would fix the following:\n');
  } else {
    log('\n📋 Fix results:\n');
  }
  
  for (const fix of results.fixed) {
    logSuccess(fix);
  }
  
  for (const fail of results.failed) {
    logError(fail);
  }
  
  return results;
}

/**
 * Generate JSON report
 */
function generateReport() {
  const auditResults = runAudit();
  const report = {
    generated: new Date().toISOString(),
    ...auditResults,
    recommendations: []
  };
  
  // Add recommendations
  for (const issue of auditResults.issues) {
    if (issue.recommendation) {
      report.recommendations.push(issue.recommendation);
    }
  }
  
  console.log(JSON.stringify(report, null, 2));
  
  // Save to file
  const reportDir = path.join(STATE_DIR, 'security-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const filename = `security-audit-${Date.now()}.json`;
  fs.writeFileSync(path.join(reportDir, filename), JSON.stringify(report, null, 2));
  logInfo(`Report saved to ${reportDir}/${filename}`);
}

/**
 * Watch mode - continuous monitoring
 */
function watchMode() {
  log('\n🔄 Starting continuous security monitoring...\n');
  log(`Check interval: ${WATCH_INTERVAL/1000} seconds`);
  log('Press Ctrl+C to stop\n');
  
  setInterval(() => {
    log(`\n${'='.repeat(50)}`);
    log(`Security Check - ${new Date().toLocaleString()}`);
    log('='.repeat(50));
    runAudit();
  }, WATCH_INTERVAL);
}

// Main entry point
function main() {
  if (flags.watch) {
    watchMode();
    return;
  }
  
  if (flags.report) {
    generateReport();
    return;
  }
  
  if (flags.audit || (Object.keys(flags).filter(k => flags[k]).length === 0)) {
    runAudit();
    return;
  }
  
  if (flags.fix) {
    fixIssues(flags.dryRun);
    return;
  }
  
  // Show help
  console.log(`
🔐 OpenClaw Security Hardener

Usage:
  node security-hardener.js --audit          Run security audit
  node security-hardener.js --fix            Auto-fix issues
  node security-hardener.js --fix --dry-run  Preview fixes without applying
  node security-hardener.js --report         Generate JSON report
  node security-hardener.js --watch          Continuous monitoring

Checks performed:
  - Workspace permissions (755 vs 700)
  - plugins.allow configuration for extensions
  - Control UI device authentication
  - Model sandboxing requirements
  - Multi-user setup risks
`);
}

main();
