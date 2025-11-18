// Equipment items configuration
// Each item has tiers, level progression, and battle effects

const EQUIPMENT_TIERS = {
  SILVER: 'silver',
  GOLD: 'gold',
  LEGENDARY: 'legendary'
};

// Level progression thresholds - number of copies needed to reach each level
const LEVEL_THRESHOLDS = {
  silver: [1, 3, 7, 15, 30, 50, 75, 105, 145, 200],
  gold: [1, 4, 10, 20, 35, 55, 80, 110, 145, 190],
  legendary: [1, 5, 12, 25, 45, 70, 100, 135, 180, 240]
};

// Equipment items definitions
const EQUIPMENT_ITEMS = {
  // SILVER TIER
  'med_drop': {
    id: 'med_drop',
    name: 'Med-Drop',
    tier: EQUIPMENT_TIERS.SILVER,
    emoji: '💉',
    description: 'Heals you for a percentage of damage dealt',
    type: 'passive',
    baseEffect: {
      healPercent: 5,
      maxActivations: 1,
      scalePerLevel: 1.5
    },
    detailedDescription: (level) => {
      const healPercent = 5 + (level - 1) * 1.5;
      return `Heals you for ${healPercent.toFixed(1)}% of damage you deal (activates once per battle)`;
    }
  },
  'vanish_ring': {
    id: 'vanish_ring',
    name: 'Vanish-Ring',
    tier: EQUIPMENT_TIERS.SILVER,
    emoji: '💍',
    description: 'Chance to drain opponent\'s energy',
    type: 'passive',
    baseEffect: {
      procChance: 5,
      energyDrain: 5,
      scalePerLevel: 2
    },
    detailedDescription: (level) => {
      const chance = 5 + (level - 1) * 2;
      return `${chance}% chance to drain 5 extra energy from opponent on their moves`;
    }
  },
  
  // GOLD TIER
  'leech_suck': {
    id: 'leech_suck',
    name: 'Leech-Suck',
    tier: EQUIPMENT_TIERS.GOLD,
    emoji: '🧛',
    description: 'Absorb opponent\'s health',
    type: 'active',
    baseEffect: {
      minDrain: 5,
      maxDrain: 15,
      scalePerLevel: 3,
      maxUses: 1
    },
    detailedDescription: (level) => {
      const min = 5;
      const max = Math.min(15 + (level - 1) * 3, 30);
      return `Absorb ${min}-${max}% of opponent's current HP (use once per battle)`;
    }
  },
  'mist_dodge': {
    id: 'mist_dodge',
    name: 'Mist-Dodge',
    tier: EQUIPMENT_TIERS.GOLD,
    emoji: '🌫️',
    description: 'Next enemy attack may miss',
    type: 'active',
    baseEffect: {
      dodgeChance: 20,
      scalePerLevel: 5,
      maxUses: 1
    },
    detailedDescription: (level) => {
      const chance = Math.min(20 + (level - 1) * 5, 50);
      return `Next opponent attack has ${chance}% chance to miss completely (use once per battle)`;
    }
  },
  'fire_fang': {
    id: 'fire_fang',
    name: 'Fire-Fang',
    tier: EQUIPMENT_TIERS.GOLD,
    emoji: '🔥',
    description: 'Reflects damage back to attacker',
    type: 'active',
    baseEffect: {
      reflectPercent: 20,
      scalePerLevel: 5,
      maxReflect: 35,
      maxUses: 1
    },
    detailedDescription: (level) => {
      const percent = Math.min(20 + (level - 1) * 5, 35);
      return `Activate before using special ability - opponent's next move reflects ${percent}% damage back (use once per battle)`;
    }
  },
  
  // LEGENDARY TIER
  'reflective_mirror': {
    id: 'reflective_mirror',
    name: 'Reflective-Mirror',
    tier: EQUIPMENT_TIERS.LEGENDARY,
    emoji: '🪞',
    description: 'Predicts and reflects massive damage',
    type: 'active',
    baseEffect: {
      reflectPercent: 75,
      scalePerLevel: 5,
      maxUses: 1,
      hidden: true
    },
    detailedDescription: (level) => {
      const percent = Math.min(75 + (level - 1) * 5, 100);
      return `Activate in advance - next direct damage reflects ${percent}% back (hidden activation, use once per battle)`;
    }
  },
  'self_defibrillator': {
    id: 'self_defibrillator',
    name: 'Self-Defibrillator',
    tier: EQUIPMENT_TIERS.LEGENDARY,
    emoji: '⚡',
    description: 'Automatically revives you from death',
    type: 'passive',
    baseEffect: {
      reviveEnergy: 5,
      scalePerLevel: 2,
      maxUses: 1,
      autoTrigger: true
    },
    detailedDescription: (level) => {
      const energy = 5 + (level - 1) * 2;
      return `Automatically revive with full HP and ${energy} energy when knocked out (once per battle)`;
    }
  },
  'energy_smash': {
    id: 'energy_smash',
    name: 'Energy-Smash',
    tier: EQUIPMENT_TIERS.LEGENDARY,
    emoji: '⚡',
    description: 'Refunds energy from your next move',
    type: 'active',
    baseEffect: {
      refundPercent: 70,
      scalePerLevel: 5,
      maxUses: 1
    },
    detailedDescription: (level) => {
      const percent = Math.min(70 + (level - 1) * 5, 90);
      return `Your next move refunds ${percent}% of energy used (use once per battle)`;
    }
  }
};

// Item drop pools for each crate type
const CRATE_ITEM_POOLS = {
  bronze: {
    items: ['med_drop', 'vanish_ring'],
    dropChance: 30,
    maxRolls: 1
  },
  silver: {
    items: ['med_drop', 'vanish_ring'],
    dropChance: 35,
    maxRolls: 1
  },
  gold: {
    items: ['med_drop', 'vanish_ring', 'leech_suck', 'mist_dodge', 'fire_fang'],
    dropChance: 25,
    maxRolls: 1,
    tierWeights: { silver: 60, gold: 40 }
  },
  emerald: {
    items: ['med_drop', 'vanish_ring', 'leech_suck', 'mist_dodge', 'fire_fang'],
    dropChance: 30,
    maxRolls: 2,
    tierWeights: { silver: 40, gold: 60 }
  },
  legendary: {
    items: ['leech_suck', 'mist_dodge', 'fire_fang', 'reflective_mirror', 'self_defibrillator', 'energy_smash'],
    dropChance: 20,
    maxRolls: 2,
    tierWeights: { gold: 60, legendary: 40 }
  },
  tyrant: {
    items: ['leech_suck', 'mist_dodge', 'fire_fang', 'reflective_mirror', 'self_defibrillator', 'energy_smash'],
    dropChance: 25,
    maxRolls: 3,
    tierWeights: { gold: 40, legendary: 60 }
  }
};

// Calculate level from number of copies
function calculateItemLevel(tier, copies) {
  const thresholds = LEVEL_THRESHOLDS[tier];
  if (!thresholds) return 1;
  
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (copies >= thresholds[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

// Get progress to next level
function getProgressToNextLevel(tier, copies) {
  const thresholds = LEVEL_THRESHOLDS[tier];
  if (!thresholds) return { current: 1, needed: 1, progress: 100 };
  
  const currentLevel = calculateItemLevel(tier, copies);
  
  if (currentLevel >= thresholds.length) {
    return {
      current: copies,
      needed: thresholds[thresholds.length - 1],
      progress: 100,
      maxLevel: true
    };
  }
  
  const currentThreshold = thresholds[currentLevel - 1];
  const nextThreshold = thresholds[currentLevel];
  const copiesIntoLevel = copies - currentThreshold;
  const copiesNeeded = nextThreshold - currentThreshold;
  const progress = (copiesIntoLevel / copiesNeeded) * 100;
  
  return {
    current: copiesIntoLevel,
    needed: copiesNeeded,
    progress: Math.min(100, Math.max(0, progress)),
    maxLevel: false
  };
}

// Get item by ID
function getEquipmentItem(itemId) {
  return EQUIPMENT_ITEMS[itemId] || null;
}

// Get all items for a tier
function getItemsByTier(tier) {
  return Object.values(EQUIPMENT_ITEMS).filter(item => item.tier === tier);
}

// Get tier emoji
function getTierEmoji(tier) {
  const emojis = {
    silver: '⚪',
    gold: '🥇',
    legendary: '🔥'
  };
  return emojis[tier] || '❓';
}

module.exports = {
  EQUIPMENT_TIERS,
  LEVEL_THRESHOLDS,
  EQUIPMENT_ITEMS,
  CRATE_ITEM_POOLS,
  calculateItemLevel,
  getProgressToNextLevel,
  getEquipmentItem,
  getItemsByTier,
  getTierEmoji
};
