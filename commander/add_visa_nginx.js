const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  // 添加visa子域名配置
  const nginxConfig = `
# Visa Openness - 子域名
server {
    listen 80;
    server_name visa.7zi.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    # Next.js静态资源缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3003;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
`;

  // 写入配置文件并测试
  const cmd = `
echo '${nginxConfig}' > /etc/nginx/sites-available/visa.conf
ln -sf /etc/nginx/sites-available/visa.conf /etc/nginx/sites-enabled/visa.conf
echo "=== 测试nginx配置 ===" && nginx -t
echo "=== 重新加载nginx ===" && nginx -s reload
echo "=== 配置完成 ==="
`;

  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('close', () => { console.log(output); conn.end(); });
  });
}).connect({
  host: '7zi.com',
  port: 22,
  username: 'root',
  password: 'ge2099334$ZZ',
  readyTimeout: 30000
});
