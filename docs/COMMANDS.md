# PlayBot Command Reference

## Getting Started

| Command | Aliases | Description |
|---------|---------|-------------|
| `!start` | `!begin`, `!register` | Begin your collection journey |
| `!help [command]` | `!h`, `!commands` | View available commands |
| `!profile [@user]` | `!p`, `!me`, `!stats` | View player profile |
| `!daily` | `!d` | Claim daily rewards |

## Collection

| Command | Aliases | Description |
|---------|---------|-------------|
| `!catch <code>` | `!c`, `!claim`, `!grab` | Catch a dropped character |
| `!collection [page]` | `!col`, `!inv`, `!chars` | View your characters |
| `!character <#/name>` | `!char`, `!info`, `!view` | View character details |
| `!select <#/name>` | `!choose`, `!equip` | Set active character |

## Economy

| Command | Aliases | Description |
|---------|---------|-------------|
| `!balance` | `!bal`, `!coins`, `!money` | Check your balance |
| `!gift @user <amount>` | `!give`, `!pay`, `!send` | Gift coins to another player |
| `!shop [page]` | `!store`, `!market` | View the shop |
| `!buy <item>` | `!purchase` | Purchase items |

## Battles

| Command | Aliases | Description |
|---------|---------|-------------|
| `!battle @user` | `!fight`, `!duel`, `!pvp` | Battle another player |

## Clans

| Command | Description |
|---------|-------------|
| `!clan` | View clan help |
| `!clan create <name> <tag>` | Create a new clan |
| `!clan join <name>` | Join an existing clan |
| `!clan leave` | Leave your current clan |
| `!clan info [name]` | View clan information |
| `!clan members` | View clan members |
| `!clan donate <amount>` | Donate to clan treasury |
| `!clan list` | View all server clans |

## Social

| Command | Aliases | Description |
|---------|---------|-------------|
| `!trade @user <your#> <their#>` | `!swap`, `!exchange` | Trade characters |
| `!leaderboard [type]` | `!lb`, `!top`, `!rankings` | View leaderboards |

### Leaderboard Types
- `coins` - Richest players (default)
- `gems` - Most gems
- `level` - Highest level
- `collection` - Most characters
- `battles` - Most battle wins
- `playcoins` - Global PlayCoins ranking

## Admin Commands

These commands require Admin permissions.

| Command | Description |
|---------|-------------|
| `!setup` | View server setup status |
| `!config` | Configure server settings |
| `!config prefix <new>` | Change command prefix |
| `!config currency name <name>` | Set currency name |
| `!config currency emoji <emoji>` | Set currency emoji |
| `!config drops enabled <true/false>` | Toggle drops |
| `!config drops interval <seconds>` | Set drop interval |
| `!setchannel <type> [#channel]` | Set feature channels |
| `!setrole <type> @role` | Configure permission roles |
| `!module` | View module status |
| `!module enable <module>` | Enable a module |
| `!module disable <module>` | Disable a module |
| `!createcharacter` | Create custom characters |

### Channel Types
- `drops` - Where character drops appear
- `events` - Event announcements
- `announcements` - Bot announcements
- `logs` - Admin action logs

### Role Types
- `admin` - Full bot control
- `moderator` - User moderation
- `vip` - Special perks

### Modules
- `collection` - Character collection system
- `battles` - Battle system
- `clans` - Clan system
- `trading` - Trading system
- `drops` - Drop system
- `events` - Events system
- `quests` - Quest system
- `shop` - Shop system
- `leaderboards` - Leaderboard system

## Currency Types

### Server Currency (Isolated per server)
- **Coins** - Main server currency, earned through gameplay
- **Gems** - Premium server currency

### Global Currency (Cross-server)
- **PlayCoins** - Earned through activities, works everywhere
- **PlayGems** - Premium global currency

Note: Server currencies cannot be transferred between servers. Global currencies are shared across all servers but cannot be directly converted from server currencies.
