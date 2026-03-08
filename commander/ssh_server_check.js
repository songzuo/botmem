const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 检查5172和5175端口
  const commands = [
    'echo "=== 检查5172端口 ===" && ss -tlnp | grep 5172',
    'echo "=== 检查5175端口 ===" && ss -tlnp | grep 5175',
    'echo "=== 检查所有517x端口 ===" && ss -tlnp | grep 517',
    'echo "=== 检查vite进程 ===" && ps aux | grep -E "vite" | grep -v grep | head -10',
    'echo "=== 检查node进程 ===" && ps aux | grep -E "node.*517" | grep -v grep'
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
