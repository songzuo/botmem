const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;

// 题库（派内知识问答）
const questions = [
  {
    id: 1,
    question: '派主的手机号是什么？',
    options: ['13319551131', '13800138000', '13912345678', '13512345678'],
    answer: '13319551131'
  },
  {
    id: 2,
    question: '派内有多少个AI成员？',
    options: ['5', '8', '11', '15'],
    answer: '11'
  },
  {
    id: 3,
    question: '派内知识问答站的核心玩法是？',
    options: ['竞答模式', '闯关模式', '积分模式', '对战模式'],
    answer: '竞答模式'
  },
  {
    id: 4,
    question: 'OpenClaw是什么类型的框架？',
    options: ['AI Agent框架', 'Web框架', '游戏引擎', '数据库框架'],
    answer: 'AI Agent框架'
  },
  {
    id: 5,
    question: '派内的主要沟通平台是？',
    options: ['Telegram', '派(Pai)', 'Discord', 'Slack'],
    answer: '派(Pai)'
  },
  {
    id: 6,
    question: ' Yuanbao AI助手 运行在哪个端口？',
    options: ['3003', '8080', '443', '3000'],
    answer: '3003'
  },
  {
    id: 7,
    question: '派内问答游戏的倒计时是多少秒？',
    options: ['10秒', '15秒', '20秒', '30秒'],
    answer: '15秒'
  },
  {
    id: 8,
    question: 'Node.js的包管理器是什么？',
    options: ['npm', 'pip', 'cargo', 'go mod'],
    answer: 'npm'
  },
  {
    id: 9,
    question: 'HTTP请求中，POST方法通常用于什么？',
    options: ['获取数据', '提交数据', '删除数据', '修改数据'],
    answer: '提交数据'
  },
  {
    id: 10,
    question: 'JSON是什么格式？',
    options: ['图片格式', '音频格式', '文本交换格式', '视频格式'],
    answer: '文本交换格式'
  }
];

// 排行榜数据（内存存储）
let leaderboard = [
  { name: '小明', score: 95 },
  { name: '小红', score: 88 },
  { name: '小强', score: 82 },
  { name: '小华', score: 76 },
  { name: '小李', score: 70 }
];

// 解析请求体
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// 发送JSON响应
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  const url = req.url;

  // CORS预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // GET /api/questions
  if (req.method === 'GET' && url === '/api/questions') {
    // 返回题目（不含答案）
    const questionsWithoutAnswer = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));
    sendJson(res, 200, { success: true, questions: questionsWithoutAnswer });
    return;
  }

  // POST /api/answer
  if (req.method === 'POST' && url === '/api/answer') {
    try {
      const body = await parseBody(req);
      const { questionId, answer } = body;

      const question = questions.find(q => q.id === questionId);
      if (!question) {
        sendJson(res, 400, { success: false, message: '题目不存在' });
        return;
      }

      const isCorrect = question.answer === answer;
      sendJson(res, 200, {
        success: true,
        correct: isCorrect,
        correctAnswer: question.answer
      });
    } catch (e) {
      sendJson(res, 400, { success: false, message: '请求格式错误' });
    }
    return;
  }

  // GET /api/leaderboard
  if (req.method === 'GET' && url === '/api/leaderboard') {
    // 按分数排序
    const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
    sendJson(res, 200, { success: true, leaderboard: sorted });
    return;
  }

  // POST /api/leaderboard (提交分数)
  if (req.method === 'POST' && url === '/api/leaderboard') {
    try {
      const body = await parseBody(req);
      const { name, score } = body;

      if (!name || typeof score !== 'number') {
        sendJson(res, 400, { success: false, message: '需要提供name和score' });
        return;
      }

      leaderboard.push({ name, score });
      // 只保留前10名
      leaderboard = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);
      sendJson(res, 200, { success: true });
    } catch (e) {
      sendJson(res, 400, { success: false, message: '请求格式错误' });
    }
    return;
  }

  // 提供静态文件
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`派内知识问答服务器运行在 http://localhost:${PORT}`);
  console.log(`访问 http://localhost:${PORT} 打开游戏页面`);
});
