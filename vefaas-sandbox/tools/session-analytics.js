#!/usr/bin/env node

/**
 * Session Analytics Tool
 * Analyzes session patterns, generates usage insights, and suggests optimizations
 * 
 * Usage:
 *   node session-analytics.js --report          # Generate full report
 *   node session-analytics.js --insights        # Show key insights
 *   node session-analytics.js --peak            # Show peak usage times
 *   node session-analytics.js --export          # Export analytics data
 *   node session-analytics.js --watch           # Watch mode (periodic reports)
 */

const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = '/workspace/projects/workspace/.openclaw/sessions';
const MEMORY_DIR = '/workspace/projects/workspace/memory';
const STATE_DIR = '/workspace/projects/workspace/state';
const TOOLS_DIR = '/workspace/projects/workspace/tools';

class SessionAnalytics {
  constructor() {
    this.data = {
      sessions: [],
      tools: new Map(),
      errors: [],
      patterns: {},
      insights: []
    };
  }

  // Scan sessions directory
  scanSessions() {
    if (!fs.existsSync(SESSIONS_DIR)) {
      console.log('⚠️  Sessions directory not found');
      return [];
    }

    const sessions = [];
    const entries = fs.readdirSync(SESSIONS_DIR, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sessionPath = path.join(SESSIONS_DIR, entry.name);
        const metaPath = path.join(sessionPath, 'meta.json');
        
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            sessions.push({
              id: entry.name,
              ...meta,
              path: sessionPath
            });
          } catch (e) {
            // Skip invalid meta files
          }
        }
      }
    }
    
    return sessions;
  }

  // Analyze tool usage patterns
  analyzeToolUsage(sessions) {
    const toolCounts = new Map();
    const toolErrors = new Map();
    const toolDurations = new Map();

    for (const session of sessions) {
      // Check state files for tool usage
      const stateFiles = this.getSessionStateFiles(session.id);
      
      for (const stateFile of stateFiles) {
        try {
          const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
          
          // Count tool invocations
          if (state.history) {
            for (const msg of state.history) {
              if (msg.tool_calls) {
                for (const call of msg.tool_calls) {
                  const toolName = call.function?.name || 'unknown';
                  toolCounts.set(toolName, (toolCounts.get(toolName) || 0) + 1);
                }
              }
              if (msg.tool_results?.error) {
                toolErrors.set(toolName, (toolErrors.get(toolName) || 0) + 1);
              }
            }
          }
        } catch (e) {
          // Skip invalid state files
        }
      }
    }

    return { toolCounts, toolErrors, toolDurations };
  }

  // Get state files for a session
  getSessionStateFiles(sessionId) {
    const stateDir = path.join(STATE_DIR, sessionId);
    if (!fs.existsSync(stateDir)) return [];
    
    return fs.readdirSync(stateDir)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(stateDir, f));
  }

  // Analyze error patterns
  analyzeErrors(sessions) {
    const errorTypes = new Map();
    
    for (const session of sessions) {
      const stateFiles = this.getSessionStateFiles(session.id);
      
      for (const stateFile of stateFiles) {
        try {
          const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
          
          if (state.history) {
            for (const msg of state.history) {
              if (msg.tool_results?.error) {
                const error = msg.tool_results.error;
                const key = error.substring(0, 50);
                errorTypes.set(key, (errorTypes.get(key) || 0) + 1);
              }
            }
          }
        } catch (e) {
          // Skip
        }
      }
    }

    return errorTypes;
  }

  // Identify peak usage times
  analyzePeakTimes(sessions) {
    const hourlyCounts = new Array(24).fill(0);
    const dailyCounts = new Array(7).fill(0);
    
    for (const session of sessions) {
      if (session.created_at) {
        const date = new Date(session.created_at);
        hourlyCounts[date.getHours()]++;
        dailyCounts[date.getDay()]++;
      }
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const peakHour = hourlyCounts.indexOf(Math.max(...hourlyCounts));
    const peakDay = dailyCounts.indexOf(Math.max(...dailyCounts));

    return {
      hourly: hourlyCounts,
      daily: dailyCounts,
      peakHour,
      peakDay: dayNames[peakDay],
      totalSessions: sessions.length
    };
  }

  // Generate insights
  generateInsights(sessions, toolAnalysis, errorAnalysis, peakTimes) {
    const insights = [];

    // Session volume insight
    if (sessions.length > 50) {
      insights.push({
        type: 'info',
        category: 'volume',
        message: `High session volume: ${sessions.length} sessions recorded`
      });
    }

    // Peak time insight
    if (peakTimes.totalSessions > 10) {
      insights.push({
        type: 'info',
        category: 'timing',
        message: `Peak usage at ${peakTimes.peakHour}:00 on ${peakTimes.peakDay}s`
      });
    }

    // Top tools insight
    if (toolAnalysis.toolCounts.size > 0) {
      const sorted = [...toolAnalysis.toolCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      const topTools = sorted.map(([name, count]) => `${name}(${count})`).join(', ');
      insights.push({
        type: 'info',
        category: 'tools',
        message: `Most used tools: ${topTools}`
      });
    }

    // Error insight
    if (errorAnalysis.size > 0) {
      const topError = [...errorAnalysis.entries()]
        .sort((a, b) => b[1] - a[1])[0];
      insights.push({
        type: 'warning',
        category: 'errors',
        message: `Top error: "${topError[0]}..." (${topError[1]} occurrences)`
      });
    }

    // Duration insight (if available)
    const avgDuration = this.calculateAverageDuration(sessions);
    if (avgDuration > 0) {
      insights.push({
        type: 'info',
        category: 'performance',
        message: `Average session duration: ${Math.round(avgDuration)}s`
      });
    }

    return insights;
  }

  // Calculate average session duration
  calculateAverageDuration(sessions) {
    const durations = sessions
      .filter(s => s.duration_ms)
      .map(s => s.duration_ms);
    
    if (durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  // Generate full report
  generateReport() {
    console.log('🔍 Scanning sessions...\n');
    
    const sessions = this.scanSessions();
    const toolAnalysis = this.analyzeToolUsage(sessions);
    const errorAnalysis = this.analyzeErrors(sessions);
    const peakTimes = this.analyzePeakTimes(sessions);
    const insights = this.generateInsights(sessions, toolAnalysis, errorAnalysis, peakTimes);

    console.log('═'.repeat(60));
    console.log('📊 SESSION ANALYTICS REPORT');
    console.log('═'.repeat(60));
    
    // Summary
    console.log('\n📈 SUMMARY');
    console.log(`  Total Sessions: ${sessions.length}`);
    console.log(`  Peak Hour: ${peakTimes.peakHour}:00`);
    console.log(`  Peak Day: ${peakTimes.peakDay}`);
    
    // Top Tools
    console.log('\n🛠️  TOP TOOLS USED');
    const sortedTools = [...toolAnalysis.toolCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (sortedTools.length > 0) {
      for (const [tool, count] of sortedTools) {
        const bar = '█'.repeat(Math.min(count, 20));
        console.log(`  ${tool.padEnd(25)} ${count.toString().padStart(3)} ${bar}`);
      }
    } else {
      console.log('  (No tool usage data)');
    }

    // Errors
    console.log('\n❌ TOP ERRORS');
    const sortedErrors = [...errorAnalysis.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    if (sortedErrors.length > 0) {
      for (const [error, count] of sortedErrors) {
        console.log(`  ${count}x ${error}...`);
      }
    } else {
      console.log('  ✅ No errors recorded');
    }

    // Insights
    console.log('\n💡 INSIGHTS');
    for (const insight of insights) {
      const icon = insight.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} ${insight.message}`);
    }

    // Hourly distribution
    console.log('\n⏰ HOURLY DISTRIBUTION');
    const maxHourly = Math.max(...peakTimes.hourly, 1);
    for (let h = 0; h < 24; h++) {
      const count = peakTimes.hourly[h];
      const bar = '█'.repeat(Math.ceil((count / maxHourly) * 20));
      const marker = h === peakTimes.peakHour ? ' 👈 PEAK' : '';
      console.log(`  ${h.toString().padStart(2, '0')}:00 ${bar} ${count}${marker}`);
    }

    console.log('\n' + '═'.repeat(60));
    
    return { sessions, toolAnalysis, errorAnalysis, peakTimes, insights };
  }

  // Export data
  exportData() {
    const sessions = this.scanSessions();
    const toolAnalysis = this.analyzeToolUsage(sessions);
    const errorAnalysis = this.analyzeErrors(sessions);
    const peakTimes = this.analyzePeakTimes(sessions);
    
    const exportPath = path.join(MEMORY_DIR, `session-analytics-${Date.now()}.json`);
    
    const data = {
      exported_at: new Date().toISOString(),
      sessions: sessions.length,
      peakTimes,
      topTools: [...toolAnalysis.toolCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      topErrors: [...errorAnalysis.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
    
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    console.log(`📦 Analytics exported to: ${exportPath}`);
    return data;
  }

  // Watch mode
  watch(intervalMs = 300000) {
    console.log(`👁️  Watch mode: generating reports every ${intervalMs / 1000}s\n`);
    
    const report = () => {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🕐 ${new Date().toLocaleString()}`);
      this.generateReport();
    };
    
    report();
    setInterval(report, intervalMs);
  }
}

// CLI
const args = process.argv.slice(2);
const analytics = new SessionAnalytics();

if (args.includes('--report') || args.length === 0) {
  analytics.generateReport();
} else if (args.includes('--insights')) {
  const sessions = analytics.scanSessions();
  const toolAnalysis = analytics.analyzeToolUsage(sessions);
  const errorAnalysis = analytics.analyzeErrors(sessions);
  const peakTimes = analytics.analyzePeakTimes(sessions);
  const insights = analytics.generateInsights(sessions, toolAnalysis, errorAnalysis, peakTimes);
  
  console.log('💡 KEY INSIGHTS');
  console.log('─'.repeat(30));
  for (const insight of insights) {
    const icon = insight.type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} ${insight.message}`);
  }
} else if (args.includes('--peak')) {
  const sessions = analytics.scanSessions();
  const peakTimes = analytics.analyzePeakTimes(sessions);
  
  console.log('⏰ PEAK USAGE TIMES');
  console.log('─'.repeat(30));
  console.log(`Total Sessions: ${peakTimes.totalSessions}`);
  console.log(`Peak Hour: ${peakTimes.peakHour}:00`);
  console.log(`Peak Day: ${peakTimes.peakDay}`);
  console.log('\nHourly Distribution:');
  for (let h = 0; h < 24; h++) {
    const count = peakTimes.hourly[h];
    const marker = h === peakTimes.peakHour ? ' 👈' : '';
    console.log(`  ${h.toString().padStart(2, '0')}:00 → ${count}${marker}`);
  }
} else if (args.includes('--export')) {
  analytics.exportData();
} else if (args.includes('--watch')) {
  const interval = parseInt(args[args.indexOf('--watch') + 1]) || 300;
  analytics.watch(interval * 1000);
} else if (args.includes('--help')) {
  console.log(`
🔧 Session Analytics Tool

Usage:
  node session-analytics.js [options]

Options:
  --report         Generate full analytics report (default)
  --insights       Show key insights only
  --peak           Show peak usage times
  --export         Export analytics data to memory/
  --watch [sec]    Watch mode (default: 300s interval)
  --help           Show this help message

Examples:
  node session-analytics.js --report
  node session-analytics.js --insights
  node session-analytics.js --peak
  node session-analytics.js --watch 60
  `);
} else {
  analytics.generateReport();
}
