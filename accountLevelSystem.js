const { EmbedBuilder } = require('discord.js');
const { saveData, saveDataImmediate } = require('./dataManager.js');

const ACCOUNT_LEVEL_DATA = [
  { level: 1, xpRequired: 0, reward: { coins: 100, gems: 5 } },
  { level: 2, xpRequired: 100, reward: { coins: 150, gems: 10 } },
  { level: 3, xpRequired: 250, reward: { coins: 200, gems: 15 } },
  { level: 4, xpRequired: 450, reward: { coins: 300, gems: 20 } },
  { level: 5, xpRequired: 700, reward: { coins: 400, gems: 30, pfp: 'level5_pfp.png' } },
  { level: 6, xpRequired: 1000, reward: { coins: 500, gems: 40 } },
  { level: 7, xpRequired: 1400, reward: { coins: 600, gems: 50 } },
  { level: 8, xpRequired: 1900, reward: { coins: 700, gems: 60 } },
  { level: 9, xpRequired: 2500, reward: { coins: 800, gems: 70 } },
  { level: 10, xpRequired: 3200, reward: { coins: 1000, gems: 100, pfp: 'level10_pfp.png' } },
  { level: 11, xpRequired: 4000, reward: { coins: 1200, gems: 110 } },
  { level: 12, xpRequired: 5000, reward: { coins: 1400, gems: 120 } },
  { level: 13, xpRequired: 6200, reward: { coins: 1600, gems: 130 } },
  { level: 14, xpRequired: 7600, reward: { coins: 1800, gems: 140 } },
  { level: 15, xpRequired: 9200, reward: { coins: 2000, gems: 150, pfp: 'level15_pfp.png' } },
  { level: 16, xpRequired: 11000, reward: { coins: 2200, gems: 160 } },
  { level: 17, xpRequired: 13000, reward: { coins: 2400, gems: 170 } },
  { level: 18, xpRequired: 15200, reward: { coins: 2600, gems: 180 } },
  { level: 19, xpRequired: 17600, reward: { coins: 2800, gems: 190 } },
  { level: 20, xpRequired: 20200, reward: { coins: 3000, gems: 200, pfp: 'level20_pfp.png' } },
  { level: 21, xpRequired: 23000, reward: { coins: 3200, gems: 220 } },
  { level: 22, xpRequired: 26000, reward: { coins: 3400, gems: 240 } },
  { level: 23, xpRequired: 29200, reward: { coins: 3600, gems: 260 } },
  { level: 24, xpRequired: 32600, reward: { coins: 3800, gems: 280 } },
  { level: 25, xpRequired: 36200, reward: { coins: 4000, gems: 300, pfp: 'level25_pfp.png' } },
  { level: 26, xpRequired: 40000, reward: { coins: 4500, gems: 320 } },
  { level: 27, xpRequired: 44000, reward: { coins: 5000, gems: 340 } },
  { level: 28, xpRequired: 48200, reward: { coins: 5500, gems: 360 } },
  { level: 29, xpRequired: 52600, reward: { coins: 6000, gems: 380 } },
  { level: 30, xpRequired: 57200, reward: { coins: 7000, gems: 400, pfp: 'level30_pfp.png' } },
  { level: 31, xpRequired: 62000, reward: { coins: 7500, gems: 420 } },
  { level: 32, xpRequired: 67000, reward: { coins: 8000, gems: 440 } },
  { level: 33, xpRequired: 72200, reward: { coins: 8500, gems: 460 } },
  { level: 34, xpRequired: 77600, reward: { coins: 9000, gems: 480 } },
  { level: 35, xpRequired: 83200, reward: { coins: 10000, gems: 500, pfp: 'level35_pfp.png' } },
  { level: 36, xpRequired: 89000, reward: { coins: 10500, gems: 525 } },
  { level: 37, xpRequired: 95000, reward: { coins: 11000, gems: 550 } },
  { level: 38, xpRequired: 101200, reward: { coins: 11500, gems: 575 } },
  { level: 39, xpRequired: 107600, reward: { coins: 12000, gems: 600 } },
  { level: 40, xpRequired: 114200, reward: { coins: 15000, gems: 800, pfp: 'level40_pfp.png' } },
  { level: 41, xpRequired: 121000, reward: { coins: 15500, gems: 850 } },
  { level: 42, xpRequired: 128000, reward: { coins: 16000, gems: 900 } },
  { level: 43, xpRequired: 135200, reward: { coins: 16500, gems: 950 } },
  { level: 44, xpRequired: 142600, reward: { coins: 17000, gems: 1000 } },
  { level: 45, xpRequired: 150200, reward: { coins: 20000, gems: 1200, pfp: 'level45_pfp.png' } },
  { level: 46, xpRequired: 158000, reward: { coins: 21000, gems: 1250 } },
  { level: 47, xpRequired: 166000, reward: { coins: 22000, gems: 1300 } },
  { level: 48, xpRequired: 174200, reward: { coins: 23000, gems: 1350 } },
  { level: 49, xpRequired: 182600, reward: { coins: 24000, gems: 1400 } },
  { level: 50, xpRequired: 191200, reward: { coins: 30000, gems: 2000, pfp: 'level50_pfp.png' } },
];

const XP_PER_COMMAND = 10;
const XP_BONUS_COMMANDS = {
  'c': 5,
  'battle': 15,
  'opencrate': 12,
  'work': 8,
  'daily': 20,
  'quest': 10
};

function initializeAccountLevel(userData) {
  if (!userData.accountLevel) {
    userData.accountLevel = {
      level: 1,
      xp: 0,
      unlockedPfps: []
    };
  }
  return userData.accountLevel;
}

function calculateAccountLevel(xp) {
  let level = 1;
  
  for (let i = ACCOUNT_LEVEL_DATA.length - 1; i >= 0; i--) {
    if (xp >= ACCOUNT_LEVEL_DATA[i].xpRequired) {
      level = ACCOUNT_LEVEL_DATA[i].level;
      break;
    }
  }
  
  return level;
}

function getXPForNextLevel(currentLevel) {
  if (currentLevel >= ACCOUNT_LEVEL_DATA.length) {
    const lastLevel = ACCOUNT_LEVEL_DATA[ACCOUNT_LEVEL_DATA.length - 1];
    const increment = 10000;
    return lastLevel.xpRequired + ((currentLevel - lastLevel.level) * increment);
  }
  
  return ACCOUNT_LEVEL_DATA[currentLevel]?.xpRequired || 0;
}

async function addCommandXP(userData, command, client = null, userId = null) {
  initializeAccountLevel(userData);
  
  const baseXP = XP_PER_COMMAND;
  const bonusXP = XP_BONUS_COMMANDS[command] || 0;
  const totalXP = baseXP + bonusXP;
  
  const oldLevel = userData.accountLevel.level;
  userData.accountLevel.xp += totalXP;
  
  const newLevel = calculateAccountLevel(userData.accountLevel.xp);
  
  if (newLevel > oldLevel) {
    userData.accountLevel.level = newLevel;
    
    const levelData = ACCOUNT_LEVEL_DATA.find(l => l.level === newLevel);
    if (levelData && levelData.reward) {
      if (levelData.reward.coins) {
        userData.coins = (userData.coins || 0) + levelData.reward.coins;
      }
      if (levelData.reward.gems) {
        userData.gems = (userData.gems || 0) + levelData.reward.gems;
      }
      if (levelData.reward.pfp) {
        if (!userData.accountLevel.unlockedPfps) {
          userData.accountLevel.unlockedPfps = [];
        }
        if (!userData.accountLevel.unlockedPfps.includes(levelData.reward.pfp)) {
          userData.accountLevel.unlockedPfps.push(levelData.reward.pfp);
        }
      }
      
      if (client && userId) {
        try {
          const user = await client.users.fetch(userId);
          const levelUpEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 LEVEL UP!')
            .setDescription(`Congratulations! You've reached **Account Level ${newLevel}**!`)
            .addFields(
              { name: '🎁 Rewards', value: getLevelUpRewardsText(levelData.reward), inline: false }
            )
            .setFooter({ text: `Keep using commands to gain XP and level up!` })
            .setTimestamp();
          
          await user.send({ embeds: [levelUpEmbed] }).catch(() => {
            console.log(`Could not DM user ${userId} for level up notification`);
          });
        } catch (error) {
          console.error('Error sending level up notification:', error);
        }
      }
    }
    
    return { leveledUp: true, oldLevel, newLevel, reward: levelData?.reward };
  }
  
  return { leveledUp: false };
}

function getLevelUpRewardsText(reward) {
  const parts = [];
  if (reward.coins) parts.push(`💰 ${reward.coins} Coins`);
  if (reward.gems) parts.push(`💎 ${reward.gems} Gems`);
  if (reward.pfp) parts.push(`🖼️ Unlocked Profile Picture: ${reward.pfp}`);
  return parts.join('\n') || 'None';
}

function getAccountLevelDisplay(userData) {
  initializeAccountLevel(userData);
  
  const currentLevel = userData.accountLevel.level;
  const currentXP = userData.accountLevel.xp;
  const nextLevelXP = getXPForNextLevel(currentLevel);
  
  const currentLevelData = ACCOUNT_LEVEL_DATA.find(l => l.level === currentLevel);
  const currentLevelMinXP = currentLevelData?.xpRequired || 0;
  
  const xpIntoCurrentLevel = currentXP - currentLevelMinXP;
  const xpNeededForNext = nextLevelXP - currentLevelMinXP;
  
  const progressPercent = Math.min(100, Math.floor((xpIntoCurrentLevel / xpNeededForNext) * 100));
  const progressBar = createProgressBar(progressPercent, 20);
  
  return {
    level: currentLevel,
    xp: currentXP,
    nextLevelXP: nextLevelXP,
    xpIntoCurrentLevel,
    xpNeededForNext,
    progressBar,
    progressPercent
  };
}

function createProgressBar(percent, length = 20) {
  const filledLength = Math.round((percent / 100) * length);
  const emptyLength = length - filledLength;
  return `[${'█'.repeat(filledLength)}${'░'.repeat(emptyLength)}] ${percent}%`;
}

module.exports = {
  initializeAccountLevel,
  calculateAccountLevel,
  getXPForNextLevel,
  addCommandXP,
  getAccountLevelDisplay,
  ACCOUNT_LEVEL_DATA,
  XP_PER_COMMAND,
  XP_BONUS_COMMANDS
};
