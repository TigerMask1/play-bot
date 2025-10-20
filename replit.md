# Discord Character Collection Bot

## Overview
A Discord bot featuring a character collection system with leveling, crates, random drops, and player trading. Users can collect 50+ unique characters, level up, open crates, catch random drops, and trade resources with other players.

## Recent Changes
- **October 20, 2025**: Initial bot creation with full feature set
  - Character selection system (3 starters: Nix, Bruce, Buck)
  - 50+ collectible characters obtainable through crates
  - Leveling system with custom token requirements per level
  - 4 crate types with varying rewards and character probabilities
  - Random drop system spawning every 20 seconds
  - Player-to-player trading with confirmation flow
  - Admin commands for resource management
  - User profiles and character search

## Project Architecture

### Core Files
- `index.js` - Main bot file with command handling
- `characters.js` - Database of all 50+ characters
- `dataManager.js` - JSON file storage system
- `levelSystem.js` - Level progression calculations
- `crateSystem.js` - Crate opening logic and rewards
- `dropSystem.js` - Random drop spawning system
- `tradeSystem.js` - Player trading system with timeout

### Data Structure
- User data stored in `data.json` with:
  - Coins, gems, tokens (currencies)
  - Level and experience
  - Character inventory with individual levels
  - Selected character

## Features

### Character System
- **Starter Characters**: Nix 🦊, Bruce 🦍, Buck 🐂
- **Total Characters**: 50+ unique characters with emojis
- Characters have individual levels and token counts

### Currency System
- **Coins** 💰: Primary currency, earned from crates and drops
- **Gems** 💎: Premium currency for opening crates
- **Tokens** 🎫: Experience points for leveling up

### Leveling System
Custom token requirements for each level:
- Level 1→2: 2 tokens
- Level 2→3: 5 tokens
- Scales up to Level 19→20: 2800 tokens
- Level 20+: +100 tokens per level

### Crate Types
1. **Gold Crate** (100 gems): 1.5% character, 50 tokens, 500 coins
2. **Emerald Crate** (250 gems): 5% character, 130 tokens, 1800 coins
3. **Legendary Crate** (500 gems): 10% character, 200 tokens, 2500 coins
4. **Tyrant Crate** (750 gems): 15% character, 300 tokens, 3500 coins

### Drop System
- Spawns every 20 seconds in designated channel
- Random rewards: 1-10 tokens, 1-10 coins, or 1-2 gems
- First-come-first-served catch mechanism
- Auto-expires if not caught

### Trading System
- Secure player-to-player trading
- Trade coins and gems
- Dual confirmation required
- 20-second timeout with expiration

## Commands

### User Commands
- `!start` - Begin your journey
- `!select <nix/bruce/buck>` - Choose starter character
- `!profile [@user]` - View player profile
- `!char <name>` - View character details
- `!crate [type]` - Open or view crates
- `!levelup` - Level up with tokens
- `!t @user` - Initiate trade
- `!c <code>` - Catch drops
- `!help` - Command list

### Admin Commands (Requires Administrator permission)
- `!setdrop` - Set drop channel to current channel
- `!startdrops` - Start automatic drop system
- `!stopdrops` - Stop drop system
- `!grant @user <tokens/coins/gems> <amount>` - Grant resources
- `!grantchar @user <character name>` - Grant character

### Trade Commands (During active trade)
- `!offer coins <amount>` - Offer coins
- `!offer gems <amount>` - Offer gems
- `!confirm` - Confirm your offer
- `!cancel` - Cancel trade

## Setup Requirements

### Environment Variables
- `DISCORD_BOT_TOKEN` - Your Discord bot token (Required)

### Discord Bot Permissions
- Read Messages/View Channels
- Send Messages
- Embed Links
- Read Message History
- Use External Emojis
- Mention Everyone (for pinging users)

### Discord Intents Required
- Guilds
- Guild Messages
- Message Content
- Guild Members

## Technical Details
- **Platform**: Discord.js v14
- **Runtime**: Node.js 20
- **Data Storage**: JSON file system
- **Drop Interval**: 20 seconds
- **Trade Timeout**: 20 seconds
