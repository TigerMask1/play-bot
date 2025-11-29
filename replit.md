# PlayBot - Community Collection Platform

## Overview
PlayBot is a modular Discord bot platform that allows each server to create their own custom character collection game. All servers are connected through a global economy layer (PlayCoins & PlayGems) while maintaining complete isolation of server-specific data.

## User Preferences
- Modular, clean code architecture
- Clear separation of concerns
- Comprehensive documentation
- Server-isolated data with global connectivity

## System Architecture

### Core Design
- **Framework**: Discord.js v14
- **Runtime**: Node.js 20
- **Database**: MongoDB for all data persistence
- **Entry Point**: `src/index.js`

### Project Structure
```
src/
├── index.js              # Main entry point with Express server
├── bot.js                # Bot client and command handler
├── commands/             # Command modules by category
│   ├── admin/            # Server administration commands
│   ├── economy/          # Currency and shop commands
│   ├── collection/       # Character collection commands
│   ├── battle/           # Battle system commands
│   ├── clan/             # Clan management commands
│   └── social/           # Trading and leaderboards
├── events/               # Discord event handlers
├── modules/              # Feature modules (drops, etc.)
├── database/
│   └── MongoDB.js        # Database connection and operations
├── utils/
│   ├── embeds.js         # Discord embed builders
│   ├── helpers.js        # General utility functions
│   ├── permissions.js    # Permission checking
│   └── economy.js        # Economy operations
└── config/
    ├── constants.js      # Global constants
    └── defaults.js       # Default configurations
```

### Database Schema

**Global Collections:**
- `global_users` - Cross-server user data, PlayCoins, PlayGems
- `global_marketplace` - Cross-server trading

**Server Collections:**
- `server_config` - Per-server settings and configuration
- `server_users` - Per-server user data, local economy
- `server_characters` - Per-server custom characters
- `server_clans` - Per-server clans

### Dual Economy System

**Server Currency (Isolated):**
- Coins and Gems earned in each server
- Cannot be transferred between servers
- Server admins control rates and values

**Global Currency (Connected):**
- PlayCoins and PlayGems work everywhere
- Cannot be directly converted from server currency
- Earned through cross-server activities

### Modular Features
Each feature can be enabled/disabled per server:
- Collection, Battles, Clans, Trading
- Drops, Events, Quests, Shop, Leaderboards

## Environment Variables
- `DISCORD_BOT_TOKEN` - Discord bot token (required)
- `MONGODB_URI` - MongoDB connection string (required)
- `BOT_OWNERS` - Comma-separated owner Discord IDs

## Development Notes
- All commands are auto-loaded from the commands directory
- Events are auto-loaded from the events directory
- Modules are auto-loaded from the modules directory
- The bot uses a single workflow for the Discord bot process
