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

  conn.exec('netstat -tlnp 2>/dev/null | grep -E "80|443|3000|517"', (err, stream) => {
    stream.on('close', () => {
      console.log('\n=== 检查所有Node进程 ===\n');
      conn.exec('ps aux | grep node | grep -v grep | head -30', (err2, stream2) => {
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
