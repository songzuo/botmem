const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 先获取所有开发进程的PID
  conn.exec('ps aux | grep -E "vite|next dev" | grep -v grep | awk \'{print $2}\'', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      const pids = output.trim().split('\n').filter(p => p);
      console.log('=== 找到进程 ===');
      console.log(pids.join(', '));

      if (pids.length === 0) {
        console.log('没有开发进程在运行');
        conn.end();
        return;
      }

      // 杀死这些进程
      const killCmd = 'kill -9 ' + pids.join(' ');
      console.log('\n=== 执行停止 ===');
      console.log(killCmd);

      conn.exec(killCmd, (err2, stream2) => {
        if (err2) { console.error(err2); conn.end(); return; }
        let output2 = '';
        stream2.on('data', (data) => { output2 += data.toString(); });
        stream2.on('end', () => {
          console.log('停止完成');
          console.log(output2);

          // 验证
          setTimeout(() => {
            conn.exec('ps aux | grep -E "vite|next dev" | grep -v grep || echo "没有开发进程在运行"', (err3, stream3) => {
              let output3 = '';
              stream3.on('data', (data) => { output3 += data.toString(); });
              stream3.on('end', () => {
                console.log('\n=== 验证结果 ===');
                console.log(output3 || '没有开发进程在运行');
                conn.end();
              });
            });
          }, 2000);
        });
      });
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
