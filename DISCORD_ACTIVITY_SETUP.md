# Discord Activity Setup Guide for Render Deployment

This guide will help you set up Discord Activities for your bot hosted at https://zoobot-zoki.onrender.com

## 🎯 What You're Setting Up

Discord Activities allow your bot to launch interactive games **inside Discord** (not external links). Users will see a "Play" button that opens the game in Discord's interface.

---

## 📋 Step 1: Discord Developer Portal Setup

### 1.1 Go to Discord Developer Portal
Visit: https://discord.com/developers/applications

### 1.2 Select Your Application
Click on your bot's application (or create a new one if needed)

### 1.3 Get Your Application ID
- In the "General Information" tab
- Copy the **Application ID** 
- Save this as `DISCORD_APPLICATION_ID`

### 1.4 Get Your Bot Token
- Go to the "Bot" tab
- Click "Reset Token" or "Copy" to get your **Bot Token**
- Save this as `DISCORD_BOT_TOKEN`

### 1.5 Get OAuth2 Credentials
- Go to the "OAuth2" tab
- Click "Reset Secret" to get your **Client Secret**
- Copy the **Client ID** (same as Application ID)
- Save these as:
  - `DISCORD_CLIENT_ID` (same as Application ID)
  - `DISCORD_CLIENT_SECRET` (the secret you just generated)

### 1.6 Configure OAuth2 Redirects
In the OAuth2 tab, add these Redirect URLs:
```
https://zoobot-zoki.onrender.com/api/token
https://zoobot-zoki.onrender.com/activity/*
```

### 1.7 Enable Activities
- Go to the "Activities" tab (or "URL Mapping" under Activities)
- Click "Add URL Mapping"
- **Prefix:** `/activity` 
- **Target:** `https://zoobot-zoki.onrender.com/activity`
- Click "Save"

### 1.8 Configure Bot Intents
In the "Bot" tab, enable these Privileged Gateway Intents:
- ✅ Presence Intent
- ✅ Server Members Intent  
- ✅ Message Content Intent

### 1.9 Bot Permissions
Make sure your bot has these permissions:
- `applications.commands` (for slash commands)
- `Send Messages`
- `Embed Links`
- `Use External Emojis`

---

## 🔐 Step 2: Add Secrets to Render

Go to your Render dashboard for your web service and add these environment variables:

### Required Secrets:
```
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=your_application_id_here
DISCORD_CLIENT_ID=your_client_id_here (same as application ID)
DISCORD_CLIENT_SECRET=your_client_secret_here
```

### Additional Configuration:
```
USE_MONGODB=false
```

**⚠️ Important:** After adding secrets, redeploy your service on Render for changes to take effect.

---

## ⚡ Step 3: Register Slash Commands

After your bot is running on Render with all secrets configured:

### Option A: Automatic Registration (Recommended)
The bot will automatically register commands when it starts. Check the logs for:
```
✅ Successfully registered application commands globally!
```

### Option B: Manual Registration
If automatic registration fails, SSH into your Render instance and run:
```bash
node registerCommands.js
```

**Note:** Global commands can take up to 1 hour to appear. For instant testing, use guild-specific registration (see below).

---

## 🧪 Step 4: Test the Activity

### 4.1 Invite Your Bot
Make sure your bot is invited to your Discord server with the `applications.commands` scope.

Invite URL format:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=277025770560&scope=bot%20applications.commands
```

### 4.2 Use the Slash Command
In any channel, type:
```
/arena
```
or
```
/launch
```

### 4.3 What You Should See
✅ An embed with arena information
✅ A "🚀 Launch Arena" button
✅ Clicking the button opens the game **inside Discord**

### 4.4 If Commands Don't Appear
- Wait up to 1 hour for global commands
- Check bot logs for registration errors
- Verify `DISCORD_APPLICATION_ID` is correct
- Try kicking and re-inviting the bot

---

## 🎮 Step 5: Available Commands

Once set up, users can use:

### `/arena` or `/launch`
Launches the interactive battle arena activity

### Traditional Text Commands (Still Work):
- `!start` - Choose starter character
- `!profile` - View your profile
- `!battle @user` - Traditional turn-based battle
- And all other existing commands...

---

## 🐛 Troubleshooting

### "Application did not respond" Error
- Check that your Render service is running
- Verify all environment variables are set
- Check Render logs for errors

### Commands Not Showing Up
- Wait up to 1 hour for global registration
- Verify bot has `applications.commands` scope
- Check bot logs for registration errors

### Activity Doesn't Load
- Verify URL mapping in Discord Developer Portal
- Check that `https://zoobot-zoki.onrender.com/activity/index.html` is accessible
- Verify CORS settings allow Discord iframe embedding

### "Invalid Access" Error in Activity
- Check that OAuth2 redirects are configured
- Verify `DISCORD_CLIENT_SECRET` is correct
- Check browser console for errors

---

## 📱 How It Works

1. User types `/arena` in Discord
2. Bot creates an embed with a "Launch Arena" button  
3. User clicks the button
4. Discord opens the activity in an embedded iframe
5. Activity authenticates with Discord SDK
6. Game connects to your Render backend via WebSocket
7. Real-time battle begins!

---

## 🔒 Security Notes

- Never share your `DISCORD_BOT_TOKEN` or `DISCORD_CLIENT_SECRET`
- All secrets should be in Render's environment variables, never in code
- The activity uses Discord's OAuth2 for authentication
- WebSocket connections are authenticated with tokens

---

## ✅ Quick Checklist

Before going live, verify:

- [ ] All 4 secrets added to Render
- [ ] Render service redeployed after adding secrets
- [ ] Bot shows as online in Discord
- [ ] OAuth2 redirects configured in Developer Portal
- [ ] Activity URL mapping configured
- [ ] Slash commands registered (check logs)
- [ ] Bot invited with correct permissions
- [ ] `/arena` command appears in Discord
- [ ] Activity button launches game inside Discord
- [ ] Game loads and connects successfully

---

## 🎉 Success!

If everything is set up correctly, users will be able to:
1. Type `/arena` in any channel
2. Click the "🚀 Launch Arena" button
3. Play the interactive battle arena **inside Discord**
4. Earn rewards that sync with the bot

No more localhost errors! The game runs entirely within Discord's embedded interface.

---

## 📞 Need Help?

If you encounter issues:
1. Check Render logs for errors
2. Check Discord bot logs  
3. Verify all secrets are correct
4. Make sure URL mapping matches exactly
5. Test the activity URL directly: https://zoobot-zoki.onrender.com/activity/index.html

Good luck! 🚀
