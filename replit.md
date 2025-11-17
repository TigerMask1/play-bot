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
- **Drop System:** Random token, coin, and gem drops every 20 seconds (main server) or 30 seconds (non-main servers), claimable by the first user, optimized to reduce API calls by leaving uncaught drops in chat. Includes a paid drop system for non-main servers (100 gems for 3 hours) with smart pausing:
  - **Smart Pausing:** Auto-pauses after 30 uncaught drops to avoid spam
  - **Inactivity Pausing:** Auto-pauses drops after 15 minutes of no commands being used in a server. Resumes automatically when any command is used. The 3-hour paid timer continues running even when paused due to inactivity.
  - **Timer Persistence:** The 3-hour timer continues running even when drops are paused
  - **Drop Revival:** Anyone using `!c <code>` revives paused drops, even if they don't catch the drop or own the character
  - **Community Feature:** Players can help revive drops for their server even without being able to claim the reward
  - **Infinite Drops Override:** Super admins can grant unlimited free drops to any server using `!setinfinitedrops on`, bypassing the paid system entirely
- **Trading System:** Secure player-to-player trading with dual confirmation.
- **Battle System:** Turn-based combat with energy management, 51 unique passive abilities, critical hits, status effects, and consumable items. Includes an AI battle system.
- **Inventory:** MongoDB-compatible inventory for battle items.
- **Event System:** Daily rotating competitive events (Trophy Hunt, Crate Master, Drop Catcher) with real-time tracking, automatic reward distribution, and manual/scheduled control.
- **Daily Giveaway System:** Automated daily giveaway with participant registration, configurable prizes (coins, gems, crates), scheduled draws, and winner tracking. Main server only. Features:
  - **Daily Registration:** Users register each day with `!giveaway join`
  - **Automatic Draws:** Scheduled draws at configurable time (default 20:00)
  - **Configurable Prizes:** Super admins can set coin, gem, and crate rewards
  - **Winner History:** Tracks last 30 daily winners
  - **Persistence:** Full state preservation across restarts, including participants and draw history
- **Daily Lottery System:** Player-funded lottery with ticket purchases, prize pool accumulation, and winner selection. Main server only. Features:
  - **Ticket Purchases:** Players buy tickets with gems (configurable entry fee)
  - **Prize Pool:** Grows with each ticket purchase, winner takes all
  - **Multiple Entries:** Configurable max tickets per person (default 5)
  - **Automatic Draws:** Scheduled draws at configurable time (default 21:00)
  - **Fair Chances:** More tickets = higher win probability
  - **Winner History:** Tracks last 30 daily winners with prize amounts
  - **Persistence:** Full state preservation including prize pool and participant tickets
- **Permission System:** Three-tier role-based access control:
  - **Super Admin:** Hardcoded bot owners with full access to all commands globally
  - **ZooAdmin Role:** Discord role (case insensitive) for server customization - allows server admins to configure channels, activate drops, customize emojis/GIFs
  - **Bot Admin (Legacy):** Database-stored admins for event management (being phased out)
- **Admin Tools:** Commands for managing resources, characters, skins, custom emojis, chest GIFs, bot channels, server infinite drops override, and bot update broadcasting.
- **Key & Cage System:** Two-tier character unlock system using character-specific keys and random cage keys obtained from events.
- **Custom Emojis:** System for bot-wide custom character emojis, stored in MongoDB and applied automatically.
- **Battle Pass System:** Comprehensive progression system with 30 tiers, XP earning from various activities, seasonal resets, and valuable rewards. Features:
  - **XP Sources:** Battles, drops, crates, quests, daily claims, events, and level-ups
  - **Tier Progression:** Automatic tier advancement as XP is earned (9,570 XP for tier 30)
  - **Reward System:** Coins, gems, shards, and crates at each tier
  - **Claim System:** Individual tier claims or bulk claiming
  - **Season Management:** Persistent season data across bot restarts, admin-controlled season resets
  - **Balanced Pacing:** Achievable progression for active players (25-50 XP per battle)
- **Profile Emote System:** Custom profile decorations granted by admins for achievements and events. Features:
  - **MongoDB Storage:** Emotes stored with CDN-ready base64 encoding
  - **Size Validation:** 5MB maximum per emote for performance
  - **Collection System:** Users can own multiple emotes and switch between them
  - **Automatic Cleanup:** Orphaned emote references removed when emotes are deleted
  - **Admin Controls:** Upload, grant, and manage emotes with super admin privileges
- **Character Nickname System:** Players can set custom names for their characters while preserving original identities. Features:
  - **Dual Display:** Shows both nickname and original name (e.g., "Shadow Hunter (Nix)")
  - **Per-Character:** Each character can have its own unique nickname (1-32 characters)
  - **Profile Integration:** Nicknames display in profiles, battles, and character lists
  - **Easy Management:** Simple commands to set and reset nicknames
- **Mail System:** Inbox clearing functionality for users.
- **Help Documentation:** Comprehensive in-bot help and command reference.
- **New Player Onboarding:** Automated welcome guide sent via DM to first-time players when they select their starter character. The guide covers battle system, economy, drops, crates, events, and all essential commands.

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