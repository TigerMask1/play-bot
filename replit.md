# Discord Character Collection Bot

## Overview
This project is a Discord bot designed to offer a comprehensive character collection experience. It features over 50 unique characters with stats, leveling, and a skin system. The bot integrates a full economy with multiple currencies, a dynamic battle system, interactive elements like crates and random drops, player trading, and competitive daily events. Its primary goal is to enhance community engagement and provide a persistent, engaging virtual world for users.

## User Preferences
The agent should prioritize iterative development, frequently asking for feedback and approval before implementing major changes. Communication should be clear and concise, avoiding jargon where possible. For coding, a preference for modular, readable, and well-documented code is essential. The agent should always provide detailed explanations for proposed changes or new features. Do not make changes to the `dataManager.js` or `mongoManager.js` files without explicit instruction, as these are critical for data integrity across environments.

## System Architecture
The bot is built on Discord.js v14 and Node.js 20, utilizing a dual-mode data storage system (JSON for testing, MongoDB for production) with a one-command migration script.

**UI/UX Decisions:**
- **Visuals:** Character skins displayed in embeds, paginated user profiles with progress bars, and custom profile picture selection from owned characters.
- **Progress Bars:** 12-slot colored emoji progress bars (🟩🟦🟨🟧🟥⬜) with percentage display for token collection.
- **Information Display:** Extensive use of Discord embeds and emoji integration for characters and items.

**Technical Implementations:**
- **Character System:** 50+ unique characters with tokens, special traits, moves, HP scaling, levels, and owned skins.
- **Economy & Currency:** Coins, Gems, Trophies, and Character-specific Tokens, with daily login and message-based rewards.
- **Crate System:** Multi-tiered crates (Gold, Emerald, Legendary, Tyrant, Bronze, Silver) offering characters, tokens, and coins, including a "pending tokens" system and interactive opening with customizable GIFs.
- **Drop System:** Random token, coin, and gem drops every 20 seconds, claimable by the first user, optimized to reduce API calls by leaving uncaught drops in chat. Includes a paid drop system for non-main servers and smart pausing.
- **Trading System:** Secure player-to-player trading with dual confirmation.
- **Battle System:** Turn-based combat with energy management, 51 unique passive abilities, critical hits, status effects, and consumable items. Includes an AI battle system.
- **Inventory:** MongoDB-compatible inventory for battle items.
- **Event System:** Daily rotating competitive events (Trophy Hunt, Crate Master, Drop Catcher) with real-time tracking, automatic reward distribution, and manual/scheduled control.
- **Permission System:** Three-tier role-based access control:
  - **Super Admin:** Hardcoded bot owners with full access to all commands globally
  - **ZooAdmin Role:** Discord role (case insensitive) for server customization - allows server admins to configure channels, activate drops, customize emojis/GIFs
  - **Bot Admin (Legacy):** Database-stored admins for event management (being phased out)
- **Admin Tools:** Commands for managing resources, characters, skins, custom emojis, chest GIFs, and bot channels, along with server management and bot update broadcasting.
- **Key & Cage System:** Two-tier character unlock system using character-specific keys and random cage keys obtained from events.
- **Custom Emojis:** System for bot-wide custom character emojis, stored in MongoDB and applied automatically.
- **Mail System:** Inbox clearing functionality for users.
- **Help Documentation:** Comprehensive in-bot help and command reference.

**System Design Choices:**
- **Modularity & Scalability:** Core functionalities are separated into dedicated files, designed with MongoDB integration for production.
- **Data Management:** Automatic data backfilling, environment-based configuration, and a dual-save system (`saveDataImmediate()` for critical operations, batched saves for telemetry) with graceful shutdown handlers.
- **Error Handling:** Comprehensive error handling with user-friendly messages.
- **Performance Optimization:** In-memory caching for skins, MongoDB indexes for fast queries, and optimized drop system to minimize Discord API calls.
- **Security:** Critical economy/admin commands restricted to super-admins. Server customization requires ZooAdmin role for safe delegation of bot management to trusted server members.
- **Multi-Server Architecture:** Supports deployment across multiple Discord servers, differentiating features like drop rates, clan wars, and promotional messages between a "Main Server" and "Non-Main Servers."

## External Dependencies
- **Discord.js v14**: For all Discord API interactions.
- **Node.js 20**: The JavaScript runtime environment.
- **Express**: Used for a lightweight HTTP server, primarily for health checks.
- **MongoDB**: Utilized for production data persistence and scalability.