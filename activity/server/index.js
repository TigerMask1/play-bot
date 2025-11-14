const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 5;
const PROJECTILE_SPEED = 8;
const PROJECTILE_DAMAGE = 20;
const PLAYER_MAX_HEALTH = 100;

const gameState = {
  players: {},
  projectiles: {}
};

let projectileIdCounter = 0;

app.post('/api/token', async (req, res) => {
  try {
    const { code } = req.body;
    
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code
      })
    });
    
    const data = await response.json();
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    players: Object.keys(gameState.players).length,
    projectiles: Object.keys(gameState.projectiles).length
  });
});

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('join', (data) => {
    const { playerId, username, channelId } = data;
    
    gameState.players[socket.id] = {
      id: playerId,
      socketId: socket.id,
      username: username,
      channelId: channelId,
      x: Math.random() * (CANVAS_WIDTH - 100) + 50,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
      vx: 0,
      vy: 0,
      health: PLAYER_MAX_HEALTH,
      kills: 0,
      deaths: 0,
      lastShot: 0
    };
    
    socket.emit('state', gameState);
    
    io.emit('player-joined', gameState.players[socket.id]);
    
    console.log(`Player ${username} joined from channel ${channelId}`);
  });
  
  socket.on('move', (direction) => {
    const player = gameState.players[socket.id];
    if (!player) return;
    
    player.vx = direction.x * PLAYER_SPEED;
    player.vy = direction.y * PLAYER_SPEED;
  });
  
  socket.on('shoot', () => {
    const player = gameState.players[socket.id];
    if (!player) return;
    
    const now = Date.now();
    if (now - player.lastShot < 500) return;
    
    player.lastShot = now;
    
    const angle = Math.random() * Math.PI * 2;
    if (player.vx !== 0 || player.vy !== 0) {
      const playerAngle = Math.atan2(player.vy, player.vx);
      angle = playerAngle;
    }
    
    const projectileId = `proj_${projectileIdCounter++}`;
    
    gameState.projectiles[projectileId] = {
      id: projectileId,
      ownerId: socket.id,
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * PROJECTILE_SPEED,
      vy: Math.sin(angle) * PROJECTILE_SPEED,
      createdAt: now
    };
  });
  
  socket.on('disconnect', () => {
    const player = gameState.players[socket.id];
    if (player) {
      console.log('Player disconnected:', player.username);
      delete gameState.players[socket.id];
      io.emit('player-left', socket.id);
    }
  });
});

function gameLoop() {
  Object.values(gameState.players).forEach(player => {
    player.x += player.vx;
    player.y += player.vy;
    
    player.x = Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_WIDTH - PLAYER_SIZE / 2, player.x));
    player.y = Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_HEIGHT - PLAYER_SIZE / 2, player.y));
  });
  
  const now = Date.now();
  Object.entries(gameState.projectiles).forEach(([id, proj]) => {
    proj.x += proj.vx;
    proj.y += proj.vy;
    
    if (now - proj.createdAt > 5000 ||
        proj.x < 0 || proj.x > CANVAS_WIDTH ||
        proj.y < 0 || proj.y > CANVAS_HEIGHT) {
      delete gameState.projectiles[id];
      return;
    }
    
    Object.values(gameState.players).forEach(player => {
      if (player.socketId === proj.ownerId) return;
      
      const dx = player.x - proj.x;
      const dy = player.y - proj.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < PLAYER_SIZE / 2) {
        player.health -= PROJECTILE_DAMAGE;
        delete gameState.projectiles[id];
        
        if (player.health <= 0) {
          const killer = gameState.players[proj.ownerId];
          if (killer) {
            killer.kills = (killer.kills || 0) + 1;
          }
          player.deaths = (player.deaths || 0) + 1;
          player.health = PLAYER_MAX_HEALTH;
          player.x = Math.random() * (CANVAS_WIDTH - 100) + 50;
          player.y = Math.random() * (CANVAS_HEIGHT - 100) + 50;
          
          io.emit('player-died', {
            killerId: proj.ownerId,
            victimId: player.socketId
          });
        }
      }
    });
  });
  
  io.emit('state', gameState);
}

setInterval(gameLoop, 1000 / 60);

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Battle Arena server running on port ${PORT}`);
});
