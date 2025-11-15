# 🎮 ZooBot - Discord Character Collection Game

**ZooBot** is a comprehensive Discord bot that brings an immersive character collection and battling experience to your server. With 51+ unique characters, turn-based battles, an economy system, and competitive events, ZooBot creates an engaging community game for your Discord server.

---

## ✨ Key Features

### 🎯 Character Collection System
- **51+ Unique Characters** with special stats, abilities, and leveling
- **Character Skins** for customization
- **Two-Tier Unlock System**: Character Keys (1000 keys for specific character) or Cage Keys (250 keys for random character)
- **Leveling System** with stat progression and release mechanics

### ⚔️ Turn-Based Battle System
- **Energy Management** mechanics
- **51 Unique Passive Abilities** (one per character)
- **Status Effects**: Burn, Poison, Stun, Freeze, Bleed, and more
- **Battle Items**: Potions, shields, energy drinks
- **AI Battle Mode** with Easy, Medium, and Hard difficulty

### 🎁 Dynamic Drop System
- **Main Server**: Unlimited free drops every 20 seconds
- **Non-Main Servers**: Pay 100 gems for 3 hours of drops (drops every 30 seconds)
  - **Super Admin Override**: Super admins can grant infinite drops to any server
- **Smart Pausing**: Auto-pauses after 30 uncaught drops (3-hour timer keeps running)
- **Drop Revival**: Anyone can revive drops by using `!c <code>` (even if they don't catch it)
- **Rewards**: Coins, Gems, Shards, and Character Tokens

### 📦 Interactive Crate System
- **6 Crate Tiers**: Bronze, Silver, Gold, Emerald, Legendary, Tyrant
- **Two-Step Opening**: Pick crate, then open with anticipation
- **Custom GIF Animations** for crate openings
- **Pending Tokens System** for unclaimed rewards

### 💎 Multi-Currency Economy
- **Coins** 💰 - Primary currency for purchases
- **Gems** 💎 - Premium currency for special items
- **Shards** 🔷 - Craft ST boosters
- **Trophies** 🏆 - Competitive ranking currency
- **Character Tokens** 🎫 - Unlock character skins

### 🎯 Competitive Features
- **Daily Events**: Trophy Hunt, Crate Master, Drop Catcher
- **Real-Time Leaderboards**: Track top players in coins, gems, battles, collection, trophies
- **Clan Wars**: Join clans, donate resources, compete weekly
- **Event Auto-Rewards**: Automatic prize distribution

### 📜 Progression Systems
- **Quest System**: Complete objectives for rewards
- **Personalized Tasks**: Dynamic tasks every 4 hours based on your playstyle
- **Daily Login Rewards**: Earn coins and gems daily
- **Transaction History**: Track your economic activity

### 🛡️ Permission System
- **Super Admin** (Bot Owners): Full control across all servers
- **ZooAdmin Role**: Server customization and drop management
- **Bot Admin** (Legacy): Event management
- **Regular Users**: All gameplay features

---

## 🚀 Getting Started

### For Server Owners

1. **Invite ZooBot** to your server
2. **Create ZooAdmin Role**: Create a Discord role named "ZooAdmin" (case insensitive)
3. **Assign ZooAdmin**: Give the role to trusted users who should manage the bot
4. **Configure Channels** (ZooAdmin only):
   - `!setdropchannel #channel` - Where drops appear
   - `!seteventschannel #channel` - Where events are announced
   - `!setupdateschannel #channel` - Where bot updates are posted
5. **Activate Drops** (ZooAdmin only): `!paydrops` - Pay 100 gems for 3 hours of drops
   - **Note:** Super admins can grant unlimited drops using `!setinfinitedrops on`

### For Players

1. **Start Your Journey**: `!start`
2. **Select Starter**: `!select <character>` - Choose your first character
3. **View Profile**: `!profile` - Check your progress
4. **Catch Drops**: `!c <code>` - Be first to catch drops for rewards
5. **Battle**: `!b @user` or `!b ai` - Challenge others or AI
6. **Open Crates**: `!crate` - Get characters and rewards
7. **Complete Quests**: `!quests` - View and complete objectives

---

## 📋 Essential Commands

### Getting Started
- `!start` - Begin your ZooBot journey
- `!select <character>` - Choose your starter character
- `!help` - View all commands
- `!overview` - See all game systems

### Profile & Characters
- `!profile [page]` - View your profile and collection
- `!char <name>` - View character details
- `!levelup <name>` - Level up a character
- `!setpfp <name>` - Set profile picture from owned characters

### Gameplay
- `!b @user` or `!b ai` - Start a battle
- `!c <code>` - Catch drops
- `!crate [type]` - Open crates
- `!t @user` - Trade with another player
- `!daily` - Claim daily rewards

### Economy & Progression
- `!quests` - View available quests
- `!shop` - Battle items shop
- `!shards` - ST booster system info
- `!keys` - View your character and cage keys

### Events & Competition
- `!event` - View current event
- `!leaderboard <type>` - View rankings
- `!clan` - Clan information
- `!eventleaderboard` - Event rankings

### Server Management (ZooAdmin)
- `!setup` - Server setup guide
- `!setdropchannel #channel` - Configure drop channel
- `!paydrops` - Activate drops (100 gems for 3 hours)
- `!setemoji <char> <emoji>` - Custom character emojis
- `!permissions` - View permission system info

---

## 💡 Drop System Details

### Main Server
- **Free unlimited drops** every 20 seconds
- No payment required
- All features available

### Non-Main Servers
- **Paid drop system**: 100 gems for 3 hours
- Drops every 30 seconds when active
- **Auto-pause**: After 30 uncaught drops (timer keeps running)
- **Auto-revival**: Anyone using `!c <code>` revives the system (even if they don't catch it)
- Only **ZooAdmins** can activate drops with `!paydrops`

### Drop Revival Feature
Using `!c <code>` **always revives paused drops**, regardless of whether you catch the drop or not:
- ✅ **Catch successful**: You get the reward AND revive drops (if paused)
- ✅ **Catch failed** (don't own character): You don't get tokens BUT still revive drops
- ⏰ **Timer continues**: The 3-hour timer keeps running even when drops are paused
- 🎯 **Help your community**: Use `!c <code>` to help restart drops, even if you can't claim the reward!

---

## 🎨 Customization

### Custom Character Emojis
ZooAdmins can set custom Discord emojis for characters:
```
!setemoji <character> <emoji>
```

### Custom Crate GIFs
ZooAdmins can customize crate opening animations:
```
!setchestgif <type> <url>
```
Types: gold, emerald, legendary, tyrant, bronze, silver

---

## 🔒 Permission Levels

### 👑 Super Admin (Bot Owners)
- Hardcoded user IDs
- Full access to all commands globally
- User/skin management, server control, data resets

### 🛡️ ZooAdmin (Server Customization)
- Discord role: "ZooAdmin" (case insensitive)
- Server setup and channel configuration
- Drop activation (`!paydrops`)
- Custom emojis and GIFs

### 🔧 Bot Admin (Legacy - Being Phased Out)
- Database-stored admins
- Event management commands
- Use `!addadmin` / `!removeadmin`

### 👥 Regular Users
- All gameplay commands
- Battles, trading, quests, crates, profiles

**See full documentation:** `!permissions` or read `PERMISSIONS_DOCUMENTATION.md`

---

## 🗄️ Technical Details

### Architecture
- **Framework**: Discord.js v14
- **Runtime**: Node.js 20
- **Database**: Dual-mode system (JSON for testing, MongoDB for production)
- **Multi-Server**: Supports deployment across multiple Discord servers

### Data Storage
- **JSON Mode**: Local file storage for development/testing
- **MongoDB Mode**: Cloud database for production deployment
- **One-Command Migration**: Easy switch between storage modes

### Performance
- In-memory caching for skins
- MongoDB indexes for fast queries
- Optimized drop system to minimize Discord API calls
- Graceful shutdown with data persistence

---

## 📚 Documentation Files

- **README.md** (this file) - Overview and getting started
- **PERMISSIONS_DOCUMENTATION.md** - Detailed permission system guide
- **replit.md** - Technical architecture and development notes

---

## 🔧 Development Setup

### 1. Create a Discord Bot
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
5. Copy your bot token

### 2. Configure Environment
Set the following secrets:
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `MONGODB_URI` (optional) - MongoDB connection string for production

### 3. Invite Bot to Server
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

---

## 🆘 Support & Help

- Use `!help` in Discord for command list
- Use `!overview` for game systems overview
- Use `!permissions` for permission info
- Contact bot administrators for server-specific issues
- Join the main server for unlimited drops and support

---

## ⚠️ Important Notes

- **Only ZooAdmins can activate drops** on non-main servers
- **Drop system auto-pauses** after 30 uncaught drops but can be revived
- **Character ownership required** to claim token drops (but anyone can revive drops)
- **Data is automatically saved** - no manual saves needed
- **This is a fan-made game** for entertainment purposes

---

**Enjoy ZooBot! 🎮**
