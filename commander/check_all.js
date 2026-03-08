const { Client } = require('ssh2');

const conn = new Client();
const serverConfig = {
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ'
};

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 1. 检查Nginx状态
  conn.exec('systemctl status nginx --no-pager | head -20', (err, stream) => {
    stream.on('close', () => {
      // 2. 检查开发模式进程数量
      conn.exec('ps aux | grep -E "vite|next dev" | grep -v grep | wc -l', (err2, stream2) => {
        stream2.on('close', () => {
          // 3. 检查端口使用情况
          conn.exec('ss -tlnp | grep -E "80:|443:|3000:|517[0-9]:"', (err3, stream3) => {
            stream3.on('close', () => {
              // 4. 检查Web目录
              conn.exec('ls -la /web/', (err4, stream4) => {
                stream4.on('close', () => {
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
          }).on('data', (data) => {
            process.stdout.write(data.toString());
          });
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
