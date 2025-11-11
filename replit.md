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
- **Event System:** Daily rotating competitive events (Trophy Hunt, Crate Master, Drop Catcher) with real-time tracking and **automatic reward distribution**. Rewards are added directly to user accounts when events end - no claiming needed. Top 3 winners receive cage keys (5/3/1 respectively).
- **Admin Tools:** Commands for managing resources, characters, skins, and bot channels.
- **Key & Cage System:** Two-tier character unlock system with character-specific keys (1000 required to unlock) and cage keys (250 for random unlock). Top 3 event winners receive cage keys automatically. Includes !keys, !unlock, and !cage commands.

**System Design Choices:**
- **Modularity:** Core functionalities are separated into dedicated files.
- **Scalability:** Designed with MongoDB integration for production data persistence.
- **Data Backfilling:** Automatic backfilling for new data fields ensures compatibility.
- **Environment-based Configuration:** Uses environment variables for sensitive data and operational modes.
- **Data Persistence & Crash Safety:** Implemented dual-save system (`saveDataImmediate()` for critical operations, batched saves for telemetry) and graceful shutdown handlers to prevent data loss.
- **Error Handling & Reliability:** Comprehensive try-catch blocks and user-friendly error messages for robust operation.
- **Performance Optimization:** In-memory caching for skins (5-minute TTL) and MongoDB indexes for fast queries on users, events, and participants.

## Recent Changes (November 2025)
- **Removed:** Tutorial and Zoo Raids systems for improved performance and reduced complexity
- **Event Rewards:** Now automatically distributed when events end - no manual claiming required
- **Skin System:** Added in-memory caching and MongoDB migration script (migrateSkins.js)
- **Performance:** Created setupIndexes.js for MongoDB index optimization
- **Documentation:** Updated COMMANDS.md to reflect automatic reward distribution
- **Reward Persistence Fix:** All critical reward distributions now use `saveDataImmediate()` for guaranteed MongoDB persistence:
  - Personalized task completion rewards (personalizedTaskSystem.js)
  - Event rewards (eventSystem.js)
  - Admin grant commands (!grant, !grantchar)
  - Message-based crate rewards (every 25 messages)
  - Quest rewards and daily rewards already used immediate saves
- **Admin Commands:** Added `!pttasks` (list all 57 personalized tasks) and `!ptsendtask` (manually assign tasks by ID) for testing

## External Dependencies
- **Discord.js v14**: For Discord API interaction.
- **Node.js 20**: The runtime environment.
- **MongoDB**: Optional, but recommended for production data storage.