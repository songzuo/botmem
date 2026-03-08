const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  const commands = [
    // 查看项目目录
    'echo "=== Web项目 ===" && ls -la /web/',
    'echo "=== OpenClaw项目 ===" && ls -la /root/.openclaw/',
    'echo "=== Claw-Mesh配置 ===" && cat /opt/claw-mesh/mesh-config.json 2>/dev/null | head -50',
    'echo "=== 正在运行的Node进程详情 ===" && ps aux | grep -E "node|npm" | grep -v grep',
    'echo "=== GitHub相关 ===" && ls -la /root/.openclaw/workspace/ | head -20',
    'echo "=== 日志目录 ===" && ls -la /var/log/ | grep -E "nginx|openclaw|mesh" | head -10',
    'echo "=== Docker日志最近 ===" && docker logs --tail 20 new-api 2>&1',
    'echo "=== 最近的系统日志 ===" && journalctl -n 20 --no-pager 2>/dev/null | tail -25',
    'echo "=== 定时任务日志 ===" && tail -30 /var/log/github-upload.log 2>/dev/null',
    'echo "=== Mesh日志 ===" && tail -30 /root/.openclaw/workspace/mesh-project/logs/self_think.log 2>/dev/null'
  ];

  let cmdIndex = 0;

  function runNextCommand() {
    if (cmdIndex >= commands.length) {
      console.log('\n=== 检查完成 ===');
      conn.end();
      return;
    }

    conn.exec(commands[cmdIndex], (err, stream) => {
      if (err) {
        console.log(`Command ${cmdIndex} error:`, err.message);
        cmdIndex++;
        runNextCommand();
        return;
      }

      let output = '';
      stream.on('close', (code, signal) => {
        if (output) console.log(output);
        cmdIndex++;
        runNextCommand();
      }).on('data', (data) => {
        output += data.toString();
      }).stderr.on('data', (data) => {
        output += data.toString();
      });
    });
  }

  runNextCommand();
}).on('error', (err) => {
  console.error('SSH Connection Error:', err.message);
  process.exit(1);
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000,
  compress: true
});
