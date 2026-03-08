const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Connected!');

  const commands = [
    'echo "=== 查找所有dist目录 ===" && find /web -maxdepth 4 -type d -name "dist" 2>/dev/null',
    'echo "=== 查找所有.next目录 ===" && find /web -maxdepth 4 -type d -name ".next" 2>/dev/null',
    'echo "=== 更新nginx配置，添加有dist的项目 ===" && cat > /etc/nginx/sites-available/projects.conf << "NGINX_EOF"',
    '# good.7zi.com configuration',
    'upstream good_static {',
    '    server 127.0.0.1:8080;',
    '    keepalive 64;',
    '}',
    '',
    '# cv.7zi.com - static files',
    'upstream cv_static {',
    '    server 127.0.0.1:8080;',
    '    keepalive 64;',
    '}',
    '',
    'server {',
    '    listen 80;',
    '    listen [::]:80;',
    '    server_name cv.7zi.com;',
    '    location / {',
    '        return 301 https://$server_name$request_uri;',
    '    }',
    '}',
    '',
    'server {',
    '    listen 443 ssl http2;',
    '    listen [::]:443 ssl http2;',
    '    server_name cv.7zi.com;',
    '    ssl_certificate /web/ssl_unified/7zi.com.crt;',
    '    ssl_certificate_key /web/ssl_unified/7zi.com.key;',
    '    ssl_protocols TLSv1.2 TLSv1.3;',
    '    ssl_ciphers HIGH:!aNULL:!MD5;',
    '    ssl_prefer_server_ciphers off;',
    '    ssl_session_cache shared:SSL:10m;',
    '    ssl_session_timeout 10m;',
    '    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    '    add_header X-Frame-Options "SAMEORIGIN" always;',
    '    add_header X-Content-Type-Options "nosniff" always;',
    '    location / {',
    '        root /web/cv/app-806p2wx4khz5/dist;',
    '        index index.html;',
    '        try_files $uri $uri/ /index.html;',
    '        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {',
    '            expires 1y;',
    '            add_header Cache-Control "public, immutable";',
    '        }',
    '    }',
    '}',
    '',
    '# sign.7zi.com',
    'server {',
    '    listen 80;',
    '    listen [::]:80;',
    '    server_name sign.7zi.com;',
    '    location / {',
    '        return 301 https://$server_name$request_uri;',
    '    }',
    '}',
    '',
    'server {',
    '    listen 443 ssl http2;',
    '    listen [::]:443 ssl http2;',
    '    server_name sign.7zi.com;',
    '    ssl_certificate /web/ssl_unified/7zi.com.crt;',
    '    ssl_certificate_key /web/ssl_unified/7zi.com.key;',
    '    ssl_protocols TLSv1.2 TLSv1.3;',
    '    ssl_ciphers HIGH:!aNULL:!MD5;',
    '    ssl_prefer_server_ciphers off;',
    '    ssl_session_cache shared:SSL:10m;',
    '    ssl_session_timeout 10m;',
    '    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    '    location / {',
    '        root /web/sign/app-7z3vcj66vpc1/dist;',
    '        index index.html;',
    '        try_files $uri $uri/ /index.html;',
    '    }',
    '}',
    'NGINX_EOF',
    'echo "=== 测试nginx配置 ===" && nginx -t',
    'echo "=== 重新加载nginx ===" && nginx -s reload',
    'echo "=== 检查3010端口进程是否正常 ===" && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3010/ || echo "连接失败"'
  ];

  let cmdIndex = 0;

  function runNextCommand() {
    if (cmdIndex >= commands.length) {
      console.log('\n=== 部署完成 ===');
      conn.end();
      return;
    }

    conn.exec(commands[cmdIndex], (err, stream) => {
      if (err) {
        console.log(`Command ${cmdIndex} error:`, err.message);
        cmdIndex++;
        runNextCommand();
        return;
      }

      let output = '';
      stream.on('close', (code, signal) => {
        if (output) console.log(output);
        cmdIndex++;
        runNextCommand();
      }).on('data', (data) => {
        output += data.toString();
      }).stderr.on('data', (data) => {
        output += data.toString();
      });
    });
  }

  runNextCommand();
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
