const { Client } = require('ssh2');

const conn = new Client();

// 项目列表
const projects = ['good', 'today', 'wechat', 'cv', 'sign', 'china', 'song', 'marriage', 'ppt', 'visa', '7zi.com'];
const basePath = '/web';

let projectIndex = 0;

function checkNextProject() {
  if (projectIndex >= projects.length) {
    console.log('=== 检查完成 ===');
    conn.end();
    return;
  }

  const project = projects[projectIndex];
  projectIndex++;

  const projectPath = project === '7zi.com' ? '/var/www/7zi' : `${basePath}/${project}`;

  conn.exec(`echo "=== ${project} ===" && ls -la ${projectPath}/package.json 2>/dev/null && cat ${projectPath}/package.json | grep -A 20 '"scripts"'`, (err, stream) => {
    if (err) {
      console.log(`=== ${project} === Error: ${err.message}`);
      checkNextProject();
      return;
    }

    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log(output);
      checkNextProject();
    });
  });
}

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');
  checkNextProject();
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
