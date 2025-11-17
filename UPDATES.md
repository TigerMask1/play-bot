# ZooBot Updates & Changelog

## Version 1.0.4 - Battle Pass, Emotes & Nicknames Update
**Release Date:** November 17, 2025

### 🎉 Major Features

#### ⚡ Battle Pass System
A comprehensive progression system that rewards players for their engagement and activity!

**Features:**
- **30 Tiers** of rewards with increasing value
- **XP Earning System** - Gain XP from battles, drops, crates, quests, and daily rewards
- **Automatic Progression** - Your tier advances as you earn XP
- **Claim System** - Claim rewards individually or all at once
- **Season Management** - Seasons can be reset by admins for fresh starts
- **Balanced Progression** - Reach tier 30 with approximately 9,570 XP

**XP Sources:**
- Battle Win: 25 XP
- Battle Loss: 10 XP
- Drop Catch: 5 XP
- Crate Open: 15 XP
- Trade Complete: 20 XP
- Quest Complete: 40 XP
- Daily Claim: 35 XP
- Event Participation: 10 XP
- Character Level Up: 50 XP

**Tier Rewards Include:**
- Coins (100 - 7,500)
- Gems (5 - 150)
- Shards (5 - 75)
- Bronze, Silver, Gold, Emerald, Legendary & Tyrant Crates

**Commands:**
- `!battlepass` or `!bp` - View your battle pass progress
- `!claimpass` - Claim all available tier rewards at once

#### 🎨 Profile Emote System
Personalize your profile with special emotes granted by admins!

**Features:**
- **Admin-Granted Emotes** - Special profile decorations for achievements and events
- **MongoDB Storage** - Emotes stored securely with CDN-ready base64 encoding
- **Collection System** - Collect multiple emotes and switch between them
- **Size Validation** - Maximum 5MB per emote to ensure performance
- **Automatic Cleanup** - Removed emotes are automatically cleaned from user inventories

**Commands:**
- `!setemote <name>` - Set your active profile emote
- `!setemote none` - Clear your profile emote

**Note:** Additional emote management commands are available in the full system on the main branch.

#### 🏷️ Character Nickname System
Give your characters custom names while keeping their original identity!

**Features:**
- **Custom Nicknames** - Set personalized names for your characters
- **Dual Display** - Shows both nickname and original name (e.g., "Shadow Hunter (Nix)")
- **Per-Character** - Each character can have its own unique nickname
- **Easy Reset** - Remove nicknames anytime to return to default names
- **Profile Integration** - Nicknames display in profile, battles, and character lists

**Commands:**
- `!setnickname <character> <nickname>` or `!nick` - Set a custom nickname
- `!resetnickname <character>` - Remove a character's nickname

**Examples:**
```
!setnickname Nix Shadow Hunter
!setnickname Rexi Thunder King
!resetnickname Nix
```

### 🔧 Technical Improvements

**Data Management:**
- Added backfill system for battle pass, emotes, and nicknames
- Season data persists across bot restarts in MongoDB
- Improved data validation and error handling
- Better XP pacing for realistic progression

**Performance:**
- Optimized emote storage with size limits
- Efficient nickname lookup and display
- Battle pass progression calculations cached

**Security:**
- Super Admin restrictions for emote and season management
- Input validation for nicknames and emote names
- Safe data cleanup when removing emotes

### 📋 Updated Commands in Help System

The help command (`!help`) has been updated to include all new features and commands in the appropriate categories.

---

## Future Updates

Stay tuned for more exciting features! Join our community to suggest new ideas and improvements.

**Known Areas for Future Enhancement:**
- Battle pass premium tier (optional paid track)
- More emote sources (event rewards, achievements)
- Nickname templates and suggestions
- Advanced battle pass statistics and leaderboards

---

*Last Updated: [Current Date]*
*Bot Version: 1.0.4*
