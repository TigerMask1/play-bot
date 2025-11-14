function createProgressBar(current, max, length = 20, showPercentage = true) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const filledLength = Math.round((percentage / 100) * length);
  const emptyLength = length - filledLength;
  
  const blocks = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];
  const fullBlocks = Math.floor(filledLength);
  const partialBlock = filledLength - fullBlocks;
  const partialIndex = Math.floor(partialBlock * (blocks.length - 1));
  
  const bar = '█'.repeat(fullBlocks) + blocks[partialIndex] + '░'.repeat(Math.max(0, emptyLength - (partialBlock > 0 ? 1 : 0)));
  
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
  
  const bar = color.repeat(filledLength) + '⬛'.repeat(emptyLength);
  return `${bar} ${current}/${max}`;
}

function createQuestProgressBar(current, max) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  // ANSI color codes: \u001b[43m = yellow background, \u001b[40m = black background, \u001b[0m = reset
  const filled = '\u001b[43m' + ' '.repeat(filledLength) + '\u001b[0m';
  const empty = '\u001b[40m' + ' '.repeat(emptyLength) + '\u001b[0m';
  
  return '```ansi\n' + filled + empty + '```' + ` ${current}/${max}`;
}

function createLevelProgressBar(currentTokens, requiredTokens) {
  const percentage = Math.min(100, (currentTokens / requiredTokens) * 100);
  const barLength = 20;
  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;
  
  // ANSI color codes: \u001b[43m = yellow background, \u001b[40m = black background, \u001b[0m = reset
  const filled = '\u001b[43m' + ' '.repeat(filledLength) + '\u001b[0m';
  const empty = '\u001b[40m' + ' '.repeat(emptyLength) + '\u001b[0m';
  
  return '🎫 ```ansi\n' + filled + empty + '```' + `**${currentTokens}/${requiredTokens}** (${percentage.toFixed(0)}%)`;
}

module.exports = {
  createProgressBar,
  createColoredProgressBar,
  createQuestProgressBar,
  createLevelProgressBar
};
