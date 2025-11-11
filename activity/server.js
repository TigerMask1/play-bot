const socketIO = require('socket.io');
const path = require('path');
const ACTIVITY_CONFIG = require('../activityConfig');
const { saveDataImmediate } = require('../dataManager');
const { verifyToken } = require('../activityAuth');

let io = null;
let activityData = null;

const players = new Map();
const authenticatedUsers = new Map();
const authAttempts = new Map();
const battleState = {
  arena: {
    width: 1920,
    height: 1080
  }
};

const RATE_LIMIT = {
  AUTH_WINDOW: 10000,
  AUTH_MAX_ATTEMPTS: 3
};

function setupSocketHandlers() {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('authenticate', (data) => {
      const now = Date.now();
      const attempts = authAttempts.get(socket.id) || { count: 0, firstAttempt: now };
      
      if (now - attempts.firstAttempt < RATE_LIMIT.AUTH_WINDOW) {
        if (attempts.count >= RATE_LIMIT.AUTH_MAX_ATTEMPTS) {
          socket.emit('authError', { message: 'Too many authentication attempts. Please wait.' });
          return;
        }
        attempts.count++;
      } else {
        attempts.count = 1;
        attempts.firstAttempt = now;
      }
      
      authAttempts.set(socket.id, attempts);
      
      if (!data.token || !data.userId) {
        socket.emit('authError', { message: 'Missing authentication data' });
        return;
      }

      const tokenCheck = verifyToken(data.userId, data.token);
      if (!tokenCheck.valid) {
        socket.emit('authError', { message: tokenCheck.error });
        return;
      }

      const userData = activityData?.users[data.userId];
      if (!userData || !userData.started) {
        socket.emit('authError', { message: 'User not found or not started' });
        return;
      }

      authenticatedUsers.set(socket.id, {
        userId: data.userId,
        username: userData.username || `Player${data.userId.slice(0, 4)}`,
        character: userData.selectedCharacter || 'warrior',
        joinedAt: Date.now()
      });

      authAttempts.delete(socket.id);
      socket.emit('authenticated', { success: true });
    });

    socket.on('joinBattle', (data) => {
      const auth = authenticatedUsers.get(socket.id);
      if (!auth) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const player = {
        id: socket.id,
        userId: auth.userId,
        username: auth.username,
        character: auth.character,
        x: Math.random() * 1000 + 460,
        y: Math.random() * 600 + 240,
        rotation: 0,
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        kills: 0,
        deaths: 0,
        damageDealt: 0,
        joinedAt: Date.now()
      };

      players.set(socket.id, player);

      socket.emit('playerJoined', player);
      socket.broadcast.emit('playerJoined', player);

      players.forEach((p, id) => {
        if (id !== socket.id) {
          socket.emit('playerJoined', p);
        }
      });
    });

    socket.on('move', (data) => {
      const player = players.get(socket.id);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.rotation = data.rotation;

        socket.broadcast.emit('playerMoved', {
          id: socket.id,
          x: data.x,
          y: data.y,
          rotation: data.rotation
        });
      }
    });

    socket.on('useSkill', (data) => {
      const player = players.get(socket.id);
      if (!player) return;

      socket.broadcast.emit('skillUsed', {
        playerId: socket.id,
        skillIndex: data.skillIndex,
        x: data.x,
        y: data.y,
        rotation: data.rotation
      });

      const damageValues = [25, 15, 35, 60];
      const damage = damageValues[data.skillIndex];

      players.forEach((target, targetId) => {
        if (targetId === socket.id) return;

        const distance = Math.sqrt(
          Math.pow(target.x - data.x, 2) + 
          Math.pow(target.y - data.y, 2)
        );

        const skillRanges = [300, 400, 150, 500];
        if (distance < skillRanges[data.skillIndex]) {
          target.health = Math.max(0, target.health - damage);
          player.damageDealt = (player.damageDealt || 0) + damage;

          io.to(targetId).emit('playerDamaged', {
            targetId,
            damage,
            newHealth: target.health
          });

          io.emit('playerDamaged', {
            targetId,
            damage,
            newHealth: target.health
          });

          if (target.health <= 0) {
            player.kills++;
            target.deaths++;

            io.emit('playerKilled', {
              killerId: socket.id,
              victimId: targetId,
              killerName: player.username,
              victimName: target.username
            });

            setTimeout(() => {
              target.health = 100;
              target.x = Math.random() * 1000 + 460;
              target.y = Math.random() * 600 + 240;

              io.emit('playerRespawned', {
                id: targetId,
                x: target.x,
                y: target.y
              });
            }, 3000);
          }
        }
      });
    });

    socket.on('disconnect', async () => {
      console.log(`Player disconnected: ${socket.id}`);
      
      const player = players.get(socket.id);
      if (player && player.userId && activityData) {
        const survivalTime = Math.floor((Date.now() - player.joinedAt) / 1000);
        
        const { recordBattleRewards } = require('../activityBattleSystem');
        const rewards = await recordBattleRewards(
          player.userId, 
          activityData, 
          player.kills, 
          player.damageDealt,
          survivalTime
        );
        
        if (rewards) {
          await saveDataImmediate(activityData);
          console.log(`💰 Saved rewards for ${player.username}: ${rewards.coins} coins, ${rewards.gems} gems`);
        }
      }
      
      players.delete(socket.id);
      authenticatedUsers.delete(socket.id);
      io.emit('playerLeft', socket.id);
    });
  });
}

function attachToServer(httpServer, app, data) {
  if (!ACTIVITY_CONFIG.ENABLED) {
    console.log('📴 Discord Activity Battle System is DISABLED');
    return false;
  }

  activityData = data;

  app.use('/activity', require('express').static(path.join(__dirname)));

  const allowedOrigins = [
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    process.env.REPL_SLUG && process.env.REPL_OWNER ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : null
  ].filter(Boolean);

  io = socketIO(httpServer, {
    path: '/activity/socket.io',
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  setupSocketHandlers();

  console.log('🎮 Battle Arena Activity attached to server');
  console.log('🚀 Activity is ENABLED and ready for battles!');
  console.log('📍 Activity URL: /activity/index.html');
  
  return true;
}

module.exports = {
  attachToServer,
  isActive: () => ACTIVITY_CONFIG.ENABLED && io !== null
};
