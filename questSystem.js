const { createQuestProgressBar } = require('./progressBar.js');

const QUESTS = [
  { id: 1, name: "First Steps", description: "Start your journey", type: "starter", requirement: 1, current: "started", reward: { coins: 100, gems: 5 } },
  { id: 2, name: "Catch Your First Drop", description: "Catch 1 drop from the drop channel", type: "drops", requirement: 1, current: "dropsCaught", reward: { coins: 50, gems: 2 } },
  { id: 3, name: "Drop Hunter I", description: "Catch 10 drops", type: "drops", requirement: 10, current: "dropsCaught", reward: { coins: 150, gems: 5 } },
  { id: 4, name: "Drop Hunter II", description: "Catch 25 drops", type: "drops", requirement: 25, current: "dropsCaught", reward: { coins: 300, gems: 10, shards: 1 } },
  { id: 5, name: "Drop Hunter III", description: "Catch 50 drops", type: "drops", requirement: 50, current: "dropsCaught", reward: { coins: 500, gems: 15, shards: 2 } },
  { id: 6, name: "Drop Master", description: "Catch 100 drops", type: "drops", requirement: 100, current: "dropsCaught", reward: { coins: 1000, gems: 25, shards: 3 } },
  
  { id: 7, name: "First Battle", description: "Win your first battle", type: "battles", requirement: 1, current: "battlesWon", reward: { coins: 200, gems: 8 } },
  { id: 8, name: "Battle Novice", description: "Win 5 battles", type: "battles", requirement: 5, current: "battlesWon", reward: { coins: 400, gems: 15, shards: 1 } },
  { id: 9, name: "Battle Apprentice", description: "Win 10 battles", type: "battles", requirement: 10, current: "battlesWon", reward: { coins: 700, gems: 20, shards: 2 } },
  { id: 10, name: "Battle Expert", description: "Win 25 battles", type: "battles", requirement: 25, current: "battlesWon", reward: { coins: 1200, gems: 35, shards: 3 } },
  { id: 11, name: "Battle Master", description: "Win 50 battles", type: "battles", requirement: 50, current: "battlesWon", reward: { coins: 2000, gems: 50, shards: 5 } },
  { id: 12, name: "Legendary Warrior", description: "Win 100 battles", type: "battles", requirement: 100, current: "battlesWon", reward: { coins: 5000, gems: 100, shards: 10 } },
  
  { id: 13, name: "Character Collector I", description: "Own 5 different characters", type: "collection", requirement: 5, current: "uniqueChars", reward: { coins: 300, gems: 10 } },
  { id: 14, name: "Character Collector II", description: "Own 10 different characters", type: "collection", requirement: 10, current: "uniqueChars", reward: { coins: 600, gems: 20, shards: 2 } },
  { id: 15, name: "Character Collector III", description: "Own 15 different characters", type: "collection", requirement: 15, current: "uniqueChars", reward: { coins: 1000, gems: 35, shards: 3 } },
  { id: 16, name: "Character Enthusiast", description: "Own 20 different characters", type: "collection", requirement: 20, current: "uniqueChars", reward: { coins: 1500, gems: 50, shards: 5 } },
  { id: 17, name: "Character Master", description: "Own 30 different characters", type: "collection", requirement: 30, current: "uniqueChars", reward: { coins: 3000, gems: 75, shards: 8 } },
  { id: 18, name: "Complete Collection", description: "Own all 51 characters", type: "collection", requirement: 51, current: "uniqueChars", reward: { coins: 10000, gems: 200, shards: 20 } },
  
  { id: 19, name: "Level Up!", description: "Level up any character to level 5", type: "leveling", requirement: 5, current: "maxLevel", reward: { coins: 200, gems: 8 } },
  { id: 20, name: "Power Training I", description: "Level up any character to level 10", type: "leveling", requirement: 10, current: "maxLevel", reward: { coins: 400, gems: 15, shards: 1 } },
  { id: 21, name: "Power Training II", description: "Level up any character to level 15", type: "leveling", requirement: 15, current: "maxLevel", reward: { coins: 700, gems: 25, shards: 2 } },
  { id: 22, name: "Power Training III", description: "Level up any character to level 20", type: "leveling", requirement: 20, current: "maxLevel", reward: { coins: 1200, gems: 40, shards: 4 } },
  { id: 23, name: "Elite Trainer", description: "Level up any character to level 30", type: "leveling", requirement: 30, current: "maxLevel", reward: { coins: 2500, gems: 75, shards: 8 } },
  { id: 24, name: "Legendary Trainer", description: "Level up any character to level 50", type: "leveling", requirement: 50, current: "maxLevel", reward: { coins: 5000, gems: 150, shards: 15 } },
  
  { id: 25, name: "First Crate", description: "Open your first crate", type: "crates", requirement: 1, current: "cratesOpened", reward: { coins: 100, gems: 5 } },
  { id: 26, name: "Crate Opener I", description: "Open 5 crates", type: "crates", requirement: 5, current: "cratesOpened", reward: { coins: 300, gems: 12 } },
  { id: 27, name: "Crate Opener II", description: "Open 10 crates", type: "crates", requirement: 10, current: "cratesOpened", reward: { coins: 600, gems: 20, shards: 1 } },
  { id: 28, name: "Crate Enthusiast", description: "Open 25 crates", type: "crates", requirement: 25, current: "cratesOpened", reward: { coins: 1200, gems: 40, shards: 3 } },
  { id: 29, name: "Crate Master", description: "Open 50 crates", type: "crates", requirement: 50, current: "cratesOpened", reward: { coins: 2500, gems: 80, shards: 6 } },
  
  { id: 30, name: "First Trade", description: "Complete your first trade", type: "trading", requirement: 1, current: "tradesCompleted", reward: { coins: 150, gems: 6 } },
  { id: 31, name: "Merchant I", description: "Complete 5 trades", type: "trading", requirement: 5, current: "tradesCompleted", reward: { coins: 400, gems: 15 } },
  { id: 32, name: "Merchant II", description: "Complete 10 trades", type: "trading", requirement: 10, current: "tradesCompleted", reward: { coins: 750, gems: 25, shards: 2 } },
  { id: 33, name: "Trade Expert", description: "Complete 25 trades", type: "trading", requirement: 25, current: "tradesCompleted", reward: { coins: 1500, gems: 50, shards: 4 } },
  
  { id: 34, name: "Coin Saver I", description: "Accumulate 1000 coins", type: "currency", requirement: 1000, current: "coins", reward: { gems: 10 } },
  { id: 35, name: "Coin Saver II", description: "Accumulate 5000 coins", type: "currency", requirement: 5000, current: "coins", reward: { gems: 25, shards: 1 } },
  { id: 36, name: "Coin Hoarder", description: "Accumulate 10000 coins", type: "currency", requirement: 10000, current: "coins", reward: { gems: 50, shards: 3 } },
  { id: 37, name: "Coin Tycoon", description: "Accumulate 25000 coins", type: "currency", requirement: 25000, current: "coins", reward: { gems: 100, shards: 6 } },
  
  { id: 38, name: "Gem Collector I", description: "Accumulate 100 gems", type: "currency", requirement: 100, current: "gems", reward: { coins: 500 } },
  { id: 39, name: "Gem Collector II", description: "Accumulate 250 gems", type: "currency", requirement: 250, current: "gems", reward: { coins: 1200, shards: 1 } },
  { id: 40, name: "Gem Enthusiast", description: "Accumulate 500 gems", type: "currency", requirement: 500, current: "gems", reward: { coins: 2500, shards: 3 } },
  { id: 41, name: "Gem Master", description: "Accumulate 1000 gems", type: "currency", requirement: 1000, current: "gems", reward: { coins: 5000, shards: 6 } },
  
  { id: 42, name: "Perfectionist", description: "Own a character with 100% ST", type: "special", requirement: 1, current: "perfectST", reward: { coins: 2000, gems: 50, shards: 5 } },
  { id: 43, name: "Shard Seeker I", description: "Collect 5 shards", type: "shards", requirement: 5, current: "shards", reward: { coins: 500, gems: 15 } },
  { id: 44, name: "Shard Seeker II", description: "Collect 10 shards", type: "shards", requirement: 10, current: "shards", reward: { coins: 1000, gems: 30 } },
  { id: 45, name: "Shard Collector", description: "Collect 25 shards", type: "shards", requirement: 25, current: "shards", reward: { coins: 2500, gems: 60 } },
  { id: 46, name: "Shard Master", description: "Collect 50 shards", type: "shards", requirement: 50, current: "shards", reward: { coins: 5000, gems: 125 } },
  
  { id: 47, name: "First Boost", description: "Use your first ST Booster", type: "boosting", requirement: 1, current: "boostsUsed", reward: { coins: 500, gems: 20 } },
  { id: 48, name: "Booster Enthusiast", description: "Use 5 ST Boosters", type: "boosting", requirement: 5, current: "boostsUsed", reward: { coins: 1500, gems: 50, shards: 2 } },
  { id: 49, name: "Booster Master", description: "Use 10 ST Boosters", type: "boosting", requirement: 10, current: "boostsUsed", reward: { coins: 3000, gems: 100, shards: 5 } },
  
  { id: 50, name: "Win Streak I", description: "Win 3 battles in a row", type: "special", requirement: 3, current: "winStreak", reward: { coins: 400, gems: 15, shards: 1 } },
  { id: 51, name: "Win Streak II", description: "Win 5 battles in a row", type: "special", requirement: 5, current: "winStreak", reward: { coins: 800, gems: 30, shards: 3 } },
  { id: 52, name: "Win Streak III", description: "Win 10 battles in a row", type: "special", requirement: 10, current: "winStreak", reward: { coins: 2000, gems: 60, shards: 6 } },
  
  { id: 53, name: "Character Releaser", description: "Release a character", type: "special", requirement: 1, current: "charsReleased", reward: { coins: 300, gems: 10 } },
  { id: 54, name: "Tyrant Crate Owner", description: "Open a Tyrant Crate", type: "crates", requirement: 1, current: "tyrantCratesOpened", reward: { coins: 500, gems: 20, shards: 2 } },
  
  { id: 55, name: "Team Builder I", description: "Have 3 characters at level 10+", type: "leveling", requirement: 3, current: "charsLevel10Plus", reward: { coins: 800, gems: 25, shards: 2 } },
  { id: 56, name: "Team Builder II", description: "Have 5 characters at level 10+", type: "leveling", requirement: 5, current: "charsLevel10Plus", reward: { coins: 1500, gems: 45, shards: 4 } },
  { id: 57, name: "Elite Team", description: "Have 3 characters at level 20+", type: "leveling", requirement: 3, current: "charsLevel20Plus", reward: { coins: 2500, gems: 75, shards: 6 } },
  
  { id: 58, name: "Battle Veteran", description: "Participate in 50 battles (wins or losses)", type: "battles", requirement: 50, current: "totalBattles", reward: { coins: 1500, gems: 40, shards: 4 } },
  { id: 59, name: "Battle Legend", description: "Participate in 100 battles (wins or losses)", type: "battles", requirement: 100, current: "totalBattles", reward: { coins: 3500, gems: 85, shards: 8 } },
  
  { id: 60, name: "Token Hoarder I", description: "Accumulate 500 total tokens across all characters", type: "special", requirement: 500, current: "totalTokens", reward: { coins: 800, gems: 25, shards: 2 } },
  { id: 61, name: "Token Hoarder II", description: "Accumulate 1000 total tokens across all characters", type: "special", requirement: 1000, current: "totalTokens", reward: { coins: 1800, gems: 50, shards: 4 } },
  { id: 62, name: "Token Master", description: "Accumulate 2500 total tokens across all characters", type: "special", requirement: 2500, current: "totalTokens", reward: { coins: 4000, gems: 100, shards: 8 } },
  
  { id: 63, name: "High Roller", description: "Own a character with 90%+ ST", type: "special", requirement: 1, current: "highSTChar", reward: { coins: 1200, gems: 35, shards: 3 } },
  { id: 64, name: "Lucky Streak", description: "Get a character from a crate 3 times", type: "crates", requirement: 3, current: "charsFromCrates", reward: { coins: 1500, gems: 45, shards: 4 } },
  { id: 65, name: "Ultimate Champion", description: "Win a battle with a character at level 30+", type: "special", requirement: 1, current: "highLevelWin", reward: { coins: 3000, gems: 80, shards: 8 } },
];

function getQuestProgress(userData, quest) {
  if (!userData.questProgress) userData.questProgress = {};
  
  let current = 0;
  
  switch (quest.current) {
    case 'started':
      current = userData.started ? 1 : 0;
      break;
    case 'dropsCaught':
      current = userData.questProgress.dropsCaught || 0;
      break;
    case 'battlesWon':
      current = userData.questProgress.battlesWon || 0;
      break;
    case 'uniqueChars':
      current = userData.characters ? Object.keys(userData.characters).length : 0;
      break;
    case 'maxLevel':
      if (userData.characters) {
        current = Math.max(0, ...Object.values(userData.characters).map(c => c.level || 1));
      }
      break;
    case 'cratesOpened':
      current = userData.questProgress.cratesOpened || 0;
      break;
    case 'tradesCompleted':
      current = userData.questProgress.tradesCompleted || 0;
      break;
    case 'coins':
      current = userData.coins || 0;
      break;
    case 'gems':
      current = userData.gems || 0;
      break;
    case 'perfectST':
      if (userData.characters) {
        current = Object.values(userData.characters).some(c => c.st >= 100) ? 1 : 0;
      }
      break;
    case 'shards':
      current = userData.shards || 0;
      break;
    case 'boostsUsed':
      current = userData.questProgress.boostsUsed || 0;
      break;
    case 'winStreak':
      current = userData.questProgress.currentWinStreak || 0;
      break;
    case 'charsReleased':
      current = userData.questProgress.charsReleased || 0;
      break;
    case 'tyrantCratesOpened':
      current = userData.questProgress.tyrantCratesOpened || 0;
      break;
    case 'charsLevel10Plus':
      if (userData.characters) {
        current = Object.values(userData.characters).filter(c => (c.level || 1) >= 10).length;
      }
      break;
    case 'charsLevel20Plus':
      if (userData.characters) {
        current = Object.values(userData.characters).filter(c => (c.level || 1) >= 20).length;
      }
      break;
    case 'totalBattles':
      current = userData.questProgress.totalBattles || 0;
      break;
    case 'totalTokens':
      if (userData.characters) {
        current = Object.values(userData.characters).reduce((sum, c) => sum + (c.tokens || 0), 0);
      }
      break;
    case 'highSTChar':
      if (userData.characters) {
        current = Object.values(userData.characters).some(c => c.st >= 90) ? 1 : 0;
      }
      break;
    case 'charsFromCrates':
      current = userData.questProgress.charsFromCrates || 0;
      break;
    case 'highLevelWin':
      current = userData.questProgress.highLevelWin || 0;
      break;
  }
  
  return Math.min(current, quest.requirement);
}

function isQuestCompleted(userData, questId) {
  if (!userData.completedQuests) userData.completedQuests = [];
  return userData.completedQuests.includes(questId);
}

function canClaimQuest(userData, quest) {
  if (isQuestCompleted(userData, quest.id)) return false;
  const progress = getQuestProgress(userData, quest);
  return progress >= quest.requirement;
}

function claimQuest(userData, quest) {
  if (!canClaimQuest(userData, quest)) {
    return { success: false, message: "Quest not completed or already claimed!" };
  }
  
  if (!userData.completedQuests) userData.completedQuests = [];
  userData.completedQuests.push(quest.id);
  
  const rewards = [];
  if (quest.reward.coins) {
    userData.coins = (userData.coins || 0) + quest.reward.coins;
    rewards.push(`💰 ${quest.reward.coins} coins`);
  }
  if (quest.reward.gems) {
    userData.gems = (userData.gems || 0) + quest.reward.gems;
    rewards.push(`💎 ${quest.reward.gems} gems`);
  }
  if (quest.reward.shards) {
    userData.shards = (userData.shards || 0) + quest.reward.shards;
    rewards.push(`🔷 ${quest.reward.shards} shards`);
  }
  
  return {
    success: true,
    message: `Quest completed! Rewards: ${rewards.join(', ')}`,
    rewards: quest.reward
  };
}

function getAvailableQuests(userData) {
  return QUESTS.filter(quest => !isQuestCompleted(userData, quest.id));
}

function getCompletedQuests(userData) {
  if (!userData.completedQuests) return [];
  return QUESTS.filter(quest => userData.completedQuests.includes(quest.id));
}

function formatQuestDisplay(userData, quest) {
  const progress = getQuestProgress(userData, quest);
  const completed = isQuestCompleted(userData, quest.id);
  const canClaim = canClaimQuest(userData, quest);
  
  const progressBar = createQuestProgressBar(progress, quest.requirement);
  
  const rewards = [];
  if (quest.reward.coins) rewards.push(`💰${quest.reward.coins}`);
  if (quest.reward.gems) rewards.push(`💎${quest.reward.gems}`);
  if (quest.reward.shards) rewards.push(`🔷${quest.reward.shards}`);
  
  const status = completed ? '✅ CLAIMED' : (canClaim ? '🎁 READY!' : '');
  
  return `**${quest.id}. ${quest.name}** ${status}\n${quest.description}\n${progressBar}\nReward: ${rewards.join(' ')}`;
}

function claimAllQuests(userData) {
  const claimableQuests = QUESTS.filter(q => canClaimQuest(userData, q));
  
  if (claimableQuests.length === 0) {
    return { success: false, message: '❌ No quests available to claim!' };
  }
  
  let totalCoins = 0;
  let totalGems = 0;
  let totalShards = 0;
  const claimedQuestNames = [];
  
  claimableQuests.forEach(quest => {
    const result = claimQuest(userData, quest);
    if (result.success) {
      claimedQuestNames.push(quest.name);
      totalCoins += quest.reward.coins || 0;
      totalGems += quest.reward.gems || 0;
      totalShards += quest.reward.shards || 0;
    }
  });
  
  const rewardParts = [];
  if (totalCoins > 0) rewardParts.push(`💰 ${totalCoins} coins`);
  if (totalGems > 0) rewardParts.push(`💎 ${totalGems} gems`);
  if (totalShards > 0) rewardParts.push(`🔷 ${totalShards} shards`);
  
  return {
    success: true,
    claimedCount: claimedQuestNames.length,
    totalRewards: { coins: totalCoins, gems: totalGems, shards: totalShards },
    rewardsText: rewardParts.join(', '),
    questNames: claimedQuestNames
  };
}

module.exports = {
  QUESTS,
  getQuestProgress,
  isQuestCompleted,
  canClaimQuest,
  claimQuest,
  claimAllQuests,
  getAvailableQuests,
  getCompletedQuests,
  formatQuestDisplay
};
