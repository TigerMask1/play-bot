const USE_MONGODB = process.env.USE_MONGODB === 'true';

let mongoManager = null;
if (USE_MONGODB) {
  mongoManager = require('./mongoManager.js');
}

const BATTLE_PASS_TIERS = [
  { tier: 1, xpRequired: 0, rewards: { coins: 100, gems: 5 } },
  { tier: 2, xpRequired: 50, rewards: { coins: 150, gems: 5 } },
  { tier: 3, xpRequired: 120, rewards: { coins: 200, shards: 5 } },
  { tier: 4, xpRequired: 210, rewards: { coins: 250, gems: 10 } },
  { tier: 5, xpRequired: 320, rewards: { coins: 300, bronzeCrates: 1 } },
  { tier: 6, xpRequired: 450, rewards: { coins: 350, gems: 15 } },
  { tier: 7, xpRequired: 600, rewards: { coins: 400, shards: 10 } },
  { tier: 8, xpRequired: 770, rewards: { coins: 450, silverCrates: 1 } },
  { tier: 9, xpRequired: 960, rewards: { coins: 500, gems: 20 } },
  { tier: 10, xpRequired: 1170, rewards: { coins: 600, goldCrates: 1 } },
  { tier: 11, xpRequired: 1400, rewards: { coins: 700, gems: 25 } },
  { tier: 12, xpRequired: 1650, rewards: { coins: 800, shards: 15 } },
  { tier: 13, xpRequired: 1920, rewards: { coins: 900, gems: 30 } },
  { tier: 14, xpRequired: 2210, rewards: { coins: 1000, silverCrates: 2 } },
  { tier: 15, xpRequired: 2520, rewards: { coins: 1200, emeraldCrates: 1 } },
  { tier: 16, xpRequired: 2850, rewards: { coins: 1400, gems: 40 } },
  { tier: 17, xpRequired: 3200, rewards: { coins: 1600, shards: 25 } },
  { tier: 18, xpRequired: 3570, rewards: { coins: 1800, gems: 50 } },
  { tier: 19, xpRequired: 3960, rewards: { coins: 2000, goldCrates: 2 } },
  { tier: 20, xpRequired: 4370, rewards: { coins: 2500, legendaryCrates: 1 } },
  { tier: 21, xpRequired: 4800, rewards: { coins: 2800, gems: 60 } },
  { tier: 22, xpRequired: 5250, rewards: { coins: 3000, shards: 35 } },
  { tier: 23, xpRequired: 5720, rewards: { coins: 3200, emeraldCrates: 2 } },
  { tier: 24, xpRequired: 6210, rewards: { coins: 3500, gems: 75 } },
  { tier: 25, xpRequired: 6720, rewards: { coins: 4000, tyrantCrates: 1 } },
  { tier: 26, xpRequired: 7250, rewards: { coins: 4500, gems: 90 } },
  { tier: 27, xpRequired: 7800, rewards: { coins: 5000, shards: 50 } },
  { tier: 28, xpRequired: 8370, rewards: { coins: 5500, legendaryCrates: 2 } },
  { tier: 29, xpRequired: 8960, rewards: { coins: 6000, gems: 100 } },
  { tier: 30, xpRequired: 9570, rewards: { coins: 7500, tyrantCrates: 2, gems: 150, shards: 75 } }
];

const XP_SOURCES = {
  BATTLE_WIN: 25,
  BATTLE_LOSS: 10,
  DROP_CATCH: 5,
  CRATE_OPEN: 15,
  TRADE_COMPLETE: 20,
  QUEST_COMPLETE: 40,
  DAILY_CLAIM: 35,
  EVENT_PARTICIPATION: 10,
  LEVEL_UP: 50
};

async function loadSeasonData(data) {
  if (data.battlePassSeason) {
    return data.battlePassSeason;
  }

  if (USE_MONGODB) {
    try {
      const db = await mongoManager.getDb();
      const seasonCollection = db.collection('battlePassSeason');
      const season = await seasonCollection.findOne({ active: true });
      
      if (season) {
        return {
          number: season.number,
          startDate: new Date(season.startDate),
          endDate: season.endDate ? new Date(season.endDate) : null,
          active: season.active
        };
      }
    } catch (error) {
      console.error('Error loading season data from MongoDB:', error);
    }
  }

  const defaultSeason = {
    number: 1,
    startDate: new Date(),
    endDate: null,
    active: true
  };
  
  data.battlePassSeason = defaultSeason;
  return defaultSeason;
}

async function saveSeasonData(seasonData, data) {
  data.battlePassSeason = seasonData;

  if (USE_MONGODB) {
    try {
      const db = await mongoManager.getDb();
      const seasonCollection = db.collection('battlePassSeason');
      
      await seasonCollection.updateOne(
        { active: true },
        {
          $set: {
            number: seasonData.number,
            startDate: seasonData.startDate,
            endDate: seasonData.endDate,
            active: seasonData.active
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving season data to MongoDB:', error);
    }
  }
}

function initializeBattlePassData(user, currentSeason) {
  if (!user.battlePass) {
    user.battlePass = {
      xp: 0,
      currentTier: 1,
      claimedTiers: [],
      seasonNumber: currentSeason.number
    };
  }
  
  if (user.battlePass.seasonNumber !== currentSeason.number) {
    user.battlePass = {
      xp: 0,
      currentTier: 1,
      claimedTiers: [],
      seasonNumber: currentSeason.number
    };
  }
  
  return user;
}

async function addXP(userId, amount, source, data) {
  if (!data.users[userId]) {
    return { success: false, xpGained: 0 };
  }

  const currentSeason = await loadSeasonData(data);
  const user = initializeBattlePassData(data.users[userId], currentSeason);
  
  user.battlePass.xp += amount;
  
  const oldTier = user.battlePass.currentTier;
  const newTier = calculateCurrentTier(user.battlePass.xp);
  user.battlePass.currentTier = newTier;
  
  const tierUp = newTier > oldTier;

  return {
    success: true,
    xpGained: amount,
    totalXP: user.battlePass.xp,
    currentTier: newTier,
    tierUp: tierUp,
    tiersGained: tierUp ? (newTier - oldTier) : 0,
    source: source
  };
}

function calculateCurrentTier(xp) {
  let tier = 1;
  
  for (let i = BATTLE_PASS_TIERS.length - 1; i >= 0; i--) {
    if (xp >= BATTLE_PASS_TIERS[i].xpRequired) {
      tier = BATTLE_PASS_TIERS[i].tier;
      break;
    }
  }
  
  return tier;
}

async function getBattlePassProgress(userId, data) {
  if (!data.users[userId]) {
    return null;
  }

  const currentSeason = await loadSeasonData(data);
  const user = initializeBattlePassData(data.users[userId], currentSeason);
  const currentTier = user.battlePass.currentTier;
  const currentXP = user.battlePass.xp;
  
  const nextTierData = BATTLE_PASS_TIERS.find(t => t.tier === currentTier + 1);
  const currentTierData = BATTLE_PASS_TIERS.find(t => t.tier === currentTier);
  
  let xpForNextTier = null;
  let xpProgress = 0;
  let progressPercentage = 100;
  
  if (nextTierData) {
    const currentTierXP = currentTierData ? currentTierData.xpRequired : 0;
    xpForNextTier = nextTierData.xpRequired - currentTierXP;
    xpProgress = currentXP - currentTierXP;
    progressPercentage = Math.floor((xpProgress / xpForNextTier) * 100);
  }

  const unclaimedTiers = [];
  for (let i = 1; i <= currentTier; i++) {
    if (!user.battlePass.claimedTiers.includes(i)) {
      unclaimedTiers.push(i);
    }
  }

  return {
    currentTier,
    currentXP,
    xpForNextTier,
    xpProgress,
    progressPercentage,
    unclaimedTiers,
    claimedTiers: user.battlePass.claimedTiers,
    seasonNumber: user.battlePass.seasonNumber,
    maxTier: BATTLE_PASS_TIERS.length
  };
}

async function claimTierRewards(userId, tier, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ User not found!' };
  }

  const currentSeason = await loadSeasonData(data);
  const user = initializeBattlePassData(data.users[userId], currentSeason);
  
  if (tier > user.battlePass.currentTier) {
    return { 
      success: false, 
      message: `❌ You haven't reached Tier ${tier} yet! Your current tier is ${user.battlePass.currentTier}.` 
    };
  }

  if (user.battlePass.claimedTiers.includes(tier)) {
    return { 
      success: false, 
      message: `❌ You've already claimed rewards for Tier ${tier}!` 
    };
  }

  const tierData = BATTLE_PASS_TIERS.find(t => t.tier === tier);
  if (!tierData) {
    return { success: false, message: `❌ Invalid tier: ${tier}` };
  }

  const rewards = tierData.rewards;
  let rewardText = [];

  if (rewards.coins) {
    user.coins += rewards.coins;
    rewardText.push(`💰 ${rewards.coins} Coins`);
  }
  
  if (rewards.gems) {
    user.gems += rewards.gems;
    rewardText.push(`💎 ${rewards.gems} Gems`);
  }
  
  if (rewards.shards) {
    user.shards = (user.shards || 0) + rewards.shards;
    rewardText.push(`🔷 ${rewards.shards} Shards`);
  }
  
  if (rewards.bronzeCrates) {
    user.bronzeCrates = (user.bronzeCrates || 0) + rewards.bronzeCrates;
    rewardText.push(`🟫 ${rewards.bronzeCrates} Bronze Crate${rewards.bronzeCrates > 1 ? 's' : ''}`);
  }
  
  if (rewards.silverCrates) {
    user.silverCrates = (user.silverCrates || 0) + rewards.silverCrates;
    rewardText.push(`⚪ ${rewards.silverCrates} Silver Crate${rewards.silverCrates > 1 ? 's' : ''}`);
  }
  
  if (rewards.goldCrates) {
    user.goldCrates = (user.goldCrates || 0) + rewards.goldCrates;
    rewardText.push(`🟡 ${rewards.goldCrates} Gold Crate${rewards.goldCrates > 1 ? 's' : ''}`);
  }
  
  if (rewards.emeraldCrates) {
    user.emeraldCrates = (user.emeraldCrates || 0) + rewards.emeraldCrates;
    rewardText.push(`🟢 ${rewards.emeraldCrates} Emerald Crate${rewards.emeraldCrates > 1 ? 's' : ''}`);
  }
  
  if (rewards.legendaryCrates) {
    user.legendaryCrates = (user.legendaryCrates || 0) + rewards.legendaryCrates;
    rewardText.push(`🟣 ${rewards.legendaryCrates} Legendary Crate${rewards.legendaryCrates > 1 ? 's' : ''}`);
  }
  
  if (rewards.tyrantCrates) {
    user.tyrantCrates = (user.tyrantCrates || 0) + rewards.tyrantCrates;
    rewardText.push(`🔴 ${rewards.tyrantCrates} Tyrant Crate${rewards.tyrantCrates > 1 ? 's' : ''}`);
  }

  user.battlePass.claimedTiers.push(tier);

  return {
    success: true,
    message: `✅ Claimed Tier ${tier} rewards!`,
    rewards: rewardText,
    tier
  };
}

async function claimAllAvailableRewards(userId, data) {
  if (!data.users[userId]) {
    return { success: false, message: '❌ User not found!' };
  }

  const currentSeason = await loadSeasonData(data);
  const user = initializeBattlePassData(data.users[userId], currentSeason);
  const progress = await getBattlePassProgress(userId, data);
  
  if (progress.unclaimedTiers.length === 0) {
    return { 
      success: false, 
      message: '❌ No unclaimed rewards available! Keep earning XP to unlock more tiers.' 
    };
  }

  const claimedTiers = [];
  const allRewards = [];

  for (const tier of progress.unclaimedTiers) {
    const result = await claimTierRewards(userId, tier, data);
    if (result.success) {
      claimedTiers.push(tier);
      allRewards.push(...result.rewards);
    }
  }

  return {
    success: true,
    message: `✅ Claimed rewards for ${claimedTiers.length} tier${claimedTiers.length > 1 ? 's' : ''}!`,
    rewards: allRewards,
    claimedTiers
  };
}

function getXPSource(action) {
  return XP_SOURCES[action] || 0;
}

async function startNewSeason(seasonNumber, data) {
  const newSeason = {
    number: seasonNumber,
    startDate: new Date(),
    endDate: null,
    active: true
  };
  
  await saveSeasonData(newSeason, data);
  
  return {
    success: true,
    message: `✅ Season ${seasonNumber} has started!`,
    seasonNumber
  };
}

async function getCurrentSeason(data) {
  return await loadSeasonData(data);
}

function createProgressBar(current, total, length = 12) {
  const percentage = Math.min(100, Math.floor((current / total) * 100));
  const filled = Math.floor((percentage / 100) * length);
  const empty = length - filled;
  
  const bar = '🟦'.repeat(filled) + '⬜'.repeat(empty);
  
  return `${bar} ${percentage}%`;
}

module.exports = {
  BATTLE_PASS_TIERS,
  XP_SOURCES,
  loadSeasonData,
  saveSeasonData,
  initializeBattlePassData,
  addXP,
  calculateCurrentTier,
  getBattlePassProgress,
  claimTierRewards,
  claimAllAvailableRewards,
  getXPSource,
  startNewSeason,
  getCurrentSeason,
  createProgressBar
};
