# Game Mechanics Documentation

This document provides in-depth information about all game systems, mechanics, characters, and features in the Discord bot.

---

## Table of Contents
1. [Core Systems](#core-systems)
2. [Character System](#character-system)
3. [Battle System](#battle-system)
4. [Leveling System](#leveling-system)
5. [Crate System](#crate-system)
6. [ST (Strength) System](#st-strength-system)
7. [Currency & Resources](#currency--resources)
8. [Trophy System](#trophy-system)
9. [Drop System](#drop-system)
10. [Trade System](#trade-system)
11. [Quest System](#quest-system)
12. [Mail System](#mail-system)
13. [Event System](#event-system)
14. [Skin System](#skin-system)
15. [Daily Rewards](#daily-rewards)

---

## Core Systems

### Player Profile
Each player has a unique profile containing:
- **User ID**: Discord user identifier
- **Username**: Discord display name
- **Selected Character**: Currently active character
- **Characters**: Array of owned characters
- **Resources**: Coins, gems, shards
- **Crates**: Inventory of different crate types
- **Trophies**: Competitive ranking score (0-9999)
- **Quest Progress**: Tracking data for all quests
- **Completed Quests**: Array of claimed quest IDs
- **Mailbox**: Personal mail messages
- **Daily Claim Status**: Last daily reward claim time
- **Pending Tokens**: Tokens waiting for first character

### Data Persistence
- **Storage**: MongoDB (if USE_MONGODB=true) or local JSON file
- **Auto-save**: Data saved after every significant action
- **Batch saving**: MongoDB uses 2-second batching to reduce database calls
- **Backfilling**: Missing fields automatically added on data load

---

## Character System

### Total Characters: 51

#### Starter Characters (3)
These can be obtained when starting:
1. **Bruce** 🦍 - Gorilla
2. **Buck** 🐂 - Bull
3. **Nix** 🦊 - Fox

#### Crate Characters (48)
Obtained from opening crates. All other characters are crate-obtainable.

### Character Properties
Each character has:
- **Name**: Unique identifier
- **Emoji**: Visual representation
- **Level**: 1-∞ (starts at 1)
- **ST (Strength)**: Random value 0.00-100.00%
- **Tokens**: Used for leveling up
- **Base HP**: Health points (calculated from ST)
- **Moves**: 3 regular moves + 1 special move
- **Current Skin**: Equipped cosmetic skin
- **Owned Skins**: Array of unlocked skins
- **Unique Ability**: Passive battle effect

### Character Abilities
**Every character has a unique passive ability that activates during battles.**

<details>
<summary><b>All Character Abilities (Click to Expand)</b></summary>

1. **Bali** 🐯 - Fierce Claws: Critical hits deal 50% more damage
2. **Betsy** 🦫 - Swift Strike: All moves cost 20% less energy
3. **Bruce** 🦍 - Fortitude: Gain 10% max HP as shield at battle start
4. **Buck** 🐂 - Charging Bull: First attack each battle deals double damage
5. **Buddy** 🦟 - Pack Leader: Heal 5% max HP every turn
6. **Caly** 🐨 - Nature's Blessing: Healing moves restore 30% more HP
7. **Dillo** ⭕ - Armored Shell: Take 15% reduced damage from all attacks
8. **Donna** 🐊 - Graceful Dance: 15% chance to dodge attacks completely
9. **Duke** 🦁 - Royal Authority: Start battle with +20 energy
10. **Earl** 🦀 - Burning Rage: 25% chance to burn opponent (5 damage/turn for 3 turns)
11. **Edna** 🦔 - Web Trap: Opponents have -10% critical hit chance
12. **Elaine** 🐆 - Petal Power: Gain +5 energy each time you heal
13. **Faye** 🐙 - Fairy Luck: +15% critical hit chance
14. **Finn** 🦈 - Tidal Force: Deal 10% more damage when HP is above 70%
15. **Frank** 🐘 - Hard Head: Cannot be stunned or frozen
16. **Fuzzy** 🐧 - Wild Spirit: Regenerate 3 energy per turn
17. **Henry** 🦇 - Electric Surge: 20% chance to paralyze opponent (skip turn)
18. **Iris** 🐍 - Life Aura: When healing, also restore 10 energy
19. **Jack** 🐺 - Shadow Strike: Deal 25% more damage when opponent HP is below 30%
20. **Jade** 🐅 - Stone Skin: Reduce damage by 5 for every hit taken (stacks)
21. **Joy** 🐒 - Radiant Energy: Special moves refund 20% energy on use
22. **Larry** 🦎 - Cunning Thief: Steal 5 energy from opponent on hit
23. **Lennon** ⭕ - Sound Wave: Attacks ignore 20% of opponent defense buffs
24. **Lizzy** ⭕ - Dragon Heart: Deal 15% more damage with special moves
25. **Louie** 🐀 - Tech Armor: Immune to burn and poison effects
26. **Max** 🦝 - Fighting Spirit: Deal 20% more damage when HP is below 30%
27. **Milo** 🦩 - Vine Heal: Restore 3 HP every turn
28. **Molly** 🦘 - Bubble Shield: First hit taken each battle deals 50% damage
29. **Nico** 🐲 - Speedster: Energy regenerates 50% faster
30. **Nina** ⭕ - Moonlight: All healing effects are 25% more effective
31. **Nix** 🦊 - Frost Bite: 20% chance to freeze opponent (lose next turn)
32. **Ollie** 🐼 - Inferno: Attacks have 30% chance to deal bonus burn damage (10 HP)
33. **Paco** 🐎 - Wind Walker: 20% chance to get a free extra turn
34. **Paolo** 🦓 - Overcharge: Start battle with max energy (100)
35. **Pepper** 🦒 - Spicy Heat: Deal 3 extra damage on all attacks
36. **Phil** 🦉 - Mind Shield: Negative effects have 50% reduced duration
37. **Poe** ⭕ - Dark Veil: Lifesteal 15% of damage dealt
38. **Quinn** ⭕ - Lightning Fast: Non-special moves cost half energy
39. **Ravi** 🦚 - Thunder Strike: Critical hits restore 10 energy
40. **Rocky** 🦂 - Mountain Stance: Cannot be moved or knocked back, +10% defense
41. **Romeo** 🐸 - Charm: 15% chance opponent misses their attack
42. **Rubie** 🦌 - Gem Power: Deal 10% more damage for each buff active
43. **Shelly** 🐢 - Shell Defense: Block first 25 damage taken each battle
44. **Skippy** 🐇 - Bounce Back: Restore 15% HP when falling below 25% HP (once per battle)
45. **Steve** 🦅 - Builder's Strength: Deal 5% more damage each turn (stacks up to 25%)
46. **Suzy** 🐝 - Starlight: Chance to get a random buff at battle start
47. **Tony** 🦛 - Twin Power: 30% chance to attack twice in one turn
48. **Ursula** 🐻‍❄️ - Ocean's Might: Gain +1 energy for each 10 damage dealt
49. **Wanda** 🐋 - Flower Power: Remove one negative effect at end of each turn
50. **Yara** 🐦 - Sandstorm: Opponent takes 3 damage at end of their turn
51. **Zac** 🦏 - Steel Wall: Take 20% reduced damage when HP is above 50%

</details>

---

## Battle System

### Battle Flow
1. **Challenge**: Player A challenges Player B
2. **Accept/Decline**: Player B has 60 seconds to respond
3. **Character Selection**: Both players use their selected character
4. **Turn-Based Combat**: Players alternate turns
5. **Victory**: First player to reduce opponent HP to 0 wins

### Energy System
- **Starting Energy**: 50
- **Energy Per Turn**: +10
- **Maximum Energy**: 100
- **Energy Usage**: Each move costs energy

### Moves

#### Move Types
1. **Attack Moves** - Deal damage to opponent
2. **Heal Moves** - Restore your HP (negative damage value)
3. **Special Moves** - Character-unique powerful attack
4. **Support Moves** - Buff/debuff effects (damage: 0)

#### Move Tiers by ST

**Low ST Moves** (ST ≤ 40%):
- Punch: 15 damage
- Kick: 20 damage
- Swipe: 22 damage
- Smack: 25 damage
- Jab: 18 damage
- Block: 0 damage (support)
- Charge: 0 damage (support)
- Heal: -15 (restores 15 HP)
- Taunt: 0 damage (support)
- Focus: 0 damage (support)

**Mid ST Moves** (40% < ST ≤ 75%):
- Strike: 40 damage
- Double Hit: 45 damage
- Wind Cut: 50 damage
- Flame Hit: 50 damage
- Frost Hit: 48 damage
- Shock Hit: 52 damage
- Counter: 35 damage
- Guard: 0 damage (support)
- Power Up: 0 damage (support)
- Recover: -30 (restores 30 HP)

**High ST Moves** (ST > 75%):
- Smash: 80 damage
- Meteor: 100 damage
- Flash: 95 damage
- Slice: 85 damage
- Flame Burst: 90 damage
- Wave: 88 damage
- Thunder: 95 damage
- Quake: 100 damage
- Revive: -60 (restores 60 HP)
- Boost: 0 damage (support)

#### Special Moves
Each character has a unique special move with high damage (80-100 base damage).
Examples:
- Bruce's Power Slam: 100 damage
- Nix's Frost Bite: 95 damage
- Bali's Claw Rush: 90 damage

### Battle Calculations

#### Base HP Calculation
```
HP = 100 + (ST * 2)
```
Examples:
- 50% ST → 200 HP
- 75% ST → 250 HP
- 100% ST → 300 HP

#### Energy Cost Calculation
```
Cost = Base Damage / 2 (minimum 5)
```
For healing moves:
```
Cost = Heal Amount / 3 (minimum 5)
```

#### Damage Calculation
- Base damage from move
- Modified by character abilities
- Modified by buffs/debuffs
- Modified by status effects
- Random variation (±10%)

#### Critical Hits
- Base critical chance: 10%
- Modified by character abilities
- Critical hits deal 1.5x damage (or more with abilities)

### Battle Actions
Each turn, players can:
1. **Use a Move**: Attack, heal, or support
2. **Use an Item**: Consumable battle items
3. **Flee**: Forfeit the battle (opponent wins)

### Battle Timeouts
- **Turn Timeout**: 60 seconds per turn
- **Failure to act**: Opponent wins automatically
- **Battle Invite**: 60 seconds to accept/decline

### Trophy Changes
- **Winner**: +5 trophies
- **Loser**: -7 trophies
- **Trophy Range**: 0-9999

---

## Leveling System

### Experience System
Characters level up using **Tokens** and **Coins**.

#### Requirements Formula
```
Tokens Required = 50 + (level - 1) * 25
Coins Required = 100 + (level - 1) * 50
```

#### Example Level Requirements:
| Level | Tokens | Coins |
|-------|--------|-------|
| 1→2   | 50     | 100   |
| 2→3   | 75     | 150   |
| 3→4   | 100    | 200   |
| 5→6   | 175    | 350   |
| 10→11 | 400    | 800   |
| 20→21 | 675    | 1350  |
| 50→51 | 1625   | 3250  |

### Leveling Benefits
- **Increased Base HP**: HP grows with each level
- **Battle Advantages**: Higher level = stronger in combat
- **Quest Progress**: Max level quests track highest level character
- **Prestige**: Display of dedication and strength

### Token Sources
- Opening crates (all types)
- Pending tokens (stored until first character obtained)
- Event rewards
- Quest rewards
- Daily rewards

---

## Crate System

### Crate Types

| Crate | Cost | Coins | Tokens | Char % | Points | Emoji |
|-------|------|-------|--------|--------|--------|-------|
| Bronze | Free | 100 | 15 | 2% | 1 | 🟫 |
| Silver | Free | 250 | 30 | 100% | 2 | ⚪ |
| Gold | 100💎 | 500 | 50 | 150% | 3 | 🟡 |
| Emerald | 250💎 | 1800 | 130 | 500% | 5 | 🟢 |
| Legendary | 500💎 | 2500 | 200 | 1000% | 8 | 🟣 |
| Tyrant | 750💎 | 3500 | 300 | 1500% | 12 | 🔴 |

### Crate Mechanics

#### Rewards
Every crate gives:
1. **Coins** (guaranteed)
2. **Tokens** (distributed to random owned character)
3. **Chance for Character** (varies by crate)

#### Character Selection
- Random character from crate pool
- Only characters you don't own
- If you own all characters: +50 gems bonus

#### Pending Tokens
- If you have no characters, tokens are saved
- When you get your first character, all pending tokens go to them
- Prevents token waste

#### Quest Tracking
- `cratesOpened`: Increments with every crate
- `tyrantCratesOpened`: Increments only for Tyrant crates
- `charsFromCrates`: Increments when character is obtained

---

## ST (Strength) System

### What is ST?
ST (Strength) is a random stat value for each character ranging from 0.00% to 100.00%.

### ST Effects

#### 1. Base HP
Higher ST = Higher HP in battles
```
HP = 100 + (ST * 2)
```

#### 2. Move Pool
ST determines which moves a character can use:
- **0-40% ST**: Low-tier moves (15-25 damage)
- **41-75% ST**: Mid-tier moves (35-52 damage)
- **76-100% ST**: High-tier moves (80-100 damage)

#### 3. Character Value
- Higher ST characters are more valuable
- Perfect 100% ST is extremely rare
- Quest reward for owning 100% ST character

### ST Modification

#### ST Boosters
- Crafted using 5 shards
- Rerolls character's ST to new random value
- Can increase OR decrease ST (risky!)
- Also recalculates HP and reassigns moves

#### When to Use ST Boosters:
- Low ST characters (<40%)
- Trying to get perfect 100%
- Optimizing your team

---

## Currency & Resources

### Coins 💰
**Primary currency**
- Used for: Leveling up characters
- Sources: Drops, crates, quests, daily rewards, battles
- No maximum limit

### Gems 💎
**Premium currency**
- Used for: Buying crates (gold/emerald/legendary/tyrant)
- Sources: Quests, crates, daily rewards, selling duplicates
- No maximum limit

### Shards 🔷
**Crafting resource**
- Used for: Crafting ST Boosters (5 shards = 1 booster)
- Sources: Quest rewards, crate rewards
- No maximum limit

### Tokens 🎫
**Character-specific**
- Used for: Leveling up specific character
- Sources: Crates (distributed to random owned character)
- Stored per character, not globally

### Trophies 🏆
**Competitive ranking**
- Range: 0-9999
- Changed by: Battle wins (+5), losses (-7)
- Used for: Leaderboards, ranking
- Starting value: 200

---

## Trophy System

### Trophy Mechanics
- **Starting Trophies**: 200
- **Win Reward**: +5 trophies
- **Loss Penalty**: -7 trophies
- **Minimum**: 0 (can't go negative)
- **Maximum**: 9999

### Trophy Significance
- Displays player skill and dedication
- Used in leaderboards
- Affects competitive standing
- Trophy-based events possible

---

## Drop System

### Drop Mechanics
- **Frequency**: Every 20 seconds (when active)
- **Location**: Designated drop channel
- **Activation**: Admin command (!startdrops)
- **Claim Method**: React to drop message

### Drop Rewards
- Coins
- Gems
- Crates
- Tokens
- Possibly characters (rare)

### Quest Tracking
- `dropsCaught`: Increments when drop is claimed
- Tracked automatically on reaction

---

## Trade System

### Trade Flow
1. **Initiate**: Player A sends trade request to Player B
2. **Offer Phase**: Both players add coins/gems to offer
3. **Confirmation**: Both players must confirm
4. **Completion**: Resources exchanged automatically

### Trade Commands
- `!offer coins <amount>`: Add coins to your offer
- `!offer gems <amount>`: Add gems to your offer
- `!confirm`: Lock in your offer
- `!cancel`: Cancel the entire trade

### Trade Rules
- Only coins and gems can be traded
- Cannot trade characters or tokens
- Both players must confirm for trade to complete
- Trade expires after 60 seconds
- Both players must have sufficient resources

### Quest Tracking
- `tradesCompleted`: Increments for BOTH players
- Only successful trades count

---

## Quest System

### Quest Overview
- **Total Quests**: 65
- **Categories**: Drops, Battles, Collection, Leveling, Crates, Trading, Currency, Special
- **Progress**: Automatically tracked
- **Rewards**: Coins, gems, shards

### Quest Categories

#### 1. Starter Quests
- Quest 1: First Steps (just start playing)

#### 2. Drop Quests (6 quests)
- Catch 1, 10, 25, 50, 100 drops
- Tracked via `dropsCaught`

#### 3. Battle Quests (7 quests)
- Win 1, 5, 10, 25, 50, 100 battles
- Participate in 50, 100 battles
- Tracked via `battlesWon` and `totalBattles`

#### 4. Collection Quests (6 quests)
- Own 5, 10, 15, 20, 30, 51 (all) unique characters
- Tracked via character count

#### 5. Leveling Quests (9 quests)
- Level any character to 5, 10, 15, 20, 30, 50
- Have 3/5 characters at level 10+
- Have 3 characters at level 20+
- Tracked via `maxLevel`, `charsLevel10Plus`, `charsLevel20Plus`

#### 6. Crate Quests (6 quests)
- Open 1, 5, 10, 25, 50 crates
- Open 1 Tyrant crate
- Get 3 characters from crates
- Tracked via `cratesOpened`, `tyrantCratesOpened`, `charsFromCrates`

#### 7. Trading Quests (4 quests)
- Complete 1, 5, 10, 25 trades
- Tracked via `tradesCompleted`

#### 8. Currency Quests (8 quests)
- Accumulate coins: 1000, 5000, 10000, 25000
- Accumulate gems: 100, 250, 500, 1000
- Tracked via current coin/gem balance

#### 9. Shard Quests (4 quests)
- Collect 5, 10, 25, 50 shards
- Tracked via `shards`

#### 10. ST Booster Quests (3 quests)
- Use 1, 5, 10 ST Boosters
- Tracked via `boostsUsed`

#### 11. Special Quests (11 quests)
- Own character with 100% ST: `perfectST`
- Own character with 90%+ ST: `highSTChar`
- Win streak of 3, 5, 10: `winStreak` (current)
- Release a character: `charsReleased`
- Win battle with level 30+ character: `highLevelWin`
- Accumulate 500, 1000, 2500 total tokens: `totalTokens`

### Quest Claiming
- View quests: `!quests`
- Check specific quest: `!quest <id>`
- Claim rewards: `!claim <id>`
- Can only claim completed quests
- Can only claim each quest once

---

## Mail System

### Mail Types
- **Admin-sent**: Personalized messages from admins
- **System-generated**: Automated rewards
- **Event rewards**: Prizes from events

### Mail Properties
- Sender name
- Message content
- Attached rewards (coins, gems, shards, crates)
- Timestamp
- Claimed status

### Mail Commands
- `!mail`: View mailbox
- `!claimmail <id>`: Claim specific mail
- `!sendmail @user | message`: Admin sends mail

---

## Event System

### Event Structure
- Events have start and end times
- Events track player progress/scores
- Events have rankings/leaderboards
- Events award prizes to top performers

### Event Types
- **Trophy Hunt**: Earn points from battles
- **Crate Master**: Earn points from opening crates
- Custom events with various objectives

### Event Participation
- Automatic participation when performing event actions
- Progress tracked in MongoDB (separate collection)
- Rankings updated in real-time

---

## Skin System

### Skin Basics
- Cosmetic appearance changes
- No stat modifications
- Character-specific
- Must be unlocked to use

### Default Skins
- Every character has a "default" skin
- Cannot be removed
- Always available

### Custom Skins
- Added by admins
- Granted to specific players
- Can be revoked
- Equippable via command

### Skin Commands
- `!equipskin <character> | <skin>`: Equip owned skin
- `!addskin <character> | <skin>`: Admin adds new skin
- `!grantskin @user | <character> | <skin>`: Admin grants skin
- `!revokeskin @user | <character> | <skin>`: Admin removes skin

---

## Daily Rewards

### Reward System
- Claimable once per 24 hours
- Automatic cooldown tracking
- Varied rewards each claim

### Typical Rewards
- Coins
- Gems
- Random crate (bronze to legendary)
- Possible bonus shards

### Daily Streak (if implemented)
- Consecutive daily claims
- Bonus rewards for streaks
- Reset on missed day

---

## Formulas Reference

### HP Calculation
```javascript
baseHP = 100 + (ST * 2)
```

### Level Requirements
```javascript
tokensRequired = 50 + (level - 1) * 25
coinsRequired = 100 + (level - 1) * 50
```

### Energy Cost
```javascript
// For damage moves
energyCost = Math.max(5, Math.floor(damage / 2))

// For heal moves
energyCost = Math.max(5, Math.floor(healAmount / 3))
```

### Damage Calculation (Simplified)
```javascript
baseDamage = move.damage
finalDamage = baseDamage * (1 + abilityModifiers) * randomFactor
// randomFactor typically 0.9 to 1.1
```

### Critical Hit
```javascript
criticalDamage = normalDamage * 1.5 // (or more with abilities)
criticalChance = 0.10 + abilityBonus
```

---

## Tips & Strategy

### Character Collection
- Open silver crates for guaranteed characters
- Save gems for emerald/legendary crates
- Complete quests for free resources

### Battle Strategy
- Level up your main battle character
- Learn opponent's move patterns
- Manage energy wisely
- Use character abilities to your advantage

### Resource Management
- Don't waste ST boosters on mid-range characters
- Save shards for important boosters
- Complete daily rewards every day
- Participate in events for bonus rewards

### Quest Optimization
- Track quest progress regularly
- Claim completed quests immediately
- Focus on multiple quests simultaneously
- Some quests unlock naturally through play

---

## Technical Notes

### Data Structure
- User data stored as JSON objects
- MongoDB uses collection per data type (users, config, events)
- Automatic backfilling ensures all fields exist
- Batch saving reduces database load

### Performance
- Connection pooling for MongoDB (5-50 connections)
- 2-second batch delay for saves
- Indexed collections for fast queries
- Compressed data transfer

---

This documentation covers all core mechanics of the Discord bot game system. For command usage, see COMMANDS.md. For quest details, see QUEST_SYSTEM.md.
