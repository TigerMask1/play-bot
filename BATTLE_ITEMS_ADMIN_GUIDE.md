# 🛠️ Battle Items Admin Guide

## Overview
Battle items are consumable items that players can use during battles for strategic advantages. As a Super Admin, you have powerful commands to manage these items for any user in the system.

## What Are Battle Items?

Battle items are consumables that can be purchased from the shop and used in battles. They provide various effects:

### Item Categories

#### 💊 Healing Items
- **Health Potion** (`health_potion`) - Restores 50 HP
- **Super Health Potion** (`super_health_potion`) - Restores 100 HP
- **Max Health Potion** (`max_health_potion`) - Fully restores HP

#### ⚡ Energy Items
- **Energy Drink** (`energy_drink`) - Restores 25 energy
- **Mega Energy Drink** (`mega_energy_drink`) - Restores 50 energy

#### 💪 Buff Items
- **Attack Boost** (`attack_boost`) - Increases attack damage by 25% for 3 turns
- **Defense Boost** (`defense_boost`) - Reduces incoming damage by 25% for 3 turns
- **Critical Boost** (`critical_boost`) - Increases critical hit chance by 25% for 3 turns

#### ✨ Special Items
- **Cleanse** (`cleanse`) - Removes all negative status effects
- **Revive** (`revive`) - Revives a fainted character with 50% HP

---

## Super Admin Commands

### 🎁 Grant Items to Users
**Command:** `!grantitem @user <item_id> <amount>`

Grants battle items to a specific user. Useful for rewards, compensation, or testing.

**Examples:**
```
!grantitem @player health_potion 10
!grantitem @player mega_energy_drink 5
!grantitem @player revive 1
```

**What it does:**
- Adds the specified quantity of an item to the user's inventory
- Shows confirmation with the total amount the user now has
- Items can be used immediately in battles

---

### 🗑️ Remove Items from Users
**Command:** `!removeitem @user <item_id> <amount>`

Removes battle items from a specific user's inventory. Useful for fixing bugs or removing exploited items.

**Examples:**
```
!removeitem @player health_potion 5
!removeitem @player attack_boost 2
```

**What it does:**
- Removes the specified quantity from the user's inventory
- Cannot remove more items than the user has
- Shows the remaining quantity after removal

---

### 📦 View User Inventory
**Command:** `!viewinventory @user` or `!checkinventory @user`

Displays a user's complete battle item inventory with quantities.

**Example:**
```
!viewinventory @player
```

**What it shows:**
- All battle items the user owns
- Quantity of each item
- Total number of different item types
- Organized display with emojis and item names

**Use Cases:**
- Checking if a user has items before removing them
- Verifying item grants were successful
- Investigating user reports about missing items
- Auditing inventory for suspicious activity

---

### 🧹 Clear User Inventory
**Command:** `!clearinventory @user`

Removes ALL battle items from a user's inventory. Use with caution!

**Example:**
```
!clearinventory @player
```

**Warning:** This action removes every battle item the user owns. Use only when necessary, such as:
- Resetting a test account
- Fixing a severely bugged inventory
- Responding to user requests for a fresh start

---

### 📋 List All Available Items
**Command:** `!listitems`

Shows all available battle items in the system with their IDs, names, and costs.

**Example:**
```
!listitems
```

**What it shows:**
- Item IDs (needed for grant/remove commands)
- Item names and emojis
- Cost in coins/gems
- Organized by category (Healing, Energy, Buffs, Special)

**Use Cases:**
- Finding the correct item ID for grant/remove commands
- Reviewing all available items in the system
- Reference when helping users with item questions

---

## Item IDs Quick Reference

Use these IDs with `!grantitem` and `!removeitem` commands:

### Healing Items
- `health_potion` - 🧪 Health Potion (50 HP)
- `super_health_potion` - 💊 Super Health Potion (100 HP)
- `max_health_potion` - 🍷 Max Health Potion (Full HP)

### Energy Items
- `energy_drink` - 🥤 Energy Drink (25 energy)
- `mega_energy_drink` - ⚡ Mega Energy Drink (50 energy)

### Buff Items
- `attack_boost` - ⚔️ Attack Boost (+25% damage, 3 turns)
- `defense_boost` - 🛡️ Defense Boost (-25% damage taken, 3 turns)
- `critical_boost` - 💫 Critical Boost (+25% crit chance, 3 turns)

### Special Items
- `cleanse` - 🧼 Cleanse (Remove negative effects)
- `revive` - 💚 Revive (Revive fainted character, 50% HP)

---

## Best Practices

### When to Grant Items
1. **Event Rewards** - Give items as prizes for events or competitions
2. **Compensation** - Compensate users affected by bugs or downtime
3. **Testing** - Provide items to test accounts for battle testing
4. **Special Recognition** - Reward helpful community members

### When to Remove Items
1. **Bug Fixes** - Remove items obtained through exploits
2. **Duplicate Grants** - Remove accidentally granted duplicate items
3. **User Request** - Remove items if a user made a mistake

### When to Clear Inventory
1. **Test Account Reset** - Clear test accounts after testing
2. **Severe Bug** - Fix severely corrupted inventory data
3. **User Fresh Start** - Only if explicitly requested by user

### Safety Tips
1. Always use `!viewinventory` before removing items
2. Double-check the username when granting/removing items
3. Keep track of administrative actions in your admin log
4. For `!clearinventory`, confirm with the user first if possible
5. Use reasonable quantities when granting items (avoid giving thousands)

---

## How Players Use Battle Items

Players interact with battle items through these commands:
- `!shop` - View all available items for purchase
- `!buy <item_id>` - Purchase an item from the shop
- `!inventory` - View their own inventory (same as what you see with `!viewinventory`)
- During battles, items can be used with the item selection interface

---

## Troubleshooting

### "User hasn't started yet"
**Problem:** User needs to use `!start` command first
**Solution:** Ask the user to start their journey with `!start`

### "Invalid item ID"
**Problem:** Item ID is misspelled or doesn't exist
**Solution:** Use `!listitems` to see all valid item IDs

### "User doesn't have any items"
**Problem:** Trying to remove items the user doesn't own
**Solution:** Use `!viewinventory @user` to check what they have first

### Items not appearing in battles
**Problem:** Item may not be usable in battle (though all current items are)
**Solution:** Verify the item has `usableInBattle: true` in itemsSystem.js

---

## System Information

### Where Items Are Stored
- Items are stored in `itemsSystem.js`
- User inventories are stored in the database under `users[userId].inventory`
- Inventory format: `{ "item_id": quantity }`

### Adding New Items to the System
If you want to add new battle items to the game:
1. Edit `itemsSystem.js`
2. Add the new item to the `ITEMS` object
3. Define its properties (id, name, emoji, description, effect, cost, category)
4. Restart the bot
5. Use `!listitems` to verify it appears

---

## Related Commands

### Currency Management
- `!grant @user coins <amount>` - Grant coins
- `!grant @user gems <amount>` - Grant gems

### Character Management
- `!grantchar @user <character>` - Grant a character
- `!viewprofile @user` - View user profile (shows currency)

---

## Permission Requirements

All battle item admin commands require **Super Admin** status. Super Admins are hardcoded in the bot configuration:
- User ID: `1296110901057032202`
- User ID: `1296109674361520146`

Regular users and ZooAdmins cannot use these commands.

---

## Examples in Action

### Scenario 1: Event Prize
```
!grantitem @winner max_health_potion 3
!grantitem @winner revive 2
!grantitem @winner mega_energy_drink 5
```

### Scenario 2: Bug Compensation
```
!viewinventory @affected_user
!grantitem @affected_user health_potion 10
!grantitem @affected_user energy_drink 10
```

### Scenario 3: Fixing Exploit
```
!viewinventory @suspicious_user
!removeitem @suspicious_user attack_boost 999
```

### Scenario 4: Test Account Setup
```
!grantitem @testuser health_potion 99
!grantitem @testuser super_health_potion 99
!grantitem @testuser energy_drink 99
!grantitem @testuser attack_boost 50
```

---

## Summary

Battle items admin commands give you complete control over user inventories:
- ✅ Grant items for rewards and testing
- ✅ Remove items to fix issues
- ✅ View inventories for auditing
- ✅ Clear inventories when needed
- ✅ List all items for reference

Use these commands responsibly and always verify actions before executing them, especially when removing or clearing items!
