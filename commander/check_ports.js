const { Client } = require('ssh2');

const conn = new Client();
const serverConfig = {
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ'
};

conn.on('ready', () => {
  console.log('=== 检查端口监听情况 ===\n');

  conn.exec('ss -tlnp | grep -E "80:|443:|3000:|517[0-9]:"', (err, stream) => {
    stream.on('close', () => {
      console.log('\n=== 检查开发模式进程详情 ===\n');
      conn.exec('ps aux | grep -E "vite|next dev" | grep -v grep', (err2, stream2) => {
        stream2.on('close', () => {
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data.toString());
        });
      }).on('data', (data) => {
        process.stdout.write(data.toString());
      });
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.log('连接错误:', err.message);
}).connect(serverConfig);
