const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  const commands = [
    'echo "=== 解压cv.zip ===" && cd /web/cv && unzip -o cv.zip -d . 2>/dev/null && echo "cv解压完成" || echo "cv解压失败或已存在"',
    'echo "=== 解压sign.zip ===" && cd /web/sign && unzip -o sign.zip -d . 2>/dev/null && echo "sign解压完成" || echo "sign解压失败或已存在"',
    'echo "=== 解压china.zip ===" && cd /web/china && unzip -o china.zip -d . 2>/dev/null && echo "china解压完成" || echo "china解压失败或已存在"',
    'echo "=== 解压song.zip ===" && cd /web/song && unzip -o song.zip -d . 2>/dev/null && echo "song解压完成" || echo "song解压失败或已存在"',
    'echo "=== 解压ppt.zip ===" && cd /web/ppt && unzip -o ppt.zip -d . 2>/dev/null && echo "ppt解压完成" || echo "ppt解压失败或已存在"',
    'echo "=== 解压today.zip ===" && cd /web/today && unzip -o today.zip -d . 2>/dev/null && echo "today解压完成" || echo "today解压失败或已存在"',
    'echo "=== 解压wechat.zip ===" && cd /web/wechat && unzip -o wechat.zip -d . 2>/dev/null && echo "wechat解压完成" || echo "wechat解压失败或已存在"',
    'echo "=== 解压good.zip ===" && cd /web/good && unzip -o good.zip -d . 2>/dev/null && echo "good解压完成" || echo "good解压失败或已存在"',
    'echo "=== 检查visa目录 ===" && ls -la /web/visa/',
    'echo "=== 检查marriage目录 ===" && ls -la /web/marriage/'
  ];

  let cmdIndex = 0;

  function runNextCommand() {
    if (cmdIndex >= commands.length) {
      console.log('\n=== 解压完成 ===');
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
