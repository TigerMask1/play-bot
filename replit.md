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
- **Enhanced Visual Progress Bars:** 12-slot colored emoji progress bars (🟩🟦🟨🟧🟥⬜) with percentage display for token collection tracking.
- **Profile Customization:** Players can choose which owned character displays as their profile picture (separate from battle selection).
- **Embeds for Information:** Extensive use of Discord embeds for displaying game information.
- **Emoji Integration:** Characters and items are often represented with emojis.

**Technical Implementations:**
- **Character System:** 50+ unique characters with specific tokens, a randomly assigned ST (Special Trait) stat, three predetermined moves, HP scaling, levels, and owned skins.
- **Economy & Currency:** Coins, Gems, Trophies, and Character-specific Tokens, supported by daily login and message-based rewards.
- **Crate System:** Four tiers of crates (Gold, Emerald, Legendary, Tyrant, plus Bronze and Silver) offering varying probabilities of characters, tokens, and coins, including a "pending tokens" system.
- **Drop System:** Random drops (tokens, coins, gems) spawn every 20 seconds, claimable by the first user. **Optimized** to reduce API calls - uncaught drops are left in chat instead of being deleted (saves 4 API calls per uncaught drop).
- **Trading System:** Secure player-to-player trading with dual confirmation.
- **Battle System:** Turn-based combat with energy management, 51 unique character passive abilities, critical hits (15% base chance), status effects (burn, freeze, poison, paralyze, stun, regeneration), and consumable battle items. Includes an interactive shop for battle items and an AI battle system with varying difficulties.
- **Items & Inventory:** MongoDB-compatible inventory for tracking battle items.
- **Event System:** Daily rotating competitive events (Trophy Hunt, Crate Master, Drop Catcher) with real-time tracking and **automatic reward distribution**. Rewards are added directly to user accounts when events end - no claiming needed. Top 3 winners receive cage keys (5/3/1 respectively).
- **Admin Tools:** Commands for managing resources, characters, skins, custom emojis, chest GIFs, and bot channels.
- **Key & Cage System:** Two-tier character unlock system with character-specific keys (1000 required to unlock) and cage keys (250 for random unlock). Top 3 event winners receive cage keys automatically. Includes !keys, !unlock, and !cage commands.

**System Design Choices:**
- **Modularity:** Core functionalities are separated into dedicated files.
- **Scalability:** Designed with MongoDB integration for production data persistence.
- **Data Backfilling:** Automatic backfilling for new data fields ensures compatibility.
- **Environment-based Configuration:** Uses environment variables for sensitive data and operational modes.
- **Data Persistence & Crash Safety:** Implemented dual-save system (`saveDataImmediate()` for critical operations, batched saves for telemetry) and graceful shutdown handlers to prevent data loss.
- **Error Handling & Reliability:** Comprehensive try-catch blocks and user-friendly error messages for robust operation.
- **Performance Optimization:** In-memory caching for skins (5-minute TTL), MongoDB indexes for fast queries on users, events, and participants, and optimized drop system that minimizes Discord API calls.

## Recent Changes (November 2025)
- **Custom Emoji System & Interactive Chest Opening (November 14, 2025):**
  - **Custom Emoji Support:** Full custom emoji system allowing bot-wide character emojis
    - MongoDB collection `emoji_assets` stores custom Discord emoji IDs per character
    - Admin command `!setemoji <character> <emojiID>` to set custom emojis
    - Data-layer hydration applies custom emojis automatically on startup and character creation
    - Emojis work across ALL servers where the bot is present
    - Backwards compatible - falls back to unicode emojis if no custom emoji set
  - **Interactive Chest Opening System:** Two-step chest opening with customizable GIFs
    - Command `!pickcrate <type>` to select a chest → bot shows ready GIF embed
    - 2-minute session timer before user must type `!opencrate` to reveal rewards
    - MongoDB collection `crate_visuals` stores customizable GIF URLs per chest type
    - Admin command `!setchestgif <type> <gifURL>` to customize chest opening animations
    - Default GIFs provided for all chest types (bronze, silver, gold, emerald, legendary, tyrant)
    - Session tracking prevents multiple simultaneous chest openings per user
  - **Technical Implementation:**
    - emojiAssetManager.js: Manages emoji caching, MongoDB persistence, and application
    - chestInteractionManager.js: Session management with auto-expiry and GIF visuals
    - Both systems fully integrated with existing data layer and save pipeline
- **Visual Enhancements & Player Documentation (November 14, 2025):**
  - **Enhanced Progress Bars:** Implemented colorful 12-square visual progress bars using emoji indicators (🟩🟦🟨🟧🟥⬜)
    - Color-coded based on percentage: Red (0-24%), Orange (25-49%), Yellow (50-74%), Blue (75-99%), Green (100%)
    - Displays alongside percentage for easy at-a-glance progress tracking
  - **Profile Customization:** Added `!setprofilepic` / `!setpfp` command
    - Players can now choose which owned character displays as their profile picture
    - Profile picture is separate from selected battle character
    - Shows character's current equipped skin in profile thumbnail
    - Graceful fallback: resets to selected character if profile character is traded/released
  - **Data Layer:** Added `profileDisplayCharacter` field with automatic backfilling for existing users
  - **Comprehensive Documentation:** Created PLAYER_GUIDE.md (500+ lines)
    - Step-by-step tutorials for beginners
    - Advanced strategies for experienced players
    - Complete command reference covering all 11 major game systems
    - FAQs, pro tips, and visual examples
    - Validated against actual code implementation for accuracy
- **Performance Optimization & Discord Activity Removal (November 14, 2025):**
  - **REMOVED:** All Discord Activity related code to reduce complexity and server load
    - Deleted activity folder, Socket.IO integration, arena routes, and all activity-related files
    - Removed slash commands: `/arena`, `/launch`
    - Removed dependencies: `@discord/embedded-app-sdk`, `socket.io` (saved 34 npm packages)
  - **Drop System Optimization:** Eliminated 4 Discord API calls per uncaught drop
    - Previous behavior: fetch old message → delete old message → send vanish message → delete vanish message
    - New behavior: uncaught drops simply remain in chat (saves bandwidth and reduces rate limit issues)
  - **Simplified Express Server:** Now only serves health check endpoint (`/health`)
  - **Result:** Significantly reduced server load and Discord API usage
- **Removed:** Tutorial, Zoo Raids, and Discord Activity systems for improved performance and reduced complexity
- **Event System Complete Overhaul (November 11, 2025):**
  - **CRITICAL FIX:** Rewrote event reward distribution to use same proven pattern as personalized tasks
  - **Crate Rewards:** Winners now receive crates (1 legendary for 1st, 1 emerald for 2nd, 2 gold for 3rd)
  - **Admin Commands:** Added `!startevent`, `!stopevent`, `!eventschedule` for manual control
  - **Automatic Scheduling:** Events auto-start at 5:30 AM IST daily (configurable)
  - **MongoDB-First:** Rewards saved directly to database using working personalized tasks pattern
  - See EVENT_SYSTEM_UPGRADE.md for complete details
- **Skin System:** Added in-memory caching and MongoDB migration script (migrateSkins.js)
- **Performance:** Created setupIndexes.js for MongoDB index optimization
- **Documentation:** Updated COMMANDS.md to reflect automatic reward distribution
- **Reward Persistence Fix:** All critical reward distributions now use `saveDataImmediate()` for guaranteed MongoDB persistence:
  - Personalized task completion rewards (personalizedTaskSystem.js)
  - Event rewards (eventSystem.js) - FIXED to use working pattern
  - Admin grant commands (!grant, !grantchar)
  - Message-based crate rewards (every 25 messages)
  - Quest rewards and daily rewards already used immediate saves
- **Admin Commands:** Added `!pttasks` (list all 57 personalized tasks) and `!ptsendtask` (manually assign tasks by ID) for testing

## External Dependencies
- **Discord.js v14**: For Discord API interaction.
- **Node.js 20**: The runtime environment.
- **Express**: Lightweight HTTP server for health checks.
- **MongoDB**: Optional, but recommended for production data storage.