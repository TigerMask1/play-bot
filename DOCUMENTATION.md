# Discord Bot - Complete Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Systems](#core-systems)
4. [Commands Reference](#commands-reference)
5. [Reward Systems](#reward-systems)
6. [Battle System](#battle-system)
7. [Admin Commands](#admin-commands)

---

## Introduction

This Discord bot features a character collection system with turn-based battles, quests, trading, and various reward mechanisms. Players can collect 51 unique characters, level them up, and compete in battles to earn trophies.

---

## Getting Started

### Initial Setup
1. **Start Your Journey**: `!start`
   - Displays starter character options

2. **Select Starter**: `!select <nix/bruce/buck>`
   - Choose your first character from:
     - 🦊 **Nix** - The cunning fox
     - 🦍 **Bruce** - The mighty gorilla
     - 🐂 **Buck** - The strong bull
   - Receive starting rewards:
     - 💰 100 Coins
     - 💎 10 Gems
     - 🏆 200 Trophies

---

## Core Systems

### Character System
- **Total Characters**: 51 unique characters with emojis
- **Starter Characters**: Nix, Bruce, Buck
- **Obtainable Characters**: Available through crates

#### Character Stats
Each character has unique stats:
- **ST (Strength)**: 1-100% (randomly assigned, affects HP and damage)
- **Level**: Starts at 1, increases with tokens and coins
- **HP**: Base HP ranges from 1000-1500, scales with ST
- **Moves**: 3 predetermined moves
  - 1 special move (unique per character)
  - 2 moves from ST tier pool
    - Low tier: 1-40% ST
    - Mid tier: 41-75% ST
    - High tier: 76-100% ST

### Currency System
- **💰 Coins**: Used for leveling up characters, obtained through various activities
- **💎 Gems**: Premium currency for opening crates
- **🏆 Trophies**: Competitive ranking, gained/lost in battles
- **🔷 Shards**: Craft ST Boosters (8 shards = 1 booster)
- **🎫 Tokens**: Character-specific, used for leveling

### Leveling System
Characters level up using **both tokens AND coins**:

| Level | Tokens Required | Coins Required |
|-------|----------------|----------------|
| 1→2   | 2              | 50             |
| 2→3   | 5              | 100            |
| 3→4   | 10             | 150            |
| 4→5   | 15             | 200            |
| 5→6   | 20             | 300            |
| 10→11 | 120            | 1,300          |
| 15→16 | 680            | 4,300          |
| 19→20 | 2,800          | 9,000          |
| 20+   | +100/level     | +200/level     |

**Command**: `!levelup <character name>`

### Trophy System
- **Starting Trophies**: 200
- **Battle Win**: +5 trophies
- **Battle Loss**: -7 trophies
- **Minimum**: 0 (cannot go below zero)
- **Maximum**: 9,999

---

## Commands Reference

### Profile & Characters

#### `!profile [page]`
View your profile with:
- 💰 Coins
- 💎 Gems
- 🏆 Trophies
- 🎮 Character count
- 💬 Message count
- Character list with levels and progress

#### `!char <character name>` or `!character <name>`
View detailed character information:
- Level and ST percentage
- Token count and requirements
- Coin requirements for next level
- Progress bar

#### `!i <character name>` or `!info <name>`
View character battle information:
- Moves and damage
- HP and battle stats
- Special move details

#### `!levelup <character name>`
Level up a character (requires both tokens AND coins)
- Shows what you have vs. what you need
- Deducts resources and levels up character

#### `!release <character name>`
Release a character (minimum level 10)
- Permanently removes character from your collection
- Cannot be undone

---

### Battle System

#### `!b @user` or `!battle @user`
Challenge another player to battle

**Battle Flow**:
1. Send battle invite
2. Opponent accepts/declines (60 second timeout)
3. Both players select a character
4. Turn-based combat begins
5. Choose moves or flee

**Move Restrictions**:
- **Normal Moves**: Can be used any time
- **Special Moves**:
  - 🔒 Unlocks after 3 turns
  - ⚡ Can only be used ONCE per battle
  - 💥 Enhanced damage with better ST scaling

**Trophy Rewards**:
- **Winner**: +5 trophies
- **Loser**: -7 trophies

**Battle Commands** (during battle):
- Type `1`, `2`, or `3` to use a move
- Type `flight`, `flee`, or `run` to forfeit

---

## Reward Systems

### Message Rewards
**Every 25 messages** you send earns a random reward:
- **Option 1**: 1-10 tokens for a random character you own
- **Option 2**: 1-20 coins
- **Option 3**: 1-5 gems

### Daily Rewards - `!daily`
Claim once every 24 hours:
- 🏆 15 Trophies
- 💰 10-100 Coins (random)
- 💎 1-3 Gems (random)

### Crate System - `!crate [type]`

#### Available Crates:

| Crate Type | Cost | Character Chance | Tokens | Coins |
|------------|------|-----------------|--------|-------|
| 🥇 Gold    | 💎100 | 1.5%           | 50     | 500   |
| 🟢 Emerald | 💎250 | 5%             | 130    | 1,800 |
| 🔥 Legendary | 💎500 | 10%          | 200    | 2,500 |
| 👑 Tyrant  | 💎750 | 15%            | 300    | 3,500 |

**Usage**: `!crate <gold/emerald/legendary/tyrant>`

### Drop System - `!c <code>`
Drops appear in the designated drop channel every 20 seconds:
- 🎫 Character tokens
- 💰 Coins
- 💎 Gems
- 🔷 Shards

**Usage**: Type `!c <code>` when a drop appears

---

### Trading - `!t @user` or `!trade @user`
Trade coins and gems with other players:
1. Initiate trade
2. Use `!offer coins <amount>` or `!offer gems <amount>`
3. Both players `!confirm` when ready
4. Use `!cancel` to abort
- 60 second timeout

---

### Quests - `!quests [page]`
Complete quests for rewards:
- **View quests**: `!quests [page]`
- **Quest details**: `!quest <id>`
- **Claim rewards**: `!claim <id>`

Quest types:
- First Steps
- Drop Hunter (I, II, III, Master)
- Battle achievements
- Character collection milestones

---

### ST Booster System

#### `!shards`
View shard information and booster count

#### `!craft`
Craft an ST Booster (costs 8 shards)

#### `!boost <character name>`
Use an ST Booster on a character

**Boost Tiers**:
- 75% - Common: +5-10% ST
- 20% - Rare: +10-18% ST
- 5% - Legendary: +18-25% ST

**Note**: HP and moves recalculate after boosting!

---

### Leaderboards - `!leaderboard <type>` or `!lb <type>`

View top 10 players:
- **Coins**: `!lb coins`
- **Gems**: `!lb gems`
- **Trophies**: `!lb trophies`
- **Battle Wins**: `!lb battles`
- **Collection**: `!lb collection`

---

### Mail & News

#### `!mail [page]` or `!mailbox [page]`
View your inbox

#### `!claimmail <number>`
Claim mail rewards

#### `!news [count]`
View latest announcements (default: 5 latest)

---

## Admin Commands

### Channel Setup

#### `!setdrop`
Set current channel as drop channel
- Drops will appear here every 20 seconds

#### `!setbattle`
Set current channel as battle channel
- Players can use battle commands here

#### `!startdrops`
Start the drop system (requires drop channel)

#### `!stopdrops`
Stop the drop system

---

### Resource Management

#### `!grant @user <coins/gems> <amount>`
Grant coins or gems to a player

**Examples**:
- `!grant @Player coins 1000`
- `!grant @Player gems 50`

#### `!grant @user tokens <character name> <amount>`
Grant character tokens to a player

**Example**:
- `!grant @Player tokens Nix 100`

#### `!grantchar @user <character name>`
Grant a character to a player
- Assigns random ST and moves
- Handles pending tokens

**Example**:
- `!grantchar @Player Duke`

#### `!settrophies @user <amount>`
Set a player's trophy count

**Example**:
- `!settrophies @Player 500`

---

### Communication

#### `!sendmail`
Shows format for sending mail to all players

**Format**: 
```
!sendmail <message> | coins:<amount> gems:<amount> shards:<amount> character:<name> goldcrates:<amount>
```

**Example**:
```
!sendmail Happy holidays! | coins:500 gems:50 shards:5
```

#### `!postnews`
Shows format for posting news announcements

**Format**: 
```
!postnews <title> | <content>
```

**Example**:
```
!postnews New Features! | Quests and ST Boosters are now available!
```

---

## Battle Mechanics Deep Dive

### HP Calculation
- Base HP: 1000-1500 (random)
- Scales with ST percentage
- Higher ST = More HP

### Damage Calculation
- Affected by move power
- Scales with character level
- Scales with ST percentage
- Special moves have enhanced ST scaling

### Battle Flow
1. **Invite Phase**: 60 seconds to accept/decline
2. **Selection Phase**: 120 seconds to choose character
3. **Combat Phase**: 
   - Turn-based
   - 60 seconds per turn
   - Turn counter starts at 0
   - Special moves unlock at turn 3
4. **Victory**: Battle ends when HP reaches 0 or player flees

### Move Types
- **Attack Moves**: Deal damage to opponent
- **Heal Moves**: Restore your HP (negative damage)
- **Support Moves**: Zero damage (buff/debuff effects)

---

## Tips & Strategies

### Leveling Strategy
- Save coins for important level-ups
- Focus on characters with high ST
- Complete quests for free coins

### Battle Strategy
- Save special moves for critical moments
- Know your opponent's character
- Higher level = more damage
- Higher ST = more damage and HP

### Trophy Climbing
- Play battles strategically
- Each win is +5, each loss is -7
- Daily rewards give +15 trophies
- Minimum is 0, so no risk of going negative

### Resource Management
- Open crates when you need specific characters
- Trade with other players for quick coins/gems
- Catch drops regularly for free resources
- Check in daily for login rewards

---

## FAQ

**Q: How do I get more characters?**  
A: Open crates with gems or receive them from admin grants/mail

**Q: Can I lose trophies?**  
A: Yes, you lose 7 trophies per battle loss, but cannot go below 0

**Q: What happens if I release a character?**  
A: The character is permanently deleted (requires level 10+)

**Q: How often can I claim daily rewards?**  
A: Once every 24 hours

**Q: Can special moves be used multiple times?**  
A: No, special moves can only be used once per battle and only after turn 3

**Q: Do message rewards work in DMs?**  
A: No, only messages in the server count

**Q: What's the best crate to open?**  
A: Tyrant crates have the highest character chance (15%) but cost the most gems

**Q: Can I trade characters?**  
A: No, only coins and gems can be traded

---

## Version History

### Current Version Features
- ✅ Message reward system (every 25 messages)
- ✅ Leveling requires coins + tokens
- ✅ Trophy system with battle rewards/penalties
- ✅ Daily login rewards
- ✅ Special move cooldown (3 turns, once per battle)
- ✅ Admin commands: setbattle, settrophies
- ✅ Trophy leaderboard

### Core Features
- 51 unique characters
- Turn-based battle system
- Quest system
- Crate system
- Drop system
- Trading system
- ST Booster system
- Mail system
- News system
- Leaderboards

---

## Support

For issues or questions, contact the server administrators.

**Prefix**: `!`

**Help Command**: `!help`

---

*Documentation last updated: October 2025*
