#!/usr/bin/env node

/**
 * Session Manager - 会话状态管理与恢复工具
 * 
 * 功能:
 * - 列出所有活跃会话
 * - 会话状态持久化
 * - 快速恢复会话
 * - 会话历史分析
 * - 批量操作
 * 
 * 使用方式:
 *   node session-manager.js --list              # 列出所有会话
 *   node session-manager.js --save <id>         # 保存会话状态
 *   node session-manager.js --restore <id>      # 恢复会话
 *   node session-manager.js --history           # 查看会话历史
 *   node session-manager.js --export           # 导出所有会话数据
 *   node session-manager.js --watch            # 持续监控会话
 */

const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(__dirname, '..', 'state', 'sessions');
const HISTORY_FILE = path.join(STATE_DIR, 'history.json');

// 确保状态目录存在
function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

// 列出所有活跃会话
async function listSessions() {
  console.log('\n📋 活跃会话列表\n');
  console.log('─'.repeat(60));
  
  try {
    // 尝试通过 sessions_list 获取会话信息
    const { sessions_list } = await import('./sessions_list_impl.js').catch(() => null);
    
    if (sessions_list) {
      const sessions = await sessions_list({ limit: 50 });
      if (sessions && sessions.length > 0) {
        sessions.forEach((s, i) => {
          console.log(`${i + 1}. ${s.sessionKey || s.id || 'unknown'}`);
          console.log(`   类型: ${s.kind || 'unknown'}`);
          console.log(`   活跃: ${s.activeMinutes ? s.activeMinutes + '分钟' : 'unknown'}`);
          console.log('');
        });
      }
    }
  } catch (e) {
    // 如果无法获取，使用文件系统方式
  }
  
  // 检查保存的会话状态文件
  if (fs.existsSync(STATE_DIR)) {
    const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json'));
    if (files.length > 0) {
      console.log('💾 已保存的会话状态:');
      files.forEach(f => {
        const data = JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), 'utf8'));
        console.log(`   - ${f.replace('.json', '')} (${data.timestamp})`);
      });
    }
  }
  
  console.log('─'.repeat(60));
}

// 保存会话状态
async function saveSession(sessionId) {
  ensureStateDir();
  
  const sessionFile = path.join(STATE_DIR, `${sessionId}.json`);
  
  const sessionData = {
    sessionId,
    timestamp: new Date().toISOString(),
    // 尝试获取更多会话信息
    status: 'saved'
  };
  
  fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  
  // 更新历史记录
  updateHistory(sessionId, 'saved');
  
  console.log(`✅ 会话 ${sessionId} 状态已保存`);
}

// 恢复会话状态
async function restoreSession(sessionId) {
  const sessionFile = path.join(STATE_DIR, `${sessionId}.json`);
  
  if (!fs.existsSync(sessionFile)) {
    console.log(`❌ 会话 ${sessionId} 的保存状态不存在`);
    return false;
  }
  
  const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  
  console.log(`📥 恢复会话 ${sessionId}:`);
  console.log(JSON.stringify(sessionData, null, 2));
  
  // 更新历史记录
  updateHistory(sessionId, 'restored');
  
  return true;
}

// 更新历史记录
function updateHistory(sessionId, action) {
  ensureStateDir();
  
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
  
  history.unshift({
    sessionId,
    action,
    timestamp: new Date().toISOString()
  });
  
  // 只保留最近100条记录
  history = history.slice(0, 100);
  
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// 查看会话历史
function showHistory(limit = 20) {
  if (!fs.existsSync(HISTORY_FILE)) {
    console.log('📝 暂无会话历史记录');
    return;
  }
  
  const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  
  console.log('\n📜 会话历史记录\n');
  console.log('─'.repeat(60));
  
  history.slice(0, limit).forEach((h, i) => {
    const time = new Date(h.timestamp).toLocaleString('zh-CN');
    const actionIcon = h.action === 'saved' ? '💾' : '📥';
    console.log(`${i + 1}. ${actionIcon} ${h.sessionId} - ${h.action}`);
    console.log(`   时间: ${time}`);
    console.log('');
  });
  
  console.log(`共 ${history.length} 条记录`);
  console.log('─'.repeat(60));
}

// 导出所有会话数据
function exportAll() {
  ensureStateDir();
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    sessions: {},
    history: []
  };
  
  // 导出保存的会话
  if (fs.existsSync(STATE_DIR)) {
    const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json'));
    files.forEach(f => {
      const key = f.replace('.json', '');
      if (key !== 'history') {
        exportData.sessions[key] = JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), 'utf8'));
      }
    });
  }
  
  // 导出历史
  if (fs.existsSync(HISTORY_FILE)) {
    exportData.history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
  
  const exportFile = path.join(STATE_DIR, `export-${Date.now()}.json`);
  fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
  
  console.log(`✅ 已导出到: ${exportFile}`);
  return exportData;
}

// 统计信息
function showStats() {
  ensureStateDir();
  
  const stats = {
    savedSessions: 0,
    historyEntries: 0,
    oldestRecord: null,
    newestRecord: null
  };
  
  // 统计保存的会话
  if (fs.existsSync(STATE_DIR)) {
    const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json') && f !== 'history.json');
    stats.savedSessions = files.length;
  }
  
  // 统计历史记录
  if (fs.existsSync(HISTORY_FILE)) {
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    stats.historyEntries = history.length;
    if (history.length > 0) {
      stats.oldestRecord = history[history.length - 1].timestamp;
      stats.newestRecord = history[0].timestamp;
    }
  }
  
  console.log('\n📊 会话管理统计\n');
  console.log('─'.repeat(40));
  console.log(`已保存会话数: ${stats.savedSessions}`);
  console.log(`历史记录条数: ${stats.historyEntries}`);
  if (stats.oldestRecord) {
    console.log(`最早记录: ${new Date(stats.oldestRecord).toLocaleString('zh-CN')}`);
  }
  if (stats.newestRecord) {
    console.log(`最新记录: ${new Date(stats.newestRecord).toLocaleString('zh-CN')}`);
  }
  console.log('─'.repeat(40));
  
  return stats;
}

// 清理旧会话
function cleanOldSessions(days = 7) {
  ensureStateDir();
  
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let cleaned = 0;
  
  if (fs.existsSync(STATE_DIR)) {
    const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json') && f !== 'history.json');
    files.forEach(f => {
      const filePath = path.join(STATE_DIR, f);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (new Date(data.timestamp).getTime() < cutoff) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    });
  }
  
  console.log(`✅ 已清理 ${cleaned} 个旧会话状态`);
  return cleaned;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case '--list':
    case '-l':
      await listSessions();
      break;
      
    case '--save':
      if (!args[1]) {
        console.log('❌ 请指定会话ID');
        process.exit(1);
      }
      await saveSession(args[1]);
      break;
      
    case '--restore':
      if (!args[1]) {
        console.log('❌ 请指定会话ID');
        process.exit(1);
      }
      await restoreSession(args[1]);
      break;
      
    case '--history':
    case '-h':
      const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 20;
      showHistory(limit);
      break;
      
    case '--export':
    case '-e':
      exportAll();
      break;
      
    case '--stats':
    case '-s':
      showStats();
      break;
      
    case '--clean':
      const days = args[1] ? parseInt(args[1]) : 7;
      cleanOldSessions(days);
      break;
      
    case '--help':
    case undefined:
      console.log(`
📋 Session Manager - 会话状态管理与恢复工具

使用方式:
  node session-manager.js --list              列出所有会话
  node session-manager.js --save <id>         保存会话状态
  node session-manager.js --restore <id>      恢复会话状态
  node session-manager.js --history            查看会话历史
  node session-manager.js --history --limit N  查看最近N条历史
  node session-manager.js --export             导出所有数据
  node session-manager.js --stats              显示统计信息
  node session-manager.js --clean [days]       清理旧会话(默认7天)
  node session-manager.js --help               显示帮助

示例:
  node session-manager.js --list
  node session-manager.js --save my-session-123
  node session-manager.js --restore my-session-123
  node session-manager.js --history --limit 50
      `);
      break;
      
    default:
      console.log(`未知命令: ${command}`);
      console.log('使用 --help 查看帮助');
      process.exit(1);
  }
}

main().catch(console.error);
