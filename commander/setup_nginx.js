const { Client } = require('ssh2');

const conn = new Client();

// 项目配置：子域名 -> dist目录
const projects = {
  'good.7zi.com': '/web/good/app-7yjgrzlwtatd/dist',
  'today.7zi.com': '/web/today/app-8cputnrlfcw1/dist',
  'wechat.7zi.com': '/web/wechat/app-81q7p9yhr5z5/dist',
  'cv.7zi.com': '/web/cv/app-806p2wx4khz5/dist',
  'sign.7zi.com': '/web/sign/app-7z3vcj66vpc1/dist',
  'china.7zi.com': '/web/china/app-81cpnk3eh8n5/dist',
  'song.7zi.com': '/web/song/app-7ucu4p2g9ypt/dist',
  'ppt.7zi.com': '/web/ppt/app-889o5k4aefi9/dist',
};

conn.on('ready', () => {
  console.log('=== SSH连接成功 ===\n');

  // 创建nginx配置
  let nginxConfig = '';

  for (const [domain, distPath] of Object.entries(projects)) {
    const serverName = domain.replace('.7zi.com', '');

    nginxConfig += `
# ${serverName}.7zi.com configuration
upstream ${serverName}_static {
    server 127.0.0.1:8080;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${domain};

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL certificate
    ssl_certificate /web/ssl_unified/7zi.com.crt;
    ssl_certificate_key /web/ssl_unified/7zi.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Root location - serve static files
    location / {
        root ${distPath};
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check
    location /health {
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }

    access_log /var/log/nginx/${serverName}-access.log;
    error_log /var/log/nginx/${serverName}-error.log;
}
`;
  }

  console.log('=== 生成的Nginx配置 ===');
  console.log(nginxConfig);

  // 保存配置到文件
  const fs = require('fs');
  const configPath = '/tmp/projects_nginx.conf';
  conn.exec(`cat > ${configPath} << 'NGINX_EOF'
${nginxConfig}
NGINX_EOF`, (err, stream) => {
    if (err) {
      console.error('保存配置失败:', err);
      conn.end();
      return;
    }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.on('end', () => {
      console.log('\n=== 配置已保存 ===');

      // 复制到nginx配置目录
      conn.exec(`cp ${configPath} /etc/nginx/sites-available/projects.conf && ln -sf /etc/nginx/sites-available/projects.conf /etc/nginx/sites-enabled/projects.conf && nginx -t`, (err2, stream2) => {
        let output2 = '';
        stream2.on('data', (data) => { output2 += data.toString(); });
        stream2.on('end', () => {
          console.log(output2);
          console.log('\n=== 重新加载nginx ===');
          conn.exec('nginx -s reload', (err3, stream3) => {
            let output3 = '';
            stream3.on('data', (data) => { output3 += data.toString(); });
            stream3.on('end', () => {
              console.log(output3 || 'nginx已重新加载');
              conn.end();
            });
          });
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
