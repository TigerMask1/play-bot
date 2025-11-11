# Complete Discord Bot Commands Reference

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [User Commands](#user-commands)
- [Admin Commands](#admin-commands)
- [Personalized Task System](#personalized-task-system)
- [Testing Guide](#testing-guide)

---

## 🎮 Getting Started

### !start
**Permission:** Everyone  
**Description:** Begin your journey! Shows available starter characters.

**Usage:**
```
!start
```

**Response:** Displays 3 starter options:
- 🦊 Nix (fox)
- 🦍 Bruce (gorilla)
- 🐂 Buck (bull)

---

### !select <character>
**Permission:** Everyone (one-time only)  
**Description:** Choose your starter character and begin playing.

**Usage:**
```
!select nix
!select bruce
!select buck
```

**What You Get:**
- Your chosen character with random ST%
- 💰 100 coins
- 💎 10 gems
- Any pending tokens you had

**Note:** This triggers invite task completion for whoever invited you!

---

## 👤 User Commands

### !profile [@user] [page]
**Permission:** Everyone  
**Description:** View your or someone else's profile with characters, stats, and resources.

**Usage:**
```
!profile                  # Your profile
!profile @username        # Someone else's profile
!profile 2                # Page 2 of your characters
!profile @username 2      # Page 2 of their characters
```

**Shows:**
- Coins, gems, trophies
- Total characters (X/51)
- Message count
- Character list with levels, ST%, tokens, and progress bars
- Pending tokens (if any)
- Current skin (with thumbnail)

---

### !char <character name>
**Alias:** !character  
**Permission:** Everyone  
**Description:** View detailed information about one of your characters.

**Usage:**
```
!char nix
!character Bruce
```

**Shows:**
- Character image (current skin)
- Level and ST%
- Tokens (current/required for next level)
- Next level cost (tokens + coins)
- Progress bar
- Current skin
- List of owned skins

---

### !levelup <character name>
**Permission:** Everyone  
**Description:** Level up a character if you have enough tokens and coins.

**Usage:**
```
!levelup nix
!levelup Bruce
```

**Requirements:**
- Enough character tokens
- Enough coins
- Costs increase with each level

**Effect:**
- Character level +1
- Spends required tokens and coins
- Tracks progress for personalized tasks

---

### !release <character name>
**Alias:** !leave  
**Permission:** Everyone  
**Description:** Permanently release a character (must be level 10+).

**Usage:**
```
!release nix
!leave Bruce
```

**Requirements:**
- Character must be level 10 or higher
- Irreversible action

**Effect:**
- Character permanently removed
- If it was selected character, auto-selects another
- Quest progress tracking updated

---

## 📦 Crate Commands

### !crate [type]
**Permission:** Everyone  
**Description:** View available crates or buy premium crates.

**Usage:**
```
!crate                    # View all crates and your inventory
!crate gold               # Buy gold crate
!crate emerald            # Buy emerald crate
!crate legendary          # Buy legendary crate
!crate tyrant             # Buy tyrant crate
```

**Crate Types & Costs:**

**Free Crates** (from message rewards):
- 🟫 Bronze (every 25 messages - 60% chance)
- ⚪ Silver (every 25 messages - 25% chance)

**Premium Crates** (buy with gems):
- 🥇 **Gold**: 💎 100 gems → 1.5% character, 50 tokens, 500 coins
- 🟢 **Emerald**: 💎 250 gems → 5% character, 130 tokens, 1,800 coins
- 🔥 **Legendary**: 💎 500 gems → 10% character, 200 tokens, 2,500 coins
- 👑 **Tyrant**: 💎 750 gems → 15% character, 300 tokens, 3,500 coins

---

### !opencrate <type>
**Permission:** Everyone  
**Description:** Open a crate you own.

**Usage:**
```
!opencrate bronze
!opencrate silver
!opencrate gold
!opencrate emerald
!opencrate legendary
!opencrate tyrant
```

**Possible Rewards:**
- Random character tokens
- Coins
- Small chance for a new character
- Higher tier = better rewards & character chance

**Effect:**
- Tracks progress for personalized tasks
- Quest progress updated

---

## ⚔️ Battle & Trading

### !b [character name]
**Alias:** !battle  
**Permission:** Everyone  
**Description:** Battle against AI or another player.

**Usage:**
```
!b                        # Battle AI with selected character
!b nix                    # Battle AI with specific character
!battle @user             # Battle another user
!battle @user nix         # Battle user with specific character
```

**Effect:**
- Win: Gain trophies, coins, tokens
- Lose: Lose trophies
- Tracks progress for personalized tasks
- Event progress tracking

---

### !t [@user]
**Alias:** !trade  
**Permission:** Everyone  
**Description:** Trade resources with another player.

**Usage:**
```
!t @username
!trade @username
```

**Can Trade:**
- Coins
- Gems
- Character tokens

**Effect:**
- Interactive trading interface
- Both players must accept
- Tracks progress for personalized tasks

---

## 🎯 Quests & Rewards

### !quests
**Permission:** Everyone  
**Description:** View all available quests and their progress.

**Usage:**
```
!quests
```

**Shows:**
- All quest objectives
- Current progress
- Rewards
- Which quests are claimable (✅)

---

### !quest <quest name>
**Permission:** Everyone  
**Description:** View detailed information about a specific quest.

**Usage:**
```
!quest first steps
!quest battle master
```

---

### !claim <quest name>
**Permission:** Everyone  
**Description:** Claim rewards for a completed quest.

**Usage:**
```
!claim first steps
!claim battle master
```

**Rewards Vary:**
- Coins, gems, shards
- Crates
- Character unlocks

---

## 💎 Other Resources

### !shards
**Permission:** Everyone  
**Description:** View your shard count and what they're used for.

**Usage:**
```
!shards
```

---

### !craft
**Permission:** Everyone  
**Description:** Craft ST Boosters using shards.

**Usage:**
```
!craft
```

**Cost:** 10 shards → 1 ST Booster

---

### !boost <character name>
**Permission:** Everyone  
**Description:** Use an ST Booster to increase a character's ST%.

**Usage:**
```
!boost nix
!boost Bruce
```

**Effect:**
- Uses 1 ST Booster
- Increases character ST% by 1-5%
- Quest progress tracking

---

### !shop
**Permission:** Everyone  
**Description:** View the in-game shop.

**Usage:**
```
!shop
```

---

## 📬 Mail & News

### !mail
**Alias:** !mailbox  
**Permission:** Everyone  
**Description:** View your mailbox messages.

**Usage:**
```
!mail
!mailbox
```

**Shows:**
- All messages from admins
- Attached rewards
- Which messages have unclaimed rewards

---

### !claimmail <mail ID>
**Permission:** Everyone  
**Description:** Claim rewards from a mail message.

**Usage:**
```
!claimmail 1
!claimmail 2
```

---

### !news
**Permission:** Everyone  
**Description:** View latest news and announcements.

**Usage:**
```
!news
```

**Shows:**
- Latest 5 news posts
- Title, content, timestamp

---

## 🏆 Leaderboards

### !leaderboard [type]
**Alias:** !lb  
**Permission:** Everyone  
**Description:** View various leaderboards.

**Usage:**
```
!leaderboard              # Default (coins)
!lb coins                 # Richest players
!lb gems                  # Most gems
!lb battles               # Battle wins
!lb collection            # Most characters
!lb trophies              # Highest trophies
```

---

## 🎨 Skin Commands

### !equipskin <character> <skin name>
**Permission:** Everyone  
**Description:** Equip a skin you own for a character.

**Usage:**
```
!equipskin nix golden
!equipskin Bruce winter
```

---

## 🎁 Drop System

### !c <code>
**Permission:** Everyone  
**Description:** Catch a drop when it appears (code is shown in drop message).

**Usage:**
```
!c abc123                 # Catch the current drop
```

**What You Get:**
- Character tokens (if you own the character)
- Coins, gems, or shards (resource drops)

**Effect:**
- Tracks progress for personalized tasks
- Event progress tracking
- Drop disappears after being caught

---

## 🔧 Admin Commands

### !setup
**Permission:** Server Administrator  
**Server:** Non-main servers only  
**Description:** View setup instructions for the bot.

**Usage:**
```
!setup
```

**Shows:**
- Required setup steps
- Current setup status
- Instructions for configuration

---

### !setdropchannel [#channel]
**Permission:** Super Admin or Bot Admin  
**Server:** Non-main servers only  
**Description:** Set the channel where drops appear.

**Usage:**
```
!setdropchannel #drops
!setdropchannel           # Use current channel
```

---

### !seteventschannel [#channel]
**Permission:** Super Admin or Bot Admin  
**Server:** Non-main servers only  
**Description:** Set the channel for events and announcements.

**Usage:**
```
!seteventschannel #events
!seteventschannel         # Use current channel
```

---

### !addadmin @user
**Permission:** Super Admin only  
**Server:** Must be in a server  
**Description:** Grant bot admin permissions to a user for this server.

**Usage:**
```
!addadmin @username
```

---

### !removeadmin @user
**Permission:** Super Admin only  
**Server:** Must be in a server  
**Description:** Remove bot admin permissions from a user.

**Usage:**
```
!removeadmin @username
```

---

### !delete @user
**Alias:** !deleteuser  
**Permission:** Super Admin or Bot Admin  
**Description:** Permanently delete a user's account and all data.

**Usage:**
```
!delete @username
!deleteuser @username
```

**What Gets Deleted:**
- All characters and stats
- Coins, gems, shards, trophies
- All crates
- Battle history
- Quest progress
- Personalized task data
- Mailbox messages
- Everything!

**Confirmation:** Shows embed with deleted username and admin who deleted it.

---

### !setdrop
**Permission:** Super Admin or Bot Admin  
**Description:** Set the current channel as the drop channel (main server).

**Usage:**
```
!setdrop
```

---

### !startdrops
**Permission:** Super Admin or Bot Admin  
**Description:** Start the automatic drop system.

**Usage:**
```
!startdrops
```

**Effect:**
- Drops appear every 20 seconds (main server)
- Drops appear every 30 seconds (non-main servers)

---

### !stopdrops
**Permission:** Super Admin or Bot Admin  
**Description:** Stop the automatic drop system.

**Usage:**
```
!stopdrops
```

---

### !grant <amount> <resource> @user
**Permission:** Super Admin or Bot Admin  
**Description:** Grant resources to a user.

**Usage:**
```
!grant 1000 coins @user
!grant 500 gems @user
!grant 50 shards @user
```

---

### !grantchar <character name> @user
**Permission:** Super Admin or Bot Admin  
**Description:** Grant a character to a user.

**Usage:**
```
!grantchar nix @user
!grantchar Bruce @user
```

---

### !addskin <character> <skin name> <image URL>
**Permission:** Super Admin or Bot Admin  
**Description:** Add a new skin to the system.

**Usage:**
```
!addskin nix golden https://example.com/image.png
```

---

### !grantskin <character> <skin name> @user
**Permission:** Super Admin or Bot Admin  
**Description:** Grant a skin to a user.

**Usage:**
```
!grantskin nix golden @user
```

---

### !revokeskin <character> <skin name> @user
**Permission:** Super Admin or Bot Admin  
**Description:** Remove a skin from a user.

**Usage:**
```
!revokeskin nix golden @user
```

---

### !deleteskin <character> <skin name>
**Permission:** Super Admin or Bot Admin  
**Description:** Permanently delete a skin from the system.

**Usage:**
```
!deleteskin nix golden
```

---

### !uploadskin <character> <skin name>
**Permission:** Super Admin or Bot Admin  
**Description:** Upload a skin image (attach image to message).

**Usage:**
```
!uploadskin nix golden
(Attach image to the message)
```

---

### !sendmail <message> | <rewards>
**Permission:** Super Admin or Bot Admin  
**Description:** Send mail to all players with optional rewards.

**Usage:**
```
!sendmail Happy holidays! | coins:500 gems:50 shards:5
!sendmail Event rewards! | goldCrates:2 emeraldCrates:1
!sendmail New character! | character:Phoenix
```

**Supported Rewards:**
- coins, gems, shards
- goldCrates, emeraldCrates, legendaryCrates, tyrantCrates, bronzeCrates, silverCrates
- character (character name)

---

### !postnews <title> | <content>
**Permission:** Super Admin or Bot Admin  
**Description:** Post a news announcement visible via !news command.

**Usage:**
```
!postnews New Features! | Quests and ST Boosters are now available!
!postnews Maintenance | Server will be down for 10 minutes.
```

---

## 🎯 Personalized Task System

### How It Works

**Automatic Background System** - No commands needed!

The bot automatically:
1. Identifies eligible users (active or inactive)
2. Sends personalized task challenges via DM
3. Tracks progress automatically as users play
4. Awards rewards via friendly DM upon completion

### Task Assignment

**Inactive Users** (last active >2 hours ago):
- Get standard encouraging messages
- Example: "Hey! 👋 I noticed you haven't been around much lately. Wanna try something fun? catch 5 drops within the next 2 hours! I'll hook you up with 1 Gold crate, 350 coins, and 18 gems when you're done 😊"

**Active Users** (active within 2 hours):
- Get exclusive "VIP" style messages
- Example: "Psst... 🤫 Don't tell anyone, but I've got something special just for you: win 3 battles in 2 hours. Exclusive rewards: 1 Gold crate, 450 coins, 22 gems, and 1 shard! This is between us 😉"

### Task Types

#### Easy Tasks (1 hour duration)
- Catch 1-3 drops
- Win 1-2 battles
- Open 1-2 crates
- Level up 1-2 times
- Send 5-10 messages
- Complete 1 trade

**Rewards:** 100-300 coins, 5-15 gems, Bronze/Silver crates

#### Medium Tasks (2-3 hours duration)
- Catch 5-12 drops
- Win 3-5 battles
- Open 3-6 crates
- Gain 3-4 levels
- Send 15-20 messages
- Complete 2-3 trades

**Rewards:** 300-650 coins, 15-33 gems, 1-2 shards, Gold/Emerald crates

#### Hard Tasks (5 hours duration)
- Catch 15-25 drops
- Win 7-12 battles
- Open 7-12 crates
- Gain 5-10 levels
- Send 30-50 messages
- Complete 5-7 trades

**Rewards:** 750-1,400 coins, 38-70 gems, 3-6 shards, Legendary crates

#### Invite Tasks (5 hours duration) 🌟 BEST REWARDS!
- Invite 1 new member who completes !start
- Invite 2 new members who complete !start
- Invite 3 new members who complete !start
- Invite 4 new members who complete !start
- Invite 5 new members who complete !start

**Rewards:**
- 1 invite: 1 Legendary crate + 500 coins + 25 gems
- 2 invites: 2 Legendary crates + 1,000 coins + 50 gems
- 3 invites: 3 Legendary + 1 Tyrant crate + 2,000 coins + 100 gems
- 4 invites: 4 Legendary + 2 Tyrant crates + 3,000 coins + 150 gems
- 5 invites: 5 Legendary + 3 Tyrant crates + 5,000 coins + 250 gems

### Completion Messages (Friendly DMs)

When you complete a task, you'll receive a friendly random message:

- "Yesss! 🎉 You crushed it! Just sent you {rewards}. That was awesome! 🔥"
- "Amazing work! 💪 {rewards} is now yours! You're killing it today!"
- "Boom! 🌟 Task complete! Added {rewards} to your account. Nice job!"
- "Perfect! ✨ {rewards} just landed in your account. You're on fire! 🔥"
- "Nailed it! 🎯 {rewards} added! That was fast, impressive!"
- Plus 5 more variations!

### Timeout Messages

If time runs out:

- "Ahh, no worries! ⏰ Time ran out on that task. But hey, there'll be more chances soon! Keep an eye out 👀"
- "Oof, time's up! ⌛ Couldn't finish that one, but it's all good! Another task coming your way soon 😊"
- Plus 8 more variations!

### Automatic Progress Tracking

The system tracks these actions automatically:
- ✅ **dropsCaught**: Catching drops with !c
- ✅ **battlesWon**: Winning battles (AI or PvP)
- ✅ **cratesOpened**: Opening any crate
- ✅ **levelsGained**: Leveling up characters
- ✅ **messagesSent**: Sending messages in chat
- ✅ **tradesCompleted**: Completing trades
- ✅ **coinTradesCompleted**: Trades with coins
- ✅ **gemTradesCompleted**: Trades with gems
- ✅ **userBattles**: Battles against users
- ✅ **anyTrade**: Any type of trade
- ✅ **invitesCompleted**: New users completing !start

### Task Lifecycle

1. **Eligibility Check**: System runs every 2-3 hours
2. **Task Selection**: Random task chosen based on user activity
3. **DM Notification**: Task sent via DM with time limit
4. **Auto-Tracking**: Progress tracked as user plays
5. **Auto-Completion**: Rewards sent immediately via DM
6. **Cooldown**: Next task assigned after cooldown period

### Special Features

**Reminder System:**
- If you ignore 5+ tasks, you get a friendly reminder
- Messages like: "Hey! 👋 I've sent you a few tasks but haven't heard back. Everything okay? Got a new one for you..."

**Invite Tracking:**
- When someone uses your invite and completes !start
- You get automatic credit if you have an active invite task
- Rewards sent immediately upon reaching goal

---

## 📊 Testing Guide

### Test Basic Commands
1. `!start` → Shows starter selection
2. `!select nix` → Selects character
3. `!profile` → Shows your profile
4. `!char nix` → Shows character details
5. `!crate` → Shows crate inventory

### Test Crate System
1. Get free crates by sending 25 messages
2. `!opencrate bronze` → Open bronze crate
3. `!crate gold` → Try to buy gold crate (need 100 gems)

### Test Drop System
1. Wait for drop to appear in drop channel
2. `!c <code>` → Catch the drop
3. Verify tokens/resources added

### Test Personalized Tasks (Admin Required)
1. **Become Inactive**: Wait 2+ hours OR manually adjust `lastActivity` in database
2. **Check DMs**: Wait for automatic task assignment
3. **Complete Task**: Do the required action (e.g., catch drops, win battles)
4. **Receive Reward**: Check DMs for completion message and rewards

### Test Invite System
1. Get an invite task assigned
2. Invite a new user to the server
3. New user does `!start` and `!select <character>`
4. Check if invite task progress updated
5. Complete required invites and receive rewards

### Test Admin Commands
1. `!delete @testuser` → Delete a user account
2. `!sendmail Test message | coins:100` → Send mail to all
3. `!postnews Test | This is a test` → Post news
4. `!grant 1000 coins @user` → Grant resources

### Verify MongoDB Persistence
1. Make changes (buy crates, level up, etc.)
2. Restart bot
3. Check if all data persists
4. `!profile` should show same data as before restart

---

## 💡 Important Notes

### Message Rewards
- Every 25 messages = automatic crate reward
- 60% chance: Bronze crate
- 25% chance: Silver crate
- 10% chance: Emerald crate
- 5% chance: Gold crate

### Data Persistence
- All data saved to MongoDB (if configured with `USE_MONGODB=true`)
- Automatic saves after most actions
- Batch saves for performance

### Permission Levels
1. **Everyone**: Basic user commands
2. **Bot Admin**: Server-specific admin assigned by Super Admin
3. **Super Admin**: Full bot access (configured in code)
4. **Server Administrator**: Discord server admin role

### Special Mechanics
- **ST (Stat Total)**: Random 0-100% assigned to each character
- **Trophies**: Increase/decrease based on battle results
- **Shards**: Rare currency for crafting ST Boosters
- **Pending Tokens**: Tokens earned before selecting starter

---

## 🔒 Security Notes

- User deletion is permanent and irreversible
- Admin commands require proper permissions
- MongoDB ensures data persistence across restarts
- All sensitive operations log admin actions

---

**Bot Prefix:** `!`  
**Total Commands:** 40+  
**Personalized Tasks:** 57 variations  
**Auto-Save:** Yes (MongoDB)
