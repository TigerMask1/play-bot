const { EmbedBuilder } = require('discord.js');

const TUTORIAL_STAGES = {
  INTRO: 'intro',
  GETTING_STARTED: 'getting_started',
  CHARACTERS: 'characters',
  BATTLES: 'battles',
  CRATES: 'crates',
  QUESTS: 'quests',
  ECONOMY: 'economy',
  ADVANCED: 'advanced',
  COMPLETED: 'completed'
};

const TUTORIAL_CONTENT = {
  [TUTORIAL_STAGES.INTRO]: {
    title: "🎉 Welcome to ZooBot!",
    description: "Yo! Welcome to the wildest character collection game on Discord! I'm here to show you the ropes and get you started on your journey. Trust me, this is gonna be fun!",
    content: `**What is ZooBot?**
ZooBot is a character collection RPG where you can:
🦊 Collect 51 unique characters with special abilities
⚔️ Battle other players in strategic turn-based combat
📦 Open crates to get new characters and rewards
🏆 Complete 65 quests for massive rewards
💰 Build your economy with coins, gems, and shards
🎨 Customize characters with unique skins

**Why you'll love it:**
Each character has a random ST (Strength) stat from 0-100%, unique moves based on their ST tier, and a special passive ability that makes them unique in battle. The higher the ST, the stronger the character!

Ready to dive in? Let's go! 🚀`,
    footer: "Say 'start' or 'begin' to continue!",
    keywords: ['start', 'begin', 'yes', 'lets go', 'continue']
  },

  [TUTORIAL_STAGES.GETTING_STARTED]: {
    title: "🎮 Getting Started - Your First Steps",
    description: "Alright, let's get you set up! Here's what you need to know first.",
    content: `**Your First Command:**
Type \`!start\` to create your account and choose your starter character!

**Choosing Your Starter:**
You'll get to pick ONE of these three characters:
🦍 **Bruce** (Gorilla) - Fortitude: Gain 10% max HP as shield at battle start
🐂 **Buck** (Bull) - Charging Bull: First attack deals double damage
🦊 **Nix** (Fox) - Frost Bite: 20% chance to freeze opponent

**Pro Tip:** Don't stress too much about your choice! You'll collect more characters as you play. But Bruce is great for beginners because of his shield ability - makes you tankier in battles.

**After You Start:**
Once you pick your starter, you can check your profile with \`!profile\` to see your stats, characters, and resources!`,
    footer: "Say 'profile' to learn about your profile, or 'characters' to learn more about the character system!",
    keywords: ['profile', 'characters', 'stats', 'starter']
  },

  [TUTORIAL_STAGES.CHARACTERS]: {
    title: "🦁 Character System - Gotta Collect 'Em All!",
    description: "Characters are the heart of ZooBot. Let me break down everything you need to know!",
    content: `**Total Characters: 51**
- 3 Starters (Bruce, Buck, Nix)
- 48 Crate Characters (unlock by opening crates!)

**Character Stats:**
Every character has:
📊 **ST (Strength):** Random 0-100% stat that determines their power
❤️ **HP:** Health points (calculated from ST: 100 + ST × 2)
⚡ **Moves:** 3 regular moves + 1 special move
🎯 **Ability:** Unique passive that affects battles
🎨 **Skins:** Cosmetic appearances you can unlock

**ST System Explained:**
Your character's ST determines EVERYTHING:
- **0-40% ST** = Low-tier moves (15-25 damage)
- **41-75% ST** = Mid-tier moves (35-52 damage)  
- **76-100% ST** = High-tier moves (80-100 damage)

Higher ST = More HP and stronger moves!

**Leveling Up:**
Use \`!level <character>\` to level up using tokens and coins!
- Tokens are character-specific (get from crates)
- Leveling increases HP and battle power
- Requirements: 50 + (level-1) × 25 tokens

**Viewing Characters:**
\`!profile\` - See your owned characters
\`!select <character>\` - Set your active character for battles
\`!char <character>\` - See detailed info about a character`,
    footer: "Say 'battles' to learn combat, 'crates' to learn how to get more characters, or 'st' to learn more about the ST system!",
    keywords: ['battles', 'battle', 'crates', 'st', 'moves', 'abilities']
  },

  [TUTORIAL_STAGES.BATTLES]: {
    title: "⚔️ Battle System - Time to Fight!",
    description: "Battles are where your characters shine! This is strategic turn-based combat at its finest.",
    content: `**How to Battle:**
\`!battle @user\` - Challenge another player
\`!b ai\` - Fight an AI opponent (great for practice!)

**AI Difficulty Levels:**
\`!b easy\` - Level 1-3, 20-50% ST (50 coins, 1 trophy)
\`!b normal\` - Level 3-7, 40-80% ST (75 coins, 3 trophies)
\`!b hard\` - Level 8-12, 75-95% ST (100 coins, 5 trophies)

**Battle Mechanics:**
⚡ **Energy:** Start with 50, regen 10/turn (max 100). Manage wisely!
💥 **Moves:** Attack, heal, or special moves. 10% crit chance = 1.5x damage!
🎭 **Abilities:** Each character has unique passive (e.g., Bali: +50% crit damage, Frank: stun immunity)
🛡️ **Status:** Burn, Freeze, Poison, Paralyze, Stun effects

**Rewards:** Winner gets +5 trophies & coins. Loser gets -7 trophies. Both get quest progress!`,
    footer: "Say 'shop' to learn about items, 'crates' to learn how to get characters, or 'economy' to learn about currencies!",
    keywords: ['shop', 'items', 'crates', 'economy', 'trophies']
  },

  [TUTORIAL_STAGES.CRATES]: {
    title: "📦 Crate System - Your Path to More Characters!",
    description: "Crates are loot boxes that give you characters, tokens, and coins! Here's the breakdown:",
    content: `**Crate Types & Costs:**

🟫 **Bronze Crate** (FREE from messages!)
- 100 coins, 15 tokens, 2% character chance
- Earn by chatting! (60% chance every 25 messages)

⚪ **Silver Crate** (FREE from messages!)
- 250 coins, 30 tokens, 100% character chance
- Earn by chatting! (25% chance every 25 messages)

🟡 **Gold Crate** (100 gems)
- 500 coins, 50 tokens, 150% character chance

🟢 **Emerald Crate** (250 gems)
- 1,800 coins, 130 tokens, 500% character chance

🟣 **Legendary Crate** (500 gems)
- 2,500 coins, 200 tokens, 1000% character chance

🔴 **Tyrant Crate** (750 gems)
- 3,500 coins, 300 tokens, 1500% character chance
- BEST odds for characters!

**How to Use:**
\`!crate\` - View your owned crates
\`!opencrate <type>\` - Open a crate you own
\`!buycrate <type>\` - Buy and open with gems

**What You Get:**
✅ Coins (always)
✅ Tokens for random character you own
✅ Chance for NEW character (varies by crate)
✅ If you own all 51 characters: +50 gems!

**Getting Free Crates:**
💬 **Chat rewards** - Get crates every 25 messages!
🎁 **Daily rewards** - \`!daily\` gives random crate
🏆 **Quest rewards** - Complete quests
🎯 **Event rewards** - Participate in events

**Pro Tip:** Save your gems for Emerald, Legendary, or Tyrant crates! They have way better character odds!`,
    footer: "Say 'quests' to learn about quests, 'economy' to learn about currencies, or 'drops' to learn about the drop system!",
    keywords: ['quests', 'economy', 'daily', 'drops', 'tokens']
  },

  [TUTORIAL_STAGES.QUESTS]: {
    title: "📜 Quest System - 65 Quests, Massive Rewards!",
    description: "Quests give you FREE stuff just for playing! Let me show you how this works.",
    content: `**Quest Commands:**
\`!quests\` - View all available quests
\`!quest <id>\` - Check a specific quest
\`!claim <id>\` - Claim rewards when complete!

**How It Works:**
Quests track your progress automatically as you play! No extra work needed. Just do what you'd normally do and watch the quests complete themselves!

**Quest Categories:**

📍 **Drop Quests** (6 quests)
Catch 1, 10, 25, 50, 100 drops
Rewards: Coins, gems, shards

⚔️ **Battle Quests** (9 quests)
Win battles, participate in battles, win streaks
Rewards: Coins, gems, shards

🦊 **Collection Quests** (6 quests)
Own 5, 10, 15, 20, 30, 51 characters
Rewards: Huge coin and gem bonuses!

📈 **Leveling Quests** (9 quests)
Level characters to 5, 10, 15, 20, 30, 50
Have multiple high-level characters
Rewards: Coins, gems, shards

📦 **Crate Quests** (7 quests)
Open crates, open Tyrant crates, get characters from crates
Rewards: Coins, gems, shards

🤝 **Trading Quests** (4 quests)
Complete 1, 5, 10, 25 trades
Rewards: Coins, gems

💰 **Currency Quests** (8 quests)
Accumulate coins and gems
Rewards: Opposite currency!

🔷 **Shard Quests** (4 quests)
Collect 5, 10, 25, 50 shards
Rewards: Coins and gems

🎯 **Special Quests** (12 quests)
- Own 100% ST character
- Win streaks
- Release character
- High-level wins
- And more!

**Total Rewards:**
All 65 quests combined give:
💰 **100,000+ coins**
💎 **2,000+ gems**  
🔷 **150+ shards**

**Pro Tip:** Check \`!quests\` regularly! Some quests you'll complete without even trying!`,
    footer: "Say 'economy' to learn about currencies, 'advanced' for advanced tips, or 'trading' to learn about trading!",
    keywords: ['economy', 'advanced', 'trading', 'shards']
  },

  [TUTORIAL_STAGES.ECONOMY]: {
    title: "💎 Economy System - Understanding Your Resources",
    description: "Let's talk about money! You've got 4 main currencies in ZooBot.",
    content: `**The 4 Currencies:**

💰 **Coins** (Primary Currency)
- Used for: Leveling up characters
- Get from: Crates, battles, drops, quests, daily rewards
- Spend wisely on leveling your best characters!

💎 **Gems** (Premium Currency)
- Used for: Buying crates (Gold/Emerald/Legendary/Tyrant)
- Get from: Quests, crates, selling duplicate characters, daily rewards
- Save for Emerald+ crates!

🔷 **Shards** (Crafting Resource)
- Used for: Crafting ST Boosters (5 shards = 1 booster)
- Get from: Quest rewards
- Very valuable - use carefully!

🎫 **Tokens** (Character-Specific)
- Used for: Leveling up specific characters
- Get from: Crates (distributed to random owned character)
- Each character has their own token stash

**Other Resources:**

🏆 **Trophies** (Competitive Ranking)
- Start with: 200 trophies
- Battle wins: +5 trophies
- Battle losses: -7 trophies
- Used for: Leaderboards and ranking

🎨 **Skins** (Cosmetics)
- Purely visual - no stat changes
- Granted by admins
- Equip with \`!equipskin <character> <skin>\`

**Income Sources:**

💬 **Chatting** - Get crates every 25 messages!
🎁 **Daily Rewards** - \`!daily\` once per 24 hours
📍 **Drops** - React to drops in drop channel
⚔️ **Battles** - Win battles for coins and trophies
📦 **Crates** - Open for coins, tokens, characters
📜 **Quests** - Complete for massive rewards
🎯 **Events** - Participate for event rewards

**Money-Making Tips:**
1. Do your \`!daily\` every day - free crate!
2. Complete easy quests first - quick gems
3. Battle AI opponents - guaranteed rewards
4. Chat to earn free Bronze/Silver crates
5. Save gems for Tyrant crates - best value!`,
    footer: "Say 'advanced' for pro tips, 'trading' to learn trading, or 'finish' to complete the tutorial!",
    keywords: ['advanced', 'trading', 'finish', 'complete', 'done']
  },

  [TUTORIAL_STAGES.ADVANCED]: {
    title: "🚀 Advanced Tips - Pro Strategies!",
    description: "Ready for the pro stuff? Here are some next-level strategies!",
    content: `**ST Booster System:**
🔷 Craft with \`!craft\` (costs 5 shards)
🎲 Use with \`!boost <character>\` (rerolls ST to new random value)
⚠️ **RISKY!** Can increase OR decrease ST!
💡 Only use on low ST characters (<40%)

**Trading System:**
\`!trade @user\` - Start a trade
\`!offer coins <amount>\` - Add coins to offer
\`!offer gems <amount>\` - Add gems to offer
\`!confirm\` - Lock in your offer
Both players must confirm for trade to complete!

**Drop System:**
📍 Random drops spawn every 20 seconds
🏃 React FAST to claim them
🎁 Get coins, gems, crates, or tokens
Complete drop quests for bonus rewards!

**Release System:**
\`!release <character>\` - Delete character (level 10+ required)
💎 Get gems based on character ST
⚠️ **PERMANENT** - Can't undo!
Good for clearing duplicates or low ST characters

**Daily Rewards:**
\`!daily\` - Claim once per 24 hours
🎁 Get coins, gems, and a random crate
🔥 Build streak for better rewards
Never skip a day!

**Events:**
🏆 Competitive daily events
📊 Earn points through specific activities
💰 Top players get HUGE rewards
Check event channel for current event!

**Shop System:**
\`!shop\` - Browse battle items
🧪 Potions: Heal in battle
⚡ Energy drinks: Restore energy
📈 Stat boosters: Temporary buffs
🧹 Cleanse: Remove negative effects

**Battle Strategy:**
⚡ Manage energy carefully
🎯 Use abilities to your advantage
🛡️ Save heal moves for critical moments
💥 Time your special moves right
📚 Learn opponent patterns

**Collection Strategy:**
1. Focus on one main character (level them up!)
2. Open Silver crates for guaranteed characters
3. Save gems for Tyrant crates (best odds)
4. Complete quests for free resources
5. Battle AI to earn coins safely
6. Trade with friends for mutual benefit
7. Join events for bonus rewards

**Leaderboard Commands:**
\`!lb coins\` - Top coin holders
\`!lb gems\` - Top gem holders
\`!lb trophies\` - Top ranked players
\`!lb battles\` - Most battle wins
\`!lb collectors\` - Most characters owned

Climb the leaderboards and show everyone who's boss!`,
    footer: "Say 'finish' to complete the tutorial, or ask about anything specific!",
    keywords: ['finish', 'complete', 'done']
  },

  [TUTORIAL_STAGES.COMPLETED]: {
    title: "✅ Tutorial Complete - You're Ready!",
    description: "Congrats! You've completed the tutorial! You're now ready to dominate ZooBot!",
    content: `**Quick Reference - Essential Commands:**

**Getting Started:**
\`!start\` - Create account & pick starter
\`!profile\` - View your profile
\`!select <character>\` - Set active character

**Characters & Leveling:**
\`!char <character>\` - Character details
\`!level <character>\` - Level up character
\`!equipskin <character> <skin>\` - Change skin

**Battles:**
\`!battle @user\` - Challenge player
\`!b ai\` / \`!b easy/normal/hard\` - AI battle
\`!shop\` - Buy battle items

**Crates & Rewards:**
\`!crate\` - View owned crates
\`!opencrate <type>\` - Open owned crate
\`!buycrate <type>\` - Buy & open with gems
\`!daily\` - Daily rewards

**Quests & Progress:**
\`!quests\` - View all quests
\`!claim <id>\` - Claim quest rewards

**Economy & Trading:**
\`!trade @user\` - Start trade
\`!craft\` - Craft ST Booster
\`!boost <character>\` - Use ST Booster

**Info & Help:**
\`!commands\` - Full command list
\`!lb <type>\` - Leaderboards
\`!news\` - Latest announcements

**Where to Go Next:**
1. ✅ Use \`!start\` to pick your starter
2. ⚔️ Try \`!b ai\` for your first battle
3. 🎁 Claim \`!daily\` rewards
4. 📜 Check \`!quests\` for easy rewards
5. 📍 Watch the drop channel for drops
6. 💬 Keep chatting for free crates!

**Remember:**
- Have fun! This is a game, enjoy the journey!
- Ask questions if you're confused
- Join events for bonus rewards
- Complete quests for free stuff
- Level up your favorite characters
- Collect all 51 characters!

**You got this! Welcome to ZooBot! 🎉**`,
    footer: "Tutorial completed! You can always ask me specific questions by mentioning me with keywords!",
    keywords: []
  }
};

const KEYWORD_RESPONSES = {
  'start': 'Use `!start` to create your account and pick one of three starter characters: Bruce 🦍, Buck 🐂, or Nix 🦊!',
  'starter': 'Your starters are: **Bruce** (Gorilla - shield ability), **Buck** (Bull - first hit double damage), or **Nix** (Fox - freeze chance). Pick whichever sounds cool!',
  'profile': 'Use `!profile` to see your stats, owned characters, coins, gems, and more! It shows everything about your account.',
  'characters': 'There are 51 total characters! Each has unique abilities and random ST (0-100%). Higher ST = better moves and more HP!',
  'battle': 'Battle with `!battle @user` for PvP or `!b ai` for AI practice! Manage energy, use abilities, and win for trophies and coins!',
  'ai': 'AI battles are great for practice! Use `!b easy`, `!b normal`, or `!b hard` for different difficulties and rewards!',
  'crates': 'Crates give characters, coins, and tokens! Bronze & Silver are FREE from chatting. Buy Gold/Emerald/Legendary/Tyrant with gems!',
  'quests': 'There are 65 quests tracking your progress! Complete them for coins, gems, and shards. Check with `!quests` and claim with `!claim <id>`!',
  'daily': 'Use `!daily` once per 24 hours for free coins, gems, and a random crate! Never skip it!',
  'tokens': 'Tokens are character-specific and used for leveling. Get them from crates! Use `!level <character>` to level up.',
  'st': 'ST (Strength) is a random 0-100% stat. Higher ST = better moves and more HP! 0-40% = low moves, 41-75% = mid moves, 76-100% = high moves!',
  'abilities': 'Every character has a unique passive ability! Examples: Bali (crit boost), Frank (stun immunity), Nix (freeze chance). Check `!char <name>` for details!',
  'shop': 'Use `!shop` to buy battle items with coins/gems! Potions heal, energy drinks restore energy, stat boosters give temp buffs!',
  'trade': 'Trade coins/gems with `!trade @user`, then `!offer coins/gems <amount>`, and both use `!confirm` to complete!',
  'drops': 'Drops spawn every 20 seconds in the drop channel! React fast to claim coins, gems, crates, or tokens!',
  'level': 'Level up with `!level <character>` using tokens + coins. Higher level = more HP and battle power!',
  'skins': 'Skins are cosmetic only (no stat changes). Admins grant them. Equip with `!equipskin <character> <skin>`!',
  'trophies': 'Trophies show your rank! Start at 200. Win battles for +5, lose for -7. Climb the leaderboard!',
  'gems': 'Gems buy crates! Save them for Emerald, Legendary, or Tyrant crates - best character odds! Get gems from quests and crates.',
  'coins': 'Coins are for leveling characters! Get from battles, crates, drops, quests, and daily rewards!',
  'shards': 'Shards craft ST Boosters! 5 shards = 1 booster. Use `!craft` then `!boost <character>` to reroll ST (risky!)',
  'events': 'Daily competitive events! Earn points doing specific activities, top players get huge rewards! Check event channel!',
  'leaderboard': 'Use `!lb coins/gems/trophies/battles/collectors` to see top players! Compete for glory!',
  'energy': 'Energy powers your moves in battle! Start with 50, regen 10/turn, max 100. Stronger moves cost more energy!',
  'hp': 'HP = 100 + (ST × 2). Higher ST characters have more health! Level up to increase HP further!',
  'moves': 'Each character has 3 regular moves + 1 special move. Move tier depends on ST: low (0-40%), mid (41-75%), high (76-100%)!',
  'special': 'Special moves are character-unique powerful attacks! Every character has one. They deal 80-100+ damage!',
  'critical': 'Critical hits have 10% base chance and deal 1.5x damage! Some abilities increase crit chance or damage!',
  'status': 'Status effects: Burn (damage over time), Freeze (skip turn), Poison (gradual damage), Paralyze (chance to skip), Stun (forced skip)!',
  'items': 'Battle items bought from `!shop`: Potions (heal), Energy Drinks (energy), Stat Boosters (temp buffs), Cleanse (remove status)!',
  'bronze': 'Bronze Crates are FREE from chatting! 60% chance every 25 messages. Give 100 coins, 15 tokens, 2% character chance!',
  'silver': 'Silver Crates are FREE from chatting! 25% chance every 25 messages. Give 250 coins, 30 tokens, 100% character chance!',
  'tyrant': 'Tyrant Crates cost 750 gems but have 1500% character chance - the BEST odds! Also give 3500 coins and 300 tokens!',
  'release': 'Release characters (lvl 10+) with `!release <character>` for gems based on ST. WARNING: Permanent deletion!',
  'boost': 'ST Boosters reroll character ST to new random value. Risky - can go up OR down! Only use on low ST characters (<40%)!',
  'help': 'I can explain anything about ZooBot! Just ask about: battles, crates, quests, characters, economy, or any specific feature!',
  'commands': 'Use `!commands` or check the COMMANDS.md file for a full list of all commands and how to use them!',
  'how': 'How to play: Pick a starter with `!start`, battle with `!b ai`, open crates, complete quests, level characters, and collect all 51!',
  'collector': 'To collect all 51 characters: Chat for free crates, complete quests for gems, buy Tyrant crates for best odds, complete collection quests!',
  'win': 'To win battles: Level your characters, manage energy wisely, learn abilities, use items strategically, and practice against AI!'
};

function getTutorialStage(userData) {
  return userData.tutorialStage || TUTORIAL_STAGES.INTRO;
}

function hasCompletedTutorial(userData) {
  return userData.tutorialCompleted === true;
}

function getNextStage(currentStage) {
  const stages = Object.values(TUTORIAL_STAGES);
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return TUTORIAL_STAGES.COMPLETED;
  }
  return stages[currentIndex + 1];
}

function checkKeywordMatch(message, keywords) {
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}

function getKeywordResponse(message) {
  const lowerMessage = message.toLowerCase();
  for (const [keyword, response] of Object.entries(KEYWORD_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  return null;
}

function createTutorialEmbed(stage) {
  const content = TUTORIAL_CONTENT[stage];
  if (!content) return null;

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle(content.title)
    .setDescription(content.description)
    .addFields({ name: '\u200B', value: content.content })
    .setFooter({ text: content.footer })
    .setTimestamp();

  return embed;
}

async function handleTutorialProgress(message, userData, data, saveData) {
  const currentStage = getTutorialStage(userData);
  
  if (currentStage === TUTORIAL_STAGES.COMPLETED) {
    return null;
  }

  const stageContent = TUTORIAL_CONTENT[currentStage];
  if (!stageContent) return null;

  if (checkKeywordMatch(message.content, stageContent.keywords)) {
    const nextStage = getNextStage(currentStage);
    userData.tutorialStage = nextStage;

    if (nextStage === TUTORIAL_STAGES.COMPLETED) {
      userData.tutorialCompleted = true;
      userData.questProgress = userData.questProgress || {};
      saveData(data);
    } else {
      saveData(data);
    }

    return createTutorialEmbed(nextStage);
  }

  return null;
}

async function handleMentionResponse(message, userData) {
  const keywordResponse = getKeywordResponse(message.content);
  
  if (keywordResponse) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💡 Quick Answer')
      .setDescription(keywordResponse)
      .setFooter({ text: 'Need more help? Just ask with keywords like "battles", "crates", "quests", etc!' })
      .setTimestamp();
    
    return embed;
  }

  const helpEmbed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('👋 Hey! How can I help?')
    .setDescription('Ask me about anything! I can explain:')
    .addFields(
      { name: '🎮 Basics', value: '`start`, `profile`, `characters`, `how to play`', inline: true },
      { name: '⚔️ Combat', value: '`battles`, `ai`, `abilities`, `energy`, `items`', inline: true },
      { name: '📦 Crates', value: '`crates`, `bronze`, `silver`, `tyrant`', inline: true },
      { name: '📜 Progress', value: '`quests`, `daily`, `events`, `leaderboard`', inline: true },
      { name: '💰 Economy', value: '`coins`, `gems`, `shards`, `tokens`, `trading`', inline: true },
      { name: '🎯 Advanced', value: '`st`, `boost`, `release`, `skins`', inline: true }
    )
    .setFooter({ text: 'Just mention me and use any keyword to get info!' })
    .setTimestamp();

  return helpEmbed;
}

module.exports = {
  TUTORIAL_STAGES,
  getTutorialStage,
  hasCompletedTutorial,
  createTutorialEmbed,
  handleTutorialProgress,
  handleMentionResponse,
  KEYWORD_RESPONSES
};
