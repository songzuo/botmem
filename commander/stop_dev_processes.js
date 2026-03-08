const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  const commands = [
    'echo "=== 停止10087端口的Taro watch进程 ===" && kill 1174435 2>/dev/null && echo "已停止Taro watch" || echo "进程已不存在"',
    'echo "=== 停止3000端口旧进程 ===" && kill 1425933 2>/dev/null && echo "已停止3000端口进程" || echo "进程已不存在"',
    'echo "=== 停止3002端口旧进程 ===" && kill 1236933 2>/dev/null && echo "已停止3002端口进程" || echo "进程已不存在"',
    'echo "=== 停止5000端口旧进程 ===" && kill 1236920 2>/dev/null && echo "已停止5000端口进程" || echo "进程已不存在"',
    'echo "=== 等待3秒后检查端口 ===" && sleep 3 && ss -tlnp | grep -E "3000|3002|5000|10087|3010"',
    'echo "=== 检查/web目录结构 ===" && ls -la /web/'
  ];

  let cmdIndex = 0;

  function runNextCommand() {
    if (cmdIndex >= commands.length) {
      console.log('\n=== 完成 ===');
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
