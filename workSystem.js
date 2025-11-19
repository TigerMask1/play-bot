const { ORES, WOOD_TYPES } = require('./resourceSystem.js');
const { useTool } = require('./toolSystem.js');

const JOBS = {
  miner: { name: 'Miner', emoji: '⛏️', tool: 'drill', cooldown: 900000 },
  caretaker: { name: 'Caretaker', emoji: '🏠', tool: null, cooldown: 900000 },
  farmer: { name: 'Farmer', emoji: '🌾', tool: 'axe', cooldown: 900000 },
  zookeeper: { name: 'Zookeeper', emoji: '🦁', tool: 'whistle', cooldown: 900000 },
  ranger: { name: 'Ranger', emoji: '🔭', tool: 'binoculars', cooldown: 900000 }
};

const JOB_LIST = Object.keys(JOBS);

function initializeWorkData(userData) {
  if (!userData.work) {
    userData.work = {
      lastWorkTime: 0,
      currentJob: null,
      jobStartTime: 0,
      firstWorkCompleted: false
    };
  }
  if (userData.work.firstWorkCompleted === undefined) {
    userData.work.firstWorkCompleted = false;
  }
  if (!userData.ores) {
    userData.ores = {
      aurelite: 0,
      kryonite: 0,
      zyronite: 0,
      rubinite: 0,
      voidinite: 0
    };
  }
  if (!userData.wood) {
    userData.wood = {
      oak: 0,
      maple: 0,
      ebony: 0,
      celestial: 0
    };
  }
  if (!userData.caretakingHouse) {
    userData.caretakingHouse = {
      level: 1,
      animalsCount: 0
    };
  }
  return userData.work;
}

function canWork(userData) {
  const work = initializeWorkData(userData);
  const now = Date.now();
  const timeSinceLastWork = now - work.lastWorkTime;
  
  if (timeSinceLastWork < 900000) {
    const timeLeft = 900000 - timeSinceLastWork;
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return { canWork: false, timeLeft: `${minutes}m ${seconds}s` };
  }
  
  return { canWork: true };
}

function assignRandomJob(userData) {
  const work = initializeWorkData(userData);
  
  let randomJob;
  if (!work.firstWorkCompleted) {
    randomJob = 'caretaker';
    giveStarterTool(userData);
  } else {
    randomJob = JOB_LIST[Math.floor(Math.random() * JOB_LIST.length)];
  }
  
  work.currentJob = randomJob;
  work.jobStartTime = Date.now();
  
  return {
    job: randomJob,
    jobData: JOBS[randomJob]
  };
}

function giveStarterTool(userData) {
  const { initializeTools } = require('./toolSystem.js');
  const tools = initializeTools(userData);
  
  if (tools.drill.level === 0 && tools.axe.level === 0 && 
      tools.whistle.level === 0 && tools.binoculars.level === 0) {
    tools.drill.level = 1;
    tools.drill.durability = 20;
  }
}

function completeWork(userData) {
  const work = initializeWorkData(userData);
  work.lastWorkTime = Date.now();
  work.firstWorkCompleted = true;
}

function handleMinerJob(userData) {
  const toolResult = useTool(userData, 'drill');
  if (!toolResult.success) {
    return { success: false, message: toolResult.message };
  }
  
  const level = toolResult.level;
  const ores = userData.ores;
  
  const lootTable = [
    { ore: 'aurelite', chance: 70, amount: [2, 5] },
    { ore: 'kryonite', chance: 50, amount: [1, 3] },
    { ore: 'zyronite', chance: 30, amount: [1, 2] },
    { ore: 'rubinite', chance: 15, amount: [1, 2] },
    { ore: 'voidinite', chance: 5, amount: [1, 1] }
  ];
  
  const rewards = {
    ores: {},
    coins: Math.floor(50 + level * 25 + Math.random() * 50),
    gems: Math.floor(5 + level * 3 + Math.random() * 10)
  };
  
  for (const loot of lootTable) {
    const boostedChance = loot.chance + (level * 8);
    if (Math.random() * 100 < boostedChance) {
      const amount = loot.amount[0] + Math.floor(Math.random() * (loot.amount[1] - loot.amount[0] + 1));
      const bonusAmount = Math.floor(amount * (level * 0.2));
      const total = amount + bonusAmount;
      ores[loot.ore] += total;
      rewards.ores[loot.ore] = total;
    }
  }
  
  userData.coins += rewards.coins;
  userData.gems += rewards.gems;
  
  return { success: true, rewards, durability: toolResult.remaining };
}

function handleCaretakerJob(userData) {
  const house = userData.caretakingHouse;
  const level = house.level;
  const work = userData.work || {};
  const isFirstWork = !work.firstWorkCompleted;
  
  const baseTokens = 10 + level * 5;
  const tokens = baseTokens + Math.floor(Math.random() * level * 3);
  
  const baseCoins = 80 + level * 40;
  const coins = baseCoins + Math.floor(Math.random() * level * 20);
  
  const baseGems = 8 + level * 4;
  const gems = baseGems + Math.floor(Math.random() * level * 2);
  
  let grantedCharacter = null;
  if (userData.characters && userData.characters.length > 0) {
    const randomChar = userData.characters[Math.floor(Math.random() * userData.characters.length)];
    randomChar.tokens = (randomChar.tokens || 0) + tokens;
    grantedCharacter = randomChar.name;
  } else {
    userData.pendingTokens = (userData.pendingTokens || 0) + tokens;
  }
  
  userData.coins += coins;
  userData.gems += gems;
  
  house.animalsCount += Math.floor(1 + Math.random() * level);
  
  const rewards = { tokens, coins, gems, ores: {}, wood: {}, grantedTo: grantedCharacter };
  
  const ores = userData.ores;
  const wood = userData.wood;
  
  if (isFirstWork) {
    wood.oak += 2;
    rewards.wood.oak = 2;
    ores.aurelite += 3;
    rewards.ores.aurelite = 3;
  } else {
    const oakAmount = 2 + Math.floor(Math.random() * 3);
    wood.oak += oakAmount;
    rewards.wood.oak = oakAmount;
    
    const aureliteAmount = 2 + Math.floor(Math.random() * 2);
    ores.aurelite += aureliteAmount;
    rewards.ores.aurelite = aureliteAmount;
  }
  
  return {
    success: true,
    rewards,
    houseLevel: level
  };
}

function handleFarmerJob(userData) {
  const toolResult = useTool(userData, 'axe');
  if (!toolResult.success) {
    return { success: false, message: toolResult.message };
  }
  
  const level = toolResult.level;
  const wood = userData.wood;
  
  const lootTable = [
    { wood: 'oak', chance: 80, amount: [3, 6] },
    { wood: 'maple', chance: 55, amount: [2, 4] },
    { wood: 'ebony', chance: 30, amount: [1, 3] },
    { wood: 'celestial', chance: 10, amount: [1, 2] }
  ];
  
  const rewards = {
    wood: {},
    coins: Math.floor(60 + level * 30 + Math.random() * 40),
    gems: Math.floor(6 + level * 3 + Math.random() * 8)
  };
  
  for (const loot of lootTable) {
    const boostedChance = loot.chance + (level * 6);
    if (Math.random() * 100 < boostedChance) {
      const amount = loot.amount[0] + Math.floor(Math.random() * (loot.amount[1] - loot.amount[0] + 1));
      const bonusAmount = Math.floor(amount * (level * 0.15));
      const total = amount + bonusAmount;
      wood[loot.wood] += total;
      rewards.wood[loot.wood] = total;
    }
  }
  
  userData.coins += rewards.coins;
  userData.gems += rewards.gems;
  
  return { success: true, rewards, durability: toolResult.remaining };
}

function handleZookeeperJob(userData) {
  const toolResult = useTool(userData, 'whistle');
  if (!toolResult.success) {
    return { success: false, message: toolResult.message };
  }
  
  const level = toolResult.level;
  
  const rewards = {
    coins: Math.floor(70 + level * 35 + Math.random() * 50),
    gems: Math.floor(7 + level * 4 + Math.random() * 10),
    crates: {},
    keys: 0
  };
  
  const crateChance = 40 + (level * 10);
  if (Math.random() * 100 < crateChance) {
    const crateRoll = Math.random() * 100;
    if (crateRoll < 50) {
      userData.bronzeCrates = (userData.bronzeCrates || 0) + 1;
      rewards.crates.bronze = 1;
    } else if (crateRoll < 80) {
      userData.silverCrates = (userData.silverCrates || 0) + 1;
      rewards.crates.silver = 1;
    } else if (crateRoll < 95) {
      userData.emeraldCrates = (userData.emeraldCrates || 0) + 1;
      rewards.crates.emerald = 1;
    } else {
      userData.goldCrates = (userData.goldCrates || 0) + 1;
      rewards.crates.gold = 1;
    }
  }
  
  const keyChance = 5 + (level * 3);
  if (Math.random() * 100 < keyChance) {
    const keyAmount = Math.random() < 0.7 ? 1 : 2;
    userData.keys = (userData.keys || 0) + keyAmount;
    rewards.keys = keyAmount;
  }
  
  userData.coins += rewards.coins;
  userData.gems += rewards.gems;
  
  return { success: true, rewards, durability: toolResult.remaining };
}

function handleRangerJob(userData) {
  const toolResult = useTool(userData, 'binoculars');
  if (!toolResult.success) {
    return { success: false, message: toolResult.message };
  }
  
  const level = toolResult.level;
  
  const rewards = {
    coins: Math.floor(65 + level * 30 + Math.random() * 45),
    gems: Math.floor(6 + level * 3 + Math.random() * 9),
    shards: 0
  };
  
  const shardChance = 25 + (level * 8);
  if (Math.random() * 100 < shardChance) {
    const shards = Math.floor(5 + level * 3 + Math.random() * (level * 5));
    userData.shards = (userData.shards || 0) + shards;
    rewards.shards = shards;
  }
  
  userData.coins += rewards.coins;
  userData.gems += rewards.gems;
  
  return { success: true, rewards, durability: toolResult.remaining };
}

module.exports = {
  JOBS,
  initializeWorkData,
  canWork,
  assignRandomJob,
  completeWork,
  handleMinerJob,
  handleCaretakerJob,
  handleFarmerJob,
  handleZookeeperJob,
  handleRangerJob
};
