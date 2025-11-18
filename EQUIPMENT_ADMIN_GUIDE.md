# ⚔️ Equipment Items Admin Guide

## Overview
Equipment items are tier-based collectibles (Silver, Gold, Legendary) that can be equipped to characters to enhance their battle abilities. As a Super Admin, you have powerful commands to manage these equipment items for any user.

## What Are Equipment Items?

Equipment items are special collectibles that:
- Come in **3 tiers**: Silver ⚪, Gold 🥇, and Legendary 🔥
- **Level up** as users collect more copies
- Can be **equipped** to characters for battle bonuses
- Are obtained primarily from **opening crates**
- Have **passive** or **active** battle effects

### How Equipment Works

1. **Collection**: Users find equipment in crates (bronze through tyrant)
2. **Leveling**: Each copy increases the equipment level based on tier thresholds
3. **Equipping**: Each character has 3 equipment slots (1 for each tier)
4. **Storage**: Equipment is stored in `user.itemCollection` as:
   ```javascript
   itemCollection[itemId] = {
     tier: 'silver' | 'gold' | 'legendary',
     copies: number,
     level: number,
     firstObtained: timestamp
   }
   ```

---

## Equipment Tiers & Items

### ⚪ Silver Tier Equipment
1. **Med-Drop** (`med_drop`) 💉
   - Type: Passive
   - Effect: Heals you for a percentage of damage dealt
   - Levels 1-10 (1, 3, 7, 15, 30, 50, 75, 105, 145, 200 copies)

2. **Vanish-Ring** (`vanish_ring`) 💍
   - Type: Passive
   - Effect: Chance to drain opponent's energy
   - Levels 1-10 (same thresholds as Med-Drop)

### 🥇 Gold Tier Equipment
1. **Leech-Suck** (`leech_suck`) 🧛
   - Type: Active
   - Effect: Absorb opponent's health percentage
   - Levels 1-10 (1, 4, 10, 20, 35, 55, 80, 110, 145, 190 copies)

2. **Mist-Dodge** (`mist_dodge`) 🌫️
   - Type: Active
   - Effect: Next enemy attack may miss completely
   - Levels 1-10 (same thresholds as Leech-Suck)

3. **Fire-Fang** (`fire_fang`) 🔥
   - Type: Active
   - Effect: Reflects damage back to attacker
   - Levels 1-10 (same thresholds as Leech-Suck)

### 🔥 Legendary Tier Equipment
1. **Reflective-Mirror** (`reflective_mirror`) 🪞
   - Type: Active
   - Effect: Predicts and reflects massive damage
   - Levels 1-10 (1, 5, 12, 25, 45, 70, 100, 135, 180, 240 copies)

2. **Self-Defibrillator** (`self_defibrillator`) ⚡
   - Type: Passive (Auto-trigger)
   - Effect: Automatically revives you from death
   - Levels 1-10 (same thresholds as Reflective-Mirror)

3. **Energy-Smash** (`energy_smash`) ⚡
   - Type: Active
   - Effect: Refunds energy from your next move
   - Levels 1-10 (same thresholds as Reflective-Mirror)

---

## Level Progression System

Equipment items level up based on the number of copies owned:

| Tier | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 | Lv.6 | Lv.7 | Lv.8 | Lv.9 | Lv.10 |
|------|------|------|------|------|------|------|------|------|------|-------|
| **Silver** | 1 | 3 | 7 | 15 | 30 | 50 | 75 | 105 | 145 | 200 |
| **Gold** | 1 | 4 | 10 | 20 | 35 | 55 | 80 | 110 | 145 | 190 |
| **Legendary** | 1 | 5 | 12 | 25 | 45 | 70 | 100 | 135 | 180 | 240 |

**Example**: A user with 30 copies of Med-Drop (silver) would have it at Level 5.

---

## Super Admin Commands

### 🎁 Grant Equipment to Users
**Commands:** `!grantequipment @user <equipment_id> <copies>` or `!grantequip @user <equipment_id> <copies>`

Grants equipment copies to a specific user. Automatically calculates new level and shows level-ups.

**Examples:**
```
!grantequipment @player med_drop 10
!grantequip @player reflective_mirror 50
!grantequipment @user leech_suck 1
```

**What it does:**
- Adds the specified number of copies to the user's collection
- Automatically calculates and updates the equipment level
- Shows how many level-ups occurred
- Displays total copies and new level
- Uses `saveDataImmediate()` for MongoDB persistence

**Example Output:**
```
✅ Granted 10x 💉 Med-Drop (silver) to @player!
🎉 Leveled up 2 time(s)! (Lv.1 → Lv.3)
They now have 10 copies at Lv.3.
```

---

### 🗑️ Remove Equipment from Users
**Commands:** `!removeequipment @user <equipment_id> <copies>` or `!removeequip @user <equipment_id> <copies>`

Removes equipment copies from a user's collection. Recalculates level if it decreases.

**Examples:**
```
!removeequipment @player med_drop 5
!removeequip @player fire_fang 10
```

**What it does:**
- Removes the specified number of copies (up to what they own)
- Recalculates equipment level based on remaining copies
- Shows level decrease if applicable
- Cannot remove more than they have

**Example Output:**
```
✅ Removed 5x 💉 Med-Drop from @player!
⚠️ Level decreased: Lv.5 → Lv.4
They now have 25 copies at Lv.4.
```

---

### 📦 View User's Equipment Collection
**Commands:** `!viewequipment @user` or `!checkequipment @user`

Displays a user's complete equipment collection organized by tier, showing levels and copy counts.

**Example:**
```
!viewequipment @player
```

**What it shows:**
- All equipment items the user owns
- Organized by tier (Silver, Gold, Legendary)
- Level and copy count for each item
- Total number of equipment types owned

**Example Output:**
```
⚔️ Player's Equipment Collection

⚪ Silver Equipment
💉 Med-Drop - Lv.5 (30 copies)
💍 Vanish-Ring - Lv.3 (7 copies)

🥇 Gold Equipment
🧛 Leech-Suck - Lv.2 (4 copies)

Total equipment types: 3
```

**Use Cases:**
- Checking user inventory before making changes
- Verifying grant operations were successful
- Investigating user reports about equipment
- Auditing equipment collections

---

### 🧹 Clear User's Equipment Collection
**Command:** `!clearequipment @user`

Removes ALL equipment from a user's collection and unequips all items from their characters. **Use with extreme caution!**

**Example:**
```
!clearequipment @player
```

**Warning:** This action:
- Removes every equipment item from the user's collection
- Unequips all items from ALL of their characters
- Cannot be undone without manually re-granting items

**Use Cases:**
- Resetting test accounts after testing
- Fixing severely corrupted equipment data
- Responding to explicit user requests for complete reset

**Example Output:**
```
✅ Cleared equipment collection for @player!
Removed 5 equipment type(s) and unequipped all items from characters.
```

---

### 📋 List All Available Equipment
**Commands:** `!listequipment` or `!listequip`

Shows all available equipment items in the system organized by tier, with IDs and descriptions.

**Example:**
```
!listequipment
```

**What it shows:**
- All equipment items by tier
- Equipment IDs (for use in grant/remove commands)
- Names, emojis, and descriptions
- Type (passive/active)

**Example Output:**
```
⚔️ All Equipment Items

⚪ Silver Equipment
`med_drop` - 💉 Med-Drop
  Heals you for a percentage of damage dealt

`vanish_ring` - 💍 Vanish-Ring
  Chance to drain opponent's energy

🥇 Gold Equipment
`leech_suck` - 🧛 Leech-Suck
  Absorb opponent's health

[... more items ...]
```

**Use Cases:**
- Finding correct equipment IDs for commands
- Reference guide for all equipment
- Answering user questions about available equipment

---

## MongoDB Storage & Data Integrity

### How Equipment is Stored

Equipment data is saved to MongoDB as part of the user object:

```javascript
{
  userId: "123456789",
  username: "Player",
  // ... other user data ...
  itemCollection: {
    "med_drop": {
      tier: "silver",
      copies: 30,
      level: 5,
      firstObtained: 1699123456789
    },
    "leech_suck": {
      tier: "gold",
      copies: 10,
      level: 3,
      firstObtained: 1699234567890
    }
  },
  characters: [
    {
      name: "Nix",
      emoji: "🦊",
      equipment: {
        silver: "med_drop",    // equipped item ID
        gold: "leech_suck",    // equipped item ID
        legendary: null        // empty slot
      }
      // ... other character data ...
    }
  ]
}
```

### Data Persistence

All equipment admin commands use `await saveDataImmediate(data)`:
- **Immediate write** to MongoDB (no batching)
- **Prevents data loss** on crashes
- **Ensures consistency** across database operations

### Verification Steps

To verify equipment is saved correctly to MongoDB:

1. **Grant equipment to a user**
2. **Check MongoDB directly** or use `!viewequipment`
3. **Restart the bot** (data should persist)
4. **Check again** with `!viewequipment`

If equipment persists after restart, MongoDB saving is working correctly.

---

## Equipment IDs Quick Reference

### Silver (⚪)
- `med_drop` - 💉 Med-Drop
- `vanish_ring` - 💍 Vanish-Ring

### Gold (🥇)
- `leech_suck` - 🧛 Leech-Suck
- `mist_dodge` - 🌫️ Mist-Dodge
- `fire_fang` - 🔥 Fire-Fang

### Legendary (🔥)
- `reflective_mirror` - 🪞 Reflective-Mirror
- `self_defibrillator` - ⚡ Self-Defibrillator
- `energy_smash` - ⚡ Energy-Smash

---

## Best Practices

### When to Grant Equipment
1. **Event Rewards** - Award equipment as prizes for special events
2. **Compensation** - Compensate for bugs or lost items
3. **Testing** - Provide equipment to test accounts for battle testing
4. **Community Rewards** - Recognize helpful community members

### When to Remove Equipment
1. **Exploit Fixes** - Remove items obtained through bugs/exploits
2. **Accidental Grants** - Remove mistakenly granted equipment
3. **Rebalancing** - Adjust excessive equipment counts

### When to Clear Equipment
1. **Test Account Reset** - Clear test accounts between testing sessions
2. **Database Corruption** - Fix severely corrupted equipment data
3. **User Request** - Only if explicitly requested by the user

### Safety Tips
1. **Always check first**: Use `!viewequipment` before removing items
2. **Double-check username**: Ensure you're targeting the correct user
3. **Track admin actions**: Keep logs of significant equipment changes
4. **Confirm with user**: For `!clearequipment`, confirm with user first if possible
5. **Understand leveling**: Know that removing copies can decrease levels
6. **Test on alts**: Test commands on test accounts before production use

---

## How Players Use Equipment

Players interact with equipment through:
- **`!equipment`** - View their own equipment collection
- **`!equip <character> <equipment_id>`** - Equip an item to a character
- **`!unequip <character> <tier>`** - Unequip an item from a character
- **Opening Crates** - Primary way to obtain equipment

Equipment is found in crates with these drop chances:
- Bronze/Silver Crates: 30-35% for silver tier
- Gold Crates: 25% (60% silver, 40% gold)
- Emerald Crates: 30% (40% silver, 60% gold)
- Legendary Crates: 20% (60% gold, 40% legendary)
- Tyrant Crates: 25% (40% gold, 60% legendary)

---

## Troubleshooting

### "User hasn't started yet"
**Problem:** User needs to use `!start` command first
**Solution:** Ask user to start their journey with `!start`

### "Invalid equipment ID"
**Problem:** Equipment ID is misspelled or doesn't exist
**Solution:** Use `!listequipment` to see all valid equipment IDs

### "User doesn't have any [equipment]"
**Problem:** Trying to remove equipment the user doesn't own
**Solution:** Use `!viewequipment @user` to check their collection first

### Equipment not appearing in battles
**Problem:** Equipment may not be equipped to a character
**Solution:** Check if the item is equipped using `!equipment` command

### Equipment lost after bot restart
**Problem:** MongoDB save may have failed
**Solution:** 
1. Check if `USE_MONGODB` environment variable is set to `'true'`
2. Verify MongoDB connection is working
3. Check error logs for save failures

---

## Examples in Action

### Scenario 1: Event Prize
```
!grantequipment @winner reflective_mirror 25
!grantequipment @winner energy_smash 15
!grantequipment @winner self_defibrillator 10
```

### Scenario 2: Bug Compensation
```
!viewequipment @affected_user
!grantequipment @affected_user med_drop 10
!grantequipment @affected_user leech_suck 5
```

### Scenario 3: Fixing Exploit
```
!viewequipment @suspicious_user
!removeequipment @suspicious_user reflective_mirror 200
```

### Scenario 4: Test Account Setup
```
!grantequipment @testuser med_drop 200
!grantequipment @testuser vanish_ring 200
!grantequipment @testuser leech_suck 190
!grantequipment @testuser reflective_mirror 240
```

### Scenario 5: Level-Up Testing
```
!grantequipment @testuser fire_fang 1    # Lv.1
!grantequipment @testuser fire_fang 3    # Lv.1 → Lv.2
!grantequipment @testuser fire_fang 6    # Lv.2 → Lv.3
!grantequipment @testuser fire_fang 10   # Lv.3 → Lv.4
```

---

## Related Systems

### Character Equipment Slots
Each character has 3 equipment slots:
- **Silver slot** - For silver tier equipment
- **Gold slot** - For gold tier equipment  
- **Legendary slot** - For legendary tier equipment

Only one item per tier can be equipped at a time.

### Equipment Commands for Users
- `!equipment` - View collection and equipped items
- `!equip <character> <equipment_id>` - Equip to character
- `!unequip <character> <tier>` - Unequip from character

---

## Summary

Equipment admin commands give you complete control over user equipment collections:
- ✅ Grant equipment with automatic leveling
- ✅ Remove equipment with level recalculation
- ✅ View complete equipment collections
- ✅ Clear all equipment when needed
- ✅ List all available equipment for reference
- ✅ MongoDB persistence with `saveDataImmediate()`

Use these commands responsibly and always verify actions before executing them, especially when removing or clearing equipment!
