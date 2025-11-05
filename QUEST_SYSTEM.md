# Quest System Documentation

This document provides comprehensive details about all 65 quests in the game, including requirements, tracking methods, and rewards.

---

## Table of Contents
1. [Quest System Overview](#quest-system-overview)
2. [Quest Tracking Fields](#quest-tracking-fields)
3. [Complete Quest List](#complete-quest-list)
4. [Quest Tracking Implementation](#quest-tracking-implementation)
5. [Quest Claiming](#quest-claiming)

---

## Quest System Overview

### Total Quests: 65

### Quest Structure
Each quest has:
- **ID**: Unique identifier (1-65)
- **Name**: Quest title
- **Description**: What the quest requires
- **Type**: Category (drops, battles, collection, etc.)
- **Requirement**: Target value to reach
- **Current**: Field name in questProgress that tracks this
- **Reward**: Coins, gems, and/or shards

### Quest States
- **Available**: Not yet completed, can make progress
- **Ready to Claim**: Requirement met, waiting for claim
- **Claimed**: Rewards received, cannot claim again

---

## Quest Tracking Fields

The `questProgress` object contains the following tracking fields:

| Field | Description | Incremented By |
|-------|-------------|----------------|
| `dropsCaught` | Total drops caught | Drop claim reactions |
| `battlesWon` | Total battles won | Battle victories |
| `cratesOpened` | Total crates opened | Any crate opening |
| `tradesCompleted` | Total successful trades | Trade completions (both players) |
| `boostsUsed` | ST Boosters used | Using !boost command |
| `currentWinStreak` | Current consecutive wins | Battle wins (+1), losses (reset to 0) |
| `maxWinStreak` | Highest win streak achieved | Updated when currentWinStreak exceeds it |
| `charsReleased` | Characters released | Using !release command |
| `tyrantCratesOpened` | Tyrant crates opened | Opening tyrant crates specifically |
| `totalBattles` | Total battles participated in | Any battle (win or lose) |
| `charsFromCrates` | Characters obtained from crates | Getting new character from crate |
| `highLevelWin` | Won with level 30+ character | Winning battle with level 30+ character |

### Calculated Fields (Not Stored)
These are calculated on-the-fly when checking quest progress:
- `started`: Player has created account (always 1)
- `uniqueChars`: Number of owned characters (character array length)
- `maxLevel`: Highest level among all characters
- `coins`: Current coin balance
- `gems`: Current gem balance
- `perfectST`: Has character with exactly 100% ST (0 or 1)
- `shards`: Current shard count
- `charsLevel10Plus`: Count of characters level 10 or higher
- `charsLevel20Plus`: Count of characters level 20 or higher
- `totalTokens`: Sum of all tokens across all characters
- `highSTChar`: Has character with 90%+ ST (0 or 1)

---

## Complete Quest List

### Starter Quest

#### Quest 1: First Steps
- **Description**: Start your journey
- **Type**: starter
- **Requirement**: 1 (just start playing)
- **Tracked By**: `started` (automatic when account exists)
- **Reward**: 💰 100 coins, 💎 5 gems
- **How to Complete**: Use `!start` command

---

### Drop Quests (2-6)

#### Quest 2: Catch Your First Drop
- **Description**: Catch 1 drop from the drop channel
- **Type**: drops
- **Requirement**: 1
- **Tracked By**: `dropsCaught`
- **Reward**: 💰 50 coins, 💎 2 gems

#### Quest 3: Drop Hunter I
- **Description**: Catch 10 drops
- **Type**: drops
- **Requirement**: 10
- **Tracked By**: `dropsCaught`
- **Reward**: 💰 150 coins, 💎 5 gems

#### Quest 4: Drop Hunter II
- **Description**: Catch 25 drops
- **Type**: drops
- **Requirement**: 25
- **Tracked By**: `dropsCaught`
- **Reward**: 💰 300 coins, 💎 10 gems, 🔷 1 shard

#### Quest 5: Drop Hunter III
- **Description**: Catch 50 drops
- **Type**: drops
- **Requirement**: 50
- **Tracked By**: `dropsCaught`
- **Reward**: 💰 500 coins, 💎 15 gems, 🔷 2 shards

#### Quest 6: Drop Master
- **Description**: Catch 100 drops
- **Type**: drops
- **Requirement**: 100
- **Tracked By**: `dropsCaught`
- **Reward**: 💰 1000 coins, 💎 25 gems, 🔷 3 shards

---

### Battle Quests (7-12, 58-59)

#### Quest 7: First Battle
- **Description**: Win your first battle
- **Type**: battles
- **Requirement**: 1
- **Tracked By**: `battlesWon`
- **Reward**: 💰 200 coins, 💎 8 gems
- **How to Complete**: Win a PvP battle using `!battle @user`

#### Quest 8: Battle Novice
- **Description**: Win 5 battles
- **Type**: battles
- **Requirement**: 5
- **Tracked By**: `battlesWon`
- **Reward**: 💰 400 coins, 💎 15 gems, 🔷 1 shard

#### Quest 9: Battle Apprentice
- **Description**: Win 10 battles
- **Type**: battles
- **Requirement**: 10
- **Tracked By**: `battlesWon`
- **Reward**: 💰 700 coins, 💎 20 gems, 🔷 2 shards

#### Quest 10: Battle Expert
- **Description**: Win 25 battles
- **Type**: battles
- **Requirement**: 25
- **Tracked By**: `battlesWon`
- **Reward**: 💰 1200 coins, 💎 35 gems, 🔷 3 shards

#### Quest 11: Battle Master
- **Description**: Win 50 battles
- **Type**: battles
- **Requirement**: 50
- **Tracked By**: `battlesWon`
- **Reward**: 💰 2000 coins, 💎 50 gems, 🔷 5 shards

#### Quest 12: Legendary Warrior
- **Description**: Win 100 battles
- **Type**: battles
- **Requirement**: 100
- **Tracked By**: `battlesWon`
- **Reward**: 💰 5000 coins, 💎 100 gems, 🔷 10 shards

#### Quest 58: Battle Veteran
- **Description**: Participate in 50 battles (wins or losses)
- **Type**: battles
- **Requirement**: 50
- **Tracked By**: `totalBattles`
- **Reward**: 💰 1500 coins, 💎 40 gems, 🔷 4 shards
- **Note**: Counts ALL battles, not just wins

#### Quest 59: Battle Legend
- **Description**: Participate in 100 battles (wins or losses)
- **Type**: battles
- **Requirement**: 100
- **Tracked By**: `totalBattles`
- **Reward**: 💰 3500 coins, 💎 85 gems, 🔷 8 shards
- **Note**: Counts ALL battles, not just wins

---

### Collection Quests (13-18)

#### Quest 13: Character Collector I
- **Description**: Own 5 different characters
- **Type**: collection
- **Requirement**: 5
- **Tracked By**: `uniqueChars` (calculated from character count)
- **Reward**: 💰 300 coins, 💎 10 gems

#### Quest 14: Character Collector II
- **Description**: Own 10 different characters
- **Type**: collection
- **Requirement**: 10
- **Tracked By**: `uniqueChars`
- **Reward**: 💰 600 coins, 💎 20 gems, 🔷 2 shards

#### Quest 15: Character Collector III
- **Description**: Own 15 different characters
- **Type**: collection
- **Requirement**: 15
- **Tracked By**: `uniqueChars`
- **Reward**: 💰 1000 coins, 💎 35 gems, 🔷 3 shards

#### Quest 16: Character Enthusiast
- **Description**: Own 20 different characters
- **Type**: collection
- **Requirement**: 20
- **Tracked By**: `uniqueChars`
- **Reward**: 💰 1500 coins, 💎 50 gems, 🔷 5 shards

#### Quest 17: Character Master
- **Description**: Own 30 different characters
- **Type**: collection
- **Requirement**: 30
- **Tracked By**: `uniqueChars`
- **Reward**: 💰 3000 coins, 💎 75 gems, 🔷 8 shards

#### Quest 18: Complete Collection
- **Description**: Own all 51 characters
- **Type**: collection
- **Requirement**: 51
- **Tracked By**: `uniqueChars`
- **Reward**: 💰 10000 coins, 💎 200 gems, 🔷 20 shards
- **Note**: Ultimate collection achievement

---

### Leveling Quests (19-24, 55-57)

#### Quest 19: Level Up!
- **Description**: Level up any character to level 5
- **Type**: leveling
- **Requirement**: 5
- **Tracked By**: `maxLevel` (highest level among all characters)
- **Reward**: 💰 200 coins, 💎 8 gems

#### Quest 20: Power Training I
- **Description**: Level up any character to level 10
- **Type**: leveling
- **Requirement**: 10
- **Tracked By**: `maxLevel`
- **Reward**: 💰 400 coins, 💎 15 gems, 🔷 1 shard

#### Quest 21: Power Training II
- **Description**: Level up any character to level 15
- **Type**: leveling
- **Requirement**: 15
- **Tracked By**: `maxLevel`
- **Reward**: 💰 700 coins, 💎 25 gems, 🔷 2 shards

#### Quest 22: Power Training III
- **Description**: Level up any character to level 20
- **Type**: leveling
- **Requirement**: 20
- **Tracked By**: `maxLevel`
- **Reward**: 💰 1200 coins, 💎 40 gems, 🔷 4 shards

#### Quest 23: Elite Trainer
- **Description**: Level up any character to level 30
- **Type**: leveling
- **Requirement**: 30
- **Tracked By**: `maxLevel`
- **Reward**: 💰 2500 coins, 💎 75 gems, 🔷 8 shards

#### Quest 24: Legendary Trainer
- **Description**: Level up any character to level 50
- **Type**: leveling
- **Requirement**: 50
- **Tracked By**: `maxLevel`
- **Reward**: 💰 5000 coins, 💎 150 gems, 🔷 15 shards
- **Note**: Extreme dedication required

#### Quest 55: Team Builder I
- **Description**: Have 3 characters at level 10+
- **Type**: leveling
- **Requirement**: 3
- **Tracked By**: `charsLevel10Plus` (calculated count)
- **Reward**: 💰 800 coins, 💎 25 gems, 🔷 2 shards

#### Quest 56: Team Builder II
- **Description**: Have 5 characters at level 10+
- **Type**: leveling
- **Requirement**: 5
- **Tracked By**: `charsLevel10Plus`
- **Reward**: 💰 1500 coins, 💎 45 gems, 🔷 4 shards

#### Quest 57: Elite Team
- **Description**: Have 3 characters at level 20+
- **Type**: leveling
- **Requirement**: 3
- **Tracked By**: `charsLevel20Plus` (calculated count)
- **Reward**: 💰 2500 coins, 💎 75 gems, 🔷 6 shards

---

### Crate Quests (25-29, 54, 64)

#### Quest 25: First Crate
- **Description**: Open your first crate
- **Type**: crates
- **Requirement**: 1
- **Tracked By**: `cratesOpened`
- **Reward**: 💰 100 coins, 💎 5 gems

#### Quest 26: Crate Opener I
- **Description**: Open 5 crates
- **Type**: crates
- **Requirement**: 5
- **Tracked By**: `cratesOpened`
- **Reward**: 💰 300 coins, 💎 12 gems

#### Quest 27: Crate Opener II
- **Description**: Open 10 crates
- **Type**: crates
- **Requirement**: 10
- **Tracked By**: `cratesOpened`
- **Reward**: 💰 600 coins, 💎 20 gems, 🔷 1 shard

#### Quest 28: Crate Enthusiast
- **Description**: Open 25 crates
- **Type**: crates
- **Requirement**: 25
- **Tracked By**: `cratesOpened`
- **Reward**: 💰 1200 coins, 💎 40 gems, 🔷 3 shards

#### Quest 29: Crate Master
- **Description**: Open 50 crates
- **Type**: crates
- **Requirement**: 50
- **Tracked By**: `cratesOpened`
- **Reward**: 💰 2500 coins, 💎 80 gems, 🔷 6 shards

#### Quest 54: Tyrant Crate Owner
- **Description**: Open a Tyrant Crate
- **Type**: crates
- **Requirement**: 1
- **Tracked By**: `tyrantCratesOpened`
- **Reward**: 💰 500 coins, 💎 20 gems, 🔷 2 shards
- **Note**: Requires opening specifically a Tyrant crate

#### Quest 64: Lucky Streak
- **Description**: Get a character from a crate 3 times
- **Type**: crates
- **Requirement**: 3
- **Tracked By**: `charsFromCrates`
- **Reward**: 💰 1500 coins, 💎 45 gems, 🔷 4 shards
- **Note**: Only character pulls count, not duplicates

---

### Trading Quests (30-33)

#### Quest 30: First Trade
- **Description**: Complete your first trade
- **Type**: trading
- **Requirement**: 1
- **Tracked By**: `tradesCompleted`
- **Reward**: 💰 150 coins, 💎 6 gems
- **How to Complete**: Successfully complete a trade using `!trade`

#### Quest 31: Merchant I
- **Description**: Complete 5 trades
- **Type**: trading
- **Requirement**: 5
- **Tracked By**: `tradesCompleted`
- **Reward**: 💰 400 coins, 💎 15 gems

#### Quest 32: Merchant II
- **Description**: Complete 10 trades
- **Type**: trading
- **Requirement**: 10
- **Tracked By**: `tradesCompleted`
- **Reward**: 💰 750 coins, 💎 25 gems, 🔷 2 shards

#### Quest 33: Trade Expert
- **Description**: Complete 25 trades
- **Type**: trading
- **Requirement**: 25
- **Tracked By**: `tradesCompleted`
- **Reward**: 💰 1500 coins, 💎 50 gems, 🔷 4 shards

---

### Currency Quests (34-41)

#### Quest 34: Coin Saver I
- **Description**: Accumulate 1000 coins
- **Type**: currency
- **Requirement**: 1000
- **Tracked By**: `coins` (current balance)
- **Reward**: 💎 10 gems

#### Quest 35: Coin Saver II
- **Description**: Accumulate 5000 coins
- **Type**: currency
- **Requirement**: 5000
- **Tracked By**: `coins`
- **Reward**: 💎 25 gems, 🔷 1 shard

#### Quest 36: Coin Hoarder
- **Description**: Accumulate 10000 coins
- **Type**: currency
- **Requirement**: 10000
- **Tracked By**: `coins`
- **Reward**: 💎 50 gems, 🔷 3 shards

#### Quest 37: Coin Tycoon
- **Description**: Accumulate 25000 coins
- **Type**: currency
- **Requirement**: 25000
- **Tracked By**: `coins`
- **Reward**: 💎 100 gems, 🔷 6 shards

#### Quest 38: Gem Collector I
- **Description**: Accumulate 100 gems
- **Type**: currency
- **Requirement**: 100
- **Tracked By**: `gems` (current balance)
- **Reward**: 💰 500 coins

#### Quest 39: Gem Collector II
- **Description**: Accumulate 250 gems
- **Type**: currency
- **Requirement**: 250
- **Tracked By**: `gems`
- **Reward**: 💰 1200 coins, 🔷 1 shard

#### Quest 40: Gem Enthusiast
- **Description**: Accumulate 500 gems
- **Type**: currency
- **Requirement**: 500
- **Tracked By**: `gems`
- **Reward**: 💰 2500 coins, 🔷 3 shards

#### Quest 41: Gem Master
- **Description**: Accumulate 1000 gems
- **Type**: currency
- **Requirement**: 1000
- **Tracked By**: `gems`
- **Reward**: 💰 5000 coins, 🔷 6 shards

---

### Shard Quests (43-46)

#### Quest 43: Shard Seeker I
- **Description**: Collect 5 shards
- **Type**: shards
- **Requirement**: 5
- **Tracked By**: `shards` (current balance)
- **Reward**: 💰 500 coins, 💎 15 gems

#### Quest 44: Shard Seeker II
- **Description**: Collect 10 shards
- **Type**: shards
- **Requirement**: 10
- **Tracked By**: `shards`
- **Reward**: 💰 1000 coins, 💎 30 gems

#### Quest 45: Shard Collector
- **Description**: Collect 25 shards
- **Type**: shards
- **Requirement**: 25
- **Tracked By**: `shards`
- **Reward**: 💰 2500 coins, 💎 60 gems

#### Quest 46: Shard Master
- **Description**: Collect 50 shards
- **Type**: shards
- **Requirement**: 50
- **Tracked By**: `shards`
- **Reward**: 💰 5000 coins, 💎 125 gems

---

### ST Booster Quests (47-49)

#### Quest 47: First Boost
- **Description**: Use your first ST Booster
- **Type**: boosting
- **Requirement**: 1
- **Tracked By**: `boostsUsed`
- **Reward**: 💰 500 coins, 💎 20 gems
- **How to Complete**: Use `!boost <character>` command

#### Quest 48: Booster Enthusiast
- **Description**: Use 5 ST Boosters
- **Type**: boosting
- **Requirement**: 5
- **Tracked By**: `boostsUsed`
- **Reward**: 💰 1500 coins, 💎 50 gems, 🔷 2 shards

#### Quest 49: Booster Master
- **Description**: Use 10 ST Boosters
- **Type**: boosting
- **Requirement**: 10
- **Tracked By**: `boostsUsed`
- **Reward**: 💰 3000 coins, 💎 100 gems, 🔷 5 shards

---

### Special Quests (42, 50-53, 60-63, 65)

#### Quest 42: Perfectionist
- **Description**: Own a character with 100% ST
- **Type**: special
- **Requirement**: 1
- **Tracked By**: `perfectST` (calculated: 1 if any character has ST ≥ 100)
- **Reward**: 💰 2000 coins, 💎 50 gems, 🔷 5 shards
- **Note**: Extremely rare, requires luck or many ST boosters

#### Quest 50: Win Streak I
- **Description**: Win 3 battles in a row
- **Type**: special
- **Requirement**: 3
- **Tracked By**: `winStreak` (currentWinStreak)
- **Reward**: 💰 400 coins, 💎 15 gems, 🔷 1 shard
- **Note**: Any loss resets streak to 0

#### Quest 51: Win Streak II
- **Description**: Win 5 battles in a row
- **Type**: special
- **Requirement**: 5
- **Tracked By**: `winStreak`
- **Reward**: 💰 800 coins, 💎 30 gems, 🔷 3 shards

#### Quest 52: Win Streak III
- **Description**: Win 10 battles in a row
- **Type**: special
- **Requirement**: 10
- **Tracked By**: `winStreak`
- **Reward**: 💰 2000 coins, 💎 60 gems, 🔷 6 shards
- **Note**: Very challenging!

#### Quest 53: Character Releaser
- **Description**: Release a character
- **Type**: special
- **Requirement**: 1
- **Tracked By**: `charsReleased`
- **Reward**: 💰 300 coins, 💎 10 gems
- **How to Complete**: Use `!release <character>` (level 10+ required)

#### Quest 60: Token Hoarder I
- **Description**: Accumulate 500 total tokens across all characters
- **Type**: special
- **Requirement**: 500
- **Tracked By**: `totalTokens` (calculated sum)
- **Reward**: 💰 800 coins, 💎 25 gems, 🔷 2 shards

#### Quest 61: Token Hoarder II
- **Description**: Accumulate 1000 total tokens across all characters
- **Type**: special
- **Requirement**: 1000
- **Tracked By**: `totalTokens`
- **Reward**: 💰 1800 coins, 💎 50 gems, 🔷 4 shards

#### Quest 62: Token Master
- **Description**: Accumulate 2500 total tokens across all characters
- **Type**: special
- **Requirement**: 2500
- **Tracked By**: `totalTokens`
- **Reward**: 💰 4000 coins, 💎 100 gems, 🔷 8 shards

#### Quest 63: High Roller
- **Description**: Own a character with 90%+ ST
- **Type**: special
- **Requirement**: 1
- **Tracked By**: `highSTChar` (calculated: 1 if any character has ST ≥ 90)
- **Reward**: 💰 1200 coins, 💎 35 gems, 🔷 3 shards

#### Quest 65: Ultimate Champion
- **Description**: Win a battle with a character at level 30+
- **Type**: special
- **Requirement**: 1
- **Tracked By**: `highLevelWin`
- **Reward**: 💰 3000 coins, 💎 80 gems, 🔷 8 shards
- **How to Complete**: Win a battle with any character that's level 30 or higher

---

## Quest Tracking Implementation

### Automatic Tracking Locations

#### dropsCaught
**Location**: `index.js` (drop system)
```javascript
// When user reacts to drop
user.questProgress.dropsCaught = (user.questProgress.dropsCaught || 0) + 1;
```

#### battlesWon
**Location**: `battleSystem.js` (endBattle function)
```javascript
// When battle ends with winner
data.users[winner].questProgress.battlesWon = (data.users[winner].questProgress.battlesWon || 0) + 1;
```

#### totalBattles
**Location**: `battleSystem.js` (endBattle function)
```javascript
// For BOTH winner and loser
data.users[winner].questProgress.totalBattles = (data.users[winner].questProgress.totalBattles || 0) + 1;
data.users[loser].questProgress.totalBattles = (data.users[loser].questProgress.totalBattles || 0) + 1;
```

#### currentWinStreak & maxWinStreak
**Location**: `battleSystem.js` (endBattle function)
```javascript
// Winner: increment streak
data.users[winner].questProgress.currentWinStreak = (data.users[winner].questProgress.currentWinStreak || 0) + 1;
data.users[winner].questProgress.maxWinStreak = Math.max(
  data.users[winner].questProgress.maxWinStreak || 0,
  data.users[winner].questProgress.currentWinStreak
);

// Loser: reset streak
data.users[loser].questProgress.currentWinStreak = 0;
```

#### highLevelWin
**Location**: `battleSystem.js` (endBattle function)
```javascript
// Check winner's character level
const winnerChar = winner === battle.player1 ? battle.player1Character : battle.player2Character;
if (winnerChar.level >= 30) {
  data.users[winner].questProgress.highLevelWin = 1;
}
```

#### cratesOpened
**Location**: `crateSystem.js` (openCrate function)
```javascript
// Every crate opened
user.questProgress.cratesOpened = (user.questProgress.cratesOpened || 0) + 1;
```

#### tyrantCratesOpened
**Location**: `crateSystem.js` (openCrate function)
```javascript
// Only when opening tyrant crate
if (crateType === 'tyrant') {
  user.questProgress.tyrantCratesOpened = (user.questProgress.tyrantCratesOpened || 0) + 1;
}
```

#### charsFromCrates
**Location**: `crateSystem.js` (openCrate function)
```javascript
// When character is pulled from crate
user.questProgress.charsFromCrates = (user.questProgress.charsFromCrates || 0) + 1;
```

#### tradesCompleted
**Location**: `tradeSystem.js` (completeTrade function)
```javascript
// For BOTH players in successful trade
initiatorData.questProgress.tradesCompleted = (initiatorData.questProgress.tradesCompleted || 0) + 1;
receiverData.questProgress.tradesCompleted = (receiverData.questProgress.tradesCompleted || 0) + 1;
```

#### boostsUsed
**Location**: `stBoosterSystem.js` (useBooster function)
```javascript
// When ST booster is used
userData.questProgress.boostsUsed = (userData.questProgress.boostsUsed || 0) + 1;
```

#### charsReleased
**Location**: `index.js` (release command)
```javascript
// When character is released
data.users[userId].questProgress.charsReleased = (data.users[userId].questProgress.charsReleased || 0) + 1;
```

---

## Quest Claiming

### Claim Process
1. User views quests with `!quests`
2. User checks specific quest with `!quest <id>`
3. If quest shows "🎁 READY!", use `!claim <id>`
4. Rewards are added immediately to user account
5. Quest marked as completed in `completedQuests` array

### Claim Validation
- Quest must exist (ID 1-65)
- Quest must not be already claimed
- Quest progress must meet requirement
- Rewards calculated based on quest definition

### Reward Distribution
```javascript
// Coins
userData.coins = (userData.coins || 0) + quest.reward.coins;

// Gems
userData.gems = (userData.gems || 0) + quest.reward.gems;

// Shards
userData.shards = (userData.shards || 0) + quest.reward.shards;

// Mark as completed
userData.completedQuests.push(quest.id);
```

---

## Quest Progress Calculation

### Function: getQuestProgress(userData, quest)
Located in `questSystem.js`, this function calculates current progress for any quest.

#### Examples:

**For dropsCaught:**
```javascript
current = userData.questProgress.dropsCaught || 0;
```

**For uniqueChars:**
```javascript
current = userData.characters ? Object.keys(userData.characters).length : 0;
```

**For maxLevel:**
```javascript
current = Math.max(0, ...Object.values(userData.characters).map(c => c.level || 1));
```

**For perfectST:**
```javascript
current = Object.values(userData.characters).some(c => c.st >= 100) ? 1 : 0;
```

**For charsLevel10Plus:**
```javascript
current = Object.values(userData.characters).filter(c => (c.level || 1) >= 10).length;
```

---

## Data Persistence

### MongoDB Storage
All quest progress is saved to MongoDB in the user document:
- `questProgress` object with all tracking fields
- `completedQuests` array with claimed quest IDs
- Batch saving (2-second delay) for performance
- Automatic backfilling ensures fields exist

### JSON Storage (Fallback)
If MongoDB is not configured:
- Saved to `data.json` file
- Immediate write on important actions
- All quest data persists across restarts

---

## Quest Tips

### Early Game Quests
1. First Steps (Quest 1) - Instant
2. First Battle (Quest 7) - Challenge a friend
3. First Crate (Quest 25) - Open bronze crate
4. Catch First Drop (Quest 2) - React to drop

### Easy Progressive Quests
- Collection quests progress automatically as you get characters
- Currency quests progress as you accumulate resources
- Level quests track your highest character

### Challenging Quests
- Win Streak III (Quest 52) - 10 wins in a row
- Complete Collection (Quest 18) - All 51 characters
- Perfectionist (Quest 42) - 100% ST character
- Legendary Trainer (Quest 24) - Level 50 character

### Quest Synergy
Many actions progress multiple quests:
- Opening crates: Crate quests + possible character quests
- Battles: Win quests + total battle quests + streak quests
- Collecting characters: Collection quests + token quests

---

## Summary

- **65 total quests** covering all game activities
- **Automatic tracking** - no manual input needed
- **Persistent progress** - saved to database continuously
- **Generous rewards** - coins, gems, and shards
- **Progressive difficulty** - from starter to ultimate challenges
- **Full implementation** - all tracking systems active and working

For command usage, see COMMANDS.md. For game mechanics, see GAME_MECHANICS.md.
