# Discord Bot Commands Documentation

## 🔧 Admin Commands

### Delete User Account
**Commands:** `!delete @user` or `!deleteuser @user`

**Permission Required:** Administrator (Super Admin or Bot Admin)

**Description:** Permanently deletes a user's account and all their data from the database.

**Usage:**
```
!delete @username
!deleteuser @username
```

**What Gets Deleted:**
- All characters and their stats
- Coins, gems, shards, trophies
- All crates (bronze, silver, gold, emerald, legendary, tyrant)
- Battle history and quest progress
- Personalized task data
- Mailbox messages
- Everything associated with the user

**Example:**
```
!delete @SpammerUser
```

**Response:**
```
🗑️ User Account Deleted
Successfully deleted SpammerUser's account from the database.

All their data (characters, coins, gems, shards, crates, etc.) has been permanently removed.
```

---

## 🎯 Personalized Task System

The personalized task system sends **custom challenges** directly to users via DM with time limits and rewards.

### How It Works

1. **Automatic Task Assignment**: The system automatically sends tasks to eligible users
2. **Two User Types**:
   - **Inactive Users** (last active >2 hours ago): Get standard encouraging messages
   - **Active Users** (active within 2 hours): Get exclusive "VIP" style messages
3. **Task Duration**: 1-5 hours depending on difficulty
4. **Progress Tracking**: Automatic tracking of user actions (drops, battles, trades, etc.)
5. **Friendly Rewards**: Upon completion, users get a randomized friendly DM with their rewards

### Task Types & Examples

#### Easy Tasks (1 hour)
- Catch 1-3 drops
- Win 1-2 battles
- Open 1-2 crates
- Level up 1-2 times
- Send 5-10 messages
- Complete 1 trade

**Rewards:** Bronze/Silver crates + 100-300 coins + 5-15 gems

#### Medium Tasks (2-3 hours)
- Catch 5-12 drops
- Win 3-5 battles
- Open 3-6 crates
- Gain 3-4 levels
- Send 15-20 messages
- Complete 2-3 trades

**Rewards:** Gold/Emerald crates + 300-650 coins + 15-33 gems + 1-2 shards

#### Hard Tasks (5 hours)
- Catch 15-25 drops
- Win 7-12 battles
- Open 7-12 crates
- Gain 5-10 levels
- Send 30-50 messages
- Complete 5-7 trades

**Rewards:** Legendary crates + 750-1,400 coins + 38-70 gems + 3-6 shards

#### Invite Tasks (5 hours) - LEGENDARY REWARDS! 🌟
- Invite 1 member who completes !start
- Invite 2 members who complete !start
- Invite 3 members who complete !start
- Invite 4 members who complete !start
- Invite 5 members who complete !start

**Rewards:** 
- 1 invite: 1 Legendary crate + 500 coins + 25 gems
- 2 invites: 2 Legendary crates + 1,000 coins + 50 gems
- 3 invites: 3 Legendary + 1 Tyrant crate + 2,000 coins + 100 gems
- 4 invites: 4 Legendary + 2 Tyrant crates + 3,000 coins + 150 gems
- 5 invites: 5 Legendary + 3 Tyrant crates + 5,000 coins + 250 gems

### Example Task Messages

**For Inactive Users:**
```
Hey! 👋 I noticed you haven't been around much lately. Wanna try something fun? 
catch 5 drops within the next 2 hours! I'll hook you up with 1 Gold crate, 350 coins, 
and 18 gems when you're done 😊
```

**For Active Users (VIP Style):**
```
Psst... 🤫 Don't tell anyone, but I've got something special just for you: 
win 3 battles in 2 hours. Exclusive rewards: 1 Gold crate, 450 coins, 22 gems, 
and 1 shard! This is between us 😉
```

**Task Completion (Friendly DMs):**
```
Yesss! 🎉 You crushed it! Just sent you 1 Gold crate, 450 coins, 22 gems, and 1 shard. 
That was awesome! 🔥
```

or

```
Amazing work! 💪 1 Legendary crate, 800 coins, 40 gems, and 3 shards is now yours! 
You're killing it today!
```

### How Personalized Tasks Are Managed

**Automatic System:** The personalized task system runs automatically in the background. There are no manual admin commands to trigger tasks or view stats through Discord commands.

**Task Management:**
- Tasks are sent automatically to eligible users
- Progress is tracked automatically when users perform actions
- Rewards are distributed automatically via DM upon completion
- System handles all cooldowns, timeouts, and eligibility checks

**Admin Control (Database Level):**
Admins can manage tasks by directly accessing the MongoDB database to:
- View a user's `personalizedTasks` object
- Check `currentTask`, `taskProgress`, `completedTasks`
- Manually enable/disable tasks by modifying `isActive` field
- View invite tracking in `invitees` array

---

## 📊 How to Test the Personalized Task System

### Testing as an Admin

1. **Make yourself inactive** (wait 2+ hours OR manually adjust lastActivity in database)
2. **Wait for automatic task assignment** (system checks periodically)
3. **Check your DMs** for the task message
4. **Complete the task** (e.g., if task is "catch 2 drops", catch 2 drops)
5. **Receive completion DM** with rewards

### Testing Invite Tasks

1. **Get an invite task assigned** to your account
2. **Share invite link/code** with a new user
3. **New user joins** and uses `!start` command
4. **System tracks completion** automatically
5. **Receive rewards** via friendly DM when task requirement is met

### Manual Testing Commands (If Available)

```
!taskstats @username          # View task progress and stats
!toggletasks @username         # Enable/disable tasks for a user
```

### Database Verification

If using MongoDB, you can check:
- User's `personalizedTasks` object
- `currentTask` field shows active task
- `taskProgress` shows current progress
- `completedTasks` array shows history
- `invitees` array tracks invite progress
- `inviteCount` shows completed invites

---

## 🔍 Task Progress Tracking

The system automatically tracks these actions:

- **dropsCaught**: When user catches a drop
- **battlesWon**: When user wins a battle (AI or PvP)
- **cratesOpened**: When user opens any crate
- **levelsGained**: When user's character levels up
- **messagesSent**: Messages sent in chat
- **tradesCompleted**: When user completes a trade
- **coinTradesCompleted**: Trades involving coins
- **gemTradesCompleted**: Trades involving gems
- **userBattles**: Battles against other users
- **anyTrade**: Any type of trade
- **invitesCompleted**: Invites where new user completed !start

---

## 💡 Tips for Testing

1. **Check Bot DMs**: All task messages are sent via DM
2. **Time Limits**: Tasks expire after their duration (1-5 hours)
3. **Missed Tasks**: If you miss 5+ tasks, you get a reminder message
4. **Active vs Inactive**: Active users (<2 hours) get "exclusive" messaging
5. **Automatic Rewards**: Rewards are added immediately upon task completion
6. **MongoDB Persistence**: All progress is saved to MongoDB (if configured)

---

## 🛠️ Troubleshooting

### "I'm not getting tasks"
- Check if tasks are enabled for your account
- Verify you don't have an active task already
- Ensure enough time has passed since last task (cooldown period)

### "My progress isn't tracking"
- Verify task hasn't expired (check time limit)
- Make sure you're doing the correct action (e.g., AI battles vs user battles)
- Check your current task with an admin

### "I didn't get rewards"
- Check if task expired before completion
- Verify bot can DM you (DMs enabled)
- Contact an admin to check task completion logs

---

## 📝 Notes

- Tasks are sent via **direct messages** (DMs must be enabled)
- **Friendly, human-like messaging** makes the system engaging
- **Invite tasks have the best rewards** to encourage community growth
- **MongoDB ensures persistence** - no data loss on bot restarts
- **Admin delete command** allows quick cleanup of spam/problem accounts
