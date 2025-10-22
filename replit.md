# Discord Character Collection Bot

## Overview
A Discord bot featuring a character collection system with character-specific tokens, ST stats, leveling, crates, random drops, and player trading. Users can collect 50+ unique characters, level them up individually, open crates, catch random drops, and trade resources with other players.

## Recent Changes
- **October 22, 2025**: Major update with character-specific tokens and ST system
  - Changed to character-specific tokens (each character has their own tokens)
  - Added ST stat (1-100%) randomly assigned to each character
  - Fixed level up to work on individual characters
  - Implemented paginated profiles with progress bars
  - Added character release/leave command (requires level 10+)
  - Updated drop system to give character-specific tokens
  - Added pending tokens system for crates opened before owning characters
  - Automatic ST backfilling for existing characters

- **October 20, 2025**: Initial bot creation with full feature set
  - Character selection system (3 starters: Nix, Bruce, Buck)
  - 50+ collectible characters obtainable through crates
  - Leveling system with custom token requirements per level
  - 4 crate types with varying rewards and character probabilities
  - Random drop system spawning every 20 seconds
  - Player-to-player trading with confirmation flow
  - Admin commands for resource management

## Project Architecture

### Core Files
- `index.js` - Main bot file with command handling
- `characters.js` - Database of all 50+ characters
- `dataManager.js` - JSON file storage system with automatic ST backfilling
- `levelSystem.js` - Level progression calculations
- `crateSystem.js` - Crate opening logic and rewards with pending tokens
- `dropSystem.js` - Random drop spawning system with character-specific tokens
- `tradeSystem.js` - Player trading system with timeout

### Data Structure
- User data stored in `data.json` with:
  - Coins, gems (currencies)
  - Pending tokens (saved when user has no characters)
  - Character inventory with individual levels, tokens, and ST
  - Selected character

## Features

### Character System
- **Starter Characters**: Nix 🦊, Bruce 🦍, Buck 🐂
- **Total Characters**: 51 unique characters with emojis
- **Character-Specific Tokens**: Each character has their own tokens for leveling
- **ST Stat**: Random 1-100% stat assigned to each character (varies even for same character)
- Characters have individual levels, tokens, and ST values

### Currency System
- **Coins** 💰: Primary currency, earned from crates and drops
- **Gems** 💎: Premium currency for opening crates
- **Character Tokens** 🎫: Each character has their own tokens for leveling up
- **Pending Tokens**: Tokens from crates are saved until you get a character

### Leveling System
Custom token requirements for each level:
- Level 1→2: 2 tokens
- Level 2→3: 5 tokens
- Scales up to Level 19→20: 2800 tokens
- Level 20+: +100 tokens per level
- Each character levels independently with their own tokens

### Crate Types
1. **Gold Crate** (100 gems): 1.5% character, 50 random character tokens, 500 coins
2. **Emerald Crate** (250 gems): 5% character, 130 random character tokens, 1800 coins
3. **Legendary Crate** (500 gems): 10% character, 200 random character tokens, 2500 coins
4. **Tyrant Crate** (750 gems): 15% character, 300 random character tokens, 3500 coins

Tokens go to a random owned character, or saved as pending tokens if you have none.

### Drop System
- Spawns every 20 seconds in designated channel
- Random rewards: 1-10 character-specific tokens, 1-10 coins, or 1-2 gems
- Only drops tokens for characters that players own
- Drop remains active if claimer doesn't own the character
- First-to-claim catch mechanism
- Auto-expires if not caught

### Trading System
- Secure player-to-player trading
- Trade coins and gems
- Dual confirmation required
- 20-second timeout with expiration

### Character Release
- Release characters you don't want
- Requires character to be level 10+
- Completely removes character from inventory
- Useful for getting better ST rolls

## Commands

### User Commands
- `!start` - Begin your journey
- `!select <nix/bruce/buck>` - Choose starter character
- `!profile [page]` - View player profile (paginated)
- `!char <name>` - View character details (shows ST, level, tokens, progress bar)
- `!crate [type]` - Open or view crates
- `!levelup <name>` - Level up a specific character with their tokens
- `!release <name>` - Release a character (level 10+ required)
- `!t @user` - Initiate trade
- `!c <code>` - Catch drops
- `!help` - Command list

### Admin Commands (Requires Administrator permission)
- `!setdrop` - Set drop channel to current channel
- `!startdrops` - Start automatic drop system
- `!stopdrops` - Stop drop system
- `!grant @user <coins/gems> <amount>` - Grant coins or gems
- `!grant @user tokens <character> <amount>` - Grant character-specific tokens
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
- **Data Storage**: JSON file system with automatic backfilling
- **Drop Interval**: 20 seconds
- **Trade Timeout**: 20 seconds
- **ST Range**: 1-100% (2 decimal places)
- **Automatic Data Migration**: ST and pending tokens backfilled on startup
