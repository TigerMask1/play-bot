# Discord Bot Commands Documentation

This document provides comprehensive information about all available commands in the Discord bot.

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Profile & Characters](#profile--characters)
3. [Crates & Shop](#crates--shop)
4. [Battle System](#battle-system)
5. [Trading System](#trading-system)
6. [Quest System](#quest-system)
7. [ST Booster System](#st-booster-system)
8. [Mail System](#mail-system)
9. [News & Leaderboard](#news--leaderboard)
10. [Daily Rewards](#daily-rewards)
11. [Events](#events)
12. [Skins](#skins)
13. [Admin Commands](#admin-commands)
14. [Utility Commands](#utility-commands)

---

## Getting Started

### `!start`
**Description:** Start your journey and receive your first character!  
**Usage:** `!start`  
**Details:** 
- Creates your player account if you don't have one
- Grants you one of three starter characters: Bruce 🦍, Buck 🐂, or Nix 🦊
- Gives you starting resources: 200 coins and 5 gems
- Automatically selects your starter as your active character
- Sets your starting trophies to 200

**Example:**
```
!start
```

---

### `!select <character name>`
**Description:** Choose which character you want to be active  
**Usage:** `!select <character name>`  
**Details:**
- Sets the specified character as your active/selected character
- You must own the character to select them
- This character will be shown in your profile and used in battles
- Character names are case-insensitive

**Example:**
```
!select bruce
!select Nix
```

---

## Profile & Characters

### `!profile [page]`
**Aliases:** None  
**Description:** View your detailed profile including stats, characters, and resources  
**Usage:** `!profile` or `!profile <page number>`  
**Details:**
- **Page 1** displays:
  - Username and selected character
  - Trophies, Level, Coins, Gems, Shards
  - Total battles won, bronze/silver crates owned
  - Number of unique characters owned
  - Daily reward status
- **Page 2** displays:
  - All your characters with their levels and ST values
  - Pagination available if you have many characters
- Use the navigation buttons (⬅️ ➡️) to switch between pages

**Example:**
```
!profile
!profile 2
```

---

### `!char <character name>`
**Aliases:** `!character`  
**Description:** View detailed information about a specific character you own  
**Usage:** `!char <character name>`  
**Details:**
Shows comprehensive character information:
- Character emoji and name
- Current level
- ST (Strength) percentage
- Tokens progress toward next level
- Coins required for next level
- Progress bar showing token accumulation
- Current equipped skin
- All owned skins for the character

**Example:**
```
!char bruce
!character Nix
```

---

### `!i <character name>`
**Aliases:** `!info`  
**Description:** View battle-specific information for a character  
**Usage:** `!i <character name>`  
**Details:**
Displays battle stats including:
- Base HP (health points)
- All moves the character can use
- Move types (Attack, Special, Heal)
- Energy costs for each move
- Character's unique passive ability
- Ability description and effects

**Example:**
```
!i bruce
!info Nix
```

---

### `!levelup <character name>`
**Description:** Level up a character using tokens and coins  
**Usage:** `!levelup <character name>`  
**Details:**
- Requires both sufficient tokens AND coins
- Token requirements increase with each level
- Coin requirements increase with each level
- Leveling increases character's base HP
- Higher level characters are stronger in battles
- Can be used for quest progress (max level quests)

**Level Requirements (examples):**
- Level 1→2: 50 tokens, 100 coins
- Level 2→3: 75 tokens, 150 coins  
- Level 5→6: 175 tokens, 350 coins
- Level 10→11: 400 tokens, 800 coins

**Example:**
```
!levelup bruce
!levelup Nix
```

---

### `!release <character name>`
**Aliases:** `!leave`  
**Description:** Release a character permanently  
**Usage:** `!release <character name>`  
**Details:**
- Character must be at least level 10 to release
- **PERMANENT ACTION** - character is removed forever
- If releasing your selected character, your selection changes to another character
- Counts toward quest progress (charsReleased)
- Use with caution!

**Example:**
```
!release bruce
!leave Nix
```

---

## Crates & Shop

### `!crate`
**Description:** View your crate inventory  
**Usage:** `!crate`  
**Details:**
Shows how many of each crate type you own:
- 🟫 Bronze Crates (free to open, 2% character chance)
- ⚪ Silver Crates (free to open, 100% character chance)
- 🟡 Gold Crates (100 gems, better rewards)
- 🟢 Emerald Crates (250 gems, great rewards)
- 🟣 Legendary Crates (500 gems, excellent rewards)
- 🔴 Tyrant Crates (750 gems, best rewards)

---

### `!opencrate <crate type>`
**Description:** Open a crate to get rewards  
**Usage:** `!opencrate <bronze|silver|gold|emerald|legendary|tyrant>`  
**Details:**
**All crates give:**
- Coins (amount varies by crate tier)
- Character tokens (distributed to random owned character)
- Chance to get a new character

**Crate Details:**
- **Bronze** 🟫: Free, 100 coins, 15 tokens, 2% character chance
- **Silver** ⚪: Free, 250 coins, 30 tokens, 100% character chance  
- **Gold** 🟡: 100 gems, 500 coins, 50 tokens, increased character chance
- **Emerald** 🟢: 250 gems, 1800 coins, 130 tokens, high character chance
- **Legendary** 🟣: 500 gems, 2500 coins, 200 tokens, very high character chance
- **Tyrant** 🔴: 750 gems, 3500 coins, 300 tokens, highest character chance

**Quest Tracking:**
- Opening any crate increments `cratesOpened`
- Opening Tyrant crates increments `tyrantCratesOpened`
- Getting a character from a crate increments `charsFromCrates`

**Example:**
```
!opencrate bronze
!opencrate silver
!opencrate tyrant
```

---

### `!shop`
**Description:** Browse and purchase items from the shop  
**Usage:** `!shop`  
**Details:**
Interactive shop interface showing:
- **Crates** - Purchase gold, emerald, legendary, or tyrant crates with gems
- **ST Boosters** - Craft boosters using shards
- Prices and requirements for each item
- Use buttons to navigate and make purchases

---

## Battle System

### `!battle <@user>` or `!b <@user>`
**Aliases:** `!b`  
**Description:** Challenge another player to a turn-based battle  
**Usage:** `!battle @username` or `!b @username`  
**Details:**

**Battle Invitation:**
- Sends a battle invitation to the mentioned user
- Opponent has 60 seconds to accept or decline
- Both players must have characters

**Battle Mechanics:**
- Turn-based combat system
- Each player starts with 50 energy
- Gain 10 energy per turn (max 100)
- Choose from 4 moves each turn:
  - Attack moves (deal damage)
  - Special moves (powerful, high energy cost)
  - Heal moves (restore HP)
  - Items (use consumable items)

**Victory Conditions:**
- Reduce opponent's HP to 0
- Opponent flees the battle
- Opponent times out (no action taken)

**Rewards & Penalties:**
- Winner: +5 trophies
- Loser: -7 trophies
- Trophy range: 0-9999

**Quest Tracking:**
- Both players: `totalBattles` +1
- Winner: `battlesWon` +1, `currentWinStreak` +1
- Loser: `currentWinStreak` reset to 0
- If winner's character is level 30+: `highLevelWin` = 1

**Example:**
```
!battle @PlayerName
!b @Friend
```

---

## Trading System

### `!trade <@user>` or `!t <@user>`
**Aliases:** `!t`  
**Description:** Initiate a trade with another player  
**Usage:** `!trade @username`  
**Details:**

**Trade Process:**
1. Send trade invitation
2. Both players use `!offer coins <amount>` or `!offer gems <amount>`
3. Both players use `!confirm` when ready
4. Trade completes automatically

**Trade Commands:**
- `!offer coins <amount>` - Add coins to your offer
- `!offer gems <amount>` - Add gems to your offer
- `!confirm` - Confirm your current offer
- `!cancel` - Cancel the trade

**Trade expires in 60 seconds if not completed**

**Quest Tracking:**
- Successful trades increment `tradesCompleted` for BOTH players

**Example:**
```
!trade @PlayerName
!offer coins 500
!offer gems 20
!confirm
```

---

## Quest System

### `!quests [page]`
**Description:** View all available quests  
**Usage:** `!quests` or `!quests <page number>`  
**Details:**
- Shows quests you haven't completed yet
- Displays progress toward each quest
- Shows quest rewards (coins, gems, shards)
- Indicates which quests are ready to claim (🎁 READY!)
- Pagination: 5 quests per page
- Shows completed quest count: X/65 total quests

---

### `!quest <quest id>`
**Description:** View detailed information about a specific quest  
**Usage:** `!quest <id>`  
**Details:**
- Shows quest name and description
- Displays your current progress
- Shows rewards for completion
- Indicates if quest is ready to claim
- Quest IDs range from 1-65

**Example:**
```
!quest 1
!quest 25
```

---

### `!claim <quest id>`
**Description:** Claim rewards for a completed quest  
**Usage:** `!claim <id>`  
**Details:**
- Quest must be fully completed
- Cannot claim already-claimed quests
- Rewards are added immediately:
  - Coins added to your balance
  - Gems added to your balance
  - Shards added to your balance
- Quest marked as completed permanently

**Example:**
```
!claim 1
!claim 25
```

---

## ST Booster System

### `!shards`
**Description:** Check how many shards you have  
**Usage:** `!shards`  
**Details:**
- Shows your current shard count
- Shards are used to craft ST Boosters
- Shards obtained from quest rewards and crates

---

### `!craft`
**Description:** Craft an ST Booster using shards  
**Usage:** `!craft`  
**Details:**
- Costs 5 shards to craft one booster
- ST Boosters can reroll a character's ST value
- Boosters are stored in your inventory
- Shows confirmation of crafting

---

### `!boost <character name>`
**Description:** Use an ST Booster on a character to reroll their ST  
**Usage:** `!boost <character name>`  
**Details:**
- Requires at least 1 ST Booster in inventory
- Consumes one booster
- Rerolls character's ST to a new random value (0-100%)
- New ST could be higher OR lower
- Also recalculates character's base HP
- Character's moves are reassigned based on new ST

**Quest Tracking:**
- Using a booster increments `boostsUsed`

**Example:**
```
!boost bruce
!boost Nix
```

---

## Mail System

### `!mail` or `!mailbox [page]`
**Aliases:** `!mailbox`  
**Description:** View your mailbox and unclaimed messages  
**Usage:** `!mail` or `!mail <page>`  
**Details:**
- Shows all mail messages (claimed and unclaimed)
- Displays sender, message content, and rewards
- Shows timestamp for each message
- Indicates unclaimed mail count
- Pagination: 5 messages per page

---

### `!claimmail <mail id>`
**Description:** Claim rewards from a mail message  
**Usage:** `!claimmail <id>`  
**Details:**
- Claims the specified mail message
- Rewards are added to your account:
  - Coins
  - Gems
  - Shards  
  - Crates (bronze, silver, gold, etc.)
- Mail marked as claimed
- Cannot claim already-claimed mail

**Example:**
```
!claimmail 1
!claimmail 3
```

---

### `!sendmail <@user> | <message>` (Admin Only)
**Description:** Send mail to a specific user  
**Usage:** `!sendmail @user | message content`  
**Details:**
- Admin command only
- Sends a custom message to specified user
- Can include rewards
- User receives notification of new mail

**Example:**
```
!sendmail @Player | Here's a reward for participating!
```

---

## News & Leaderboard

### `!news`
**Description:** View the latest bot news and announcements  
**Usage:** `!news`  
**Details:**
- Shows recent news posts from admins
- Displays title, content, and timestamp
- Limited to recent announcements

---

### `!postnews <title> | <content>` (Admin Only)
**Description:** Post a news announcement  
**Usage:** `!postnews <title> | <content>`  
**Details:**
- Admin command only
- Creates a new news post visible to all users
- Separate title and content with " | "

**Example:**
```
!postnews New Features! | Quests and ST Boosters are now available!
```

---

### `!leaderboard [type]` or `!lb [type]`
**Aliases:** `!lb`  
**Description:** View various leaderboards  
**Usage:** `!leaderboard` or `!lb <coins|gems|battles|collectors|trophies>`  
**Details:**

**Leaderboard Types:**
- **coins** - Top players by coin count
- **gems** - Top players by gem count
- **battles** - Top players by battles won
- **collectors** - Top players by unique characters owned
- **trophies** (default) - Top players by trophy count

Shows top 10 players in each category with their stats

**Example:**
```
!leaderboard
!lb coins
!lb battles
```

---

## Daily Rewards

### `!daily`
**Description:** Claim your daily rewards  
**Usage:** `!daily`  
**Details:**
- Can be claimed once every 24 hours
- Rewards include:
  - Coins
  - Gems
  - Crates (random tier)
- Shows countdown until next daily reward available
- Streak bonuses may apply (if implemented)

**Example:**
```
!daily
```

---

## Events

### `!event`
**Description:** View current active event and your progress  
**Usage:** `!event`  
**Details:**
- Shows current event details:
  - Event name and description
  - Start and end times
  - Your current score/progress
  - Your rank in the event
  - Top participants
- Events may have different objectives (battles, crate opening, drop catching)
- **✅ Rewards are automatically added to your account when events end - no claiming needed!**
- Top 3 and Top 5% receive gems, coins, and cage keys
- Check your mailbox for reward notifications

---

### `!setevent` (Admin Only)
**Description:** Configure event settings  
**Usage:** `!setevent`  
**Details:**
- Admin command only
- Sets the event announcement channel
- Used for event notifications

---

## Skins

### `!equipskin <character name> | <skin name>`
**Description:** Equip a skin on one of your characters  
**Usage:** `!equipskin <character> | <skin>`  
**Details:**
- Character must own the skin
- Changes character's appearance in displays
- Skins are cosmetic only (no stat changes)
- Use "default" as skin name to revert to original

**Example:**
```
!equipskin bruce | summer
!equipskin Nix | default
```

---

### `!addskin <character name> | <skin name>` (Admin Only)
**Description:** Add a new skin to the system  
**Usage:** `!addskin <character> | <skin name>`  
**Details:**
- Admin command only
- Creates a new skin for a character
- Makes skin available for granting to players

**Example:**
```
!addskin bruce | winter
```

---

### `!grantskin <@user> | <character> | <skin>` (Admin Only)
**Description:** Grant a skin to a player  
**Usage:** `!grantskin @user | <character> | <skin>`  
**Details:**
- Admin command only
- Adds the specified skin to player's collection
- Player can then equip the skin

**Example:**
```
!grantskin @Player | bruce | winter
```

---

### `!revokeskin <@user> | <character> | <skin>` (Admin Only)
**Description:** Remove a skin from a player  
**Usage:** `!revokeskin @user | <character> | <skin>`  
**Details:**
- Admin command only
- Removes the specified skin from player's collection
- Cannot revoke default skins
- If skin was equipped, reverts to default

**Example:**
```
!revokeskin @Player | bruce | winter
```

---

## Admin Commands

### `!grant <@user> <coins|gems|shards|crates> <amount>`
**Description:** Grant resources to a player  
**Usage:** `!grant @user <resource> <amount>`  
**Details:**
- Admin command only (requires Administrator permission)
- Can grant:
  - coins
  - gems
  - shards
  - bronze/silver/gold/emerald/legendary/tyrant crates

**Example:**
```
!grant @Player coins 1000
!grant @Player gems 50
!grant @Player bronzecrates 10
```

---

### `!grantchar <@user> <character name>`
**Description:** Grant a character to a player  
**Usage:** `!grantchar @user <character name>`  
**Details:**
- Admin command only
- Adds specified character to player's collection
- Character gets random ST value
- Starts at level 1

**Example:**
```
!grantchar @Player bruce
!grantchar @Player Nix
```

---

### `!setdrop`
**Description:** Set the current channel as the drop channel  
**Usage:** `!setdrop`  
**Details:**
- Admin command only
- Drops will appear in this channel
- Only one drop channel can be active

---

### `!startdrops`
**Description:** Start the automatic drop system  
**Usage:** `!startdrops`  
**Details:**
- Admin command only
- Requires drop channel to be set first
- Drops appear every 20 seconds
- Players catch drops by reacting quickly

---

### `!stopdrops`
**Description:** Stop the automatic drop system  
**Usage:** `!stopdrops`  
**Details:**
- Admin command only
- Stops all automatic drops

---

### `!setbattle`
**Description:** Set the current channel as the battle channel  
**Usage:** `!setbattle`  
**Details:**
- Admin command only
- Battles will take place in this channel
- Helps organize server channels

---

### `!settrophies <@user> <amount>`
**Description:** Set a player's trophy count  
**Usage:** `!settrophies @user <amount>`  
**Details:**
- Admin command only
- Sets player's trophies to exact amount
- Range: 0-9999

**Example:**
```
!settrophies @Player 500
```

---

### `!reset` (Admin Only)
**Description:** Reset all bot data  
**Usage:** `!reset`  
**Details:**
- Admin command only
- **EXTREMELY DANGEROUS**
- Deletes ALL user data permanently
- Requires confirmation
- Cannot be undone

---

## Utility Commands

### `!c <id>`
**Description:** Quick character lookup by ID  
**Usage:** `!c <number>`  
**Details:**
- View character by their position in your collection
- Faster than typing full character name
- Shows same info as `!char` command

**Example:**
```
!c 1
!c 5
```

---

### `!botinfo`
**Description:** View bot statistics and information  
**Usage:** `!botinfo`  
**Details:**
Shows:
- Total number of servers
- Total number of users
- Bot uptime
- Total characters available
- Total quests
- Feature highlights

---

### `!help`
**Description:** Display help information and command list  
**Usage:** `!help`  
**Details:**
Shows categorized list of all commands:
- Getting Started
- Profile & Characters
- Battle System
- Trading
- Crates & Shop
- Quests
- ST Boosters
- Mail
- News & Leaderboard
- Daily Rewards
- Events
- Skins
- Admin Commands

---

## Command Prefix

**All commands use the `!` prefix**

Examples:
- `!start`
- `!profile`
- `!battle @user`

---

## Notes

- Character names are **case-insensitive**
- Most commands have shortened aliases for convenience
- Admin commands require **Administrator** permission in Discord
- Some commands use buttons for interactive navigation
- Quest progress is automatically tracked across all game activities
- All data is saved to MongoDB if configured (USE_MONGODB=true)

---

## Support

If you encounter issues or have questions about commands, use `!help` or contact a server administrator.
