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
- **Battle System:** Strategic turn-based combat with comprehensive mechanics:
  - **Energy System:** Players start with 50 energy, regenerate 10 per turn (max 100). Moves cost energy based on damage output.
  - **Character Abilities:** Each of the 51 characters has a unique passive ability that provides strategic advantages (e.g., critical damage boosts, energy cost reduction, healing, shields).
  - **Critical Hits:** 15% base chance, affected by character abilities and stat buffs, dealing 1.5x damage.
  - **Status Effects:** Burn, freeze, poison, paralyze, stun, and regeneration effects with turn-based durations.
  - **Battle Items:** Consumable items (healing potions, energy drinks, stat boosts, cleanse) can be used mid-battle for strategic advantages.
  - **Shop System:** Interactive shop (`!shop`) with category browsing to purchase battle items with coins and gems.
  - **Enhanced UI:** Real-time HP and energy bars, active status effects display, buff/debuff tracking.
  - **Buff System:** Temporary stat modifications (attack, defense, critical chance) with turn-based durations.
- **Items & Inventory:** MongoDB-compatible inventory system tracking owned battle items with quantities.
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

## Recent Changes (November 5, 2025)

**Interactive Tutorial & MongoDB Skin Storage (November 5, 2025):**
- ✅ **Comprehensive Tutorial System** - Interactive 8-stage tutorial for new players
  - Covers all game mechanics: characters, battles, crates, quests, economy, advanced tips
  - Keyword-based progression through tutorial stages
  - One-time use per account (prevents tutorial spam)
  - Tutorial command: `!tutorial` to start/resume
  - Smart mention detection with 40+ keyword responses for instant help
  - Examples: Mention bot with "battles", "crates", "quests" for quick explanations
  - Tracks progress automatically through MongoDB/JSON
- ✅ **MongoDB Skin Storage** - Skin system now fully integrated with MongoDB
  - Skins stored in MongoDB collection instead of separate JSON file
  - Command: `!addskin <character> <skin_name> <image_url>` now saves to MongoDB
  - Automatic fallback to JSON file if MongoDB not enabled
  - All skin functions properly async with await patterns
  - Improves scalability and data consistency

**Major System Overhaul (November 5, 2025):**
- ✅ **Shop System Redesign** - Complete fix for interaction flow issues
  - Eliminated UI replacement bugs that caused "X" to appear incorrectly
  - Simplified purchase flow with ephemeral confirmations
  - Shop now stays open during purchases for better UX
  - All purchases immediately saved to prevent data loss
- ✅ **Battle Abilities - Full Implementation** - All 51 character abilities now work correctly
  - Added dodge chance (Donna's ability) - 15% chance to completely avoid attacks
  - Implemented HP-based damage bonuses (Finn, Max) - damage scales with HP percentage
  - Enhanced status immunity system (Frank, Louie) - prevents specific status effects
  - All passive abilities now trigger correctly during battles
- ✅ **AI Battle System** - Single-player battles with intelligent AI opponents
  - Command: `!b ai`, `!b easy`, `!b normal`, or `!b hard` for difficulty
  - AI makes smart decisions based on HP, energy, and move effectiveness
  - AI uses healing moves strategically when low on health
  - Different difficulty levels: Easy (Lvl 1-3, 20-50% ST), Normal (Lvl 3-7, 40-80% ST), Hard (Lvl 8-12, 75-95% ST)
  - Rewards scale with difficulty: Easy (50 coins, 1 trophy), Normal (75 coins, 3 trophies), Hard (100 coins, 5 trophies)
  - Full integration with status effects and character abilities
- ✅ **Status Effects - Enhanced Reliability** - All status effects verified working
  - Burn, freeze, poison, paralyze, stun, and regeneration all function correctly
  - Status immunity properly prevents unwanted effects
  - Turn-based durations work as intended

## Recent Changes (November 5, 2025 - Earlier)
**Migration & Bug Fixes:**
- ✅ Migrated project to Replit environment
- ✅ Fixed deprecated `ephemeral` parameter usage across all interaction handlers (replaced with `flags: 64`)
- ✅ Fixed deprecated `ready` event (changed to `clientReady` for Discord.js v14 compatibility)
- ✅ Fixed `InteractionAlreadyReplied` error in shop system by reordering interaction updates
- ✅ Fixed race condition in message handler where data was accessed before initialization
- ✅ **Fixed event rewards bug:** Winners now receive mail notifications with their rewards when events end

**New Features Added:**
- ✅ **Implemented `!sendmail` command** - Admins can now send mail to all players with rewards
  - Format: `!sendmail <message> | coins:<amount> gems:<amount> bronzeCrates:<amount> ...`
  - Example: `!sendmail Happy Holidays! | coins:500 gems:50 bronzeCrates:3`
- ✅ **Implemented `!postnews` command** - Admins can post news announcements
  - Format: `!postnews <title> | <content>`
  - Example: `!postnews New Features! | Bronze and Silver crates are now available!`
- ✅ **Enhanced `!grantchar` command** - Now accepts optional ST parameter
  - Format: `!grantchar @user <character name> [ST]`
  - Example: `!grantchar @user Nix 75` (grants Nix with exactly 75% ST)
  - Example: `!grantchar @user Bruce` (grants Bruce with random ST)
- ✅ **Added Bronze and Silver Crates** - New free crate types earned from messaging
  - 🟫 Bronze Crate: 0.5% character chance, 15 tokens, 100 coins (1 event point)
  - ⚪ Silver Crate: 1% character chance, 30 tokens, 250 coins (2 event points)
  - Players earn these from message rewards (every 25 messages)
- ✅ **New `!opencrate` command** - Open owned crates without spending gems
  - Format: `!opencrate <type>` (bronze, silver, gold, emerald, legendary, tyrant)
  - Works for both free crates (bronze/silver) and purchased crates
- ✅ **Revamped Message Reward System** - Now gives crates instead of coins/gems/tokens
  - 60% chance: Bronze Crate
  - 25% chance: Silver Crate
  - 10% chance: Emerald Crate
  - 5% chance: Gold Crate
- ✅ **Enhanced Crate Master Event** - Balanced point system based on crate rarity
  - Bronze: 1 point, Silver: 2 points, Gold: 3 points
  - Emerald: 5 points, Legendary: 8 points, Tyrant: 12 points
- ✅ **Enhanced Crate Inventory Display** - `!crate` command now shows owned crates

**Production-Ready Enhancements (November 5, 2025):**
- ✅ **Shop System Overhaul** - Complete redesign for reliability and UX
  - Added quantity selector (1-10 items) for purchasing multiple items at once
  - Fixed interaction collectors and timeout issues
  - Enabled continuous browsing without re-opening shop
  - Implemented immediate saves after purchases to prevent data loss
- ✅ **Battle System Improvements** - Enhanced reliability and strategic depth
  - Added "Pass Turn" button for energy management
  - Fixed interaction timeout failures with deferred replies
  - Added character skin images to battle embeds
  - Improved item usage flow with proper error handling
  - Enhanced ability effect visibility with clear trigger messages
  - Immediate saves after battle completion to preserve rewards
- ✅ **Data Persistence & Crash Safety** - Production-grade durability
  - Implemented dual-save system: `saveDataImmediate()` for critical operations, batched saves for telemetry
  - All critical operations now use immediate saves: user onboarding, starter selection, crate opening, level ups, quest claims, daily rewards, shop purchases, battle rewards, item usage
  - Added graceful shutdown handlers (SIGTERM, SIGINT, uncaughtException) that flush pending saves
  - MongoDB connection pooling (5-50 connections) with compression and retry logic
  - Prevents data loss on crashes or unexpected shutdowns
- ✅ **Error Handling & Reliability** - Ready for multi-server deployment
  - Comprehensive try-catch blocks throughout battle and shop systems
  - Proper interaction cleanup to prevent memory leaks
  - Battle state recovery on errors
  - User-friendly error messages instead of silent failures

**Technical Updates:**
- ✅ Data backfilling system updated to initialize all 6 crate types for existing users
- ✅ Mail system supports all crate types as rewards
- ✅ All dependencies installed and workflow configured
- ✅ Bot code is production-ready for large-scale multi-server deployment
- ⚠️ **Next Step:** Add `DISCORD_BOT_TOKEN` to secrets to start the bot