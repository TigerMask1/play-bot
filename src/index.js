const express = require('express');
const http = require('http');
const PlayBot = require('./bot');

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json({ 
    name: 'PlayBot',
    version: '1.0.0',
    description: 'A modular community collection bot platform'
  });
});

const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} in use, trying alternative...`);
    server.listen(0, '0.0.0.0', () => {
      console.log(`🌐 Server running on port ${server.address().port}`);
    });
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN not found in environment variables!');
  console.error('Please add your Discord bot token to the Secrets.');
  process.exit(1);
}

const bot = new PlayBot();
bot.start(token).catch(error => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});
