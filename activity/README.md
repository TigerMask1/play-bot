# Discord Battle Arena Activity

A multiplayer PVP battle game that runs directly in Discord voice channels using the Discord Embedded App SDK.

## Features

✨ **Joystick Controls** - Move your character with smooth joystick controls  
🔫 **Projectile Shooting** - Fire projectiles to attack other players  
⚡ **Real-time Multiplayer** - See all players in your voice channel in real-time  
🏆 **Scoreboard** - Track kills and deaths  
📱 **Mobile & Desktop** - Works on all devices  

## Setup Instructions

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Give it a name like "Battle Arena"
4. Copy your **Application ID** (Client ID)

### 2. Enable Discord Activity

1. In your application, go to **Activities** tab
2. Toggle **"Enable Activities"** ON
3. Add URL Mappings:
   - **Development**: `http://localhost:5173` → `/`
   - **Production**: Your Replit URL → `/`

### 3. Configure OAuth2

1. Go to **OAuth2** tab
2. Add Redirect URLs:
   - `http://localhost:5173`
   - Your production URL
3. Copy your **Client Secret**

### 4. Install Dependencies

```bash
cd activity
npm install
```

### 5. Environment Variables

Create a `.env` file in the `activity` folder:

```env
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
VITE_DISCORD_CLIENT_ID=your_application_id_here
VITE_SERVER_URL=http://localhost:3001
PORT=3001
```

### 6. Run Development Server

```bash
npm run dev
```

This will start:
- Frontend on `http://localhost:5173`
- Backend WebSocket server on `http://localhost:3001`

### 7. Test in Discord

1. Join a voice channel in your Discord server
2. Click the 🚀 **rocket ship** icon (next to screen share)
3. Select your activity from the list
4. The game will load in the voice channel!

## How to Play

🕹️ **Move**: Use the joystick in the bottom-left  
🔥 **Shoot**: Tap the shoot button in the bottom-right  
🎯 **Goal**: Hit other players with projectiles to score kills!  

Each hit deals 20 damage. Players have 100 health and respawn when eliminated.

## Game Controls

- **Joystick** (bottom-left): Drag to move your character
- **Shoot Button** (bottom-right): Fire a projectile in your movement direction
- **Scoreboard** (top-right): Shows all players, kills, and deaths

## Deployment to Replit

### Using the existing workflow:

The activity game runs separately from the main bot. You'll need to:

1. Create a new Replit deployment for the activity
2. Set environment variables in Replit Secrets:
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
3. Update Discord Developer Portal with your Replit URL
4. Run `npm start` or configure the deployment

### Or use a separate Repl:

1. Create a new Node.js Repl
2. Upload the `activity` folder contents
3. Run `npm install` and `npm start`

## Custom Emoji Support (Main Bot)

To use custom character images instead of text emojis:

1. Upload character images as custom emojis to your Discord server
2. Right-click the emoji → Copy Link
3. Extract the emoji ID from the URL: `https://cdn.discordapp.com/emojis/EMOJI_ID_HERE.png`
4. Use admin command: `!setemoji CharacterName EMOJI_ID_HERE`

The bot will automatically use the custom emoji in all displays!

## Architecture

```
activity/
├── client/              # Frontend (Vite + Vanilla JS)
│   ├── index.html      # Main HTML
│   └── game.js         # Game logic + Discord SDK
├── server/             # Backend (Express + Socket.io)
│   └── index.js        # Game server
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── README.md           # This file
```

## Tech Stack

- **Discord Embedded App SDK** - Activity integration
- **Socket.io** - Real-time multiplayer sync
- **Canvas API** - 2D game rendering
- **Express** - Backend server
- **Vite** - Frontend build tool

## Troubleshooting

**Activity doesn't show up in Discord:**
- Make sure you've enabled Activities in the Developer Portal
- Check your URL mappings are correct
- Verify your Client ID is correct in `.env`

**Players can't see each other:**
- Ensure the backend server is running on port 3001
- Check WebSocket connection in browser console
- Verify players are in the same voice channel

**OAuth errors:**
- Double-check your Client ID and Secret
- Make sure redirect URLs are configured
- Clear browser cache and try again

## License

MIT
