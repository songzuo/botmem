#!/usr/bin/env node

/**
 * config-backup-manager.js
 * OpenClaw 配置备份与恢复管理器
 * 
 * 功能:
 * - 自动备份 OpenClaw 配置
 * - 管理配置版本历史
 * - 快速恢复到稳定状态
 * - 导出/导入配置
 * - 配置变更检测与告警
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG_DIRS = [
  '~/.openclaw',
  '~/.openclaw/config',
  '~/.openclaw/agents',
  '~/.config/openclaw'
];

const BACKUP_DIR = path.join(__dirname, '..', 'state', 'config-backups');
const STATE_FILE = path.join(BACKUP_DIR, 'backup-state.json');

class ConfigBackupManager {
  constructor() {
    this.ensureBackupDir();
    this.state = this.loadState();
  }

  ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`📁 创建备份目录: ${BACKUP_DIR}`);
    }
  }

  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch (e) {
      console.warn('⚠️  无法加载状态文件');
    }
    return { backups: [], latestTag: null };
  }

  saveState() {
    fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
  }

  resolvePath(p) {
    return p.replace(/^~/, process.env.HOME || '/root');
  }

  findConfigFiles() {
    const files = [];
    for (const dir of CONFIG_DIRS) {
      const resolved = this.resolvePath(dir);
      if (fs.existsSync(resolved)) {
        this.scanDir(resolved, files);
      }
    }
    return files;
  }

  scanDir(dir, files, relative = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relative, entry.name);
        
        // 跳过隐藏目录和node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        if (entry.isDirectory()) {
          this.scanDir(fullPath, files, relPath);
        } else if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
          files.push({ path: fullPath, relative: relPath });
        }
      }
    } catch (e) {
      // 权限问题忽略
    }
  }

  computeHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
  }

  backup(tag = null, note = '') {
    const files = this.findConfigFiles();
    if (files.length === 0) {
      console.log('❌ 未找到配置文件');
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = tag || `backup-${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, backupId);
    
    fs.mkdirSync(backupPath, { recursive: true });
    
    const summary = {
      id: backupId,
      timestamp: new Date().toISOString(),
      note: note,
      files: [],
      totalFiles: 0,
      totalSize: 0
    };

    for (const file of files) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const destPath = path.join(backupPath, file.relative);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, content);
        
        const hash = this.computeHash(content);
        summary.files.push({
          relative: file.relative,
          hash: hash,
          size: content.length
        });
        summary.totalFiles++;
        summary.totalSize += content.length;
      } catch (e) {
        console.warn(`⚠️  备份失败: ${file.relative} - ${e.message}`);
      }
    }

    // 保存摘要
    fs.writeFileSync(path.join(backupPath, 'summary.json'), JSON.stringify(summary, null, 2));
    
    // 更新状态
    this.state.backups.push({
      id: backupId,
      timestamp: summary.timestamp,
      note: note,
      totalFiles: summary.totalFiles,
      totalSize: summary.totalSize
    });
    this.state.latestTag = backupId;
    this.saveState();

    console.log(`✅ 备份完成: ${backupId}`);
    console.log(`   文件数: ${summary.totalFiles}`);
    console.log(`   大小: ${(summary.totalSize / 1024).toFixed(1)} KB`);
    if (note) console.log(`   备注: ${note}`);
    
    return backupId;
  }

  list() {
    if (this.state.backups.length === 0) {
      console.log('📭 暂无备份记录');
      return;
    }

    console.log('📦 配置备份列表:\n');
    console.log('ID'.padEnd(25) + '时间'.padEnd(25) + '文件数'.padEnd(10) + '备注');
    console.log('-'.repeat(70));
    
    for (const b of this.state.backups.slice().reverse()) {
      const time = new Date(b.timestamp).toLocaleString('zh-CN');
      const note = b.note || '-';
      console.log(b.id.padEnd(25) + time.padEnd(25) + String(b.totalFiles).padEnd(10) + note);
    }
  }

  restore(backupId, dryRun = false) {
    const backupPath = path.join(BACKUP_DIR, backupId);
    if (!fs.existsSync(backupPath)) {
      console.log(`❌ 备份不存在: ${backupId}`);
      return false;
    }

    const summary = JSON.parse(fs.readFileSync(path.join(backupPath, 'summary.json'), 'utf8'));
    
    console.log(`🔄 ${dryRun ? '预览' : '恢复'}备份: ${backupId}`);
    console.log(`   文件数: ${summary.totalFiles}\n`);

    let restored = 0;
    for (const file of summary.files) {
      const srcPath = path.join(backupPath, file.relative);
      const destPath = this.resolvePath(path.join('~/.openclaw', file.relative));
      
      if (!fs.existsSync(srcPath)) continue;
      
      console.log(`   ${dryRun ? '[DRY-RUN] ' : ''}${file.relative}`);
      
      if (!dryRun) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
        restored++;
      }
    }

    if (!dryRun) {
      console.log(`\n✅ 已恢复 ${restored} 个文件`);
      console.log('⚠️  请重启 gateway 使配置生效');
    } else {
      console.log(`\n📝 预览模式: 将会恢复 ${restored} 个文件`);
    }
    
    return true;
  }

  diff(backupId1, backupId2 = null) {
    const b1 = this.loadBackupSummary(backupId1);
    if (!b1) return;

    let b2;
    if (backupId2) {
      b2 = this.loadBackupSummary(backupId2);
    } else {
      // 与当前配置比较
      b2 = { files: this.findConfigFiles().map(f => {
        const content = fs.readFileSync(f.path, 'utf8');
        return { relative: f.relative, hash: this.computeHash(content) };
      })};
    }

    if (!b2) return;

    const files1 = new Map(b1.files.map(f => [f.relative, f]));
    const files2 = new Map(b2.files.map(f => [f.relative, f]));

    console.log(`\n📊 配置差异: ${backupId1} vs ${backupId2 || '当前'}\n`);

    // 新增文件
    for (const [rel, f] of files2) {
      if (!files1.has(rel)) {
        console.log(`+ ${rel} (新增)`);
      }
    }

    // 删除文件
    for (const [rel, f] of files1) {
      if (!files2.has(rel)) {
        console.log(`- ${rel} (已删除)`);
      }
    }

    // 修改文件
    for (const [rel, f1] of files1) {
      const f2 = files2.get(rel);
      if (f2 && f1.hash !== f2.hash) {
        console.log(`~ ${rel} (已修改)`);
      }
    }
  }

  loadBackupSummary(backupId) {
    const backupPath = path.join(BACKUP_DIR, backupId);
    const summaryPath = path.join(backupPath, 'summary.json');
    
    if (!fs.existsSync(summaryPath)) {
      // 可能是备份ID的一部分，尝试查找
      const entries = fs.readdirSync(BACKUP_DIR);
      const matched = entries.find(e => e.startsWith(backupId));
      if (matched) {
        return this.loadBackupSummary(matched);
      }
      console.log(`❌ 备份不存在: ${backupId}`);
      return null;
    }
    
    return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  }

  autoBackup(note = '') {
    const id = this.backup('auto', note || `自动备份 - ${new Date().toLocaleString('zh-CN')}`);
    
    // 清理旧备份，保留最近10个
    const backups = this.state.backups.slice(-10);
    const toRemove = this.state.backups.slice(0, -10);
    
    for (const b of toRemove) {
      const p = path.join(BACKUP_DIR, b.id);
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true });
      }
    }
    
    this.state.backups = backups;
    this.saveState();
    
    return id;
  }

  watch(intervalMs = 60000) {
    console.log(`👀 开始监控配置变化 (间隔: ${intervalMs/1000}秒)`);
    console.log('   按 Ctrl+C 停止\n');
    
    let lastHashes = new Map();
    
    // 初始哈希
    for (const f of this.findConfigFiles()) {
      const content = fs.readFileSync(f.path, 'utf8');
      lastHashes.set(f.relative, this.computeHash(content));
    }
    
    const check = () => {
      const files = this.findConfigFiles();
      const changes = [];
      
      for (const f of files) {
        const content = fs.readFileSync(f.path, 'utf8');
        const hash = this.computeHash(content);
        const lastHash = lastHashes.get(f.relative);
        
        if (!lastHash) {
          changes.push({ type: 'new', file: f.relative });
        } else if (hash !== lastHash) {
          changes.push({ type: 'change', file: f.relative });
        }
        
        lastHashes.set(f.relative, hash);
      }
      
      // 检查删除
      for (const [rel] of lastHashes) {
        if (!files.find(f => f.relative === rel)) {
          changes.push({ type: 'delete', file: rel });
        }
      }
      
      if (changes.length > 0) {
        console.log(`\n⏰ ${new Date().toLocaleString('zh-CN')} - 检测到配置变化:`);
        for (const c of changes) {
          const icon = c.type === 'new' ? '+' : c.type === 'delete' ? '-' : '~';
          console.log(`   ${icon} ${c.file}`);
        }
        
        // 自动备份
        this.autoBackup(`自动备份 - 检测到 ${changes.length} 处变化`);
      }
    };
    
    setInterval(check, intervalMs);
  }
}

// CLI
const args = process.argv.slice(2);
const manager = new ConfigBackupManager();

if (args.includes('--help') || args.length === 0) {
  console.log(`
📦 配置备份与恢复管理器

用法:
  node config-backup-manager.js --backup [tag] [--note "备注"]
  node config-backup-manager.js --list
  node config-backup-manager.js --restore <backup-id> [--dry-run]
  node config-backup-manager.js --diff <backup-id> [backup-id2]
  node config-backup-manager.js --auto
  node config-backup-manager.js --watch
  node config-backup-manager.js --latest

示例:
  node config-backup-manager.js --backup before-update --note "升级前备份"
  node config-backup-manager.js --list
  node config-backup-manager.js --restore backup-2026-03-04
  node config-backup-manager.js --restore latest --dry-run
  node config-backup-manager.js --diff backup-old backup-new
  node config-backup-manager.js --auto
  node config-backup-manager.js --watch
`);
  process.exit(0);
}

const backupIdx = args.indexOf('--backup');
if (backupIdx !== -1) {
  const tag = args[backupIdx + 1] || null;
  const noteIdx = args.indexOf('--note');
  const note = noteIdx !== -1 ? args[noteIdx + 1] : '';
  manager.backup(tag, note);
} else if (args.includes('--list')) {
  manager.list();
} else if (args.includes('--restore')) {
  const idx = args.indexOf('--restore');
  let id = args[idx + 1];
  if (id === 'latest' || !id) {
    id = manager.state.latestTag;
  }
  manager.restore(id, args.includes('--dry-run'));
} else if (args.includes('--diff')) {
  const idx = args.indexOf('--diff');
  manager.diff(args[idx + 1], args[idx + 2]);
} else if (args.includes('--auto')) {
  manager.autoBackup();
} else if (args.includes('--watch')) {
  manager.watch();
} else if (args.includes('--latest')) {
  console.log('最新备份:', manager.state.latestTag || '无');
} else {
  console.log('未知命令, 使用 --help 查看帮助');
}
