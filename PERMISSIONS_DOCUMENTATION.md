# ZooBot Permissions Documentation

## Overview
ZooBot uses a three-tier permission system to control access to different commands and features.

## Permission Tiers

### 1. Super Admin (Bot Owners)
Hardcoded bot owners with full access to all commands and features across all servers.

**Super Admin User IDs:**
- `1296110901057032202`
- `1296109674361520146`

### 2. ZooAdmin (Server Customization Role)
**Role Name:** `ZooAdmin` (case insensitive)

Users with this role can customize their server's bot settings and manage server-specific features. This is the primary way for server administrators to manage the bot in their server.

**How to Setup:**
1. Create a Discord role called "ZooAdmin" (any case: zooadmin, ZOOADMIN, ZooAdmin, etc.)
2. Assign this role to users who should manage the bot
3. These users can now run all server customization commands

### 3. Bot Admin (Legacy System)
Database-stored admins that can be added by Super Admins. This system is being phased out in favor of the ZooAdmin role for most commands.

### 4. Regular Users
All other users can access standard gameplay commands.

---

## Command Reference by Permission Level

### Super Admin Commands (Bot Owners Only)

#### User Management
- `!delete @user` / `!deleteuser @user` - Delete a user's account from the database
- `!grant <user> <coins/gems> <amount>` - Grant coins or gems to a user
- `!grantchar <user> <character name>` - Grant a specific character to a user

#### Skin Management
- `!addskin <character> <skin_name> <image_url>` - Add a new skin to a character
- `!grantskin <user> <character> <skin_name>` - Grant a skin to a user
- `!revokeskin <user> <character> <skin_name>` - Remove a skin from a user
- `!deleteskin <character> <skin_name>` - Delete a skin permanently
- `!uploadskin <character> <skin_name>` - Upload/update a skin image

#### Battle Items Management (Consumables)
- `!grantitem @user <item_id> <amount>` - Grant consumable battle items to a user
- `!removeitem @user <item_id> <amount>` - Remove consumable battle items from a user
- `!viewinventory @user` / `!checkinventory @user` - View a user's consumable battle item inventory
- `!clearinventory @user` - Clear all consumable battle items from a user's inventory
- `!listitems` - List all available consumable battle items with their IDs
  - **Note:** See BATTLE_ITEMS_ADMIN_GUIDE.md for detailed usage and examples

#### Equipment Items Management (Silver/Gold/Legendary)
- `!grantequipment @user <equipment_id> <copies>` / `!grantequip` - Grant equipment items to a user
- `!removeequipment @user <equipment_id> <copies>` / `!removeequip` - Remove equipment items from a user
- `!viewequipment @user` / `!checkequipment @user` - View a user's equipment collection
- `!clearequipment @user` - Clear all equipment items from a user's collection
- `!listequipment` / `!listequip` - List all available equipment items with their IDs
  - **Note:** See EQUIPMENT_ADMIN_GUIDE.md for detailed usage and examples

#### Server Management
- `!servers` / `!serverlist` - List all servers the bot is in
- `!removeserver <server_id>` / `!leaveserver <server_id>` - Remove bot from a server
- `!reset` - Reset bot data (use with extreme caution)

#### Communication
- `!postupdate <message>` / `!botupdate <message>` - Post an update to all server update channels
- `!sendmail <title> | <message> | <rewards>` - Send mail to all users
- `!postnews <title> | <message>` - Post news to all users

#### System Settings
- `!settrophies <user> <amount>` - Set a user's trophy count
- `!setbattle` - Configure battle settings
- `!setevent` - Configure event settings

---

### ZooAdmin Commands (Server Customization)

**Requirement:** Must have a role named "ZooAdmin" (case insensitive) in the server

#### Server Setup
- `!setup` - Display server setup instructions and status
- `!setdropchannel #channel` - Set where character drops will appear
- `!seteventschannel #channel` - Set where events will be announced
- `!setupdateschannel #channel` - Set where bot updates will be posted

#### Drop Management
- `!paydrops` / `!activatedrops` - Activate drops for 3 hours (costs 100 gems)
  - **Note:** Only ZooAdmins can spend gems to activate drops for the server

#### Customization
- `!setemoji <character> <emoji>` - Set custom emoji for a character
  - Example: `!setemoji Nix 🦊`
  - Example: `!setemoji Nix 1234567890` (custom Discord emoji ID)
- `!setchestgif <type> <url>` / `!setcrategif <type> <url>` - Set custom GIF for chest openings
  - Types: bronze, silver, gold, emerald, legendary, tyrant
  - Example: `!setchestgif gold https://media.giphy.com/media/example/giphy.gif`

---

### Bot Admin Commands (Legacy - Being Phased Out)

**Note:** These commands still require Bot Admin status, which can only be granted by Super Admins. Most functionality has moved to ZooAdmin.

#### Admin Management
- `!addadmin @user` - Add a user as a bot admin (Super Admins or existing Bot Admins)
- `!removeadmin @user` - Remove a bot admin (Super Admins only)

#### Event Management
- `!startevent` - Start an event manually
- `!stopevent` - Stop an event manually
- `!eventschedule` - Manage event schedules (with subcommands: enable, disable, settime)

---

### Regular User Commands (Everyone)

#### Getting Started
- `!start` - Begin your ZooBot journey and select your starter character
- `!profile` - View your profile, stats, and collection
- `!help` - Display help information
- `!overview` / `!systems` - View information about game systems

#### Character Management
- `!select <character>` - Select a character from your collection
- `!char` / `!character` - View your currently selected character
- `!release <character>` / `!leave <character>` - Release a character from your collection
- `!i <character>` / `!info <character>` - View detailed information about a character
- `!c <character>` - Catch a dropped character

#### Progression
- `!levelup` - Level up your selected character
- `!boost <character>` - Boost a character's stats
- `!daily` - Claim your daily reward
- `!quests` - View available quests
- `!quest <quest_name>` - View details of a specific quest
- `!claim <quest_name>` - Claim quest rewards

#### Inventory & Shop
- `!shop` - Open the shop
- `!crate` - View your crate inventory
- `!opencrate <type>` / `!openchest <type>` - Open a crate (bronze, silver, gold, emerald, legendary, tyrant)
- `!pickcrate <type>` / `!pickchest <type>` - Interactive crate opening experience
- `!shards` - View your character shards
- `!craft <character>` - Craft a character from shards
- `!keys` - View your keys
- `!unlock <character>` - Unlock a character with keys
- `!cage` - Open a random cage

#### Skins
- `!equipskin <character> <skin_name>` - Equip a skin to a character
- `!setprofilepic <character>` / `!setpfp <character>` - Set your profile picture character

#### Social & Competition
- `!t <user>` / `!trade <user>` - Initiate a trade with another user
- `!b <user>` / `!battle <user>` - Challenge another user to a battle
- `!leaderboard` / `!lb` - View leaderboards
- `!clan` / `!clanprofile` - View your clan profile
- `!clans` / `!clanleaderboard` - View clan leaderboard
- `!joinclan` - Join your server's clan
- `!leaveclan` - Leave your current clan
- `!donate <coins/gems/trophies> <amount>` - Donate to your clan

#### Information & Status
- `!dropstatus` - Check if drops are active and time remaining
- `!event` - View current event information
- `!news` - View latest news
- `!mail` / `!mailbox` - View your mail
- `!claimmail` - Claim mail rewards
- `!clearmail` - Clear claimed mail
- `!botinfo` - View bot information and stats
- `!history` - View your activity history (Administrator permission required)

---

## Setting Up ZooAdmin in Your Server

### Step 1: Create the Role
1. Go to Server Settings → Roles
2. Click "Create Role"
3. Name it "ZooAdmin" (case doesn't matter)
4. Set appropriate permissions (the bot doesn't require specific Discord permissions, just the role name)

### Step 2: Assign the Role
1. Right-click on a user
2. Select "Roles"
3. Check "ZooAdmin"

### Step 3: Use the Commands
Users with the ZooAdmin role can now:
- Run `!setup` to start the setup process
- Configure channels for drops, events, and updates
- Customize emojis and GIFs
- Activate drops for the server

---

## Frequently Asked Questions

### Q: What happened to the Bot Admin system?
A: The Bot Admin system still exists but is being phased out. Most server customization features now use the ZooAdmin role, which is easier to manage using Discord's native role system.

### Q: Can I have multiple ZooAdmins?
A: Yes! Anyone with the ZooAdmin role can manage the bot. Assign it to as many trusted users as needed.

### Q: Does the ZooAdmin role name need to be exactly "ZooAdmin"?
A: No, it's case insensitive. "zooadmin", "ZOOADMIN", "ZooAdmin", or any other capitalization will work.

### Q: Can ZooAdmins add other ZooAdmins?
A: ZooAdmins don't add other ZooAdmins directly. Server administrators assign the Discord role to other users.

### Q: What's the difference between Super Admin, Bot Admin, and ZooAdmin?
- **Super Admin**: Bot owners with global access to all commands across all servers (hardcoded)
- **Bot Admin**: Legacy database-stored admins (being phased out)
- **ZooAdmin**: Server role for managing bot settings in your specific server (recommended)

### Q: Who can activate drops?
A: Only users with the ZooAdmin role can pay gems to activate drops for non-main servers. The main server has unlimited drops.

---

## Permission Hierarchy

```
Super Admin (Bot Owners)
    ↓ (has access to everything below)
ZooAdmin (Server Customization)
    ↓ (only for server-specific settings)
Bot Admin (Legacy)
    ↓ (limited to event management)
Regular Users (Everyone)
```

---

## Migration Guide from Bot Admin to ZooAdmin

If your server was using the old Bot Admin system:

1. **Create the ZooAdmin role** in your server
2. **Assign it** to users who previously had Bot Admin status
3. **Keep Bot Admin** for now if you need event management features
4. **Contact bot owner** if you need to remove Bot Admin status

Most commands have been moved to the ZooAdmin system for easier management.

---

## Support

For issues or questions:
- Contact Super Admins
- Join the main server for support
- Check `!help` for command usage

Last Updated: November 15, 2025
