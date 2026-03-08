const { Client } = require('ssh2');

const conn = new Client();
const serverConfig = {
  host: '7zi.com',
  port: 22,
  username: 'root',
  privateKey: require('fs').readFileSync('C:/Users/Administrator/lobsterai/project/.ssh/id_rsa')
};

conn.on('ready', () => {
  console.log('SSH连接成功');

  // 执行检查开发模式进程的命令
  conn.exec('ps aux | grep -E "vite|next" | grep -v grep | head -20', (err, stream) => {
    if (err) {
      console.log('执行错误:', err.message);
      conn.end();
      return;
    }

    let output = '';
    stream.on('close', (code) => {
      console.log('进程列表:');
      console.log(output);
      conn.end();
    }).on('data', (data) => {
      output += data.toString();
    }).stderr.on('data', (data) => {
      output += data.toString();
    });
  });
}).on('error', (err) => {
  console.log('连接错误:', err.message);
}).connect(serverConfig);
