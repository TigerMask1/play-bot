# Discord Character Collection Bot

## Overview
A Discord bot featuring a character collection system with character-specific tokens, ST stats, leveling, crates, random drops, and player trading. Users can collect 50+ unique characters, level them up individually, open crates, catch random drops, and trade resources with other players.

## Recent Changes
- **October 22, 2025**: Battle System Update
  - Implemented turn-based battle system with Pokemon-style combat
  - Each character has 3 moves: 1 special move + 2 ST-tier moves
  - Move damage scales with character level and ST stat
  - HP system (1000-1500 base HP, influenced by ST)
  - Battle invites with 60-second expiration
  - 10-minute battle duration limit
  - Fight or flight options during battles
  - Character info command (!I) to view moves and stats
  - Fixed admin permission bug for security
  - Automatic move and HP assignment for all characters

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
- `dataManager.js` - JSON file storage system with automatic backfilling
- `levelSystem.js` - Level progression calculations
- `crateSystem.js` - Crate opening logic and rewards with pending tokens
- `dropSystem.js` - Random drop spawning system with character-specific tokens
- `tradeSystem.js` - Player trading system with timeout
- `battleSystem.js` - Turn-based battle system with invite flow
- `battleUtils.js` - Damage calculations, HP formulas, move assignment
- `moves.js` - Move database with ST-tier pools and special moves

### Data Structure
- User data stored in `data.json` with:
  - Coins, gems (currencies)
  - Pending tokens (saved when user has no characters)
  - Character inventory with individual levels, tokens, ST, moves, and HP
  - Selected character
  - Each character has 3 moves (1 special, 2 tier moves) and base HP

## Features

### Character System
- **Starter Characters**: Nix 🦊, Bruce 🦍, Buck 🐂
- **Total Characters**: 51 unique characters with emojis
- **Character-Specific Tokens**: Each character has their own tokens for leveling
- **ST Stat**: Random 1-100% stat assigned to each character (varies even for same character)
- **Move System**: Each character has 3 predetermined moves (assigned on acquisition)
  - 1 special move (unique to each character type)
  - 2 moves from ST tier pool (Low: 1-40%, Mid: 41-75%, High: 76-100%)
- **HP System**: Base HP ranges from 1000-1500, scales with ST
- Characters have individual levels, tokens, ST, moves, and HP values

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

### Battle System
- **Turn-Based Combat**: Pokemon-style battles between players
- **Battle Invites**: Challenge players with `!b @user`, 60-second acceptance window
- **Character Selection**: Both players choose their character before battle starts
- **Move System**:
  - Each character has 3 moves (1 special + 2 tier moves)
  - Special moves have character-unique names and enhanced ST scaling
  - Tier moves based on ST: Low (1-40%), Mid (41-75%), High (76-100%)
  - Moves include attacks, heals, and support moves
- **Damage Formula**:
  - Regular moves: `damage = max(1, round(baseDamage * (1 + (level-1)*0.08) * (0.6 + st/100*0.4)))`
  - Special moves: Enhanced ST multiplier `(0.8 + st/100*0.6)`
  - Healing moves: Restore HP based on level and ST
  - Support moves: No damage but provide strategic value
- **HP System**: Base HP 1000-1500, scales with ST
- **Battle Flow**:
  - Turn-based with random first turn
  - Each turn: choose attack (1-3) or flight to flee
  - Battle ends when HP reaches 0 or player flees
  - 10-minute maximum battle duration
- **Character Info**: Use `!I <character>` to view moves, HP, and stats

## Commands

### User Commands
- `!start` - Begin your journey
- `!select <nix/bruce/buck>` - Choose starter character
- `!profile [page]` - View player profile (paginated)
- `!char <name>` - View character details (shows ST, level, tokens, progress bar)
- `!I <name>` - View character battle info (moves, HP, stats)
- `!crate [type]` - Open or view crates
- `!levelup <name>` - Level up a specific character with their tokens
- `!release <name>` - Release a character (level 10+ required)
- `!b @user` - Challenge a player to battle
- `!b ai` - AI battle (coming soon)
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

### Battle Commands (During battle)
- Type `1`, `2`, or `3` - Use the corresponding move
- Type `flight` or `flee` - Forfeit the battle

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
- **Battle Invite Timeout**: 60 seconds
- **Battle Duration**: 10 minutes maximum
- **ST Range**: 1-100% (2 decimal places)
- **HP Range**: 1000-1500 base (scales with ST)
- **Move Tiers**: 3 tiers based on ST (Low/Mid/High)
- **Automatic Data Migration**: ST, moves, HP, and pending tokens backfilled on startup
