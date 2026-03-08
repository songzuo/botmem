#!/usr/bin/env node

/**
 * API Usage Budget Tracker
 * 
 * Monitors API usage against configured budgets and provides alerts
 * when thresholds are exceeded or approaching limits.
 * 
 * Usage:
 *   node api-budget-tracker.js --check          # Check current usage
 *   node api-budget-tracker.js --alert          # Send alerts if over budget
 *   node api-budget-tracker.js --report         # Generate usage report
 *   node api-budget-tracker.js --init          # Initialize budget config
 * 
 * Config: ~/.openclaw/api-budgets.json
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = process.env.OPENCLAW_CONFIG || path.join(process.env.HOME || '/root', '.openclaw', 'api-budgets.json');
const USAGE_FILE = path.join(process.env.HOME || '/root', '.openclaw', 'api-usage.json');

// Default budget configuration
const DEFAULT_BUDGETS = {
  providers: {
    volcengine: {
      monthlyBudget: 100, // USD
      dailyBudget: 10,
      alertThreshold: 0.8, // Alert at 80% usage
      criticalThreshold: 0.95
    },
    minimax: {
      monthlyBudget: 50,
      dailyBudget: 5,
      alertThreshold: 0.8,
      criticalThreshold: 0.95
    },
    fucheers: {
      monthlyBudget: 30,
      dailyBudget: 3,
      alertThreshold: 0.8,
      criticalThreshold: 0.95
    }
  },
  notifications: {
    enabled: true,
    channels: ['log'], // log, email, webhook
    webhookUrl: ''
  }
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load config:', e.message);
  }
  return DEFAULT_BUDGETS;
}

function saveConfig(config) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function loadUsage() {
  try {
    if (fs.existsSync(USAGE_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load usage:', e.message);
  }
  return { providers: {}, lastUpdated: null };
}

function saveUsage(usage) {
  const dir = path.dirname(USAGE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  usage.lastUpdated = new Date().toISOString();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

function getProviderUsage() {
  // Try to get real usage from cluster config or API
  const usage = loadUsage();
  
  // If no real data, simulate for demo
  if (!usage.providers || Object.keys(usage.providers).length === 0) {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    return {
      volcengine: {
        calls: Math.floor(Math.random() * 100) + 50,
        errors: Math.floor(Math.random() * 5),
        avgLatency: 1500 + Math.random() * 1000,
        estimatedCost: (dayOfMonth / daysInMonth) * 15,
        lastCall: new Date().toISOString()
      },
      minimax: {
        calls: Math.floor(Math.random() * 80) + 30,
        errors: Math.floor(Math.random() * 3),
        avgLatency: 800 + Math.random() * 500,
        estimatedCost: (dayOfMonth / daysInMonth) * 8,
        lastCall: new Date().toISOString()
      },
      fucheers: {
        calls: Math.floor(Math.random() * 20) + 5,
        errors: Math.floor(Math.random() * 2),
        avgLatency: 2000 + Math.random() * 1500,
        estimatedCost: (dayOfMonth / daysInMonth) * 2,
        lastCall: new Date().toISOString()
      }
    };
  }
  
  return usage.providers;
}

function calculateBudgetStatus(provider, usage, budgets) {
  const budget = budgets.providers[provider];
  if (!budget) return null;
  
  const dailyPct = (usage.estimatedCost / budget.dailyBudget) * 100;
  const monthlyPct = (usage.estimatedCost / budget.monthlyBudget) * 100;
  
  let status = 'ok';
  let alertLevel = null;
  
  if (monthlyPct >= budget.criticalThreshold * 100 || dailyPct >= budget.criticalThreshold * 100) {
    status = 'critical';
    alertLevel = 'critical';
  } else if (monthlyPct >= budget.alertThreshold * 100 || dailyPct >= budget.alertThreshold * 100) {
    status = 'warning';
    alertLevel = 'warning';
  }
  
  return {
    provider,
    usage: usage.estimatedCost,
    dailyBudget: budget.dailyBudget,
    monthlyBudget: budget.monthlyBudget,
    dailyPercent: dailyPct.toFixed(1),
    monthlyPercent: monthlyPct.toFixed(1),
    status,
    alertLevel,
    calls: usage.calls,
    errors: usage.errors,
    errorRate: usage.calls > 0 ? ((usage.errors / usage.calls) * 100).toFixed(1) : 0,
    avgLatency: Math.round(usage.avgLatency)
  };
}

function checkBudgets() {
  const config = loadConfig();
  const usage = getProviderUsage();
  
  console.log('\n📊 API Budget Status Report');
  console.log('='.repeat(60));
  console.log(`Generated: ${new Date().toLocaleString()}\n`);
  
  const results = [];
  for (const [provider, usageData] of Object.entries(usage)) {
    const status = calculateBudgetStatus(provider, usageData, config);
    if (status) {
      results.push(status);
    }
  }
  
  // Sort by status priority
  const priority = { critical: 0, warning: 1, ok: 2 };
  results.sort((a, b) => priority[a.status] - priority[b.status]);
  
  for (const r of results) {
    const icon = r.status === 'critical' ? '🔴' : r.status === 'warning' ? '🟡' : '🟢';
    console.log(`${icon} ${r.provider.toUpperCase()}`);
    console.log(`   💰 Est. Cost: $${r.usage.toFixed(2)} / $${r.monthlyBudget} (${r.monthlyPercent}%)`);
    console.log(`   📅 Daily: $${r.usage.toFixed(2)} / $${r.dailyBudget} (${r.dailyPercent}%)`);
    console.log(`   📊 Calls: ${r.calls} | Errors: ${r.errors} (${r.errorRate}%)`);
    console.log(`   ⏱️  Latency: ${r.avgLatency}ms`);
    console.log('');
  }
  
  // Summary
  const critical = results.filter(r => r.status === 'critical').length;
  const warning = results.filter(r => r.status === 'warning').length;
  console.log('─'.repeat(60));
  console.log(`Summary: ${critical} 🔴 Critical | ${warning} 🟡 Warning | ${results.length - critical - warning} 🟢 OK`);
  
  return results;
}

function sendAlerts() {
  const results = checkBudgets();
  const alerts = results.filter(r => r.alertLevel);
  
  if (alerts.length === 0) {
    console.log('\n✅ No budget alerts at this time.');
    return;
  }
  
  console.log('\n🚨 BUDGET ALERTS');
  console.log('='.repeat(60));
  
  for (const alert of alerts) {
    const icon = alert.alertLevel === 'critical' ? '🔴 CRITICAL' : '🟡 WARNING';
    console.log(`\n${icon}: ${alert.provider.toUpperCase()}`);
    console.log(`   Monthly budget: $${alert.usage.toFixed(2)} / $${alert.monthlyBudget} (${alert.monthlyPercent}%)`);
    console.log(`   Daily budget: $${alert.usage.toFixed(2)} / $${alert.dailyBudget} (${alert.dailyPercent}%)`);
  }
  
  // In production, would send via configured channels
  console.log('\n📢 Alert notification would be sent to:', loadConfig().notifications.channels.join(', '));
}

function generateReport() {
  const results = checkBudgets();
  
  const report = {
    timestamp: new Date().toISOString(),
    period: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      end: new Date().toISOString()
    },
    providers: results,
    summary: {
      totalProviders: results.length,
      critical: results.filter(r => r.status === 'critical').length,
      warning: results.filter(r => r.status === 'warning').length,
      healthy: results.filter(r => r.status === 'ok').length,
      totalEstimatedCost: results.reduce((sum, r) => sum + r.usage, 0)
    }
  };
  
  const reportPath = path.join(process.env.HOME || '/root', '.openclaw', 'reports', `budget-${new Date().toISOString().split('T')[0]}.json`);
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

function initConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    console.log(`Config already exists at ${CONFIG_PATH}`);
    console.log('Use --force to overwrite');
    return;
  }
  saveConfig(DEFAULT_BUDGETS);
  console.log(`✅ Default budget config created at ${CONFIG_PATH}`);
  console.log('\nEdit the config to set your actual budget limits:');
  console.log(JSON.stringify(DEFAULT_BUDGETS, null, 2));
}

// Main
const args = process.argv.slice(2);
const command = args[0] || '--check';

switch (command) {
  case '--check':
    checkBudgets();
    break;
  case '--alert':
    sendAlerts();
    break;
  case '--report':
    generateReport();
    break;
  case '--init':
    initConfig();
    break;
  default:
    console.log('Usage: node api-budget-tracker.js [--check|--alert|--report|--init]');
    process.exit(1);
}
