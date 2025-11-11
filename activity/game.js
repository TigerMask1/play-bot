class BattleArena extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleArena' });
        this.players = new Map();
        this.projectiles = [];
        this.particles = [];
        this.myPlayer = null;
        this.joystick = { x: 0, y: 0 };
        this.skills = [];
        this.cooldowns = [0, 0, 0, 0];
        this.socket = null;
    }

    preload() {
        this.load.setBaseURL('.');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.cameras.main.setBackgroundColor('#1a1a2e');
        
        this.createArena(width, height);
        
        this.initializeSocket();
        
        this.initializeControls();
        
        this.time.addEvent({
            delay: 100,
            callback: this.updateEnergy,
            callbackScope: this,
            loop: true
        });
        
        this.time.addEvent({
            delay: 50,
            callback: this.updateCooldowns,
            callbackScope: this,
            loop: true
        });
    }

    createArena(width, height) {
        const gridSize = 50;
        const graphics = this.add.graphics();
        
        graphics.lineStyle(1, 0x0f3460, 0.3);
        for (let x = 0; x < width; x += gridSize) {
            graphics.lineBetween(x, 0, x, height);
        }
        for (let y = 0; y < height; y += gridSize) {
            graphics.lineBetween(0, y, width, y);
        }
        
        const border = this.add.graphics();
        border.lineStyle(4, 0xFFD700, 1);
        border.strokeRect(10, 10, width - 20, height - 20);
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.socket.emit('joinBattle', {
                username: 'Player' + Math.floor(Math.random() * 1000),
                character: 'warrior'
            });
        });
        
        this.socket.on('playerJoined', (data) => {
            this.createPlayer(data.id, data.x, data.y, data.username, data.character);
            if (data.id === this.socket.id) {
                this.myPlayer = this.players.get(data.id);
                this.cameras.main.startFollow(this.myPlayer.sprite, true, 0.1, 0.1);
            }
        });
        
        this.socket.on('playerMoved', (data) => {
            const player = this.players.get(data.id);
            if (player && data.id !== this.socket.id) {
                player.targetX = data.x;
                player.targetY = data.y;
                player.rotation = data.rotation;
            }
        });
        
        this.socket.on('playerLeft', (id) => {
            const player = this.players.get(id);
            if (player) {
                player.sprite.destroy();
                player.nameText.destroy();
                player.healthBar.destroy();
                this.players.delete(id);
            }
        });
        
        this.socket.on('skillUsed', (data) => {
            this.handleSkillEffect(data);
        });
        
        this.socket.on('playerDamaged', (data) => {
            this.showDamage(data.targetId, data.damage);
            const player = this.players.get(data.targetId);
            if (player) {
                player.health = data.newHealth;
                this.updatePlayerHealthBar(player);
            }
        });
        
        this.socket.on('playerKilled', (data) => {
            this.addKillFeedMessage(`${data.killerName} eliminated ${data.victimName}!`);
            const player = this.players.get(data.victimId);
            if (player) {
                this.createDeathEffect(player.sprite.x, player.sprite.y);
            }
        });
        
        this.socket.on('playerRespawned', (data) => {
            const player = this.players.get(data.id);
            if (player) {
                player.sprite.x = data.x;
                player.sprite.y = data.y;
                player.health = 100;
                player.sprite.alpha = 1;
                this.updatePlayerHealthBar(player);
            }
        });
    }

    createPlayer(id, x, y, username, character) {
        const colors = {
            warrior: 0xFF4444,
            mage: 0x4444FF,
            archer: 0x44FF44,
            assassin: 0xFF44FF
        };
        
        const color = colors[character] || 0xFFFFFF;
        
        const sprite = this.add.circle(x, y, 20, color);
        sprite.setStrokeStyle(3, 0xFFFFFF);
        
        const nameText = this.add.text(x, y - 40, username, {
            fontSize: '14px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        const healthBarBg = this.add.rectangle(x, y - 30, 50, 6, 0x000000, 0.7);
        const healthBar = this.add.rectangle(x, y - 30, 50, 6, 0x00FF00);
        
        this.players.set(id, {
            sprite,
            nameText,
            healthBar,
            healthBarBg,
            targetX: x,
            targetY: y,
            rotation: 0,
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100
        });
    }

    initializeControls() {
        const joystickElement = document.getElementById('joystick');
        const stick = document.getElementById('joystick-stick');
        
        let isDragging = false;
        
        const handleJoystick = (e) => {
            if (!isDragging) return;
            
            const rect = joystickElement.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            let x = e.clientX - rect.left - centerX;
            let y = e.clientY - rect.top - centerY;
            
            if (e.touches && e.touches[0]) {
                x = e.touches[0].clientX - rect.left - centerX;
                y = e.touches[0].clientY - rect.top - centerY;
            }
            
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = rect.width / 2 - 30;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(y, x);
                x = Math.cos(angle) * maxDistance;
                y = Math.sin(angle) * maxDistance;
            }
            
            stick.style.transform = `translate(${x}px, ${y}px)`;
            
            this.joystick.x = x / maxDistance;
            this.joystick.y = y / maxDistance;
        };
        
        joystickElement.addEventListener('mousedown', () => isDragging = true);
        joystickElement.addEventListener('touchstart', () => isDragging = true);
        
        document.addEventListener('mousemove', handleJoystick);
        document.addEventListener('touchmove', handleJoystick);
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            stick.style.transform = 'translate(0, 0)';
            this.joystick.x = 0;
            this.joystick.y = 0;
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
            stick.style.transform = 'translate(0, 0)';
            this.joystick.x = 0;
            this.joystick.y = 0;
        });
        
        const skillButtons = document.querySelectorAll('.skill-btn');
        skillButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => this.useSkill(index));
        });
        
        this.input.keyboard.on('keydown-Q', () => this.useSkill(0));
        this.input.keyboard.on('keydown-W', () => this.useSkill(1));
        this.input.keyboard.on('keydown-E', () => this.useSkill(2));
        this.input.keyboard.on('keydown-R', () => this.useSkill(3));
    }

    useSkill(skillIndex) {
        if (this.cooldowns[skillIndex] > 0) return;
        if (!this.myPlayer) return;
        
        const energyCost = [20, 30, 40, 50][skillIndex];
        if (this.myPlayer.energy < energyCost) return;
        
        this.myPlayer.energy -= energyCost;
        this.cooldowns[skillIndex] = [2, 3, 5, 10][skillIndex];
        
        this.socket.emit('useSkill', {
            skillIndex,
            x: this.myPlayer.sprite.x,
            y: this.myPlayer.sprite.y,
            rotation: this.myPlayer.rotation
        });
        
        this.createSkillEffect(skillIndex, this.myPlayer.sprite.x, this.myPlayer.sprite.y, this.myPlayer.rotation);
        
        this.updateEnergyBar();
    }

    createSkillEffect(skillIndex, x, y, rotation) {
        switch(skillIndex) {
            case 0:
                this.createProjectile(x, y, rotation, 0xFF4444);
                break;
            case 1:
                for (let i = 0; i < 3; i++) {
                    const angle = rotation + (i - 1) * 0.3;
                    this.createProjectile(x, y, angle, 0x4444FF);
                }
                break;
            case 2:
                this.createAOE(x, y, 0x44FF44);
                break;
            case 3:
                this.createUltimateEffect(x, y);
                break;
        }
    }

    createProjectile(x, y, angle, color) {
        const projectile = this.add.circle(x, y, 8, color);
        projectile.setStrokeStyle(2, 0xFFFFFF);
        
        const speed = 400;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        
        const trail = this.add.particles(x, y, {
            speed: { min: -20, max: 20 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.7, end: 0 },
            tint: color,
            lifespan: 300,
            quantity: 2,
            frequency: 20
        });
        
        this.projectiles.push({
            sprite: projectile,
            dx,
            dy,
            trail,
            lifetime: 3000,
            created: Date.now()
        });
    }

    createAOE(x, y, color) {
        const circle = this.add.circle(x, y, 10, color, 0.5);
        
        this.tweens.add({
            targets: circle,
            radius: 100,
            alpha: 0,
            duration: 500,
            onComplete: () => circle.destroy()
        });
        
        this.createParticleExplosion(x, y, color);
    }

    createUltimateEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.createProjectile(x, y, angle, 0xFFD700);
        }
        
        this.createParticleExplosion(x, y, 0xFFD700, 50);
        
        this.cameras.main.shake(200, 0.01);
    }

    createParticleExplosion(x, y, color, count = 20) {
        const particles = this.add.particles(x, y, {
            speed: { min: 100, max: 300 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: color,
            lifespan: 600,
            quantity: count,
            angle: { min: 0, max: 360 }
        });
        
        this.time.delayedCall(700, () => particles.destroy());
    }

    createDeathEffect(x, y) {
        this.createParticleExplosion(x, y, 0xFF0000, 100);
        this.cameras.main.flash(300, 255, 0, 0, false);
    }

    handleSkillEffect(data) {
        if (data.playerId !== this.socket.id) {
            this.createSkillEffect(data.skillIndex, data.x, data.y, data.rotation);
        }
    }

    showDamage(playerId, damage) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        const damageText = this.add.text(player.sprite.x, player.sprite.y - 50, `-${damage}`, {
            fontSize: '24px',
            fill: '#FF0000',
            stroke: '#000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: damageText,
            y: player.sprite.y - 120,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: () => damageText.destroy()
        });
        
        if (playerId === this.socket.id) {
            this.cameras.main.shake(100, 0.005);
            this.updateHealthBar();
        }
    }

    updatePlayerHealthBar(player) {
        const healthPercent = player.health / player.maxHealth;
        player.healthBar.width = 50 * healthPercent;
        
        if (healthPercent > 0.6) {
            player.healthBar.fillColor = 0x00FF00;
        } else if (healthPercent > 0.3) {
            player.healthBar.fillColor = 0xFFFF00;
        } else {
            player.healthBar.fillColor = 0xFF0000;
        }
    }

    updateHealthBar() {
        if (!this.myPlayer) return;
        const healthPercent = this.myPlayer.health / this.myPlayer.maxHealth;
        document.getElementById('health-fill').style.width = (healthPercent * 100) + '%';
    }

    updateEnergyBar() {
        if (!this.myPlayer) return;
        const energyPercent = this.myPlayer.energy / this.myPlayer.maxEnergy;
        document.getElementById('energy-fill').style.width = (energyPercent * 100) + '%';
    }

    updateEnergy() {
        if (!this.myPlayer) return;
        this.myPlayer.energy = Math.min(this.myPlayer.maxEnergy, this.myPlayer.energy + 2);
        this.updateEnergyBar();
    }

    updateCooldowns() {
        for (let i = 0; i < this.cooldowns.length; i++) {
            if (this.cooldowns[i] > 0) {
                this.cooldowns[i] = Math.max(0, this.cooldowns[i] - 0.05);
                const btn = document.querySelector(`[data-skill="${i}"]`);
                if (btn) {
                    if (this.cooldowns[i] > 0) {
                        btn.classList.add('cooldown');
                        btn.textContent = Math.ceil(this.cooldowns[i]);
                    } else {
                        btn.classList.remove('cooldown');
                        btn.textContent = ['Q', 'W', 'E', 'R'][i];
                    }
                }
            }
        }
    }

    addKillFeedMessage(message) {
        const killFeed = document.getElementById('kill-feed');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'kill-message';
        messageDiv.textContent = message;
        killFeed.prepend(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 5000);
    }

    update(time, delta) {
        if (this.myPlayer) {
            const speed = 300;
            const newX = this.myPlayer.sprite.x + this.joystick.x * speed * delta / 1000;
            const newY = this.myPlayer.sprite.y + this.joystick.y * speed * delta / 1000;
            
            const bounds = this.cameras.main.getBounds();
            this.myPlayer.sprite.x = Phaser.Math.Clamp(newX, 30, bounds.width - 30);
            this.myPlayer.sprite.y = Phaser.Math.Clamp(newY, 30, bounds.height - 30);
            
            if (this.joystick.x !== 0 || this.joystick.y !== 0) {
                this.myPlayer.rotation = Math.atan2(this.joystick.y, this.joystick.x);
                
                this.socket.emit('move', {
                    x: this.myPlayer.sprite.x,
                    y: this.myPlayer.sprite.y,
                    rotation: this.myPlayer.rotation
                });
            }
            
            this.myPlayer.nameText.x = this.myPlayer.sprite.x;
            this.myPlayer.nameText.y = this.myPlayer.sprite.y - 40;
            this.myPlayer.healthBar.x = this.myPlayer.sprite.x;
            this.myPlayer.healthBar.y = this.myPlayer.sprite.y - 30;
            this.myPlayer.healthBarBg.x = this.myPlayer.sprite.x;
            this.myPlayer.healthBarBg.y = this.myPlayer.sprite.y - 30;
        }
        
        this.players.forEach((player) => {
            if (player !== this.myPlayer) {
                player.sprite.x = Phaser.Math.Linear(player.sprite.x, player.targetX, 0.2);
                player.sprite.y = Phaser.Math.Linear(player.sprite.y, player.targetY, 0.2);
                
                player.nameText.x = player.sprite.x;
                player.nameText.y = player.sprite.y - 40;
                player.healthBar.x = player.sprite.x;
                player.healthBar.y = player.sprite.y - 30;
                player.healthBarBg.x = player.sprite.x;
                player.healthBarBg.y = player.sprite.y - 30;
            }
        });
        
        this.projectiles = this.projectiles.filter(proj => {
            proj.sprite.x += proj.dx * delta / 1000;
            proj.sprite.y += proj.dy * delta / 1000;
            
            if (proj.trail) {
                proj.trail.x = proj.sprite.x;
                proj.trail.y = proj.sprite.y;
            }
            
            const isAlive = Date.now() - proj.created < proj.lifetime;
            if (!isAlive) {
                proj.sprite.destroy();
                if (proj.trail) proj.trail.destroy();
            }
            return isAlive;
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    scene: BattleArena,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
