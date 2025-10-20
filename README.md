# Discord Character Collection Bot Setup

## Quick Start Guide

### 1. Create a Discord Bot
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
5. Copy your bot token (you'll need this next)

### 2. Add Bot Token to Replit
The bot token will be requested automatically. Keep it ready!

### 3. Invite Bot to Your Server
1. Go to "OAuth2" → "URL Generator" in Discord Developer Portal
2. Select scopes: `bot`
3. Select permissions:
   - Read Messages/View Channels
   - Send Messages
   - Embed Links
   - Read Message History
   - Use External Emojis
   - Mention Everyone
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

### 4. Start Using Commands
Once the bot is online, use `!help` to see all available commands!

## First Steps
1. Use `!start` to begin
2. Choose your starter: `!select nix`, `!select bruce`, or `!select buck`
3. Check your profile: `!profile`
4. Explore crates: `!crate`

## Admin Setup
1. Make sure you have Administrator permission in Discord
2. Set a drop channel: `!setdrop` (in the channel you want drops)
3. Start the drop system: `!startdrops`

Enjoy collecting characters! 🎮
