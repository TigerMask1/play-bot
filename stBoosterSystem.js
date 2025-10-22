const { calculateDamage } = require('./battleUtils.js');

const SHARDS_PER_BOOSTER = 8;

const BOOST_PROBABILITIES = [
  { chance: 0.75, min: 5, max: 10, tier: "Common" },
  { chance: 0.20, min: 10, max: 18, tier: "Rare" },
  { chance: 0.05, min: 18, max: 25, tier: "Legendary" }
];

function canCraftBooster(userData) {
  const shards = userData.shards || 0;
  return shards >= SHARDS_PER_BOOSTER;
}

function craftBooster(userData) {
  if (!canCraftBooster(userData)) {
    return { success: false, message: `❌ You need ${SHARDS_PER_BOOSTER} shards to craft an ST Booster! You have ${userData.shards || 0}.` };
  }
  
  userData.shards -= SHARDS_PER_BOOSTER;
  userData.stBoosters = (userData.stBoosters || 0) + 1;
  
  return {
    success: true,
    message: `✅ Successfully crafted an ST Booster! You now have ${userData.stBoosters} booster(s). Use !boost <character> to use it!`
  };
}

function getBoostAmount() {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const boost of BOOST_PROBABILITIES) {
    cumulative += boost.chance;
    if (roll < cumulative) {
      const amount = Math.random() * (boost.max - boost.min) + boost.min;
      return {
        amount: parseFloat(amount.toFixed(2)),
        tier: boost.tier
      };
    }
  }
  
  return { amount: 5.0, tier: "Common" };
}

function useBooster(userData, characterName) {
  if (!userData.stBoosters || userData.stBoosters <= 0) {
    return { success: false, message: "❌ You don't have any ST Boosters! Craft one with 8 shards using !craft" };
  }
  
  if (!userData.characters || !userData.characters[characterName]) {
    return { success: false, message: "❌ You don't own this character!" };
  }
  
  const character = userData.characters[characterName];
  const oldST = character.st;
  
  if (oldST >= 100) {
    return { success: false, message: "❌ This character already has 100% ST!" };
  }
  
  const boost = getBoostAmount();
  const newST = Math.min(100, oldST + boost.amount);
  const actualBoost = newST - oldST;
  
  character.st = parseFloat(newST.toFixed(2));
  
  if (character.baseHP) {
    const { calculateHP } = require('./battleUtils.js');
    character.baseHP = calculateHP(character.st);
  }
  
  userData.stBoosters -= 1;
  
  if (!userData.questProgress) userData.questProgress = {};
  userData.questProgress.boostsUsed = (userData.questProgress.boostsUsed || 0) + 1;
  
  let tierEmoji = '⭐';
  if (boost.tier === 'Rare') tierEmoji = '🌟';
  else if (boost.tier === 'Legendary') tierEmoji = '💫';
  
  return {
    success: true,
    character: characterName,
    oldST: oldST.toFixed(2),
    newST: newST.toFixed(2),
    boost: actualBoost.toFixed(2),
    tier: boost.tier,
    tierEmoji: tierEmoji,
    message: `${tierEmoji} **${boost.tier} Boost!** ${characterName}'s ST increased from ${oldST.toFixed(2)}% to ${newST.toFixed(2)}% (+${actualBoost.toFixed(2)}%)`
  };
}

function getBoosterInfo(userData) {
  const shards = userData.shards || 0;
  const boosters = userData.stBoosters || 0;
  const boostsUsed = userData.questProgress?.boostsUsed || 0;
  
  return {
    shards,
    boosters,
    boostsUsed,
    canCraft: shards >= SHARDS_PER_BOOSTER,
    shardsNeeded: Math.max(0, SHARDS_PER_BOOSTER - shards)
  };
}

module.exports = {
  SHARDS_PER_BOOSTER,
  BOOST_PROBABILITIES,
  canCraftBooster,
  craftBooster,
  useBooster,
  getBoosterInfo
};
