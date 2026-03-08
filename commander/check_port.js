const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  conn.exec('ss -tlnp | grep -E "3000|3010|5000|3002|10087"', (err, stream) => {
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log(output);
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error(err);
  process.exit(1);
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ'
});
