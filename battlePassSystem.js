const BATTLE_PASS_TIERS = [
  { tier: 1, xpRequired: 0, rewards: { coins: 100, gems: 5 } },
  { tier: 2, xpRequired: 100, rewards: { coins: 150, gems: 5 } },
  { tier: 3, xpRequired: 250, rewards: { coins: 200, shards: 5 } },
  { tier: 4, xpRequired: 450, rewards: { coins: 250, gems: 10 } },
  { tier: 5, xpRequired: 700, rewards: { coins: 300, bronzeCrates: 1 } },
  { tier: 6, xpRequired: 1000, rewards: { coins: 350, gems: 15 } },
  { tier: 7, xpRequired: 1350, rewards: { coins: 400, shards: 10 } },
  { tier: 8, xpRequired: 1750, rewards: { coins: 450, silverCrates: 1 } },
  { tier: 9, xpRequired: 2200, rewards: { coins: 500, gems: 20 } },
  { tier: 10, xpRequired: 2700, rewards: { coins: 600, goldCrates: 1 } },
  { tier: 11, xpRequired: 3250, rewards: { coins: 700, gems: 25 } },
  { tier: 12, xpRequired: 3850, rewards: { coins: 800, shards: 15 } },
  { tier: 13, xpRequired: 4500, rewards: { coins: 900, gems: 30 } },
  { tier: 14, xpRequired: 5200, rewards: { coins: 1000, silverCrates: 2 } },
  { tier: 15, xpRequired: 5950, rewards: { coins: 1200, emeraldCrates: 1 } },
  { tier: 16, xpRequired: 6750, rewards: { coins: 1400, gems: 40 } },
  { tier: 17, xpRequired: 7600, rewards: { coins: 1600, shards: 25 } },
  { tier: 18, xpRequired: 8500, rewards: { coins: 1800, gems: 50 } },
  { tier: 19, xpRequired: 9450, rewards: { coins: 2000, goldCrates: 2 } },
  { tier: 20, xpRequired: 10450, rewards: { coins: 2500, legendaryCrates: 1 } },
  { tier: 21, xpRequired: 11500, rewards: { coins: 2800, gems: 60 } },
  { tier: 22, xpRequired: 12600, rewards: { coins: 3000, shards: 35 } },
  { tier: 23, xpRequired: 13750, rewards: { coins: 3200, emeraldCrates: 2 } },
  { tier: 24, xpRequired: 14950, rewards: { coins: 3500, gems: 75 } },
  { tier: 25, xpRequired: 16200, rewards: { coins: 4000, tyrantCrates: 1 } },
  { tier: 26, xpRequired: 17500, rewards: { coins: 4500, gems: 90 } },
  { tier: 27, xpRequired: 18850, rewards: { coins: 5000, shards: 50 } },
  { tier: 28, xpRequired: 20250, rewards: { coins: 5500, legendaryCrates: 2 } },
  { tier: 29, xpRequired: 21700, rewards: { coins: 6000, gems: 100 } },
  { tier: 30, xpRequired: 23200, rewards: { coins: 7500, tyrantCrates: 2, gems: 150, shards: 75 } }
];

const XP_REWARDS = {
  BATTLE_WIN: 30,
  BATTLE_LOSS: 10,
  DROP_CATCH: 5,
  CRATE_OPEN: 15,
  TRADE_COMPLETE: 20,
  QUEST_COMPLETE: 50,
  DAILY_CLAIM: 40,
  EVENT_PARTICIPATION: 15,
  LEVEL_UP: 60
};

function createUnicodeProgressBar(current, max, length = 20) {
  const filled = Math.floor((current / max) * length);
  const empty = length - filled;
  const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
  const percentage = Math.floor((current / max) * 100);
  return `${bar} ${percentage}%`;
}

function initializeBattlePass(user) {
  if (!user.battlePass) {
    user.battlePass = {
      totalXP: 0,
      currentTier: 1,
      claimedTiers: []
    };
  }
  return user.battlePass;
}

function calculateCurrentTier(totalXP) {
  let tier = 1;
  for (let i = BATTLE_PASS_TIERS.length - 1; i >= 0; i--) {
    if (totalXP >= BATTLE_PASS_TIERS[i].xpRequired) {
      tier = BATTLE_PASS_TIERS[i].tier;
      break;
    }
  }
  return tier;
}

function addXP(user, amount, source) {
  const bp = initializeBattlePass(user);
  const oldTier = bp.currentTier;
  
  bp.totalXP += amount;
  bp.currentTier = calculateCurrentTier(bp.totalXP);
  
  const tierUp = bp.currentTier > oldTier;
  
  return {
    success: true,
    totalXP: bp.totalXP,
    currentTier: bp.currentTier,
    xpGained: amount,
    tierUp: tierUp,
    source: source
  };
}

function getProgressInfo(user) {
  const bp = initializeBattlePass(user);
  const currentTierData = BATTLE_PASS_TIERS.find(t => t.tier === bp.currentTier);
  const nextTierData = BATTLE_PASS_TIERS.find(t => t.tier === bp.currentTier + 1);
  
  if (!nextTierData) {
    return {
      currentTier: bp.currentTier,
      totalXP: bp.totalXP,
      maxTier: true,
      progressBar: '▰'.repeat(20) + ' 100%'
    };
  }
  
  const currentTierXP = currentTierData.xpRequired;
  const nextTierXP = nextTierData.xpRequired;
  const progressInTier = bp.totalXP - currentTierXP;
  const xpNeededForNext = nextTierXP - currentTierXP;
  
  return {
    currentTier: bp.currentTier,
    totalXP: bp.totalXP,
    progressInTier: progressInTier,
    xpNeededForNext: xpNeededForNext,
    nextTierXP: nextTierXP,
    progressBar: createUnicodeProgressBar(progressInTier, xpNeededForNext),
    maxTier: false
  };
}

function getUnclaimedRewards(user) {
  const bp = initializeBattlePass(user);
  const unclaimed = [];
  
  for (let i = 1; i <= bp.currentTier; i++) {
    if (!bp.claimedTiers.includes(i)) {
      const tierData = BATTLE_PASS_TIERS.find(t => t.tier === i);
      if (tierData) {
        unclaimed.push({
          tier: i,
          rewards: tierData.rewards
        });
      }
    }
  }
  
  return unclaimed;
}

function claimRewards(user, data) {
  const unclaimed = getUnclaimedRewards(user);
  
  if (unclaimed.length === 0) {
    return {
      success: false,
      message: '❌ No rewards to claim! Complete more tiers to earn rewards.'
    };
  }
  
  let totalCoins = 0;
  let totalGems = 0;
  let totalShards = 0;
  let crates = {
    bronze: 0,
    silver: 0,
    gold: 0,
    emerald: 0,
    legendary: 0,
    tyrant: 0
  };
  
  unclaimed.forEach(tier => {
    const rewards = tier.rewards;
    
    if (rewards.coins) {
      totalCoins += rewards.coins;
      user.coins = (user.coins || 0) + rewards.coins;
    }
    if (rewards.gems) {
      totalGems += rewards.gems;
      user.gems = (user.gems || 0) + rewards.gems;
    }
    if (rewards.shards) {
      totalShards += rewards.shards;
      user.shards = (user.shards || 0) + rewards.shards;
    }
    if (rewards.bronzeCrates) {
      crates.bronze += rewards.bronzeCrates;
      user.bronzeCrates = (user.bronzeCrates || 0) + rewards.bronzeCrates;
    }
    if (rewards.silverCrates) {
      crates.silver += rewards.silverCrates;
      user.silverCrates = (user.silverCrates || 0) + rewards.silverCrates;
    }
    if (rewards.goldCrates) {
      crates.gold += rewards.goldCrates;
      user.goldCrates = (user.goldCrates || 0) + rewards.goldCrates;
    }
    if (rewards.emeraldCrates) {
      crates.emerald += rewards.emeraldCrates;
      user.emeraldCrates = (user.emeraldCrates || 0) + rewards.emeraldCrates;
    }
    if (rewards.legendaryCrates) {
      crates.legendary += rewards.legendaryCrates;
      user.legendaryCrates = (user.legendaryCrates || 0) + rewards.legendaryCrates;
    }
    if (rewards.tyrantCrates) {
      crates.tyrant += rewards.tyrantCrates;
      user.tyrantCrates = (user.tyrantCrates || 0) + rewards.tyrantCrates;
    }
    
    user.battlePass.claimedTiers.push(tier.tier);
  });
  
  let rewardText = [];
  if (totalCoins > 0) rewardText.push(`💰 ${totalCoins} Coins`);
  if (totalGems > 0) rewardText.push(`💎 ${totalGems} Gems`);
  if (totalShards > 0) rewardText.push(`✨ ${totalShards} Shards`);
  if (crates.bronze > 0) rewardText.push(`🟤 ${crates.bronze} Bronze Crate${crates.bronze > 1 ? 's' : ''}`);
  if (crates.silver > 0) rewardText.push(`⚪ ${crates.silver} Silver Crate${crates.silver > 1 ? 's' : ''}`);
  if (crates.gold > 0) rewardText.push(`🟡 ${crates.gold} Gold Crate${crates.gold > 1 ? 's' : ''}`);
  if (crates.emerald > 0) rewardText.push(`🟢 ${crates.emerald} Emerald Crate${crates.emerald > 1 ? 's' : ''}`);
  if (crates.legendary > 0) rewardText.push(`🟣 ${crates.legendary} Legendary Crate${crates.legendary > 1 ? 's' : ''}`);
  if (crates.tyrant > 0) rewardText.push(`🔴 ${crates.tyrant} Tyrant Crate${crates.tyrant > 1 ? 's' : ''}`);
  
  return {
    success: true,
    tiersClaimed: unclaimed.length,
    rewards: rewardText.join('\n'),
    message: `✅ Claimed rewards from **${unclaimed.length} tier${unclaimed.length > 1 ? 's' : ''}**!\n\n${rewardText.join('\n')}`
  };
}

module.exports = {
  BATTLE_PASS_TIERS,
  XP_REWARDS,
  createUnicodeProgressBar,
  initializeBattlePass,
  calculateCurrentTier,
  addXP,
  getProgressInfo,
  getUnclaimedRewards,
  claimRewards
};
