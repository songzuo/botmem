const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  conn.exec('ps aux | grep -E "vite|next dev" | grep -v grep || echo "没有开发进程在运行"', (err, stream) => {
    let output = '';
    stream.on('data', d => output += d.toString());
    stream.on('end', () => { console.log(output); conn.end(); });
  });
}).on('error', err => {
  console.error(err);
  process.exit(1);
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ'
});
