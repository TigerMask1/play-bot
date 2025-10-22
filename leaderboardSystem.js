function getTopCoins(allUserData, limit = 10) {
  const users = Object.entries(allUserData)
    .filter(([userId, data]) => data.started)
    .map(([userId, data]) => ({
      userId,
      username: data.username || 'Unknown',
      coins: data.coins || 0
    }))
    .sort((a, b) => b.coins - a.coins)
    .slice(0, limit);
  
  return users;
}

function getTopGems(allUserData, limit = 10) {
  const users = Object.entries(allUserData)
    .filter(([userId, data]) => data.started)
    .map(([userId, data]) => ({
      userId,
      username: data.username || 'Unknown',
      gems: data.gems || 0
    }))
    .sort((a, b) => b.gems - a.gems)
    .slice(0, limit);
  
  return users;
}

function getTopBattles(allUserData, limit = 10) {
  const users = Object.entries(allUserData)
    .filter(([userId, data]) => data.started && data.questProgress?.battlesWon)
    .map(([userId, data]) => ({
      userId,
      username: data.username || 'Unknown',
      wins: data.questProgress.battlesWon || 0
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, limit);
  
  return users;
}

function getTopCollectors(allUserData, limit = 10) {
  const users = Object.entries(allUserData)
    .filter(([userId, data]) => data.started && data.characters)
    .map(([userId, data]) => ({
      userId,
      username: data.username || 'Unknown',
      count: Object.keys(data.characters).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  return users;
}

function getTopTrophies(allUserData, limit = 10) {
  const users = Object.entries(allUserData)
    .filter(([userId, data]) => data.started)
    .map(([userId, data]) => ({
      userId,
      username: data.username || 'Unknown',
      trophies: data.trophies || 200
    }))
    .sort((a, b) => b.trophies - a.trophies)
    .slice(0, limit);
  
  return users;
}

function formatLeaderboard(users, type) {
  const medals = ['🥇', '🥈', '🥉'];
  
  let lines = [];
  users.forEach((user, index) => {
    const rank = index < 3 ? medals[index] : `${index + 1}.`;
    let value;
    
    switch(type) {
      case 'coins':
        value = `💰 ${user.coins.toLocaleString()}`;
        break;
      case 'gems':
        value = `💎 ${user.gems.toLocaleString()}`;
        break;
      case 'battles':
        value = `⚔️ ${user.wins} wins`;
        break;
      case 'collection':
        value = `🎭 ${user.count} characters`;
        break;
      case 'trophies':
        value = `🏆 ${user.trophies.toLocaleString()}`;
        break;
    }
    
    lines.push(`${rank} ${user.username} - ${value}`);
  });
  
  return lines.join('\n');
}

module.exports = {
  getTopCoins,
  getTopGems,
  getTopBattles,
  getTopCollectors,
  getTopTrophies,
  formatLeaderboard
};
