const LEVEL_REQUIREMENTS = {
  1: { tokens: 2, coins: 50 },
  2: { tokens: 5, coins: 100 },
  3: { tokens: 10, coins: 150 },
  4: { tokens: 15, coins: 200 },
  5: { tokens: 20, coins: 300 },
  6: { tokens: 30, coins: 450 },
  7: { tokens: 40, coins: 600 },
  8: { tokens: 55, coins: 800 },
  9: { tokens: 80, coins: 1000 },
  10: { tokens: 120, coins: 1300 },
  11: { tokens: 170, coins: 1700 },
  12: { tokens: 240, coins: 2200 },
  13: { tokens: 340, coins: 2800 },
  14: { tokens: 480, coins: 3500 },
  15: { tokens: 680, coins: 4300 },
  16: { tokens: 950, coins: 5200 },
  17: { tokens: 1350, coins: 6300 },
  18: { tokens: 1950, coins: 7500 },
  19: { tokens: 2800, coins: 9000 }
};

function getLevelRequirements(currentLevel) {
  if (LEVEL_REQUIREMENTS[currentLevel]) {
    return LEVEL_REQUIREMENTS[currentLevel];
  }
  
  const tokens = 2800 + ((currentLevel - 19) * 100);
  const coins = 9000 + ((currentLevel - 19) * 200);
  return { tokens, coins };
}

function calculateLevel(tokens) {
  let level = 1;
  let totalRequired = 0;
  
  while (tokens >= totalRequired + getLevelRequirements(level).tokens) {
    totalRequired += getLevelRequirements(level).tokens;
    level++;
  }
  
  return { level, remainingTokens: tokens - totalRequired };
}

module.exports = { getLevelRequirements, calculateLevel };
