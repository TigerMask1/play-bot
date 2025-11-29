# PlayBot - Multi-Server Customizable Discord Bot Platform

## Overview
PlayBot is a customizable Discord bot platform that allows each server to have their own themed experience with custom characters, moves, items, and currencies while maintaining a global official economy.

## Project Structure
```
src/
├── core/                    # Core bot functionality
│   ├── PlayBot.js          # Main bot class
│   ├── config.js           # Bot configuration
│   └── logger.js           # Logging utility
├── services/               # Business logic services
│   ├── commandRegistry.js  # Dual command system (official + server)
│   ├── contentService.js   # Official/server content management
│   ├── economyService.js   # Currency and exchange system
│   ├── permissionService.js # Permission management
│   ├── profileService.js   # User profile management
│   ├── serverSettingsService.js # Server configuration
│   └── auditService.js     # Audit logging
├── infrastructure/         # Database and utilities
│   └── database.js         # MongoDB connection and collections
├── models/                 # Data schemas
│   └── schemas.js          # All data models
├── commands/               # Command definitions
│   ├── official/           # Official PlayBot commands
│   └── server/             # Server-specific commands
├── features/               # Game features
│   ├── official/           # Official content
│   └── server/             # Server-customizable content
└── index.js               # Entry point
```

## Key Features

### Dual Registry System
- **Official Commands**: Global commands managed by super admins
- **Server Commands**: Custom commands created by server admins (PlayAdmin role)

### Currency System
- **Official Currency**: PlayCoins (🪙) and PlayGems (💎) - global across all servers
- **Server Currency**: Customizable primary and premium currencies per server
- **Exchange System**: Convert between official and server currencies with configurable rates

### Permission Levels
1. **Super Admin**: Control official content and grant official currency
2. **Server Owner**: Full control of server settings
3. **PlayAdmin**: Server-level administration
4. **User**: Regular gameplay

### Server Customization
- Custom bot display name per server
- Custom command prefix
- Custom currencies (names and symbols)
- Custom characters, moves, items, and more

## Database Collections
- `global_content`: Official characters, moves, items, crates
- `server_content`: Server-specific custom content
- `server_settings`: Bot configuration per server
- `user_profiles`: Global user data and official balances
- `user_server_profiles`: Per-server user progress and balances
- `currency_exchange_rates`: Exchange rates per server
- `economy_transactions`: Transaction ledger
- `audit_logs`: Admin action logging

## Environment Variables
- `DISCORD_BOT_TOKEN`: Discord bot token (required)
- `MONGODB_URI`: MongoDB connection string (required)
- `SUPER_ADMIN_IDS`: Comma-separated list of super admin Discord IDs
- `MAIN_SERVER_ID`: Main/official server ID

## Commands

### General
- `!help` - Show all commands
- `!ping` - Check bot latency
- `!start` - Start your adventure
- `!profile` - View your profile
- `!balance` - Check your currency balance

### Admin (PlayAdmin role required)
- `!setup` - Configure server settings
- `!setbotname <name>` - Change bot display name
- `!setprefix <prefix>` - Change command prefix
- `!setcurrency <type> <name> <symbol>` - Customize currency
- `!setdropchannel #channel` - Set drops channel
- `!seteventschannel #channel` - Set events channel
- `!setupdateschannel #channel` - Set updates channel
- `!grantcoins @user <amount>` - Grant server coins
- `!grantgems @user <amount>` - Grant server gems

### Super Admin
- `!grantplaycoins @user <amount>` - Grant official PlayCoins
- `!grantplaygems @user <amount>` - Grant official PlayGems

## Recent Changes
- **Nov 29, 2025**: Initial PlayBot architecture created
  - Migrated from ZooBot to new modular architecture
  - Implemented dual registry system for official/server commands
  - Created economy service with dual currency support
  - Added server settings customization
  - Implemented permission system with 4 levels

## Development Notes
- Entry point: `src/index.js`
- Workflow command: `node src/index.js`
- Default port: 3000
- The bot requires MongoDB for data storage
