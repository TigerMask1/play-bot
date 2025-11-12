# Quick Start Guide

## 🎮 Your Discord Bot is Live!

Your character collection bot with character-specific tokens and ST system is running!

---

## 🚀 NEW: Discord Activity Arena Setup

To enable the interactive battle arena (like the screenshot you showed), follow these steps:

### Step 1: Get Your Discord Secrets (5 minutes)

Visit: https://discord.com/developers/applications

1. **General Information tab** → Copy `Application ID`
   - Use for both `DISCORD_APPLICATION_ID` and `DISCORD_CLIENT_ID`

2. **Bot tab** → Reset Token → Copy
   - Use for `DISCORD_BOT_TOKEN`

3. **OAuth2 tab** → Reset Secret → Copy
   - Use for `DISCORD_CLIENT_SECRET`

### Step 2: Add to Render (2 minutes)

In your Render dashboard → Environment tab, add:
```
DISCORD_BOT_TOKEN=your_token
DISCORD_APPLICATION_ID=your_app_id
DISCORD_CLIENT_ID=your_app_id
DISCORD_CLIENT_SECRET=your_secret
```

Save → Render will auto-redeploy

### Step 3: Configure Discord (3 minutes)

Back in Discord Developer Portal:

**A) OAuth2 tab** → Add Redirects:
```
https://zoobot-zoki.onrender.com/api/token
https://zoobot-zoki.onrender.com/activity
```

**B) Activities tab** → Add URL Mapping:
- Prefix: `/activity`
- Target: `https://zoobot-zoki.onrender.com/activity`

**C) Bot tab** → Enable:
- ✅ Presence Intent
- ✅ Server Members Intent
- ✅ Message Content Intent

### Step 4: Test It!

In Discord, type: `/arena` → Click "🚀 Launch Arena" button!

**See DISCORD_ACTIVITY_SETUP.md for detailed troubleshooting**

---

## First Time Setup (Admin Only)

1. **Set the drop channel** (in the channel where you want drops to appear):
   ```
   !setdrop
   ```

2. **Start the drop system**:
   ```
   !startdrops
   ```

That's it! Drops will now appear every 20 seconds.

## For Players

### Getting Started
```
!start          - Begin your journey
!select nix     - Choose Nix as your starter (30.45% ST example)
!select bruce   - Choose Bruce as your starter  
!select buck    - Choose Buck as your starter
```

Each character gets a random **ST** (stat) value between 1-100%!

### Understanding the System

**Character-Specific Tokens**: Each character has their own tokens. You can't use Nix tokens to level up Bruce!

**ST Stat**: A random 1-100% stat assigned when you get a character. Even two Nix can have different ST values (e.g., 30.45% vs 67.89%).

**Pending Tokens**: If you open crates before getting your first character, the tokens are saved for you!

### Check Your Progress
```
!profile        - View your first page of characters
!profile 2      - View page 2 (5 characters per page)
!char nix       - See detailed info about your Nix
```

The profile shows:
- Character level and ST percentage
- Progress bar showing tokens toward next level
- Pending tokens (if you have any)
- Selected character

### Opening Crates
```
!crate          - View all crate types
!crate gold     - Open a Gold Crate (100 gems)
!crate emerald  - Open an Emerald Crate (250 gems)
!crate legendary - Open a Legendary Crate (500 gems)
!crate tyrant   - Open a Tyrant Crate (750 gems)
```

Crates give:
- Coins
- Random character tokens (goes to one of your characters)
- Chance to get a NEW character

If you don't have any characters yet, tokens are saved as "pending tokens"!

### Leveling Up Characters
```
!levelup nix    - Level up your Nix character
!levelup bruce  - Level up your Bruce character
```

Each character needs their own tokens to level up. The cost increases with level!

### Catching Drops
When a drop appears in the drop channel:
```
!c <code>       - Example: !c tyrant
```

Drops can give:
- **Character-specific tokens** (only if you own that character!)
- **Coins**
- **Gems**

If a drop has tokens for a character you don't own, it stays active for someone else!

### Trading
```
!t @username    - Start a trade
!offer coins 50 - Offer 50 coins (during trade)
!offer gems 10  - Offer 10 gems (during trade)
!confirm        - Confirm your side
!cancel         - Cancel the trade
```

Trades expire after 20 seconds if not completed!

### Releasing Characters
```
!release nix    - Release your Nix (must be level 10+)
```

Why release?
- Get rid of characters with low ST
- Try to get a better ST roll from a crate
- **Warning**: You lose the character, all their tokens, and progress!

## Admin Commands

### Resource Management
```
!grant @user coins 100             - Give 100 coins
!grant @user gems 50               - Give 50 gems
!grant @user tokens nix 20         - Give 20 Nix tokens
!grantchar @user bali              - Give Bali character
```

When granting a character to someone with no characters, they also get their pending tokens!

### Drop Control
```
!setdrop        - Set current channel as drop channel
!startdrops     - Start the drop system
!stopdrops      - Stop the drop system
```

## Tips & Strategies

- **ST matters!** A character with 90% ST is much rarer than one with 20% ST
- **Save your gems** for higher tier crates (better character chances!)
- **Level 10 release** lets you "reroll" for better ST on characters
- **Catch drops quickly** - first person to type the code gets the reward!
- **Pending tokens** mean you can open crates even before selecting a starter
- **Each character levels independently** - focus on your favorites!
- **Trade with friends** to help each other collect gems and coins

## Understanding Progress Bars

In your profile, you'll see progress bars like this:
```
[████░░░░░░] 40/100
```
This means the character has 40 tokens out of 100 needed for the next level!

Enjoy collecting all 51 characters! 🎉
