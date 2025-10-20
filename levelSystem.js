const LEVEL_REQUIREMENTS = {
  1: 2,
  2: 5,
  3: 10,
  4: 15,
  5: 20,
  6: 30,
  7: 40,
  8: 55,
  9: 80,
  10: 120,
  11: 170,
  12: 240,
  13: 340,
  14: 480,
  15: 680,
  16: 950,
  17: 1350,
  18: 1950,
  19: 2800
};

function getLevelRequirements(currentLevel) {
  if (LEVEL_REQUIREMENTS[currentLevel]) {
    return LEVEL_REQUIREMENTS[currentLevel];
  }
  
  return 2800 + ((currentLevel - 19) * 100);
}

function calculateLevel(tokens) {
  let level = 1;
  let totalRequired = 0;
  
  while (tokens >= totalRequired + getLevelRequirements(level)) {
    totalRequired += getLevelRequirements(level);
    level++;
  }
  
  return { level, remainingTokens: tokens - totalRequired };
}

module.exports = { getLevelRequirements, calculateLevel };
