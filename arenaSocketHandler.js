const { getSkinUrl } = require('./skinSystem.js');
const { calculateBaseHP } = require('./battleUtils.js');

// Match storage
const matches = new Map();

function initArenaSocket(io, data) {
  const arenaNamespace = io.of('/arena');
  
  arenaNamespace.on('connection', (socket) => {
    const { matchId, playerId } = socket.handshake.query;
    
    console.log(`Player ${playerId} connected to match ${matchId}`);
    
    if (!matchId || !playerId) {
      socket.emit('error', { message: 'Missing matchId or playerId' });
      socket.disconnect();
      return;
    }
    
    // Join match room
    socket.join(matchId);
    
    // Initialize match if not exists
    if (!matches.has(matchId)) {
      matches.set(matchId, {
        id: matchId,
        players: {},
        phase: 'lobby',
        startTime: null,
        projectiles: [],
        effects: []
      });
    }
    
    const match = matches.get(matchId);
    
    // Add player to match
    if (!match.players[playerId]) {
      const userData = data.users[playerId];
      match.players[playerId] = {
        playerId,
        username: userData?.username || 'Unknown',
        socketId: socket.id,
        character: null,
        ready: false,
        hp: 0,
        maxHp: 0,
        x: 0,
        y: 0,
        damageDealt: 0
      };
    } else {
      match.players[playerId].socketId = socket.id;
    }
    
    // Notify others
    arenaNamespace.to(matchId).emit('playerJoined', {
      playerId,
      ready: Object.values(match.players).filter(p => p.ready).length === 2
    });
    
    // Character selection
    socket.on('selectCharacter', async ({ character }) => {
      const player = match.players[playerId];
      if (!player || match.phase !== 'lobby') return;
      
      player.character = character;
      player.ready = true;
      
      // Calculate HP based on character ST
      player.maxHp = calculateBaseHP(character.st);
      player.hp = player.maxHp;
      
      // Notify everyone
      arenaNamespace.to(matchId).emit('characterLocked', {
        playerId,
        character: {
          name: character.name,
          emoji: character.emoji
        }
      });
      
      // Check if both players ready
      const allReady = Object.values(match.players).every(p => p.ready);
      if (allReady && Object.keys(match.players).length === 2) {
        startMatchCountdown(matchId, arenaNamespace);
      }
    });
    
    // Player movement
    socket.on('playerMove', ({ x, y }) => {
      const player = match.players[playerId];
      if (!player || match.phase !== 'playing') return;
      
      player.x = x;
      player.y = y;
      
      // Broadcast to others
      socket.to(matchId).emit('playerMove', { playerId, x, y });
    });
    
    // Attack casting
    socket.on('castAttack', ({ moveIndex, aimAngle }) => {
      const player = match.players[playerId];
      if (!player || match.phase !== 'playing') return;
      
      const move = player.character.moves[moveIndex];
      if (!move) return;
      
      // Create projectile
      const projectile = {
        id: Date.now() + Math.random(),
        playerId,
        moveIndex,
        x: player.x,
        y: player.y,
        angle: aimAngle,
        speed: move.speed || 10,
        damage: move.damage,
        range: move.range || 300,
        shape: move.shape || 'circle',
        radius: move.radius || 20,
        width: move.width || 40,
        height: move.height || 40,
        traveledDistance: 0
      };
      
      match.projectiles.push(projectile);
      
      arenaNamespace.to(matchId).emit('attackCast', {
        playerId,
        moveIndex,
        projectile
      });
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Player ${playerId} disconnected from match ${matchId}`);
      
      // If match is still active, end it
      if (match.phase === 'playing') {
        const otherPlayer = Object.values(match.players).find(p => p.playerId !== playerId);
        if (otherPlayer) {
          endMatch(matchId, otherPlayer.playerId, arenaNamespace, 'Opponent disconnected');
        }
      }
    });
  });
  
  // Game tick for projectile movement and collision
  setInterval(() => {
    matches.forEach((match, matchId) => {
      if (match.phase !== 'playing') return;
      
      // Update projectiles
      match.projectiles = match.projectiles.filter(proj => {
        // Move projectile
        proj.x += Math.cos(proj.angle) * proj.speed;
        proj.y += Math.sin(proj.angle) * proj.speed;
        proj.traveledDistance += proj.speed;
        
        // Check if out of range
        if (proj.traveledDistance > proj.range) {
          return false;
        }
        
        // Check collision with players
        for (const [targetId, target] of Object.entries(match.players)) {
          if (targetId === proj.playerId) continue;
          
          const dx = proj.x - target.x;
          const dy = proj.y - target.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < (proj.radius || 20) + 30) {
            // Hit!
            target.hp = Math.max(0, target.hp - proj.damage);
            
            // Track damage
            if (match.players[proj.playerId]) {
              match.players[proj.playerId].damageDealt += proj.damage;
            }
            
            arenaNamespace.to(matchId).emit('playerHit', {
              targetId,
              damage: proj.damage,
              newHp: target.hp
            });
            
            // Check if player died
            if (target.hp <= 0) {
              endMatch(matchId, proj.playerId, arenaNamespace);
            }
            
            return false; // Remove projectile
          }
        }
        
        return true; // Keep projectile
      });
      
      // Send game state update
      arenaNamespace.to(matchId).emit('gameUpdate', {
        players: match.players,
        projectiles: match.projectiles
      });
    });
  }, 1000 / 30); // 30 FPS
}

function startMatchCountdown(matchId, arenaNamespace) {
  const match = matches.get(matchId);
  if (!match) return;
  
  match.phase = 'countdown';
  
  let countdown = 5;
  arenaNamespace.to(matchId).emit('startCountdown', { seconds: countdown });
  
  const interval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(interval);
      startMatch(matchId, arenaNamespace);
    }
  }, 1000);
}

function startMatch(matchId, arenaNamespace) {
  const match = matches.get(matchId);
  if (!match) return;
  
  match.phase = 'playing';
  match.startTime = Date.now();
  
  // Position players
  const players = Object.values(match.players);
  if (players[0]) {
    players[0].x = 400;
    players[0].y = 450;
  }
  if (players[1]) {
    players[1].x = 1200;
    players[1].y = 450;
  }
  
  arenaNamespace.to(matchId).emit('gameStart', {
    gameState: {
      phase: 'playing',
      players: match.players,
      projectiles: [],
      effects: []
    }
  });
  
  console.log(`Match ${matchId} started!`);
}

function endMatch(matchId, winnerId, arenaNamespace, reason = null) {
  const match = matches.get(matchId);
  if (!match) return;
  
  match.phase = 'ended';
  
  const winner = match.players[winnerId];
  
  arenaNamespace.to(matchId).emit('gameEnd', {
    winnerId,
    winnerName: winner?.username || 'Unknown',
    damageDealt: winner?.damageDealt || 0,
    reason
  });
  
  // Clean up match after 30 seconds
  setTimeout(() => {
    matches.delete(matchId);
    console.log(`Match ${matchId} cleaned up`);
  }, 30000);
}

// Create a new match (called from command)
function createMatch(matchId, player1Id, player2Id) {
  if (matches.has(matchId)) {
    return false;
  }
  
  matches.set(matchId, {
    id: matchId,
    players: {},
    expectedPlayers: [player1Id, player2Id],
    phase: 'lobby',
    startTime: null,
    projectiles: [],
    effects: [],
    createdAt: Date.now()
  });
  
  console.log(`Match ${matchId} created for players ${player1Id} and ${player2Id}`);
  return true;
}

// Clean up old matches that were never joined
function cleanupOldMatches() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [matchId, match] of matches.entries()) {
    if (match.phase === 'lobby' && now - match.createdAt > maxAge) {
      matches.delete(matchId);
      console.log(`Cleaned up abandoned match ${matchId}`);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupOldMatches, 60000);

module.exports = {
  initArenaSocket,
  createMatch,
  matches
};
