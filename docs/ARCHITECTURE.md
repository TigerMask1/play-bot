# PlayBot Community Platform - Architecture Documentation

## Overview

PlayBot is a modular Discord community platform that allows each server to create their own custom character collection game. All servers are connected through a global economy layer (PlayCoins & PlayGems) while maintaining complete isolation of server-specific data.

## Core Principles

### 1. Server Independence
- Each Discord server operates as an isolated instance
- Servers have their own characters, economy, clans, and settings
- Server admins have full control over their community's experience
- No data leakage between servers

### 2. Global Economy Layer
- **PlayCoins**: Universal currency earned through global activities
- **PlayGems**: Premium universal currency for special features
- Cannot be directly converted from server currencies
- Used for cross-server marketplace, global events, and platform features

### 3. Modular Architecture
- Features can be enabled/disabled per server
- Each module operates independently
- Easy to extend with new features

---

## Database Schema

### Global Collections

#### `global_users`
```javascript
{
  _id: ObjectId,
  odiscrdId: String,          // Discord user ID
  username: String,            // Current username
  playCoins: Number,           // Global currency
  playGems: Number,            // Premium global currency
  globalLevel: Number,         // Platform-wide level
  globalXP: Number,            // Platform-wide experience
  serversJoined: [String],     // List of server IDs
  achievements: [Object],      // Global achievements
  createdAt: Date,
  lastActive: Date
}
```

#### `global_marketplace`
```javascript
{
  _id: ObjectId,
  sellerId: String,
  itemType: String,            // 'character', 'item', 'resource'
  itemData: Object,
  price: Number,
  currency: String,            // 'playCoins' or 'playGems'
  listedAt: Date,
  expiresAt: Date
}
```

### Server Collections

#### `server_config`
```javascript
{
  _id: ObjectId,
  serverId: String,
  serverName: String,
  prefix: String,              // Command prefix
  modules: {
    collection: Boolean,
    battles: Boolean,
    clans: Boolean,
    trading: Boolean,
    drops: Boolean,
    events: Boolean,
    quests: Boolean
  },
  channels: {
    drops: String,
    events: String,
    announcements: String,
    logs: String
  },
  roles: {
    admin: [String],
    moderator: [String],
    vip: [String]
  },
  economy: {
    currencyName: String,      // Custom currency name
    currencyEmoji: String,     // Custom currency emoji
    startingBalance: Number
  },
  drops: {
    enabled: Boolean,
    interval: Number,          // Seconds between drops
    channelId: String
  },
  customization: {
    embedColor: String,
    welcomeMessage: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### `server_users` (per server)
```javascript
{
  _id: ObjectId,
viserdId: String,
  odiscrdId: String,
  username: String,
  balance: Number,             // Server-local currency
  gems: Number,                // Server-local premium currency
  level: Number,
  xp: Number,
  characters: [{
    id: String,
    name: String,
    rarity: String,
    stats: Object,
    customizations: Object,
    obtainedAt: Date
  }],
  selectedCharacter: String,
  inventory: Object,
  stats: {
    battlesWon: Number,
    battlesLost: Number,
    charactersCollected: Number,
    tradesCompleted: Number
  },
  clanId: String,
  lastDaily: Date,
  lastActivity: Date,
  createdAt: Date
}
```

#### `server_characters` (per server)
```javascript
{
  _id: ObjectId,
  serverId: String,
  characterId: String,
  name: String,
  description: String,
  rarity: String,              // common, uncommon, rare, epic, legendary, mythic
  imageUrl: String,
  baseStats: {
    hp: Number,
    attack: Number,
    defense: Number,
    speed: Number
  },
  abilities: [Object],
  dropWeight: Number,          // Probability weight for drops
  isCustom: Boolean,           // Server-created character
  createdBy: String,           // Admin who created it
  createdAt: Date
}
```

#### `server_clans` (per server)
```javascript
{
  _id: ObjectId,
  serverId: String,
  clanId: String,
  name: String,
  tag: String,
  description: String,
  leaderId: String,
  officers: [String],
  members: [String],
  level: Number,
  xp: Number,
  treasury: Number,
  stats: {
    battlesWon: Number,
    warWins: Number
  },
  settings: Object,
  createdAt: Date
}
```

---

## Module System

### Available Modules

| Module | Description | Default |
|--------|-------------|---------|
| `collection` | Character collection and management | Enabled |
| `battles` | PvP and PvE battle system | Enabled |
| `clans` | Clan creation and management | Enabled |
| `trading` | Player-to-player trading | Enabled |
| `drops` | Automatic character drops | Enabled |
| `events` | Server events and competitions | Enabled |
| `quests` | Daily/weekly quest system | Enabled |
| `shop` | In-game shop | Enabled |
| `leaderboards` | Rankings and statistics | Enabled |

### Module Configuration
Each module can be configured independently:
```javascript
// Enable/disable modules
!module enable battles
!module disable clans

// Configure module settings
!module config drops interval 60
!module config battles pvp_enabled true
```

---

## Permission System

### Hierarchy
1. **Bot Owner**: Full platform control
2. **Server Owner**: Full server control
3. **Server Admin**: Manage server settings, characters, economy
4. **Server Moderator**: Manage users, moderate activities
5. **VIP**: Special perks (customizable)
6. **Member**: Standard access

### Permission Checks
```javascript
// Permission levels
OWNER = 100
ADMIN = 80
MODERATOR = 60
VIP = 40
MEMBER = 20
```

---

## Economy Design

### Dual Currency System

#### Server Economy (Isolated)
- **Coins**: Earned through gameplay in that server
- **Gems**: Premium server currency
- Cannot leave the server
- Server admins control rates and values

#### Global Economy (Connected)
- **PlayCoins**: Earned through cross-server activities
- **PlayGems**: Premium global currency
- Used in global marketplace
- Controlled by platform

### Earning Methods

| Activity | Server Coins | PlayCoins |
|----------|--------------|-----------|
| Catch Drop | 10-50 | 1-5 |
| Win Battle | 25-100 | 5-15 |
| Complete Quest | 50-200 | 10-25 |
| Daily Login | 100 | 10 |
| Win Clan War | 500 | 50 |

### Anti-Exploitation Measures
1. Server economies are completely isolated
2. No direct conversion between currencies
3. Rate limiting on all transactions
4. Activity verification for rewards
5. Cooldowns on major actions

---

## Command Categories

### Admin Commands
- `!setup` - Initial server setup
- `!config` - Server configuration
- `!module` - Enable/disable modules
- `!character create` - Create custom characters
- `!economy` - Economy management
- `!announce` - Send announcements

### Collection Commands
- `!catch` / `!c` - Catch dropped characters
- `!collection` / `!col` - View collection
- `!character` / `!char` - Character details
- `!select` - Select active character

### Economy Commands
- `!balance` / `!bal` - Check balance
- `!daily` - Daily rewards
- `!shop` - View shop
- `!buy` - Purchase items

### Battle Commands
- `!battle` - Start battle
- `!stats` - Battle statistics
- `!moves` - View character moves

### Clan Commands
- `!clan` - Clan information
- `!clan create` - Create clan
- `!clan join` - Join clan
- `!clan donate` - Donate to clan

### Social Commands
- `!trade` - Trade with players
- `!gift` - Gift items
- `!leaderboard` - View rankings
- `!profile` - View profile

---

## File Structure

```
playbot/
├── src/
│   ├── index.js              # Main entry point
│   ├── bot.js                # Bot client setup
│   ├── commands/
│   │   ├── admin/            # Admin commands
│   │   ├── economy/          # Economy commands
│   │   ├── collection/       # Collection commands
│   │   ├── battle/           # Battle commands
│   │   ├── clan/             # Clan commands
│   │   ├── social/           # Social commands
│   │   └── utility/          # Utility commands
│   ├── events/               # Discord event handlers
│   ├── modules/              # Feature modules
│   │   ├── DropModule.js
│   │   ├── BattleModule.js
│   │   ├── ClanModule.js
│   │   └── ...
│   ├── database/
│   │   ├── MongoDB.js        # Database connection
│   │   ├── models/           # Data models
│   │   └── repositories/     # Data access layer
│   ├── utils/
│   │   ├── embeds.js         # Embed builders
│   │   ├── permissions.js    # Permission checks
│   │   ├── economy.js        # Economy utilities
│   │   └── helpers.js        # General helpers
│   └── config/
│       ├── constants.js      # Global constants
│       └── defaults.js       # Default configurations
├── docs/
│   ├── ARCHITECTURE.md       # This file
│   ├── COMMANDS.md           # Command documentation
│   ├── SETUP.md              # Setup guide
│   └── API.md                # API reference
├── package.json
├── replit.md
└── README.md
```

---

## Scalability Considerations

1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Caching**: Redis-compatible caching for hot data
3. **Rate Limiting**: Per-user and per-server limits
4. **Sharding Ready**: Architecture supports Discord sharding
5. **Modular Loading**: Only load enabled modules

---

## Security Measures

1. **Input Validation**: All user inputs sanitized
2. **Permission Verification**: Multi-level permission checks
3. **Rate Limiting**: Prevent spam and abuse
4. **Audit Logging**: Track admin actions
5. **Data Encryption**: Sensitive data encrypted at rest
