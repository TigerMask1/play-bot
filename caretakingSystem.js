const HOUSE_LEVELS = {
  1: { coins: 0, gems: 0, ores: {}, description: 'Basic Shelter' },
  2: { coins: 500, gems: 50, ores: { aurelite: 10, oak: 5 }, description: 'Cozy House' },
  3: { coins: 1500, gems: 150, ores: { kryonite: 15, maple: 8 }, description: 'Spacious Home' },
  4: { coins: 3500, gems: 350, ores: { zyronite: 20, ebony: 12 }, description: 'Grand Estate' },
  5: { coins: 7500, gems: 750, ores: { rubinite: 25, celestial: 15 }, description: 'Luxurious Manor' }
};

function canUpgradeHouse(userData, targetLevel) {
  const house = userData.caretakingHouse || { level: 1 };
  
  if (house.level >= 5) {
    return { canUpgrade: false, reason: 'Max level reached!' };
  }
  
  if (targetLevel !== house.level + 1) {
    return { canUpgrade: false, reason: `Must upgrade to level ${house.level + 1} first` };
  }
  
  const requirements = HOUSE_LEVELS[targetLevel];
  const ores = userData.ores || {};
  const wood = userData.wood || {};
  
  if (userData.coins < requirements.coins) {
    return { canUpgrade: false, reason: `Need ${requirements.coins} coins` };
  }
  
  if (userData.gems < requirements.gems) {
    return { canUpgrade: false, reason: `Need ${requirements.gems} gems` };
  }
  
  for (const [resource, amount] of Object.entries(requirements.ores)) {
    const hasAmount = ores[resource] || wood[resource] || 0;
    if (hasAmount < amount) {
      return { canUpgrade: false, reason: `Need ${amount} ${resource}` };
    }
  }
  
  return { canUpgrade: true };
}

function upgradeHouse(userData) {
  const house = userData.caretakingHouse || { level: 1 };
  const nextLevel = house.level + 1;
  
  const check = canUpgradeHouse(userData, nextLevel);
  if (!check.canUpgrade) {
    return { success: false, reason: check.reason };
  }
  
  const requirements = HOUSE_LEVELS[nextLevel];
  const ores = userData.ores || {};
  const wood = userData.wood || {};
  
  userData.coins -= requirements.coins;
  userData.gems -= requirements.gems;
  
  for (const [resource, amount] of Object.entries(requirements.ores)) {
    if (ores[resource]) ores[resource] -= amount;
    if (wood[resource]) wood[resource] -= amount;
  }
  
  house.level = nextLevel;
  
  return {
    success: true,
    newLevel: nextLevel,
    description: HOUSE_LEVELS[nextLevel].description
  };
}

function getHouseInfo(userData) {
  const house = userData.caretakingHouse || { level: 1, animalsCount: 0 };
  return {
    level: house.level,
    description: HOUSE_LEVELS[house.level].description,
    animalsCount: house.animalsCount,
    nextLevelCost: house.level < 5 ? HOUSE_LEVELS[house.level + 1] : null
  };
}

module.exports = {
  HOUSE_LEVELS,
  canUpgradeHouse,
  upgradeHouse,
  getHouseInfo
};
