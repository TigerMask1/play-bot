# ZooBot Arena - Discord Activity Setup Guide

## 🎮 Overview

The ZooBot Arena is a real-time 2D battle system that runs as a Discord Activity (embedded iframe) within Discord. Players can challenge each other to skill-based combat using their collected characters.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Discord Application Setup](#discord-application-setup)
3. [Environment Variables](#environment-variables)
4. [Render Deployment Configuration](#render-deployment-configuration)
5. [Customizing Arena Assets](#customizing-arena-assets)
6. [Testing the Arena](#testing-the-arena)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up the arena, ensure you have:

- ✅ Discord bot created in Discord Developer Portal
- ✅ Bot deployed on Render (or similar hosting platform)
- ✅ `DISCORD_BOT_TOKEN` configured
- ✅ Socket.IO and Express installed (already in package.json)

---

## Discord Application Setup

### Step 1: Enable Discord Activity

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Navigate to **Activities** section
4. Click **Enable Activities**

### Step 2: Configure Activity URL Mapping

1. In the Activities section, add a new URL mapping:
   - **URL Prefix**: `/activity/arena`
   - **Target URL**: `https://zoobot-zoki.onrender.com/activity/arena`
     - Replace with your Render app URL if different
   - **Description**: ZooBot Arena Battle System

### Step 3: Get OAuth Credentials

1. Go to **OAuth2** section
2. Note your **Client ID** and **Client Secret**
3. Add redirect URI:
   - `https://zoobot-zoki.onrender.com/api/token`
   - Replace with your actual domain

### Step 4: Configure Activity Settings

1. Under **Activities**, configure:
   - **Activity Name**: ZooBot Arena
   - **Description**: Real-time 2D battle arena
   - **Max Participants**: 2
   - **Activity Type**: EMBEDDED

---

## Environment Variables

Add these environment variables to your Replit Secrets or Render environment:

### Required Variables

```bash
# Discord Bot Token (already configured)
DISCORD_BOT_TOKEN=your_bot_token_here

# Discord OAuth for Activity
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Render URL (or your hosting URL)
RENDER_EXTERNAL_URL=https://zoobot-zoki.onrender.com
```

### How to Set on Render

1. Go to your Render dashboard
2. Select your Web Service
3. Navigate to **Environment** tab
4. Add each environment variable:
   - Key: `DISCORD_CLIENT_ID`
   - Value: Your Discord client ID
   - Click **Add**
5. Repeat for `DISCORD_CLIENT_SECRET` and `RENDER_EXTERNAL_URL`
6. Click **Save Changes** and redeploy

---

## Render Deployment Configuration

### Update render.yaml (if using)

```yaml
services:
  - type: web
    name: zoobot
    env: node
    buildCommand: npm install
    startCommand: node index.js
    envVars:
      - key: DISCORD_BOT_TOKEN
        sync: false
      - key: DISCORD_CLIENT_ID
        sync: false
      - key: DISCORD_CLIENT_SECRET
        sync: false
      - key: RENDER_EXTERNAL_URL
        value: https://zoobot-zoki.onrender.com
```

### Verify Deployment

1. Check that port 5000 is correctly bound in `index.js`:
   ```javascript
   const PORT = process.env.PORT || 5000;
   server.listen(PORT, '0.0.0.0', ...)
   ```

2. Ensure static files are served:
   ```javascript
   app.use('/activity/arena', express.static(path.join(__dirname, 'activity', 'arena')));
   ```

3. Check logs for initialization:
   ```
   ✅ Logged in as YourBot#1234
   🌐 Server running on port 5000
   ✅ All systems initialized!
   ```

---

## Customizing Arena Assets

### Arena Background Image

To change the arena background, edit `activity/arena/game.js`:

**Location**: Line ~850 in `game.js`, in the `render()` function

**Current**: Simple grid background

**To use custom image**:

1. Add your arena image to `activity/arena/assets/` (create the folder):
   ```bash
   mkdir -p activity/arena/assets
   ```

2. Upload your arena background (e.g., `arena-bg.png`)

3. Modify `game.js`:

```javascript
// In the render() function, replace the grid drawing code with:

// Load background image (do this once, outside render loop)
const arenaBackground = new Image();
arenaBackground.src = 'assets/arena-bg.png';

// In render() function:
function render() {
  // Draw arena background
  if (arenaBackground.complete) {
    ctx.drawImage(arenaBackground, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    // Fallback gradient while loading
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  
  // Rest of rendering code...
}
```

### Character Sprites

Character sprites are automatically loaded from your existing skin system via the `getSkinUrl()` function.

To ensure characters display correctly in the arena:

1. Check that all characters have valid skin URLs in `skins.json`
2. Default sprites show as colored circles - replace in `drawPlayer()` function:

```javascript
// In game.js, drawPlayer() function:
function drawPlayer(player) {
  ctx.save();
  
  // Load character sprite if available
  if (player.character && player.character.skinUrl) {
    const sprite = new Image();
    sprite.src = player.character.skinUrl;
    
    if (sprite.complete) {
      ctx.drawImage(
        sprite,
        player.x - PLAYER_SIZE / 2,
        player.y - PLAYER_SIZE / 2,
        PLAYER_SIZE,
        PLAYER_SIZE
      );
    } else {
      // Fallback circle
      ctx.fillStyle = player.playerId === playerId ? '#4CAF50' : '#F44336';
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Rest of player rendering...
  ctx.restore();
}
```

### Attack Visual Effects

Attack visuals are defined in `arenaMovesData.js`. Each move has a `color` property.

To customize attack appearances:

1. Edit `activity/arena/game.js`, `drawProjectile()` function
2. Add particle effects, trails, or custom shapes based on `proj.shape`

Example enhancement:

```javascript
function drawProjectile(proj) {
  ctx.save();
  
  // Add glow effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = proj.color || '#FFF';
  
  if (proj.shape === 'circle') {
    ctx.fillStyle = proj.color || 'rgba(255, 100, 100, 0.8)';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (proj.shape === 'beam') {
    const gradient = ctx.createLinearGradient(
      proj.x - proj.width/2, proj.y,
      proj.x + proj.width/2, proj.y
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.5, proj.color || 'rgba(100, 100, 255, 0.8)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(proj.x - proj.width / 2, proj.y - proj.height / 2, proj.width, proj.height);
  }
  
  ctx.restore();
}
```

### UI Customization

**Button Colors**: Edit `activity/arena/styles.css`

```css
.attack-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change colors here */
}
```

**HP Bar Colors**: In `styles.css`:

```css
.hp-fill {
  background: linear-gradient(90deg, #ff0000 0%, #00ff00 100%);
  /* Customize gradient */
}
```

**Arena Theme**: Change background gradient in `styles.css`:

```css
body {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  /* Change theme colors */
}
```

---

## Testing the Arena

### Local Testing

1. **Start the bot locally** (if testing on Replit):
   ```bash
   node index.js
   ```

2. **Check console for initialization**:
   ```
   ✅ All systems initialized!
   ```

3. **Test the command** in Discord:
   ```
   !arena @SomeUser
   ```

4. **Click the activity link** - both players must click

### Production Testing on Render

1. Deploy to Render
2. Wait for deployment to complete
3. Check Render logs for:
   ```
   🌐 Server running on port 5000
   ✅ All systems initialized!
   ```

4. Test in Discord:
   ```
   !arena @opponent
   ```

5. Both players click the link - should open Discord Activity overlay

### Common Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Challenge someone | Embed message with clickable link |
| Click link | Discord Activity opens in overlay |
| Select character | Character appears in grid, can select |
| Both players ready | 5-second countdown starts |
| Battle starts | Arena renders with both characters |
| Joystick | Character moves smoothly |
| Attack button | Projectile fires, cooldown starts |
| HP reaches 0 | Victory/defeat screen shows |
| Close button | Activity closes cleanly |

---

## Troubleshooting

### Issue: Activity Link Doesn't Open in Discord

**Cause**: Discord Activity not properly configured

**Solution**:
1. Verify Activity is enabled in Discord Developer Portal
2. Check URL mapping matches your Render domain exactly
3. Ensure `RENDER_EXTERNAL_URL` environment variable is set
4. Redeploy application after changes

### Issue: "Failed to load characters"

**Cause**: User data not accessible or characters not initialized

**Solution**:
1. Check user has started the game (`!start`)
2. Verify characters have battle data (moves, HP)
3. Check server logs for API errors

### Issue: Projectiles Not Showing

**Cause**: Move data missing arena properties

**Solution**:
1. Check `arenaMovesData.js` has all move definitions
2. Verify character moves are enhanced with `enhanceMovesForArena()`
3. Check browser console for JavaScript errors

### Issue: Both Players Can't Join

**Cause**: Match ID or Socket.IO connection issues

**Solution**:
1. Check both players are using same match ID (in URL hash)
2. Verify Socket.IO namespace is initialized
3. Check server logs for connection errors
4. Ensure CORS is properly configured in Socket.IO setup

### Issue: Character Sprites Don't Load

**Cause**: Skin URL issues or CORS blocking images

**Solution**:
1. Check skin URLs are accessible (test in browser)
2. Verify `getSkinUrl()` returns valid URLs
3. Check browser console for CORS or 404 errors
4. Ensure image URLs support CORS headers

### Issue: OAuth/Authentication Fails

**Cause**: Discord OAuth credentials incorrect

**Solution**:
1. Verify `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct
2. Check redirect URI matches in Discord Developer Portal
3. Test `/api/token` endpoint manually
4. Review server logs for auth errors

---

## File Structure Reference

```
your-bot/
├── index.js                      # Main bot file with arena integration
├── arenaRoutes.js                # Express routes for arena API
├── arenaSocketHandler.js         # Socket.IO arena namespace
├── arenaMovesData.js             # Real-time move properties
├── activity/
│   └── arena/
│       ├── index.html            # Arena UI structure
│       ├── styles.css            # Arena styling
│       ├── game.js               # Main game logic
│       └── assets/               # (Create this folder)
│           └── arena-bg.png      # Your custom background
└── ARENA_SETUP.md                # This documentation
```

---

## URLs to Configure

Replace `zoobot-zoki.onrender.com` with your actual Render app URL in these files:

1. **.env / Secrets**: `RENDER_EXTERNAL_URL`
2. **index.js**: Line 1364 (fallback URL in !arena command)
3. **Discord Developer Portal**: Activity URL mapping
4. **Discord Developer Portal**: OAuth redirect URI

---

## Commands

### User Commands

- `!arena @user` - Challenge a user to arena battle

### Admin Testing

Test the arena system is working:
1. Create two test accounts in Discord
2. Run `!start` on both
3. Run `!arena @otheraccount`
4. Both click the link
5. Verify full flow works

---

## Support

If you encounter issues not covered here:

1. Check server logs on Render
2. Check browser console (F12 in Discord)
3. Verify all environment variables are set
4. Test Discord Activity setup in Developer Portal
5. Ensure bot has proper permissions in Discord server

---

## Next Steps

After setup is complete, you can:

1. **Balance moves**: Adjust damage, cooldowns in `arenaMovesData.js`
2. **Add effects**: Enhance projectile visuals in `game.js`
3. **Custom arena**: Add multiple arena backgrounds
4. **Leaderboard**: Track arena wins/losses
5. **Tournaments**: Create tournament brackets
6. **Spectator mode**: Allow others to watch battles

---

**Good luck with your arena battles! ⚔️**
