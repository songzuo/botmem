#!/usr/bin/env node

/**
 * security-issue-remediator.js
 * 
 * Automatically remediates common OpenClaw security issues found by security audit.
 * Addresses: plugins.allow, dangerous flags, state dir permissions, sandbox configs
 * 
 * Usage: node security-issue-remediator.js [--dry-run] [--fix]
 * 
 * @author OpenClaw Autonomous Agent
 * @date 2026-03-08
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_PATH = '/workspace/projects/workspace/config.yaml';
const WORKSPACE_PATH = '/workspace/projects/workspace';
const EXTENSIONS_PATH = '/workspace/projects/extensions';

class SecurityRemediator {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || true;
    this.fixes = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    if (!this.verbose && type === 'info') return;
    const prefix = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      fix: '🔧'
    }[type] || '•';
    console.log(`${prefix} ${message}`);
  }

  /**
   * Discover available plugins in extensions directory
   */
  discoverPlugins() {
    const plugins = [];
    if (!fs.existsSync(EXTENSIONS_PATH)) {
      this.warnings.push('Extensions directory not found');
      return plugins;
    }

    const entries = fs.readdirSync(EXTENSIONS_PATH, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const distPath = path.join(EXTENSIONS_PATH, entry.name, 'dist', 'index.js');
        const pkgPath = path.join(EXTENSIONS_PATH, entry.name, 'package.json');
        
        let pluginId = entry.name;
        if (fs.existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            pluginId = pkg.name || entry.name;
          } catch (e) {}
        }
        
        plugins.push({
          name: entry.name,
          id: pluginId,
          hasDist: fs.existsSync(distPath)
        });
      }
    }
    return plugins;
  }

  /**
   * Read current config
   */
  readConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
      throw new Error(`Config not found: ${CONFIG_PATH}`);
    }
    return fs.readFileSync(CONFIG_PATH, 'utf8');
  }

  /**
   * Fix 1: Set plugins.allow to explicit list
   */
  fixPluginsAllow(plugins) {
    const pluginIds = plugins.map(p => p.id);
    const config = this.readConfig();
    
    // Check if plugins.allow already exists
    const hasPluginsAllow = /^plugins:\s*\n\s*allow:/m.test(config);
    
    if (!hasPluginsAllow) {
      // Need to add plugins section
      if (config.includes('plugins:')) {
        // Plugins exists but no allow
        this.fixes.push({
          issue: 'plugins.allow not set',
          action: 'Add plugins.allow with discovered plugins',
          value: pluginIds.join(', '),
          yaml: `  allow:\n${pluginIds.map(id => `    - ${id}`).join('\n')}`
        });
      } else {
        // Add new plugins section at end
        this.fixes.push({
          issue: 'plugins.allow not set',
          action: 'Add plugins section with allow list',
          value: pluginIds.join(', '),
          yaml: `\nplugins:\n  allow:\n${pluginIds.map(id => `    - ${id}`).join('\n')}`
        });
      }
    } else {
      this.log('plugins.allow already configured', 'info');
    }
  }

  /**
   * Fix 2: Disable dangerous control UI flag
   */
  fixDangerousFlags() {
    const config = this.readConfig();
    
    if (config.includes('dangerouslyDisableDeviceAuth')) {
      this.fixes.push({
        issue: 'Control UI device auth disabled',
        action: 'Remove or set gateway.controlUi.dangerouslyDisableDeviceAuth to false',
        current: 'true',
        desired: 'false (or remove the line)',
        yaml: 'gateway:\n  controlUi:\n    dangerouslyDisableDeviceAuth: false'
      });
    }
  }

  /**
   * Fix 3: Sandbox config for small models
   */
  fixSandboxConfig() {
    const config = this.readConfig();
    
    // Check if there are small model fallbacks
    const hasSmallModels = config.includes('Qwen2.5') || config.includes('72B');
    
    if (hasSmallModels) {
      // Check sandbox settings
      const hasSandboxAll = /sandbox:\s*\n\s*mode:\s*["']?all["']?/m.test(config);
      const hasToolDenials = /tools:\s*\n\s*deny:/m.test(config);
      
      if (!hasSandboxAll) {
        this.fixes.push({
          issue: 'Small models without full sandboxing',
          action: 'Enable sandbox mode for all sessions',
          yaml: 'agents:\n  defaults:\n    sandbox:\n      mode: all'
        });
      }
      
      if (!hasToolDenials) {
        this.fixes.push({
          issue: 'Small models with web tools enabled',
          action: 'Deny web-related tools for small models',
          yaml: 'tools:\n  deny:\n    - group:web\n    - browser'
        });
      }
    }
  }

  /**
   * Fix 4: Workspace directory permissions
   */
  fixWorkspacePermissions() {
    try {
      const stats = fs.statSync(WORKSPACE_PATH);
      const mode = (stats.mode & 0o777).toString(8);
      
      if (parseInt(mode, 8) > 0o700) {
        this.fixes.push({
          issue: `State dir mode is ${mode} (should be 700)`,
          action: `chmod 700 ${WORKSPACE_PATH}`,
          command: `chmod 700 ${WORKSPACE_PATH}`
        });
      }
    } catch (e) {
      this.warnings.push(`Could not check workspace permissions: ${e.message}`);
    }
  }

  /**
   * Apply fixes
   */
  async applyFixes() {
    if (this.fixes.length === 0) {
      this.log('No fixes needed!', 'success');
      return;
    }

    this.log(`\nApplying ${this.fixes.length} fix(es)...`, 'warn');

    for (const fix of this.fixes) {
      this.log(`Applying: ${fix.issue}`, 'fix');
      
      if (fix.command) {
        if (this.dryRun) {
          this.log(`  [DRY RUN] Would execute: ${fix.command}`, 'info');
        } else {
          try {
            execSync(fix.command, { stdio: 'pipe' });
            this.log(`  Applied: ${fix.action}`, 'success');
          } catch (e) {
            this.log(`  Failed: ${e.message}`, 'error');
          }
        }
      }
      
      if (fix.yaml) {
        this.log(`  Config change needed:`, 'info');
        this.log(`  ${fix.yaml.split('\n').join('\n  ')}`, 'info');
      }
    }

    if (this.dryRun) {
      this.log('\n[DRY RUN] No changes were made. Run with --fix to apply.', 'warn');
    }
  }

  /**
   * Generate summary report
   */
  report() {
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY REMEDIATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Status: ${this.fixes.length} issues found`);
    
    if (this.fixes.length > 0) {
      console.log('\n🔍 Issues & Recommended Fixes:\n');
      this.fixes.forEach((fix, i) => {
        console.log(`${i + 1}. ${fix.issue}`);
        console.log(`   → ${fix.action}`);
        if (fix.value) console.log(`   Value: ${fix.value}`);
        console.log('');
      });
    }

    if (this.warnings.length > 0) {
      console.log('⚠️ Warnings:\n');
      this.warnings.forEach(w => console.log(`  - ${w}`));
      console.log('');
    }

    console.log('='.repeat(60));
    
    if (this.dryRun) {
      console.log('\n💡 Run with --fix to apply these changes\n');
    }
  }

  /**
   * Main run method
   */
  async run() {
    this.log('🔍 Scanning for security issues...', 'info');
    
    // Discover plugins
    const plugins = this.discoverPlugins();
    this.log(`Found ${plugins.length} extension(s)`, 'info');
    
    // Run all fixes
    this.fixPluginsAllow(plugins);
    this.fixDangerousFlags();
    this.fixSandboxConfig();
    this.fixWorkspacePermissions();
    
    // Report
    this.report();
    
    // Apply if requested
    if (!this.dryRun && this.fixes.length > 0) {
      await this.applyFixes();
    }
  }
}

// CLI
const args = process.argv.slice(2);
const options = {
  dryRun: !args.includes('--fix'),
  verbose: true
};

const remediator = new SecurityRemediator(options);
remediator.run().catch(console.error);
