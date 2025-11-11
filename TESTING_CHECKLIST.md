# Testing Checklist for Discord Bot

## ✅ Quick Test Scenarios

### 🎮 Basic Flow Test (5 minutes)
- [ ] `!start` - Shows starter selection
- [ ] `!select nix` - Selects Nix as starter
- [ ] `!profile` - Shows profile with Nix
- [ ] `!char nix` - Shows Nix details
- [ ] Send 25 messages - Get free crate reward
- [ ] `!opencrate bronze` - Open the bronze crate
- [ ] `!crate` - View crate inventory

### 💰 Resource Test
- [ ] `!profile` - Verify starting 100 coins, 10 gems
- [ ] `!shards` - Check shard count
- [ ] Try `!craft` - Should need 10 shards
- [ ] Try `!crate gold` - Should need 100 gems

### ⚔️ Combat Test
- [ ] `!b` - Battle AI with selected character
- [ ] `!battle @user` - Battle another player (if available)
- [ ] Check trophy changes after wins/losses

### 📦 Drop System Test
- [ ] Wait for drop in drop channel
- [ ] `!c <code>` - Catch the drop
- [ ] `!profile` - Verify tokens/resources added

### 🎯 Quest Test
- [ ] `!quests` - View all quests
- [ ] `!quest first steps` - View specific quest
- [ ] Complete quest objectives
- [ ] `!claim first steps` - Claim rewards

### 📬 Mail & News Test
- [ ] `!mail` - Check mailbox
- [ ] `!news` - Check news

### 🏆 Leaderboard Test
- [ ] `!lb` - Default leaderboard
- [ ] `!lb coins` - Coins leaderboard
- [ ] `!lb trophies` - Trophies leaderboard

### 🔧 Admin Commands Test (Admin Only)

#### Setup Commands (Non-Main Server)
- [ ] `!setup` - View setup instructions
- [ ] `!setdropchannel #channel` - Set drop channel
- [ ] `!seteventschannel #channel` - Set events channel
- [ ] `!addadmin @user` - Add bot admin
- [ ] `!removeadmin @user` - Remove bot admin

#### User Management
- [ ] `!delete @testuser` - Delete test user
- [ ] Verify user is completely removed
- [ ] Check logs for deletion record

#### Resource Granting
- [ ] `!grant 1000 coins @user` - Grant coins
- [ ] `!grant 500 gems @user` - Grant gems
- [ ] `!grantchar phoenix @user` - Grant character
- [ ] Verify resources added

#### Communication
- [ ] `!sendmail Test | coins:100` - Send mail to all
- [ ] `!mail` - Verify mail received
- [ ] `!claimmail 1` - Claim mail rewards
- [ ] `!postnews Test | Content` - Post news
- [ ] `!news` - Verify news appears

### 🎯 Personalized Task System Test

#### Testing Inactive User Tasks
1. **Setup:**
   - [ ] Note your current `lastActivity` time (database)
   - [ ] Either wait 2+ hours OR manually set `lastActivity` to 3 hours ago

2. **Wait for Assignment:**
   - [ ] Check DMs every 30 minutes
   - [ ] Wait for task assignment message
   - [ ] Should receive encouraging message (inactive user style)

3. **Complete Task:**
   - [ ] Note task requirement (e.g., "catch 5 drops")
   - [ ] Note time limit (e.g., "2 hours")
   - [ ] Perform required action
   - [ ] Check DMs for completion message
   - [ ] Verify rewards added to account

#### Testing Active User Tasks
1. **Setup:**
   - [ ] Be active in the server (send messages, play)
   - [ ] Keep lastActivity within last 2 hours

2. **Wait for Assignment:**
   - [ ] Check DMs
   - [ ] Wait for task (may take 3+ hours)
   - [ ] Should receive "VIP/exclusive" style message

3. **Complete Task:**
   - [ ] Follow same completion steps as inactive test

#### Testing Invite Tasks
1. **Get Invite Task:**
   - [ ] Wait for invite task to be assigned
   - [ ] Note requirement (e.g., "invite 2 members who complete !start")

2. **Invite Users:**
   - [ ] Share server invite with test accounts
   - [ ] Have them join server

3. **Track Progress:**
   - [ ] Each invited user does `!start`
   - [ ] Each invited user does `!select <character>`
   - [ ] Check database for invite tracking updates
   - [ ] Verify inviteCount increments

4. **Claim Rewards:**
   - [ ] Meet invite requirement
   - [ ] Check DMs for completion message
   - [ ] Verify legendary/tyrant crates added
   - [ ] Verify coins and gems added

#### Testing Progress Tracking
- [ ] Get task: "catch 3 drops"
  - Catch 1 drop → Check progress (1/3)
  - Catch 2 drops → Check progress (2/3)
  - Catch 3 drops → Auto-complete, receive DM

- [ ] Get task: "win 2 battles"
  - Win 1 battle → Check progress (1/2)
  - Win 2 battles → Auto-complete, receive DM

- [ ] Get task: "send 10 messages"
  - Send 5 messages → Check progress (5/10)
  - Send 10 messages → Auto-complete, receive DM

#### Testing Task Timeout
1. **Get Task:**
   - [ ] Note task and time limit
   - [ ] Don't complete it

2. **Wait for Expiry:**
   - [ ] Wait past time limit
   - [ ] Check DMs for timeout message
   - [ ] Should receive friendly "no worries" message

#### Testing Reminder System
1. **Ignore Tasks:**
   - [ ] Get task → ignore it (let timeout)
   - [ ] Repeat 5 times

2. **Check for Reminder:**
   - [ ] On 6th task, should get reminder message
   - [ ] Message mentions you haven't been responding

### 🗄️ MongoDB Persistence Test

#### Before Restart
- [ ] Complete several actions:
  - Open crates
  - Level up characters
  - Win battles
  - Send messages
  - Catch drops
- [ ] Note all stats (coins, gems, characters, levels, etc.)
- [ ] `!profile` - Take screenshot

#### Restart Bot
- [ ] Stop the bot
- [ ] Verify MongoDB connection is configured
- [ ] Start the bot

#### After Restart
- [ ] `!profile` - Compare with screenshot
- [ ] Verify all data matches:
  - [ ] Same coins amount
  - [ ] Same gems amount
  - [ ] Same characters
  - [ ] Same character levels
  - [ ] Same trophies
  - [ ] Same message count
  - [ ] Same crate inventory
- [ ] Check personalized task data (database):
  - [ ] currentTask preserved
  - [ ] taskProgress preserved
  - [ ] completedTasks array preserved

### 🔍 Edge Cases Test

#### Character Management
- [ ] Try `!levelup` without enough tokens
- [ ] Try `!levelup` without enough coins
- [ ] Try `!release` on character below level 10
- [ ] Try `!select` after already selecting

#### Crate System
- [ ] Try `!opencrate gold` without owning one
- [ ] Try `!crate gold` without enough gems
- [ ] Send exactly 25 messages, verify crate reward

#### Drop System
- [ ] Try `!c` with wrong code
- [ ] Try `!c` after drop already caught
- [ ] Try `!c` when no drop active
- [ ] Catch drop for character you don't own

#### Admin Commands
- [ ] Try admin commands without permission
- [ ] Try `!delete` on non-existent user
- [ ] Try `!grant` with invalid resource type
- [ ] Try `!sendmail` with incorrect format

#### Personalized Tasks
- [ ] Complete task after it expires
- [ ] Complete 2 tasks simultaneously (if possible)
- [ ] Get invite task with no invites available

### 📊 Performance Test

#### Message Spam Test
- [ ] Send 100 messages quickly
- [ ] Verify message count accurate
- [ ] Verify crate rewards at 25, 50, 75, 100
- [ ] Check if personalized task progress tracked

#### Multiple Users Test
- [ ] Have 3+ users use bot simultaneously
- [ ] Trade between users
- [ ] Battle between users
- [ ] Verify no data conflicts

#### Database Load Test
- [ ] Perform 20+ save operations
- [ ] Check if batching working (2 second delay)
- [ ] Verify all data eventually saved

---

## 🐛 Common Issues to Check

### Task System Not Working?
- [ ] Check if `USE_MONGODB=true` is set
- [ ] Check if MongoDB connection successful
- [ ] Check user's `isActive` field in personalizedTasks
- [ ] Check if bot can DM user (DMs not disabled)
- [ ] Verify task assignment timers are running

### Data Not Persisting?
- [ ] Verify `MONGODB_URI` environment variable set
- [ ] Check bot logs for MongoDB connection errors
- [ ] Verify `USE_MONGODB=true` is set
- [ ] Check if saveData() is being called

### Drops Not Appearing?
- [ ] Verify drop channel set with `!setdropchannel`
- [ ] Check if drops started with `!startdrops`
- [ ] Verify bot has permission to send in drop channel

### Commands Not Responding?
- [ ] Check bot prefix is `!`
- [ ] Verify bot has read message permissions
- [ ] Check command spelling/format
- [ ] Review bot logs for errors

---

## ✅ Final Verification Checklist

- [ ] All basic commands work
- [ ] All admin commands work (with permissions)
- [ ] Personalized tasks assign automatically
- [ ] Invite tasks track correctly
- [ ] Task completion sends friendly DMs
- [ ] Rewards are added correctly
- [ ] MongoDB persistence works
- [ ] Delete command removes all user data
- [ ] Drop system functions
- [ ] Battle system works
- [ ] Trading system works
- [ ] Quest system works
- [ ] Leaderboards display correctly
- [ ] Mail system works
- [ ] News system works
- [ ] Skin system works (if used)

---

## 📝 Testing Notes Template

```
Date: ___________
Tester: ___________

Test: Personalized Task System - Inactive User
- Task Received: ___________
- Time Limit: ___________
- Requirement: ___________
- Completed: [ ] Yes [ ] No
- Rewards Received: ___________
- Issues: ___________

Test: Delete User Command
- User Deleted: ___________
- Verification:
  - User removed from database: [ ]
  - !profile shows "hasn't started": [ ]
  - All data cleared: [ ]
- Issues: ___________

Test: MongoDB Persistence
- Data before restart: ___________
- Data after restart: ___________
- Match: [ ] Yes [ ] No
- Issues: ___________
```

---

**Estimated Full Test Time:** 3-4 hours  
**Quick Test Time:** 30 minutes  
**Core Features Test:** 1 hour  
**Personalized Tasks Test:** 2-3 hours (due to wait times)
