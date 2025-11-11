# Event System Upgrade - Complete Overhaul

## Summary
The event reward distribution system has been completely rewritten with MongoDB-first architecture, automatic scheduling, and enhanced rewards including crates.

## ✅ Changes Implemented

### 1. MongoDB-First Reward Distribution
- **Old System**: Rewards were added to in-memory data, then saved via `dataManager.saveDataImmediate()`
- **New System**: Rewards are saved directly to MongoDB using bulk operations via `mongoManager.applyEventRewards()`
- **Benefits**: Eliminates race conditions, ensures immediate persistence, more reliable under concurrent operations

### 2. Crate Rewards Added
Event winners now receive crates in addition to gems, coins, and cage keys:
- **🥇 1st Place**: 1 🟣 Legendary Crate + 500 💎 + 5,000 💰 + 5 🎫
- **🥈 2nd Place**: 1 🟢 Emerald Crate + 250 💎 + 2,500 💰 + 3 🎫
- **🥉 3rd Place**: 2 🟡 Gold Crates + 150 💎 + 1,500 💰 + 1 🎫
- **🎖️ Top 5%**: 75 💎 + 750 💰 (no crates)

Crates are automatically saved to user profiles in MongoDB and can be opened with `!opencrate <type>`.

### 3. New MongoDB Functions
Added to `mongoManager.js`:
- `incrementUserResources(userId, resources, mailDoc)` - Add rewards to a single user
- `applyEventRewards(eventId, rewardOps)` - Bulk distribute rewards to all winners
- `upsertEventSchedule(config)` - Save event schedule configuration
- `getEventSchedule()` - Retrieve current schedule settings
- `setEventStatus(eventId, status, extra)` - Update event status
- `clearEventParticipants(eventId)` - Clean up participant data

### 4. Admin Commands

#### `!startevent`
- **Permission**: Bot Admin or Super Admin
- **Function**: Manually start a new event immediately
- **Note**: Prevents starting if an event is already active

#### `!stopevent`
- **Permission**: Bot Admin or Super Admin
- **Function**: Immediately stop the current event and distribute rewards
- **Note**: Returns error if no event is active

#### `!eventschedule`
- **Permission**: 
  - Regular users can view schedule (limited info)
  - Bot Admins can manage schedule settings
- **Subcommands**:
  - `!eventschedule` - View current schedule configuration
  - `!eventschedule enable` - Enable automatic scheduling
  - `!eventschedule disable` - Disable automatic scheduling
  - `!eventschedule settime HH:MM` - Set event start time in IST (e.g., `!eventschedule settime 05:30`)

### 5. Automatic Event Scheduling
- **Default Start Time**: 5:30 AM IST (India Standard Time)
- **Timezone**: Asia/Kolkata (UTC+5:30)
- **Behavior**: 
  - Checks every minute for scheduled event time
  - If an event is running when schedule triggers, it stops the current event first
  - Then starts a new event according to the rotation
  - Prevents duplicate starts within the same minute
- **Persistence**: Schedule configuration is saved to MongoDB
- **Configuration Fields**:
  - `enabled` - Whether auto-scheduling is active
  - `startTime` - Time to start events (HH:MM format)
  - `timezone` - Timezone identifier (default: Asia/Kolkata)
  - `lastRun` - Timestamp of last scheduled event start

### 6. Event Stop Logic
When a scheduled event triggers:
1. Checks if an active event exists
2. If yes, calls `endEvent()` to:
   - Calculate leaderboard
   - Distribute rewards via MongoDB
   - Announce results
3. Starts the new scheduled event
4. Updates `lastRun` timestamp to prevent re-runs

## 🔧 Technical Details

### Reward Distribution Flow
```
1. Event ends (timer or manual stop)
2. Get participant leaderboard from MongoDB
3. Calculate rewards for each tier (top 3, top 5%)
4. Build rewardOps array with MongoDB update operations
5. Call mongoManager.applyEventRewards()
6. Bulk write all rewards to users collection
7. Mark event.rewardsDistributed = true
8. Send mail notifications to winners
```

### IST Time Conversion
```javascript
// IST is UTC+5:30
const istOffset = (5 * 60 + 30) * 60 * 1000;
const istTime = new Date(utcTime + istOffset);
```

The scheduler compares current IST time against the configured start time every minute.

## 📊 MongoDB Schema Updates

### Users Collection
New fields added for crate storage:
```javascript
{
  bronzeCrates: 0,
  silverCrates: 0,
  goldCrates: 0,
  emeraldCrates: 0,
  legendaryCrates: 0,
  tyrantCrates: 0
}
```

### Config Collection
New document for event scheduling:
```javascript
{
  _id: 'event_schedule',
  timezone: 'Asia/Kolkata',
  startTime: '05:30',
  enabled: true,
  lastRun: Date,
  updatedAt: Date
}
```

## 🎯 Usage Examples

### For Admins

**Start an event manually:**
```
!startevent
```

**Stop the current event:**
```
!stopevent
```

**View current schedule:**
```
!eventschedule
```

**Enable automatic scheduling:**
```
!eventschedule enable
```

**Change event start time to 6:00 AM IST:**
```
!eventschedule settime 06:00
```

**Disable automatic scheduling:**
```
!eventschedule disable
```

### For Players

**Check current event:**
```
!event
```

**View schedule (limited info):**
```
!eventschedule
```

## 🐛 Bug Fixes
- Fixed permission check bug in admin commands (was calling `isBotAdmin(serverId, userId)`, now correctly calls `isBotAdmin(userId, serverId)`)
- Eliminated potential race conditions in reward distribution
- Prevented duplicate event starts within the same minute

## ⚠️ Important Notes

1. **Automatic Scheduling is Enabled by Default** at 5:30 AM IST
2. **Rewards are now instant** - saved directly to MongoDB, no sync delays
3. **Crates appear in user inventories** immediately after event ends
4. **Schedule persists across bot restarts** - stored in MongoDB
5. **Event announcements** show the new crate rewards in the embed

## 🔄 Migration
No manual migration needed! The system will:
- Auto-create the event schedule config on first run
- Initialize crate fields for users when rewards are distributed
- Continue working with existing events in MongoDB

## 🚀 Next Steps
1. Add your `DISCORD_BOT_TOKEN` to environment secrets
2. Optionally add `MONGODB_URI` for production MongoDB (otherwise uses JSON storage)
3. Test admin commands with a bot admin account
4. Monitor the first scheduled event at 5:30 AM IST
5. Verify rewards are distributed correctly via `!profile` and `!mail`

## 📝 Files Modified
- `eventSystem.js` - Complete overhaul of reward distribution and scheduling
- `mongoManager.js` - Added new reward persistence functions
- `index.js` - Added three new admin commands
- `EVENT_SYSTEM_UPGRADE.md` - This documentation file (new)
