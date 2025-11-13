// Discord Activity Arena Game
let discordSdk;
let socket;
let matchId;
let playerId;
let playerData = {};
let config = null;
let gameState = {
    phase: 'loading',
    players: {},
    projectiles: [],
    effects: []
};

// Canvas and rendering
let canvas, ctx;
let lastFrameTime = 0;
let canvasScale = 1;

// Joystick
let joystick = {
    active: false,
    baseX: 0,
    baseY: 0,
    x: 0,
    y: 0,
    angle: 0,
    distance: 0
};

// Game constants
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;
const PLAYER_SIZE = 60;
const MOVE_SPEED = 5;
const MAX_JOYSTICK_DISTANCE = 45;

// Initialize Discord SDK
async function initDiscordSDK() {
    const loadingText = document.querySelector('#loading-screen p');
    
    try {
        loadingText.textContent = 'Fetching configuration...';
        console.log('Fetching arena config...');
        
        const configResponse = await fetch('/api/arena/config');
        if (!configResponse.ok) {
            throw new Error('Failed to fetch config: ' + configResponse.status);
        }
        config = await configResponse.json();
        console.log('Config loaded:', config);
        
        if (!config.clientId) {
            console.warn('Discord Client ID not configured, using test mode');
            loadingText.textContent = 'Running in test mode...';
            playerId = 'test_' + Math.random().toString(36).substr(2, 9);
            playerData.username = 'TestPlayer';
            setTimeout(() => initSocketIO(), 500);
            return;
        }
        
        if (!window.DiscordSDK) {
            throw new Error('Discord SDK not loaded. Make sure you are running this inside Discord.');
        }
        
        loadingText.textContent = 'Initializing Discord SDK...';
        const DiscordSDK = window.DiscordSDK;
        discordSdk = new DiscordSDK(config.clientId);
        
        loadingText.textContent = 'Connecting to Discord...';
        await discordSdk.ready();
        console.log('Discord SDK ready');
        
        loadingText.textContent = 'Authenticating...';
        const { code } = await discordSdk.commands.authorize({
            client_id: config.clientId,
            response_type: 'code',
            state: '',
            prompt: 'none',
            scope: ['identify', 'guilds']
        });
        
        console.log('Got authorization code');
        
        loadingText.textContent = 'Getting access token...';
        const response = await fetch('/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get access token: ' + response.status);
        }
        
        const { access_token } = await response.json();
        
        loadingText.textContent = 'Completing authentication...';
        const auth = await discordSdk.commands.authenticate({ access_token });
        playerId = auth.user.id;
        playerData.username = auth.user.username;
        
        console.log('Authenticated as:', playerData.username);
        
        loadingText.textContent = 'Connecting to game server...';
        initSocketIO();
    } catch (error) {
        console.error('Discord SDK initialization failed:', error);
        loadingText.textContent = 'Error: ' + error.message;
        
        setTimeout(() => {
            loadingText.textContent = 'Falling back to test mode...';
            playerId = 'test_' + Math.random().toString(36).substr(2, 9);
            playerData.username = 'TestPlayer';
            initSocketIO();
        }, 2000);
    }
}

// Initialize Socket.IO
function initSocketIO() {
    // Get match ID from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    matchId = params.get('matchId');
    
    if (!matchId) {
        console.error('No match ID found');
        return;
    }
    
    socket = io('/arena', {
        query: { matchId, playerId }
    });
    
    socket.on('connect', () => {
        console.log('Connected to arena server');
        hideScreen('loading-screen');
        showCharacterSelect();
    });
    
    socket.on('playerJoined', (data) => {
        console.log('Player joined:', data);
        updatePlayerStatus(data);
    });
    
    socket.on('characterLocked', (data) => {
        console.log('Character locked:', data);
        lockCharacterInUI(data.playerId, data.character);
    });
    
    socket.on('startCountdown', (data) => {
        startCountdown(data.seconds);
    });
    
    socket.on('gameStart', (data) => {
        gameState = data.gameState;
        startGame();
    });
    
    socket.on('gameUpdate', (data) => {
        updateGameState(data);
    });
    
    socket.on('playerMove', (data) => {
        if (gameState.players[data.playerId]) {
            gameState.players[data.playerId].x = data.x;
            gameState.players[data.playerId].y = data.y;
        }
    });
    
    socket.on('attackCast', (data) => {
        handleAttackCast(data);
    });
    
    socket.on('playerHit', (data) => {
        handlePlayerHit(data);
    });
    
    socket.on('gameEnd', (data) => {
        endGame(data);
    });
    
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        alert('Error: ' + error.message);
    });
}

// Character selection
async function showCharacterSelect() {
    hideScreen('loading-screen');
    showScreen('character-select');
    
    // Fetch user's characters from bot
    try {
        const response = await fetch(`/api/arena/characters/${playerId}`);
        const characters = await response.json();
        
        const grid = document.getElementById('character-grid');
        grid.innerHTML = '';
        
        characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.character = char.name;
            
            const img = document.createElement('img');
            img.src = char.skinUrl;
            img.alt = char.name;
            
            const name = document.createElement('p');
            name.textContent = `${char.emoji} ${char.name}`;
            
            const level = document.createElement('p');
            level.textContent = `Lvl ${char.level} | ST: ${char.st}%`;
            level.style.fontSize = '0.8em';
            level.style.opacity = '0.8';
            
            card.appendChild(img);
            card.appendChild(name);
            card.appendChild(level);
            
            card.addEventListener('click', () => selectCharacter(char));
            
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load characters:', error);
    }
}

function selectCharacter(character) {
    // Highlight selected
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-character="${character.name}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Send to server
    socket.emit('selectCharacter', {
        matchId,
        playerId,
        character
    });
}

function lockCharacterInUI(playerId, character) {
    if (playerId !== this.playerId) {
        document.querySelectorAll('.character-card').forEach(card => {
            if (card.dataset.character === character.name) {
                card.classList.add('locked');
            }
        });
    }
}

function updatePlayerStatus(data) {
    const statusText = document.getElementById('waiting-text');
    if (data.ready) {
        statusText.textContent = 'Both players ready! Starting soon...';
    } else {
        statusText.textContent = 'Waiting for opponent...';
    }
}

// Countdown
function startCountdown(seconds) {
    hideScreen('character-select');
    showScreen('countdown-screen');
    
    const countdownEl = document.getElementById('countdown-number');
    let count = seconds;
    
    const interval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        
        if (count <= 0) {
            clearInterval(interval);
        }
    }, 1000);
}

// Game initialization
function startGame() {
    hideScreen('countdown-screen');
    showScreen('game-screen');
    
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });
    
    // Set up HUD
    updateHUD();
    
    // Set up controls
    initJoystick();
    initAttackButtons();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    const aspectRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
    const containerAspect = containerWidth / containerHeight;
    
    let displayWidth, displayHeight;
    
    if (containerAspect > aspectRatio) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * aspectRatio;
    } else {
        displayWidth = containerWidth;
        displayHeight = containerWidth / aspectRatio;
    }
    
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    canvasScale = displayWidth / CANVAS_WIDTH;
    
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
}

function updateHUD() {
    const players = Object.values(gameState.players);
    if (players.length >= 2) {
        const p1 = players[0];
        const p2 = players[1];
        
        // Player 1
        document.getElementById('p1-name').textContent = p1.username;
        document.getElementById('p1-avatar').src = p1.character.skinUrl;
        updateHP(1, p1.hp, p1.maxHp);
        
        // Player 2
        document.getElementById('p2-name').textContent = p2.username;
        document.getElementById('p2-avatar').src = p2.character.skinUrl;
        updateHP(2, p2.hp, p2.maxHp);
    }
    
    // Set attack button names
    const myPlayer = gameState.players[playerId];
    if (myPlayer && myPlayer.character.moves) {
        myPlayer.character.moves.forEach((move, index) => {
            const btn = document.querySelector(`[data-move="${index}"]`);
            if (btn) {
                btn.querySelector('.attack-name').textContent = move.name;
            }
        });
    }
}

function updateHP(playerNum, current, max) {
    const percentage = (current / max) * 100;
    document.getElementById(`p${playerNum}-hp-fill`).style.width = percentage + '%';
    document.getElementById(`p${playerNum}-hp-text`).textContent = `${Math.round(current)}/${max}`;
}

// Joystick controls
function initJoystick() {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    
    function updateBasePosition() {
        const rect = base.getBoundingClientRect();
        joystick.baseX = rect.left + rect.width / 2;
        joystick.baseY = rect.top + rect.height / 2;
    }
    
    updateBasePosition();
    window.addEventListener('resize', updateBasePosition);
    window.addEventListener('orientationchange', () => {
        setTimeout(updateBasePosition, 100);
    });
    
    let isDragging = false;
    
    const onStart = (e) => {
        e.preventDefault();
        updateBasePosition();
        isDragging = true;
        joystick.active = true;
        updateJoystick(e);
    };
    
    const onMove = (e) => {
        if (isDragging) {
            e.preventDefault();
            updateJoystick(e);
        }
    };
    
    const onEnd = (e) => {
        if (e) e.preventDefault();
        isDragging = false;
        joystick.active = false;
        stick.style.transform = 'translate(-50%, -50%)';
        joystick.x = 0;
        joystick.y = 0;
    };
    
    base.addEventListener('mousedown', onStart, { passive: false });
    base.addEventListener('touchstart', onStart, { passive: false });
    
    stick.addEventListener('mousedown', onStart, { passive: false });
    stick.addEventListener('touchstart', onStart, { passive: false });
    
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
}

function updateJoystick(e) {
    const touch = e.touches ? e.touches[0] : e;
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    let deltaX = clientX - joystick.baseX;
    let deltaY = clientY - joystick.baseY;
    
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > MAX_JOYSTICK_DISTANCE) {
        const ratio = MAX_JOYSTICK_DISTANCE / distance;
        deltaX *= ratio;
        deltaY *= ratio;
    }
    
    joystick.x = deltaX;
    joystick.y = deltaY;
    joystick.distance = Math.min(distance, MAX_JOYSTICK_DISTANCE);
    joystick.angle = Math.atan2(deltaY, deltaX);
    
    const stick = document.getElementById('joystick-stick');
    stick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
}

// Attack buttons
function initAttackButtons() {
    document.querySelectorAll('.attack-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (!btn.disabled && !btn.classList.contains('on-cooldown')) {
                castAttack(index);
            }
        });
    });
}

function castAttack(moveIndex) {
    const myPlayer = gameState.players[playerId];
    if (!myPlayer) return;
    
    const move = myPlayer.character.moves[moveIndex];
    if (!move) return;
    
    // Find opponent
    const opponentId = Object.keys(gameState.players).find(id => id !== playerId);
    const opponent = gameState.players[opponentId];
    
    if (!opponent) return;
    
    // Calculate aim direction (toward opponent by default)
    const aimAngle = Math.atan2(
        opponent.y - myPlayer.y,
        opponent.x - myPlayer.x
    );
    
    socket.emit('castAttack', {
        matchId,
        playerId,
        moveIndex,
        aimAngle
    });
    
    // Start cooldown animation
    startCooldown(moveIndex, move.cooldown);
}

function startCooldown(moveIndex, cooldownMs) {
    const btn = document.querySelector(`[data-move="${moveIndex}"]`);
    btn.classList.add('on-cooldown');
    btn.disabled = true;
    
    setTimeout(() => {
        btn.classList.remove('on-cooldown');
        btn.disabled = false;
    }, cooldownMs);
}

// Game loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Update player movement
    if (joystick.active) {
        const myPlayer = gameState.players[playerId];
        if (myPlayer) {
            const moveX = Math.cos(joystick.angle) * MOVE_SPEED * (joystick.distance / MAX_JOYSTICK_DISTANCE);
            const moveY = Math.sin(joystick.angle) * MOVE_SPEED * (joystick.distance / MAX_JOYSTICK_DISTANCE);
            
            myPlayer.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, myPlayer.x + moveX));
            myPlayer.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, myPlayer.y + moveY));
            
            // Send position update
            socket.emit('playerMove', {
                matchId,
                playerId,
                x: myPlayer.x,
                y: myPlayer.y
            });
        }
    }
    
    // Render
    render();
    
    if (gameState.phase === 'playing') {
        requestAnimationFrame(gameLoop);
    }
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw arena background (simple grid for now)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }
    
    // Draw projectiles
    gameState.projectiles.forEach(proj => {
        drawProjectile(proj);
    });
    
    // Draw effects
    gameState.effects.forEach(effect => {
        drawEffect(effect);
    });
    
    // Draw players
    Object.values(gameState.players).forEach(player => {
        drawPlayer(player);
    });
}

function drawPlayer(player) {
    ctx.save();
    
    // Draw character sprite (placeholder circle)
    ctx.fillStyle = player.playerId === playerId ? '#4CAF50' : '#F44336';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw username
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.username, player.x, player.y - PLAYER_SIZE);
    
    ctx.restore();
}

function drawProjectile(proj) {
    ctx.save();
    
    if (proj.shape === 'circle') {
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
    } else if (proj.shape === 'beam') {
        ctx.fillStyle = 'rgba(100, 100, 255, 0.8)';
        ctx.fillRect(proj.x - proj.width / 2, proj.y - proj.height / 2, proj.width, proj.height);
    }
    
    ctx.restore();
}

function drawEffect(effect) {
    if (effect.type === 'aimOverlay') {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
        ctx.lineWidth = 2;
        
        if (effect.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Handle game events
function updateGameState(data) {
    if (data.players) {
        gameState.players = data.players;
        
        // Update HP bars
        const players = Object.values(gameState.players);
        if (players.length >= 2) {
            updateHP(1, players[0].hp, players[0].maxHp);
            updateHP(2, players[1].hp, players[1].maxHp);
        }
    }
    
    if (data.projectiles) {
        gameState.projectiles = data.projectiles;
    }
}

function handleAttackCast(data) {
    console.log('Attack cast:', data);
    // Visual feedback for attack
}

function handlePlayerHit(data) {
    console.log('Player hit:', data);
    // Update HP and show damage effect
    if (gameState.players[data.targetId]) {
        gameState.players[data.targetId].hp = data.newHp;
    }
}

function endGame(data) {
    gameState.phase = 'ended';
    hideScreen('game-screen');
    showScreen('end-game-screen');
    
    const title = document.getElementById('end-game-title');
    const winnerText = document.getElementById('winner-text');
    const damageText = document.getElementById('damage-dealt-text');
    
    if (data.winnerId === playerId) {
        title.textContent = '🎉 Victory!';
        title.style.color = '#00ff00';
    } else {
        title.textContent = '💀 Defeat';
        title.style.color = '#ff0000';
    }
    
    winnerText.textContent = `Winner: ${data.winnerName}`;
    damageText.textContent = `Damage Dealt: ${data.damageDealt || 0}`;
    
    document.getElementById('close-activity-btn').addEventListener('click', () => {
        if (discordSdk) {
            discordSdk.close();
        } else {
            window.close();
        }
    });
}

// Utility functions
function showScreen(screenId) {
    document.getElementById(screenId).classList.remove('hidden');
}

function hideScreen(screenId) {
    document.getElementById(screenId).classList.add('hidden');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    initDiscordSDK();
});
