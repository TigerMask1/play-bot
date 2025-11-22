const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const activeGames = new Map();

// Rare reward chance (5% = legendary crate or 1 UST)
const RARE_REWARD_CHANCE = 0.05;

const REWARDS = {
  miner: { coins: 150, gems: 15, ores: 20, xp: 50 },
  farmer: { coins: 120, gems: 12, wood: 15, xp: 40 },
  ranger: { coins: 100, gems: 10, ores: 10, wood: 10, xp: 35 },
  zookeeper: { coins: 130, gems: 13, tokens: 5, xp: 45 },
  caretaker: { coins: 110, gems: 11, tokens: 3, xp: 30 }
};

function getRareReward() {
  if (Math.random() < RARE_REWARD_CHANCE) {
    return { type: 'legendary_crate', name: '🎁 Legendary Crate!' };
  }
  return null;
}

function generateGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== MINER SUB-WORKS ====================

async function minerHitTheRock(userId, message) {
  const gameId = generateGameId();
  const game = {
    gameId,
    userId,
    type: 'miner_rock',
    blocks: 8,
    hitCount: 0,
    startTime: Date.now(),
    timeout: 8000,
    completed: false,
    reward: REWARDS.miner
  };
  
  activeGames.set(gameId, game);
  
  const progressBar = '■'.repeat(0) + '□'.repeat(8);
  const rockEmbed = new EmbedBuilder()
    .setColor('#8B4513')
    .setTitle('⛏️ Hit the Rock!')
    .setDescription(`🪨 ROCK: ${progressBar}\n\n**Type "hit" to break blocks!**\nTimer: 8 seconds`)
    .setFooter({ text: `Game ID: ${gameId}` });
  
  await message.reply({ embeds: [rockEmbed] });
  
  return { gameId, game };
}

async function handleMinerRockHit(userId, gameId, data) {
  const game = activeGames.get(gameId);
  if (!game || game.type !== 'miner_rock' || game.userId !== userId) return null;
  
  const elapsed = Date.now() - game.startTime;
  if (elapsed > game.timeout) {
    activeGames.delete(gameId);
    return { success: false, message: '⏰ Time\'s up!' };
  }
  
  game.hitCount++;
  const progressBar = '■'.repeat(game.hitCount) + '□'.repeat(8 - game.hitCount);
  
  if (game.hitCount >= 8) {
    game.completed = true;
    const bonus = Math.floor(game.hitCount * 10);
    const rareReward = getRareReward();
    
    activeGames.delete(gameId);
    return {
      success: true,
      message: `✅ All blocks broken! **${game.hitCount} blocks** destroyed!\n💰 Bonus: ${bonus} coins`,
      bonus,
      rareReward
    };
  }
  
  return { success: true, message: `🪨 ${progressBar}` };
}

async function minerAvoidTheTNT(userId, message) {
  const gameId = generateGameId();
  const bombChest = Math.random() < 0.5 ? 'A' : 'B';
  
  const game = {
    gameId,
    userId,
    type: 'miner_tnt',
    correctChest: bombChest,
    startTime: Date.now(),
    timeout: 6000,
    completed: false,
    reward: REWARDS.miner
  };
  
  activeGames.set(gameId, game);
  
  const tntEmbed = new EmbedBuilder()
    .setColor('#FF6B6B')
    .setTitle('⚠️ Avoid the TNT!')
    .setDescription(`🟫 Chest A    🟫 Chest B\n\nOne has ores, one has TNT!\n**Which chest do you pick?** Reply: A or B`)
    .setFooter({ text: `Game ID: ${gameId} | 6 seconds` });
  
  await message.reply({ embeds: [tntEmbed] });
  return { gameId, game };
}

async function handleMinerTNT(userId, gameId, choice, data) {
  const game = activeGames.get(gameId);
  if (!game || game.type !== 'miner_tnt' || game.userId !== userId) return null;
  
  const elapsed = Date.now() - game.startTime;
  if (elapsed > game.timeout) {
    activeGames.delete(gameId);
    return { success: false, message: '⏰ Time\'s up!' };
  }
  
  const choiceUpper = choice.toUpperCase();
  const correctChest = game.correctChest;
  
  activeGames.delete(gameId);
  
  if (choiceUpper === correctChest) {
    return {
      success: true,
      message: `✅ Safe choice! You got the ores!\n💰 +150 coins`,
      rareReward: getRareReward()
    };
  } else {
    return {
      success: true,
      message: `💣 BOOM! You hit the TNT! 💥\n😂 Chaos ensues but you escape!\n💰 +75 coins (half reward)`,
      chaosBonus: true
    };
  }
}

async function minerPickOrder(userId, message) {
  const gameId = generateGameId();
  const emojis = ['🎉', '⭐', '💎'];
  const correctOrder = [...emojis].sort(() => Math.random() - 0.5);
  
  const game = {
    gameId,
    userId,
    type: 'miner_order',
    correctOrder,
    startTime: Date.now(),
    timeout: 8000,
    completed: false,
    reward: REWARDS.miner
  };
  
  activeGames.set(gameId, game);
  
  const orderEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🔢 Pick the Correct Order!')
    .setDescription(`Remember this order:\n${correctOrder.join('')}\n\n**Type the emojis in the same order!**\nTimer: 8 seconds`)
    .setFooter({ text: `Game ID: ${gameId}` });
  
  await message.reply({ embeds: [orderEmbed] });
  return { gameId, game };
}

// ==================== FARMER SUB-WORKS ====================

async function farmerWaterCrops(userId, message) {
  const gameId = generateGameId();
  const game = {
    gameId,
    userId,
    type: 'farmer_water',
    startTime: Date.now(),
    timeout: 5000,
    completed: false,
    reward: REWARDS.farmer
  };
  
  activeGames.set(gameId, game);
  
  const waterEmbed = new EmbedBuilder()
    .setColor('#4ECDC4')
    .setTitle('💧 Water the Crops!')
    .setDescription('🌾 Your crops are drying! Type **WATER!**')
    .setFooter({ text: `Game ID: ${gameId} | 5 seconds` });
  
  await message.reply({ embeds: [waterEmbed] });
  return { gameId, game };
}

async function handleFarmerWater(userId, gameId, data) {
  const game = activeGames.get(gameId);
  if (!game || game.type !== 'farmer_water' || game.userId !== userId) return null;
  
  const elapsed = Date.now() - game.startTime;
  if (elapsed > game.timeout) {
    activeGames.delete(gameId);
    return { success: false, message: '⏰ Too late! Crops wilted!' };
  }
  
  activeGames.delete(gameId);
  return {
    success: true,
    message: `✅ Crops watered! 🌾 They're happy!\n💰 +120 coins + Bonus`,
    rareReward: getRareReward()
  };
}

async function farmerHarvestMini(userId, message) {
  const gameId = generateGameId();
  const crops = ['🌽', '🍓', '🥕', '🥔', '🍅'];
  const correctCrop = crops[Math.floor(Math.random() * crops.length)];
  
  const game = {
    gameId,
    userId,
    type: 'farmer_harvest',
    correctCrop,
    crops,
    startTime: Date.now(),
    timeout: 8000,
    completed: false,
    reward: REWARDS.farmer
  };
  
  activeGames.set(gameId, game);
  
  const harvestEmbed = new EmbedBuilder()
    .setColor('#90EE90')
    .setTitle('🌽 Harvest Mini-Game!')
    .setDescription(`Pick the correct harvest emoji:\n${crops.join(' ')}\n\nYou must pick: ${correctCrop}\n**Timer: 8 seconds**`)
    .setFooter({ text: `Game ID: ${gameId}` });
  
  await message.reply({ embeds: [harvestEmbed] });
  return { gameId, game };
}

// ==================== RANGER SUB-WORKS ====================

async function rangerShootTarget(userId, message) {
  const gameId = generateGameId();
  const game = {
    gameId,
    userId,
    type: 'ranger_shoot',
    startTime: Date.now(),
    timeout: 6000,
    completed: false,
    reward: REWARDS.ranger
  };
  
  activeGames.set(gameId, game);
  
  const shootEmbed = new EmbedBuilder()
    .setColor('#FF8C00')
    .setTitle('🏹 Shoot the Target!')
    .setDescription('🎯 -----> O\n\n**Type "shoot" to fire!**\nTimer: 6 seconds')
    .setFooter({ text: `Game ID: ${gameId}` });
  
  await message.reply({ embeds: [shootEmbed] });
  return { gameId, game };
}

async function handleRangerShoot(userId, gameId, data) {
  const game = activeGames.get(gameId);
  if (!game || game.type !== 'ranger_shoot' || game.userId !== userId) return null;
  
  const elapsed = Date.now() - game.startTime;
  if (elapsed > game.timeout) {
    activeGames.delete(gameId);
    return { success: false, message: '⏰ Missed the target!' };
  }
  
  const bonus = Math.random() < 0.5 ? 30 : 0;
  activeGames.delete(gameId);
  
  return {
    success: true,
    message: `🎯 Direct hit!\n${bonus > 0 ? `💥 Critical bonus: +${bonus} coins!` : '💰 +100 coins'}`,
    rareReward: getRareReward()
  };
}

// ==================== ZOOKEEPER SUB-WORKS ====================

async function zookeeperFeedAnimals(userId, message) {
  const gameId = generateGameId();
  
  const animals = ['🐵', '🐶', '🐰'];
  const foods = ['🥕', '🍖', '🍌'];
  const pairs = { '🐵': '🍌', '🐶': '🍖', '🐰': '🥕' };
  
  const game = {
    gameId,
    userId,
    type: 'zookeeper_feed',
    animals,
    foods,
    pairs,
    startTime: Date.now(),
    timeout: 10000,
    completed: false,
    reward: REWARDS.zookeeper
  };
  
  activeGames.set(gameId, game);
  
  const feedEmbed = new EmbedBuilder()
    .setColor('#FF69B4')
    .setTitle('🍎 Feed the Right Animal!')
    .setDescription(`**Animals:** ${animals.join('  ')}\n**Foods:** ${foods.join('  ')}\n\nMatch each animal with the correct food!\n**Pairs:** 🐵-🍌, 🐶-🍖, 🐰-🥕\n**Type:** animal food (e.g., 🐵🍌)\nTimer: 10 seconds`)
    .setFooter({ text: `Game ID: ${gameId}` });
  
  await message.reply({ embeds: [feedEmbed] });
  return { gameId, game };
}

async function zookeeperCleanEnclosure(userId, message) {
  const gameId = generateGameId();
  const game = {
    gameId,
    userId,
    type: 'zookeeper_clean',
    startTime: Date.now(),
    timeout: 4000,
    completed: false,
    reward: REWARDS.zookeeper
  };
  
  activeGames.set(gameId, game);
  
  const cleanEmbed = new EmbedBuilder()
    .setColor('#87CEEB')
    .setTitle('🧹 Clean the Enclosure!')
    .setDescription('🧹 Clean up the mess! Type **CLEAN!**')
    .setFooter({ text: `Game ID: ${gameId} | 4 seconds` });
  
  await message.reply({ embeds: [cleanEmbed] });
  return { gameId, game };
}

async function handleZookeeperClean(userId, gameId, data) {
  const game = activeGames.get(gameId);
  if (!game || game.type !== 'zookeeper_clean' || game.userId !== userId) return null;
  
  const elapsed = Date.now() - game.startTime;
  if (elapsed > game.timeout) {
    activeGames.delete(gameId);
    return { success: false, message: '⏰ Enclosure too messy!' };
  }
  
  activeGames.delete(gameId);
  return {
    success: true,
    message: `✨ Enclosure sparkling clean!\n💰 +130 coins`,
    rareReward: getRareReward()
  };
}

// ==================== CARETAKER SUB-WORKS ====================

async function caretakerWashAnimals(userId, message) {
  const gameId = generateGameId();
  const game = {
    gameId,
    userId,
    type: 'caretaker_wash',
    washCount: 0,
    neededWashes: 5,
    startTime: Date.now(),
    timeout: 10000,
    completed: false,
    reward: REWARDS.caretaker
  };
  
  activeGames.set(gameId, game);
  
  const washEmbed = new EmbedBuilder()
    .setColor('#87CEEB')
    .setTitle('🛁 Wash the Animals!')
    .setDescription(`🧼🧼🧼🧼🧼\n\nType **wash** 5 times to clean all animals!\n**Current:** 0/5\nTimer: 10 seconds`)
    .setFooter({ text: `Game ID: ${gameId}` });
  
  await message.reply({ embeds: [washEmbed] });
  return { gameId, game };
}

async function handleCaretakerWash(userId, gameId, data) {
  const game = activeGames.get(gameId);
  if (!game || game.type !== 'caretaker_wash' || game.userId !== userId) return null;
  
  const elapsed = Date.now() - game.startTime;
  if (elapsed > game.timeout) {
    activeGames.delete(gameId);
    return { success: false, message: '⏰ Ran out of time!' };
  }
  
  game.washCount++;
  
  if (game.washCount >= 5) {
    activeGames.delete(gameId);
    return {
      success: true,
      message: `✨ All animals sparkling clean!\n💰 +110 coins + Bonus`,
      completed: true,
      rareReward: getRareReward()
    };
  }
  
  return { success: true, message: `🧼 Progress: ${game.washCount}/5 washes` };
}

// ==================== HELPER FUNCTIONS ====================

function getActiveGame(gameId) {
  return activeGames.get(gameId);
}

function deleteGame(gameId) {
  activeGames.delete(gameId);
}

module.exports = {
  // Miner
  minerHitTheRock,
  handleMinerRockHit,
  minerAvoidTheTNT,
  handleMinerTNT,
  minerPickOrder,
  
  // Farmer
  farmerWaterCrops,
  handleFarmerWater,
  farmerHarvestMini,
  
  // Ranger
  rangerShootTarget,
  handleRangerShoot,
  
  // Zookeeper
  zookeeperFeedAnimals,
  zookeeperCleanEnclosure,
  handleZookeeperClean,
  
  // Caretaker
  caretakerWashAnimals,
  handleCaretakerWash,
  
  // Utilities
  getActiveGame,
  deleteGame,
  getRareReward,
  REWARDS,
  activeGames
};
