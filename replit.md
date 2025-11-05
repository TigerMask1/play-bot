# Discord Character Collection Bot

## Overview
This project is a Discord bot offering a rich character collection experience with over 50 unique characters, each having stats, leveling, and a unique skin system. It includes a comprehensive economy with multiple currencies, a dynamic battle system, interactive features like crates, random drops, player trading, and competitive daily events. The bot aims to foster community engagement and provide an engaging, persistent virtual world.

## User Preferences
The agent should prioritize iterative development, frequently asking for feedback and approval before implementing major changes. Communication should be clear and concise, avoiding jargon where possible. For coding, a preference for modular, readable, and well-documented code is essential. The agent should always provide detailed explanations for proposed changes or new features. Do not make changes to the `dataManager.js` or `mongoManager.js` files without explicit instruction, as these are critical for data integrity across environments.

## System Architecture
The bot is built on Discord.js v14 and Node.js 20, using a dual-mode data storage system (JSON for testing, MongoDB for production) with a one-command migration script.

**UI/UX Decisions:**
- **Character Skins:** Visual skins for characters displayed in embeds, with an admin system for custom skins.
- **Paginated Profiles:** User profiles and character details are paginated with progress bars.
- **Embeds for Information:** Extensive use of Discord embeds for displaying game information.
- **Emoji Integration:** Characters and items are often represented with emojis.

**Technical Implementations:**
- **Character System:** 50+ unique characters with specific tokens, a randomly assigned ST (Special Trait) stat, three predetermined moves, HP scaling, levels, and owned skins.
- **Economy & Currency:** Coins, Gems, Trophies, and Character-specific Tokens, supported by daily login and message-based rewards.
- **Crate System:** Four tiers of crates (Gold, Emerald, Legendary, Tyrant, plus Bronze and Silver) offering varying probabilities of characters, tokens, and coins, including a "pending tokens" system.
- **Drop System:** Random drops (tokens, coins, gems) spawn every 20 seconds, claimable by the first user.
- **Trading System:** Secure player-to-player trading with dual confirmation.
- **Battle System:** Turn-based combat with energy management, 51 unique character passive abilities, critical hits (15% base chance), status effects (burn, freeze, poison, paralyze, stun, regeneration), and consumable battle items. Includes an interactive shop for battle items and an AI battle system with varying difficulties.
- **Items & Inventory:** MongoDB-compatible inventory for tracking battle items.
- **Event System:** Daily rotating competitive events (Trophy Hunt, Crate Master, Drop Catcher) with real-time tracking and rewards.
- **Admin Tools:** Commands for managing resources, characters, skins, and bot channels.
- **Zoo Raids System:** Cooperative multiplayer boss battles with hourly spawns, turn-based combat, damage leaderboards, and tiered rewards. Server-specific raids (Server ID: 1430516117851340893) spawn in designated channel (ID: 1435599092679049319) every hour.
- **Key & Cage System:** Two-tier character unlock system with character-specific keys (1000 required to unlock) and cage keys (250 for random unlock). Players earn 1 character key per raid; keys auto-convert to gems (1:1) for owned characters. Top 3 event winners receive cage keys (5/3/1 respectively). Includes !keys, !unlock, and !cage commands.
- **Tutorial System:** Interactive 8-stage tutorial for new players covering all game mechanics, with keyword-based progression and smart mention detection for help.

**System Design Choices:**
- **Modularity:** Core functionalities are separated into dedicated files.
- **Scalability:** Designed with MongoDB integration for production data persistence.
- **Data Backfilling:** Automatic backfilling for new data fields ensures compatibility.
- **Environment-based Configuration:** Uses environment variables for sensitive data and operational modes.
- **Data Persistence & Crash Safety:** Implemented dual-save system (`saveDataImmediate()` for critical operations, batched saves for telemetry) and graceful shutdown handlers to prevent data loss.
- **Error Handling & Reliability:** Comprehensive try-catch blocks and user-friendly error messages for robust operation.

## External Dependencies
- **Discord.js v14**: For Discord API interaction.
- **Node.js 20**: The runtime environment.
- **MongoDB**: Optional, but recommended for production data storage.