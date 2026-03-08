const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  const commands = [
    'echo "=== 检查cv目录内容 ===" && ls -la /web/cv/',
    'echo "=== 检查sign目录内容 ===" && ls -la /web/sign/',
    'echo "=== 检查china目录内容 ===" && ls -la /web/china/',
    'echo "=== 检查song目录内容 ===" && ls -la /web/song/',
    'echo "=== 检查ppt目录内容 ===" && ls -la /web/ppt/',
    'echo "=== 检查today目录内容 ===" && ls -la /web/today/',
    'echo "=== 检查wechat目录内容 ===" && ls -la /web/wechat/',
    'echo "=== 检查good目录内容 ===" && ls -la /web/good/',
    'echo "=== 检查visa目录完整内容 ===" && ls -laR /web/visa/ | head -50',
    'echo "=== 检查visa-openness目录 ===" && ls -la /web/visa/visa-openness/'
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
