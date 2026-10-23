/**
 * 读取集群 SSH 密码。
 * 优先级：环境变量 CLUSTER_SSH_PASSWORD > 凭据文件 > 报错。
 * 不再把密码硬编码进各个脚本（仓库是公开仓库，硬编码等于公开泄露）。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const CRED_PATHS = [
  '/root/.openclaw/cron/.secrets/cluster-ssh.env',
  path.join(os.homedir(), '.openclaw/cron/.secrets/cluster-ssh.env'),
];

function clusterPassword() {
  const fromEnv = process.env.CLUSTER_SSH_PASSWORD;
  if (fromEnv) return fromEnv;

  for (const p of CRED_PATHS) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      for (const line of content.split('\n')) {
        const t = line.trim();
        if (t.startsWith('CLUSTER_SSH_PASSWORD=')) {
          return t.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      /* 继续尝试下一个路径 */
    }
  }
  throw new Error('未找到 CLUSTER_SSH_PASSWORD（环境变量或凭据文件）');
}

module.exports = { clusterPassword };
