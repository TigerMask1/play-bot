# PlayBot - Community Collection Platform

A modular Discord bot platform that allows each server to create their own custom character collection game, connected by a global economy layer.

## Features

- **Multi-Server Architecture**: Each server operates independently with its own characters, economy, and settings
- **Dual Economy System**: Server-local currency + global PlayCoins/PlayGems that work across all servers
- **Modular Design**: Enable/disable features per server (collection, battles, clans, trading, etc.)
- **Custom Characters**: Create unique characters for your community
- **Battle System**: PvP battles between players
- **Clan System**: Create and manage clans within each server
- **Trading**: Trade characters with other players
- **Drop System**: Automatic character spawns in configured channels
- **Leaderboards**: Server and global rankings
- **Admin Tools**: Full configuration and moderation capabilities

## Quick Start

1. Set environment variables:
   - `DISCORD_BOT_TOKEN`: Your Discord bot token
   - `MONGODB_URI`: MongoDB connection string

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the bot:
   ```bash
   npm start
   ```

## Commands

### Getting Started
- `!start` - Begin your collection journey
- `!help` - View all commands
- `!profile` - View your stats
- `!daily` - Claim daily rewards

### Collection
- `!catch <code>` - Catch dropped characters
- `!collection` - View your characters
- `!character <name>` - View character details
- `!select <name>` - Set active character

### Economy
- `!balance` - Check your balance
- `!shop` - View the shop
- `!buy <item>` - Purchase items
- `!gift @user <amount>` - Gift coins

### Social
- `!battle @user` - Challenge to battle
- `!trade @user` - Trade characters
- `!clan` - Clan management
- `!leaderboard` - View rankings

### Admin
- `!setup` - Server setup guide
- `!config` - Configure settings
- `!module` - Enable/disable features
- `!createcharacter` - Create custom characters
- `!setchannel` - Configure channels
- `!setrole` - Configure roles

## Architecture

```
src/
├── index.js              # Entry point
├── bot.js                # Bot client
├── commands/             # Command handlers
│   ├── admin/
│   ├── economy/
│   ├── collection/
│   ├── battle/
│   ├── clan/
│   └── social/
├── events/               # Discord events
├── modules/              # Feature modules
├── database/             # MongoDB layer
├── utils/                # Utilities
└── config/               # Configuration
```

## Economy

### Server Currency (Isolated)
- **Coins**: Earned through gameplay in that specific server
- **Gems**: Premium server currency
- Cannot leave the server ecosystem

### Global Currency (Connected)
- **PlayCoins**: Earned through cross-server activities
- **PlayGems**: Premium global currency
- Works across all servers running PlayBot
- Used in global marketplace

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - Technical design
- [Commands](docs/COMMANDS.md) - Full command reference
- [Setup](docs/SETUP.md) - Installation guide

## License

MIT License - Feel free to use and modify for your own projects.
