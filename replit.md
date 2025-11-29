# PlayBot - Multi-Server Customizable Discord Bot Platform

## Overview
PlayBot is a professional multi-server customizable Discord bot platform where each server can customize virtually everything while maintaining a global official economy. Features a dual-layer architecture: official content managed by super admins (global across all servers) and server-specific content managed by server admins.

## Current State: Ready for Discord Token
The bot is fully built and waiting for DISCORD_BOT_TOKEN to connect.

## Recent Changes (November 2025)
- Complete rewrite from ZooBot to PlayBot architecture
- Implemented dual-layer content system (official + server-specific)
- Built comprehensive economy with currency exchange
- Created 54+ official commands across all systems
- Added 4 official preset templates (Simple, RPG, Pokemon, Competitive)
- Full customization system for server owners

## Architecture

### Folder Structure
```
src/
├── core/           # Core bot framework (PlayBot.js, config.js, logger.js)
├── services/       # Business logic services
│   ├── permissionService.js    # 4-level permission system
│   ├── contentService.js       # Official + server content management
│   ├── economyService.js       # Dual currency system + exchange
│   ├── serverSettingsService.js # Per-server configuration
│   ├── profileService.js       # User profiles (global + per-server)
│   ├── commandRegistry.js      # Command registration system
│   ├── dropService.js          # Customizable drop system
│   ├── workService.js          # Custom work/job commands
│   ├── battleService.js        # PvP battle system
│   ├── crateService.js         # Gacha/crate system with pity
│   ├── tradeService.js         # Player trading
│   ├── eventService.js         # Server events
│   ├── presetService.js        # Configuration templates
│   └── auditService.js         # Action logging
├── models/         # MongoDB schemas
├── commands/       # Command implementations
│   └── official/   # Official commands
└── infrastructure/ # Database connection
```

### Database Collections (MongoDB)
- `global_content` - Official characters, moves, items (cross-server)
- `server_content` - Server-specific custom content
- `server_settings` - Per-server configuration
- `user_profiles` - Global user data + PlayCoins/PlayGems
- `user_server_profiles` - Per-server user data + server currencies
- `currency_exchange_rates` - Exchange rates between currencies
- `economy_transactions` - Transaction history
- `audit_logs` - Admin action logs

### Permission Levels
1. **User** (0) - Basic gameplay commands
2. **PlayAdmin** (1) - Server customization commands
3. **ServerOwner** (2) - Full server control, presets
4. **SuperAdmin** (3) - Official content management, grants

### Currency System
- **Official (Global)**: PlayCoins, PlayGems - controlled by super admins
- **Server-Specific**: Customizable names/emojis, managed per server
- **Exchange**: Convert between official ↔ server currencies with configurable rates/fees

## Customizable Systems
Each server can customize:
- **Drop System**: Chances, cooldowns, rarity weights, channel restrictions
- **Work Commands**: Custom jobs with rewards, XP, messages, fail chances
- **Battles**: Team sizes, turn timers, rewards, rules
- **Crates/Gacha**: Types, contents, prices, pity system
- **Trading**: Fees, restrictions, min levels
- **Progression**: XP curves, level formulas, prestige
- **Characters**: Custom characters with stats, moves, abilities
- **Items**: Custom items with effects and prices
- **Events**: Custom events with boosts and rewards
- **Currencies**: Custom names and emojis

## Available Presets
- `simple` - Easy to use, minimal configuration
- `rpg` - Full RPG experience with quests and deep progression
- `pokemon` - Creature collector focused on catching and battling
- `competitive` - Balanced economy with PvP focus

## Commands (54 Total)

### User Commands
- `!help`, `!start`, `!profile`, `!balance`, `!daily`
- `!work [job]`, `!jobs`, `!crate [type]`
- `!battle @player`, `!forfeit`
- `!trade @player`, `!tradecancel`
- `!inventory`, `!characters`, `!leaderboard [type]`
- `!events`, `!exchange <from> <to> <amount>`

### Admin Commands (PlayAdmin)
- `!setup` - Initial server setup
- `!setbotname`, `!setprefix`, `!setcurrency`
- `!setdropchannel`, `!seteventschannel`, `!setupdateschannel`
- `!addcharacter`, `!publishcharacter`, `!servercharacters`
- `!addmove`, `!additem`
- `!addjob`, `!removejob`, `!setjobmessages`
- `!addcrate`, `!removecrate`
- `!setdropchance`, `!setdropcooldown`, `!setrarityweight`
- `!setbattlerewards`, `!togglefeature`
- `!presets`, `!serverconfig`, `!exportconfig`
- `!grantcoins`, `!grantgems`

### Server Owner Commands
- `!applypreset <preset>`

### Super Admin Commands
- `!addofficialcharacter`, `!officialcharacters`
- `!grantplaycoins`, `!grantplaygems`
- `!setexchangerate`, `!setexchangefee`

## Environment Variables Required
- `DISCORD_BOT_TOKEN` - Discord bot token (required)
- `MONGODB_URI` - MongoDB connection string (optional, uses in-memory if not set)

## User Preferences
- Bot should be simple and fun for server owners to manage
- Everything should be customizable
- Official currency (PlayCoins/PlayGems) controlled by devs only
- Fresh start - no migration from old ZooBot data needed
