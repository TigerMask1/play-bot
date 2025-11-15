function createProgressBar(current, max, length = 20, showPercentage = true) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const filledLength = Math.round((percentage / 100) * length);
  const emptyLength = length - filledLength;
  
  const filledChar = '█';
  const emptyChar = '░';
  
  const bar = filledChar.repeat(filledLength) + emptyChar.repeat(emptyLength);
  
  if (showPercentage) {
    return `${bar} ${percentage.toFixed(1)}%`;
  }
  return bar;
}

function createColoredProgressBar(current, max, length = 20) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const filledLength = Math.round((percentage / 100) * length);
  const emptyLength = length - filledLength;
  
  let color = '🟩';
  if (percentage < 25) color = '🟥';
  else if (percentage < 50) color = '🟧';
  else if (percentage < 75) color = '🟨';
  
  const bar = color.repeat(filledLength) + '⬜'.repeat(emptyLength);
  return `${bar} ${current}/${max}`;
}

function createQuestProgressBar(current, max) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const filledLength = Math.round((percentage / 100) * 15);
  const emptyLength = 15 - filledLength;
  
  const filled = '▰';
  const empty = '▱';
  
  const bar = filled.repeat(filledLength) + empty.repeat(emptyLength);
  const status = percentage >= 100 ? '✅' : '⏳';
  
  return `${status} ${bar} ${current}/${max}`;
}

function createLevelProgressBar(currentTokens, requiredTokens) {
  const percentage = Math.min(100, (currentTokens / requiredTokens) * 100);
  const filledLength = Math.round((percentage / 100) * 8);
  const emptyLength = 8 - filledLength;
  
  const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
  
  return `[${bar}] ${currentTokens}/${requiredTokens} 🎫`;
}

module.exports = {
  createProgressBar,
  createColoredProgressBar,
  createQuestProgressBar,
  createLevelProgressBar
};