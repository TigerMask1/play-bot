# PlayBot - Complete User & Admin Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [User Guide](#user-guide)
3. [Server Owner/Admin Guide](#server-owner--admin-guide)
4. [Customization Guide](#customization-guide)
5. [Preset Descriptions](#preset-descriptions)
6. [Advanced Configuration](#advanced-configuration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### For Server Owners: Get Your Server Running in 5 Minutes

1. **Invite PlayBot** to your Discord server (with admin permissions)
2. **Run Setup**: Type `!setup`
3. **Choose a Preset**: Run `!applypreset simple` (or rpg/pokemon/competitive)
4. **You're Done!** Players can now use `!start` to begin playing

### For Players: Join the Fun

1. **Start Your Adventure**: Type `!start`
2. **Check Your Balance**: `!balance`
3. **Claim Daily Rewards**: `!daily`
4. **Explore Options**: `!help`

---

## User Guide

### Getting Started

#### `!start`
Initialize your account on the server. Required before using any gameplay commands.
```
!start
```

#### `!profile`
View your account information including level, XP, and stats.
```
!profile
```

#### `!balance`
Check your current coin and gem balance.
```
!balance
```

### Earning Currency

#### `!daily`
Claim your daily reward (one per 24 hours). Includes streak bonuses!
```
!daily
```
**Rewards**: 100 coins + 10 bonus per day streak (capped at 100 bonus)

#### `!work [job]`
Perform a job to earn coins and XP.
```
!work              # Perform default job
!work hunt         # Hunt for treasures
!work fish         # Go fishing
!work mine         # Mine precious ore
```
**Rewards**: Varies by job (20-150 coins, 5-50 XP)

#### `!jobs`
List all available work jobs with their rewards and cooldowns.
```
!jobs
```

### Collecting Characters

#### `!crate [type]`
Open a crate to receive characters, items, or currency.
```
!crate              # View available crates
!crate common_crate # Open a crate
```
**Contains**: Characters, items, or coins based on crate type

#### `!characters`
View your character collection, sorted by rarity.
```
!characters
```

### Combat & Challenges

#### `!battle @player`
Challenge another player to a 1v1 battle.
```
!battle @opponent
```
**Requirements**: 
- You and opponent must have at least 1 character
- Both must be level 1+
- 60 second cooldown between battles

**Rewards**:
- Winner: Base coins + XP
- Loser: Consolation coins + XP

#### `!forfeit`
Surrender your current battle (opponent wins).
```
!forfeit
```

### Trading & Economy

#### `!trade @player`
Initiate a trade with another player.
```
!trade @friend
```
**Process**:
1. Both players add items, characters, or currency to their offers
2. Both confirm the trade
3. Items are exchanged automatically

**Fees**: Configurable by server admins (default 5%)

#### `!tradecancel`
Cancel your pending trade.
```
!tradecancel
```

#### `!exchange <from> <to> <amount>`
Convert between server and official currencies.
```
!exchange coins playcoins 1000          # Convert coins to PlayCoins
!exchange playcoins coins 100           # Convert PlayCoins to coins
!exchange gems playgems 50              # Convert gems to PlayGems
```
**Includes**: Exchange rate display + fee calculation

### Inventory & Collection

#### `!inventory`
View all items in your inventory.
```
!inventory
```

#### `!leaderboard [type]`
View server rankings.
```
!leaderboard           # Top by level
!leaderboard coins     # Richest players
!leaderboard battles   # Most battle wins
!leaderboard characters # Largest collections
```

### Events & Updates

#### `!events`
See active server events with bonuses and rewards.
```
!events
```

---

## Server Owner & Admin Guide

### Initial Setup

#### `!setup`
Interactive first-time server configuration.
```
!setup
```
**Configures**: Bot name, prefix, currency names, admin role

#### `!presets`
View the 4 built-in configuration templates.
```
!presets
```

#### `!applypreset <preset_id>`
Apply a complete configuration template (REPLACES current settings).
```
!applypreset simple         # For casual servers
!applypreset rpg            # For RPG-focused communities
!applypreset pokemon        # For creature collector vibes
!applypreset competitive    # For PvP-focused servers
```

#### `!serverconfig`
View your current server configuration at a glance.
```
!serverconfig
```

### Customizing Drop System

Drops happen randomly in channels. Players who collect enough messages get a chance to claim drops for rewards.

#### `!setdropchance <0.01-1.0>`
Set the probability of a drop occurring.
```
!setdropchance 0.15    # 15% chance per message threshold
```

#### `!setdropcooldown <seconds>`
Set cooldown between drops per player.
```
!setdropcooldown 30    # Player can collect drop every 30 seconds
```

#### `!setdropchannel <#channel>`
Set which channel drops appear in.
```
!setdropchannel #drops
```

#### `!setrarityweight <rarity> <weight>`
Adjust drop rarity distribution.
```
!setrarityweight common 50
!setrarityweight rare 15
!setrarityweight legendary 2
```

### Customizing Work System

Each job gives coins and XP. Create custom jobs tailored to your community.

#### `!jobs`
List all available jobs.
```
!jobs
```

#### `!addjob <id> <name> <emoji> <cooldown_seconds> <min_reward> <max_reward>`
Create a custom job.
```
!addjob farm "Farming" 🌾 300 20 80
!addjob raid "Raid Dungeon" ⚔️ 1800 100 300
!addjob study "Study Magic" 📖 600 15 60
```

#### `!setjobmessages <job_id> <message1> | <message2> | ...`
Customize success messages for a job (makes it feel personalized).
```
!setjobmessages farm "Crops harvested!" | "You farmed successfully!" | "Great harvest today!"
```

#### `!removejob <job_id>`
Delete a custom job.
```
!removejob farm
```

### Customizing Battle System

#### `!setbattlerewards <winner_coins> <winner_xp> <loser_coins> <loser_xp>`
Adjust battle rewards.
```
!setbattlerewards 100 50 20 10
```

### Customizing Crate System

#### `!addcrate <id> <name> <emoji> <coin_price> <gem_price>`
Create a new crate type.
```
!addcrate legendary_box "Legendary Box" 👑 2000 50
!addcrate daily_crate "Daily Reward Box" 🎁 0 10
```

#### `!removecrate <crate_id>`
Delete a crate type.
```
!removecrate legend_box
```

### Content Management

#### `!addcharacter <name> <emoji> [rarity]`
Create a custom character for your server.
```
!addcharacter "Fire Dragon" 🐉 legendary
!addcharacter "Wood Sprite" 🌳 common
```

#### `!publishcharacter <slug>`
Make a character available for drops/crates.
```
!publishcharacter fire_dragon
```

#### `!servercharacters`
View all custom characters you've created.
```
!servercharacters
```

#### `!addmove <name> <type> <power> <accuracy> <energy>`
Add a custom move/ability.
```
!addmove "Inferno" fire 90 85 30
!addmove "Nature's Fury" grass 80 90 25
```

#### `!additem <name> <emoji> <type> <price>`
Create a custom item.
```
!additem "Health Potion" 🧪 consumable 100
!additem "Dragon Scale" 🪨 material 500
```

### Feature Control

#### `!togglefeature <feature> <on/off>`
Enable/disable gameplay features.
```
!togglefeature drops on
!togglefeature trading off
!togglefeature battles on
```
**Available features**: drops, battles, trading, crates, work, events, leaderboards

### Currency Management

#### Grant Official Currency (Admin Only)

Admins can grant PlayCoins/PlayGems (official global currency) to servers or players.

```
!grantplaycoins @player 100     # Give player 100 PlayCoins
!grantplaygems @player 50       # Give player 50 PlayGems
```

#### Grant Server Currency

```
!grantcoins @player 500         # Give player 500 of server currency
!grantgems @player 100          # Give player 100 of server premium currency
```

### Admin Utilities

#### `!exportconfig`
Export your server's configuration as JSON (useful for backups or sharing).
```
!exportconfig
```

---

## Customization Guide

### Scenario 1: Build a Casual Community Server

**Goal**: Simple, fun, easy for new players

```
!applypreset simple
```
Done! This includes:
- Liberal drop rates (20% chance)
- Simple work system
- Casual crate prices
- Forgiving battle rewards

### Scenario 2: Create an RPG Economy

**Goal**: Complex progression, multiple jobs, rare rewards

```
!applypreset rpg
!addjob quest "Daily Quest" 📜 1800 100 300
!setbattlerewards 150 75 30 20
!setrarityweight legendary 3
!addcrate epic_chest "Epic Chest" 👑 1000 0
```

### Scenario 3: Implement Creature Collector (Pokemon-style)

**Goal**: Focus on catching creatures, battling, trading

```
!applypreset pokemon
!addcharacter "Sparkeon" ✨ common
!addcharacter "Flamewing" 🔥 rare
!addcharacter "Thunderking" ⚡ legendary
!togglefeature trading on
```

### Scenario 4: Competitive PvP Server

**Goal**: Skill-based battles, high rewards for winners

```
!applypreset competitive
!setbattlerewards 500 100 100 25
!setdropcooldown 120
!setdropchance 0.05
!togglefeature leaderboards on
```

### Custom Progression Curve

**Slow Progression** (RPG):
- High XP requirements per level
- More content to experience
- `!setjobmessages` should have multiple varied messages

**Fast Progression** (Casual):
- Low XP requirements
- Quick level ups = feeling of progress
- Keep job messages short and snappy

---

## Preset Descriptions

### Simple Mode 🎮
**Best For**: Discord servers, casual communities, beginners

**Features**:
- Drop chance: 20%
- Work cooldown: 3 minutes
- Jobs: Basic work only
- Crates: 1 simple type at 200 coins
- No trading fees
- Min level for trading: 1
- XP per level: 50

**Customize By**: Adding custom jobs, characters, adjusting drop rates

### RPG Style 📖
**Best For**: Gaming communities, story-focused servers, immersion

**Features**:
- Drop chance: 15%
- Work cooldown: 5 minutes
- Jobs: Hunt, Fish, Mine, Forage, Quest (epic quests!)
- Crates: 3 types with pity system
- 5% trading fee
- Min level for trading: 5
- XP per level: 100
- Prestige system enabled

**Customize By**: Adding lore, custom quests, themed characters

### Creature Collector 🎭
**Best For**: Collectors, competitive traders, catching enthusiasts

**Features**:
- Drop chance: 12%
- Work cooldown: 5 minutes
- Jobs: Explore, Train
- Crates: Creature-focused (Pokéball, Great Ball, Ultra Ball)
- 2% trading fee
- Min level for trading: 3
- Focus on character collection

**Customize By**: Creating themed character collections, adding rarity tiers

### Competitive 🏆
**Best For**: PvP-focused servers, competitive communities, esports

**Features**:
- Drop chance: 8% (rare)
- Work cooldown: 10 minutes
- Jobs: Grind only
- Crates: Ranked crate only
- 10% trading fee (discourages inflation)
- Min level for trading: 10
- High battle rewards: Winner gets 150 coins + 75 XP
- Leaderboards enabled

**Customize By**: Adjusting battle rules, implementing seasons

---

## Advanced Configuration

### Creating a Themed Server

#### Example: Dragon-themed Server

```
!applypreset rpg
!addcharacter "Red Dragon" 🐉 legendary
!addcharacter "Ice Dragon" 🧊 epic
!addcharacter "Golden Dragon" ✨ rare
!addcharacter "Drake Hatchling" 🐣 common
!addjob dragon_hunt "Dragon Hunt" 🏹 3600 200 500
!setjobmessages dragon_hunt "You slayed a dragon!" | "Dragon treasure collected!" | "Victory!"
!addcrate dragon_box "Dragon Box" 🎁 5000 0
!setcurrency "Gold Coins" "🪙" "Dragon Scales" "🩸"
```

### Economy Balancing

**Inflation Prevention**:
1. Set drop chance LOW (0.08) to reduce free currency
2. Set high trading fees (10%) to reduce transfers
3. Set high crate prices (relative to daily earnings)
4. Require high min level for trading

**Reward Generation**:
1. Set drop chance HIGH (0.25) for generous rewards
2. Create high-reward jobs
3. Set low crate prices
4. Remove trading fees

### Event Configuration

Create seasonal economies:
- **Spring**: Flower-themed drops, garden jobs
- **Summer**: Beach event, surfing jobs, sand-themed items
- **Autumn**: Harvest festival, farming bonuses
- **Winter**: Holiday drops, special gifts

Use `!events` to set up temporary boosts during these times.

---

## Best Practices

### 1. Start Simple
- Begin with a preset
- Make small tweaks
- Expand gradually as community grows

### 2. Balance Reward Systems
- Work rewards should be achievable
- Rare drops should feel special
- Battle rewards should incentivize participation

### 3. Keep the Economy Healthy
- Monitor coin inflation
- Adjust drop rates if currency becomes devalued
- Set reasonable crate prices
- Use trading fees to control transfers

### 4. Community Engagement
- Add custom jobs that match your community's vibe
- Create themed characters
- Use events to keep things fresh
- Adjust difficulty seasonally

### 5. Moderate Growth
- Set progression curves that challenge but don't frustrate
- Allow new players to catch up quickly
- Give veterans goals to strive for

### 6. Customization Momentum
- Don't change too many settings at once
- Give community time to adapt
- Gather feedback before major changes

---

## Troubleshooting

### "I'm not seeing drops"
- Check drop chance: `!serverconfig` → `dropSettings.baseChance`
- Ensure drops channel is set: `!setdropchannel #channel`
- Wait for cooldown to expire (default 30s between drops)

### "Crates are too expensive"
- Use `!removecrate` and `!addcrate` with lower prices
- Or use `!applypreset simple` for cheaper defaults

### "Jobs are too easy"
- Increase cooldowns: `!setjobmessages` to make rewards feel earned
- Reduce rewards: `!addjob` with lower min/max values
- Or use `!applypreset competitive` for higher difficulty

### "Trading is unfair"
- Check restrictions: `!serverconfig` → `tradingSettings`
- Adjust min level: Higher level requirement = less spam
- Increase fees: `!togglefeature` to disable if problematic

### "Bots are spamming commands"
- Set higher permission levels for sensitive commands
- Use role-based restrictions
- Report bot abuse to server admins

### "How do I reset everything?"
- Use `!applypreset` to reload a template (overwrites current config)
- Or recreate the server settings with `!setup`

### "Can I transfer my configuration?"
- Use `!exportconfig` to get a JSON backup
- Share with other server owners

---

## Command Reference by Permission Level

### User Commands (Everyone)
- `!start`, `!help`, `!ping`, `!profile`, `!balance`, `!daily`
- `!work`, `!jobs`, `!crate`, `!characters`, `!inventory`
- `!battle`, `!forfeit`, `!trade`, `!tradecancel`
- `!events`, `!leaderboard`, `!exchange`, `!transactions`

### Admin Commands (PlayAdmin+)
- `!setup`, `!serverconfig`, `!exportconfig`, `!presets`
- `!setbotname`, `!setprefix`, `!setcurrency`, `!setdropchannel`
- `!addcharacter`, `!addmove`, `!additem`, `!publishcharacter`, `!servercharacters`
- `!addjob`, `!removejob`, `!setjobmessages`
- `!addcrate`, `!removecrate`
- `!setdropchance`, `!setdropcooldown`, `!setrarityweight`
- `!setbattlerewards`, `!togglefeature`
- `!grantcoins`, `!grantgems`

### Owner Commands (ServerOwner+)
- `!applypreset`

### Super Admin Commands (SuperAdmin)
- `!addofficialcharacter`, `!officialcharacters`
- `!grantplaycoins`, `!grantplaygems`
- `!setexchangerate`, `!setexchangefee`

---

## Tips & Tricks

✨ **Customize everything** - Your server, your rules!
🎯 **Balance matters** - Check leaderboards to ensure fairness
🎨 **Make it personal** - Add custom characters/jobs that match your community
💰 **Economy health** - Monitor inflation and adjust drop rates accordingly
📊 **Data-driven** - Use leaderboards to understand what players enjoy
🎪 **Keep it fresh** - Use events and rotating job rewards
🤝 **Community input** - Ask players what they want!

---

## Getting Help

- Use `!help` in Discord for quick command info
- Check this guide for detailed explanations
- Ask server admins for customization questions
- Report bugs to development team

**Enjoy PlayBot! 🎮**
