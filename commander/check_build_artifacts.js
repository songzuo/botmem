const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  const commands = [
    'echo "=== 检查cv的app目录 ===" && ls -la /web/cv/app-806p2wx4khz5/ | head -20',
    'echo "=== 检查sign的app目录 ===" && ls -la /web/sign/app-7z3vcj66vpc1/ | head -20',
    'echo "=== 检查china的app目录 ===" && ls -la /web/china/app-81cpnk3eh8n5/ | head -20 "=== 检查song',
    'echo的app目录 ===" && ls -la /web/song/app-7ucu4p2g9ypt/ | head -20',
    'echo "=== 检查ppt的app目录 ===" && ls -la /web/ppt/app-889o5k4aefi9/ | head -20',
    'echo "=== 检查today的app目录 ===" && ls -la /web/today/app-8cputnrlfcw1/ | head -20',
    'echo "=== 检查wechat的app目录 ===" && ls -la /web/wechat/app-81q7p9yhr5z5/ | head -20',
    'echo "=== 检查good的app目录 ===" && ls -la /web/good/app-7yjgrzlwtatd/ | head -20',
    'echo "=== 检查visa的.next目录 ===" && ls -la /web/visa/visa-openness/.next/ | head -20',
    'echo "=== 检查marriage目录结构 ===" && ls -la /web/marriage/ | head -20'
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
