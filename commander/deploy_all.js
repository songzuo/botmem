const { Client } = require('ssh2');

const conn = new Client();

// 项目配置：项目名 -> 端口映射
const projects = {
  'good': 3001,
  'today': 3002,
  'wechat': 3003,
  'cv': 3004,
  'sign': 3005,
  'china': 3006,
  'song': 3007,
  'marriage': 3008,
  'ppt': 3009,
  'visa': 3011
};

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 1. 先解压所有zip文件
  const cmd = `
echo "=== 解压构建产物 ===" &&
cd /web &&
for f in good.zip today.zip wechat.zip cv.zip sign.zip china.zip song.zip ppt.zip; do
  if [ -f "$f" ]; then
    echo "解压 $f"
    unzip -o "$f" -d /web/
  fi
done &&
ls -la /web/good /web/today /web/wechat /web/cv /web/sign /web/china /web/song /web/ppt 2>/dev/null | head -30
`;

  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log(output);
      console.log('\n=== 解压完成，接下来需要配置nginx和启动服务 ===');
      conn.end();
    });
  });
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
