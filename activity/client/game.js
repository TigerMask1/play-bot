import { DiscordSDK } from '@discord/embedded-app-sdk';
import { io } from 'socket.io-client';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const PLAYER_SIZE = 40;
const PROJECTILE_SIZE = 10;
const PROJECTILE_SPEED = 8;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const loadingEl = document.getElementById('loading');
const statusEl = document.getElementById('status');
const playerListEl = document.getElementById('player-list');
const joystickContainer = document.getElementById('joystick-container');
const joystickKnob = document.getElementById('joystick-knob');
const shootButton = document.getElementById('shoot-button');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let discordSdk;
let socket;
let playerId;
let players = {};
let projectiles = {};
let joystickActive = false;
let joystickDirection = { x: 0, y: 0 };

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

async function init() {
  try {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '123456789';
    discordSdk = new DiscordSDK(clientId);
    
    await discordSdk.ready();
    statusEl.textContent = '🔐 Authenticating...';
    
    const { code } = await discordSdk.commands.authorize({
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds']
    });
    
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    const { access_token } = await response.json();
    
    const auth = await discordSdk.commands.authenticate({
      access_token
    });
    
    playerId = auth.user.id;
    const username = auth.user.username;
    
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    socket = io(serverUrl);
    
    socket.on('connect', () => {
      statusEl.textContent = '⚡ Connected';
      socket.emit('join', { 
        playerId, 
        username, 
        channelId: discordSdk.channelId 
      });
      loadingEl.classList.add('hidden');
      joystickContainer.classList.remove('hidden');
      shootButton.classList.remove('hidden');
    });
    
    socket.on('state', (state) => {
      players = state.players || {};
      projectiles = state.projectiles || {};
      updateScoreboard();
    });
    
    socket.on('player-joined', (player) => {
      players[player.id] = player;
      updateScoreboard();
    });
    
    socket.on('player-left', (id) => {
      delete players[id];
      updateScoreboard();
    });
    
    socket.on('player-died', ({ killerId, victimId }) => {
      if (players[killerId]) players[killerId].kills = (players[killerId].kills || 0) + 1;
      if (players[victimId]) players[victimId].deaths = (players[victimId].deaths || 0) + 1;
      updateScoreboard();
    });
    
    await discordSdk.commands.setActivity({
      activity: {
        details: 'Playing Battle Arena',
        state: 'In a match'
      }
    });
    
    setupControls();
    gameLoop();
    
  } catch (error) {
    console.error('Initialization error:', error);
    statusEl.textContent = '❌ Error: ' + error.message;
    statusEl.style.color = '#ff4444';
  }
}

function setupControls() {
  const joystick = document.getElementById('joystick');
  const knob = joystickKnob;
  const joystickRect = joystick.getBoundingClientRect();
  const joystickCenterX = joystickRect.width / 2;
  const joystickCenterY = joystickRect.height / 2;
  const maxDistance = 45;
  
  function updateJoystick(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const x = clientX - rect.left - joystickCenterX;
    const y = clientY - rect.top - joystickCenterY;
    
    const distance = Math.sqrt(x * x + y * y);
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(y, x);
    
    const knobX = Math.cos(angle) * clampedDistance;
    const knobY = Math.sin(angle) * clampedDistance;
    
    knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    joystickDirection = {
      x: knobX / maxDistance,
      y: knobY / maxDistance
    };
    
    if (socket && socket.connected) {
      socket.emit('move', joystickDirection);
    }
  }
  
  function resetJoystick() {
    knob.style.transform = 'translate(-50%, -50%)';
    joystickDirection = { x: 0, y: 0 };
    if (socket && socket.connected) {
      socket.emit('move', joystickDirection);
    }
  }
  
  knob.addEventListener('mousedown', (e) => {
    joystickActive = true;
    e.preventDefault();
  });
  
  knob.addEventListener('touchstart', (e) => {
    joystickActive = true;
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (joystickActive) {
      updateJoystick(e.clientX, e.clientY);
    }
  });
  
  document.addEventListener('touchmove', (e) => {
    if (joystickActive && e.touches.length > 0) {
      updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (joystickActive) {
      joystickActive = false;
      resetJoystick();
    }
  });
  
  document.addEventListener('touchend', () => {
    if (joystickActive) {
      joystickActive = false;
      resetJoystick();
    }
  });
  
  shootButton.addEventListener('click', () => {
    if (socket && socket.connected) {
      socket.emit('shoot');
      shootButton.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a6f)';
      setTimeout(() => {
        shootButton.style.background = 'linear-gradient(135deg, #f093fb, #f5576c)';
      }, 100);
    }
  });
  
  shootButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (socket && socket.connected) {
      socket.emit('shoot');
    }
  });
}

function updateScoreboard() {
  const sortedPlayers = Object.values(players).sort((a, b) => 
    (b.kills || 0) - (a.kills || 0)
  );
  
  playerListEl.innerHTML = sortedPlayers.map((player, index) => {
    const isMe = player.id === playerId;
    return `
      <div class="player-score" style="${isMe ? 'font-weight: bold; color: #4ade80;' : ''}">
        <span>${player.username}${isMe ? ' (You)' : ''}</span>
        <span>${player.kills || 0}/${player.deaths || 0}</span>
      </div>
    `;
  }).join('');
}

function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.strokeStyle = '#2d2d44';
  ctx.lineWidth = 1;
  for (let i = 0; i < CANVAS_WIDTH; i += 50) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(CANVAS_WIDTH, i);
    ctx.stroke();
  }
  
  Object.values(projectiles).forEach(proj => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, PROJECTILE_SIZE, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFD700';
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  
  Object.values(players).forEach((player, index) => {
    const color = colors[index % colors.length];
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    if (player.id === playerId) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.username, player.x, player.y - PLAYER_SIZE);
    
    const healthBarWidth = 50;
    const healthBarHeight = 6;
    const healthPercent = (player.health || 100) / 100;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x - healthBarWidth / 2, player.y + PLAYER_SIZE / 2 + 5, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#facc15' : '#ef4444';
    ctx.fillRect(player.x - healthBarWidth / 2, player.y + PLAYER_SIZE / 2 + 5, healthBarWidth * healthPercent, healthBarHeight);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x - healthBarWidth / 2, player.y + PLAYER_SIZE / 2 + 5, healthBarWidth, healthBarHeight);
  });
  
  requestAnimationFrame(gameLoop);
}

init();
