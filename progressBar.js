function createProgressBar(current, max, length = 20, showPercentage = true) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  // Improved fractional block system (8 levels)
  const totalLevels = length * 8;
  const filledLevels = Math.floor((percentage / 100) * totalLevels);

  const fullBlocks = Math.floor(filledLevels / 8);
  const partialIndex = filledLevels % 8;

  const blocks = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];

  const bar =
    '█'.repeat(fullBlocks) +
    (partialIndex > 0 ? blocks[partialIndex] : '') +
    '░'.repeat(length - fullBlocks - (partialIndex > 0 ? 1 : 0));

  if (showPercentage) {
    return `${bar} ${percentage.toFixed(1)}%`;
  }
  return bar;
}

function createColoredProgressBar(current, max, length = 20) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;

  let color = '🟩';
  if (percentage < 25) color = '🟥';
  else if (percentage < 50) color = '🟧';
  else if (percentage < 75) color = '🟨';

  return `${color.repeat(filled)}${"⬛".repeat(empty)} ${current}/${max}`;
}

function createQuestProgressBar(current, max) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const barLength = 15;

  const filledLength = Math.round((percentage / 100) * barLength);
  const emptyLength = barLength - filledLength;

  const bar =
    '█'.repeat(filledLength) +
    '▬'.repeat(emptyLength);

  return `${bar} ${current}/${max}`;
}

function createLevelProgressBar(currentTokens, requiredTokens) {
  const percentage = Math.min(100, (currentTokens / requiredTokens) * 100);
  const barLength = 20;

  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;

  const filledBar = '🟨'.repeat(filled);
  const emptyBar = '⬛'.repeat(empty);

  return `🎫 **${filledBar}${emptyBar} ${percentage.toFixed(0)}% (${currentTokens}/${requiredTokens})**`;
}


// ⭐ NEW: CLEAN CONTINUOUS BORDERED PROGRESS BAR
function createBorderProgressBar(current, max, length = 20) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  const totalLevels = length * 8;
  const filledLevels = Math.floor((percentage / 100) * totalLevels);

  const fullBlocks = Math.floor(filledLevels / 8);
  const partialIndex = filledLevels % 8;

  const blocks = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'];

  const bar =
    '█'.repeat(fullBlocks) +
    (partialIndex > 0 ? blocks[partialIndex] : '') +
    '░'.repeat(length - fullBlocks - (partialIndex > 0 ? 1 : 0));

  return `[${bar}] ${percentage.toFixed(1)}%`;
}



module.exports = {
  createProgressBar,
  createColoredProgressBar,
  createQuestProgressBar,
  createLevelProgressBar,
  createBorderProgressBar // added new one
};