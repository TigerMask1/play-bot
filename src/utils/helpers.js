const { LEVELS, RARITY_WEIGHTS, RARITY_MULTIPLIERS } = require('../config/constants');

function calculateLevel(xp) {
  let level = 1;
  let requiredXP = LEVELS.XP_BASE;
  let totalXP = 0;

  while (totalXP + requiredXP <= xp) {
    totalXP += requiredXP;
    level++;
    requiredXP = Math.floor(LEVELS.XP_BASE * Math.pow(LEVELS.XP_MULTIPLIER, level - 1));
  }

  return {
    level,
    currentXP: xp - totalXP,
    requiredXP,
    totalXP: xp
  };
}

function getXPForLevel(level) {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(LEVELS.XP_BASE * Math.pow(LEVELS.XP_MULTIPLIER, i - 1));
  }
  return totalXP;
}

function selectRandomRarity() {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    random -= weight;
    if (random <= 0) {
      return rarity;
    }
  }
  
  return 'COMMON';
}

function selectRandomCharacter(characters, rarity = null) {
  let pool = characters;
  
  if (rarity) {
    pool = characters.filter(c => c.rarity === rarity);
  }
  
  if (pool.length === 0) return null;
  
  const totalWeight = pool.reduce((sum, char) => sum + (char.dropWeight || 1), 0);
  let random = Math.random() * totalWeight;
  
  for (const character of pool) {
    random -= character.dropWeight || 1;
    if (random <= 0) {
      return character;
    }
  }
  
  return pool[pool.length - 1];
}

function generateCatchCode(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function parseTime(timeString) {
  const units = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000
  };

  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function sanitizeInput(input, maxLength = 100) {
  return input
    .replace(/[<>@#&!`]/g, '')
    .trim()
    .slice(0, maxLength);
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function calculateBattleStats(baseStats, level, boosts = {}) {
  const levelMultiplier = 1 + (level - 1) * 0.1;
  
  return {
    hp: Math.floor((baseStats.hp * levelMultiplier) * (1 + (boosts.hp || 0))),
    attack: Math.floor((baseStats.attack * levelMultiplier) * (1 + (boosts.attack || 0))),
    defense: Math.floor((baseStats.defense * levelMultiplier) * (1 + (boosts.defense || 0))),
    speed: Math.floor((baseStats.speed * levelMultiplier) * (1 + (boosts.speed || 0)))
  };
}

function calculateDamage(attackerAttack, defenderDefense, moveBaseDamage = 10) {
  const baseDamage = ((2 * attackerAttack * moveBaseDamage) / (defenderDefense + 50)) + 2;
  const variance = randomFloat(0.85, 1.15);
  return Math.max(1, Math.floor(baseDamage * variance));
}

function getRarityValue(rarity) {
  return RARITY_MULTIPLIERS[rarity] || 1;
}

function createProgressBar(current, max, length = 10) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function generateId(prefix = '') {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  calculateLevel,
  getXPForLevel,
  selectRandomRarity,
  selectRandomCharacter,
  generateCatchCode,
  formatNumber,
  formatDuration,
  parseTime,
  randomInt,
  randomFloat,
  shuffleArray,
  chunk,
  clamp,
  capitalize,
  sanitizeInput,
  isValidUrl,
  calculateBattleStats,
  calculateDamage,
  getRarityValue,
  createProgressBar,
  sleep,
  debounce,
  generateId
};
