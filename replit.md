# Discord Character Collection Bot

## Overview
This project is a Discord bot designed to offer a rich character collection experience within Discord. Users can collect over 50 unique characters, each with individual stats, leveling progression, and a unique skin system. The bot incorporates a comprehensive economy with multiple currencies, a dynamic battle system, and interactive features like crates, random drops, and player trading. A key ambition is to foster community engagement through competitive daily events and an evolving character ecosystem, providing an engaging and persistent virtual world for players.

## User Preferences
The agent should prioritize iterative development, frequently asking for feedback and approval before implementing major changes. Communication should be clear and concise, avoiding jargon where possible. For coding, a preference for modular, readable, and well-documented code is essential. The agent should always provide detailed explanations for proposed changes or new features. Do not make changes to the `dataManager.js` or `mongoManager.js` files without explicit instruction, as these are critical for data integrity across environments.

## System Architecture
The bot is built on Discord.js v14 and Node.js 20, featuring a dual-mode data storage system that supports both JSON files for testing and MongoDB for production, with a one-command migration script (`npm run migrate`).

**UI/UX Decisions:**
- **Character Skins:** Each character features visual skins displayed in embeds, with a default skin for all characters and an admin system for adding unlimited custom skins. Players can equip owned skins, enhancing visual engagement.
- **Paginated Profiles:** User profiles and character details are paginated with progress bars for better readability.
- **Embeds for Information:** Extensive use of Discord embeds for displaying character details, battle information, crate contents, and event results.
- **Emoji Integration:** Characters and items are often represented with emojis for quick identification.

**Technical Implementations:**
- **Character System:** 50+ unique characters, each with character-specific tokens, a randomly assigned ST (Special Trait) stat (1-100%), and three predetermined moves (one special, two ST-tier). HP scales with ST, and characters have individual levels and owned skins.
- **Economy & Currency:** Implements Coins (primary), Gems (premium), Trophies (competitive ranking), and Character-specific Tokens. Includes daily login rewards and message-based rewards to encourage activity.
- **Crate System:** Four tiers of crates (Gold, Emerald, Legendary, Tyrant) offering varying probabilities of characters, tokens, and coins. Includes a "pending tokens" system for tokens received before character ownership.
- **Drop System:** Random drops spawn every 20 seconds, offering character-specific tokens, coins, or gems, claimable by the first user.
- **Trading System:** Secure player-to-player trading with dual confirmation and a timeout.
- **Battle System:** Turn-based combat with Pokemon-style mechanics. Features battle invites, character selection, character-specific moves (with cooldowns for special moves), a damage formula scaling with level and ST, and trophy rewards.
- **Event System:** Daily rotating competitive events (Trophy Hunt, Crate Master, Drop Catcher) with real-time progress tracking, competitive rewards, and automatic announcements.
- **Admin Tools:** Extensive admin commands for managing resources, characters, skins, and setting up bot channels.

**System Design Choices:**
- **Modularity:** Core functionalities are separated into dedicated files (e.g., `levelSystem.js`, `crateSystem.js`, `battleSystem.js`).
- **Scalability:** Designed with MongoDB integration for production-level data persistence and scalability.
- **Data Backfilling:** Automatic backfilling for new data fields (like ST, moves, HP, skins) ensures compatibility with existing player data.
- **Environment-based Configuration:** Uses environment variables for sensitive data (`DISCORD_BOT_TOKEN`, `MONGODB_URI`) and operational modes (`USE_MONGODB`).

## External Dependencies
- **Discord.js v14**: Primary library for interacting with the Discord API.
- **Node.js 20**: The runtime environment for the bot.
- **MongoDB**: Optional, but recommended for production data storage. Requires a `MONGODB_URI` connection string.