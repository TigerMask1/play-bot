const { saveDataImmediate } = require('./dataManager.js');

function initializeHistory(userData) {
  if (!userData.history) {
    userData.history = {
      transactions: [],
      totalCoinsEarned: 0,
      totalGemsEarned: 0,
      totalShardsEarned: 0,
      totalCratesEarned: {},
      totalCoinsSpent: 0,
      totalGemsSpent: 0,
      totalShardsSpent: 0,
      totalCratesOpened: 0
    };
  }
  
  if (userData.history.totalShardsEarned === undefined) userData.history.totalShardsEarned = 0;
  if (userData.history.totalShardsSpent === undefined) userData.history.totalShardsSpent = 0;
  
  return userData.history;
}

async function logTransaction(data, userData, type, amount, source, details = {}) {
  const history = initializeHistory(userData);
  
  const transaction = {
    type: type,
    amount: amount,
    source: source,
    details: details,
    timestamp: Date.now(),
    date: new Date().toISOString()
  };
  
  history.transactions.push(transaction);
  
  if (history.transactions.length > 100) {
    history.transactions = history.transactions.slice(-100);
  }
  
  updateTotals(history, type, amount, details);
  
  await saveDataImmediate(data);
}

function updateTotals(history, type, amount, details) {
  switch(type) {
    case 'coins_earned':
      history.totalCoinsEarned = (history.totalCoinsEarned || 0) + amount;
      break;
    case 'coins_spent':
      history.totalCoinsSpent = (history.totalCoinsSpent || 0) + amount;
      break;
    case 'gems_earned':
      history.totalGemsEarned = (history.totalGemsEarned || 0) + amount;
      break;
    case 'gems_spent':
      history.totalGemsSpent = (history.totalGemsSpent || 0) + amount;
      break;
    case 'shards_earned':
      history.totalShardsEarned = (history.totalShardsEarned || 0) + amount;
      break;
    case 'shards_spent':
      history.totalShardsSpent = (history.totalShardsSpent || 0) + amount;
      break;
    case 'crate_earned':
      if (details.crateType) {
        if (!history.totalCratesEarned[details.crateType]) {
          history.totalCratesEarned[details.crateType] = 0;
        }
        history.totalCratesEarned[details.crateType] += amount;
      }
      break;
    case 'crate_opened':
      history.totalCratesOpened = (history.totalCratesOpened || 0) + amount;
      break;
  }
}

function getHistory(userData, limit = 50, filter = null) {
  const history = initializeHistory(userData);
  let transactions = history.transactions;
  
  if (filter) {
    transactions = transactions.filter(t => {
      if (filter.type && t.type !== filter.type) return false;
      if (filter.source && t.source !== filter.source) return false;
      if (filter.startDate && t.timestamp < filter.startDate) return false;
      if (filter.endDate && t.timestamp > filter.endDate) return false;
      return true;
    });
  }
  
  return transactions.slice(-limit).reverse();
}

function getHistorySummary(userData) {
  const history = initializeHistory(userData);
  
  return {
    totalCoinsEarned: history.totalCoinsEarned || 0,
    totalGemsEarned: history.totalGemsEarned || 0,
    totalShardsEarned: history.totalShardsEarned || 0,
    totalCratesEarned: history.totalCratesEarned || {},
    totalCoinsSpent: history.totalCoinsSpent || 0,
    totalGemsSpent: history.totalGemsSpent || 0,
    totalShardsSpent: history.totalShardsSpent || 0,
    totalCratesOpened: history.totalCratesOpened || 0,
    netCoins: (history.totalCoinsEarned || 0) - (history.totalCoinsSpent || 0),
    netGems: (history.totalGemsEarned || 0) - (history.totalGemsSpent || 0),
    netShards: (history.totalShardsEarned || 0) - (history.totalShardsSpent || 0)
  };
}

function formatTransactionType(type) {
  const typeMap = {
    'coins_earned': '💰 Coins Earned',
    'coins_spent': '💸 Coins Spent',
    'gems_earned': '💎 Gems Earned',
    'gems_spent': '💎 Gems Spent',
    'crate_earned': '📦 Crate Earned',
    'crate_opened': '🎁 Crate Opened',
    'shards_earned': '✨ Shards Earned',
    'shards_spent': '✨ Shards Spent'
  };
  return typeMap[type] || type;
}

function formatSource(source) {
  const sourceMap = {
    'drop': 'Drop Catch',
    'battle_win': 'Battle Victory',
    'battle_reward': 'Battle Reward',
    'crate_open': 'Crate Opening',
    'quest_reward': 'Quest Completion',
    'daily_reward': 'Daily Reward',
    'personalized_task': 'Personalized Task',
    'event_reward': 'Event Reward',
    'trade': 'Trade',
    'admin_grant': 'Admin Grant',
    'shop_purchase': 'Shop Purchase',
    'crate_purchase': 'Crate Purchase',
    'character_upgrade': 'Character Upgrade',
    'booster_craft': 'Booster Craft',
    'booster_use': 'Booster Use',
    'mail_claim': 'Mail Claim',
    'promotion': 'Promotion',
    'key_unlock': 'Key Unlock',
    'invite_reward': 'Invite Reward'
  };
  return sourceMap[source] || source;
}

function formatHistoryEntry(transaction) {
  const time = new Date(transaction.timestamp);
  const timeStr = time.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  let detailsStr = '';
  if (transaction.details) {
    if (transaction.details.crateType) {
      detailsStr = ` (${transaction.details.crateType.charAt(0).toUpperCase() + transaction.details.crateType.slice(1)})`;
    }
    if (transaction.details.character) {
      detailsStr += ` - ${transaction.details.character}`;
    }
    if (transaction.details.item) {
      detailsStr += ` - ${transaction.details.item}`;
    }
    if (transaction.details.note) {
      detailsStr += ` - ${transaction.details.note}`;
    }
  }
  
  const amount = transaction.amount > 0 ? `+${transaction.amount}` : transaction.amount;
  
  return `\`${timeStr}\` | ${formatTransactionType(transaction.type)} | ${amount}${detailsStr} | *${formatSource(transaction.source)}*`;
}

function formatHistory(transactions, summary, page = 1, pageSize = 20) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(transactions.length / pageSize);
  
  if (paginatedTransactions.length === 0 && page > 1) {
    return `📊 **Transaction History**\n\nPage ${page} does not exist. Total pages: ${totalPages}`;
  }
  
  if (!transactions || transactions.length === 0) {
    return '📊 **Transaction History**\n\nNo transactions found.';
  }
  
  let output = `📊 **Transaction History** (Page ${page}/${totalPages})\n\n`;
  
  output += '**Summary:**\n';
  output += `💰 Coins: ${summary.totalCoinsEarned.toLocaleString()} earned | ${summary.totalCoinsSpent.toLocaleString()} spent | Net: ${summary.netCoins.toLocaleString()}\n`;
  output += `💎 Gems: ${summary.totalGemsEarned.toLocaleString()} earned | ${summary.totalGemsSpent.toLocaleString()} spent | Net: ${summary.netGems.toLocaleString()}\n`;
  output += `✨ Shards: ${summary.totalShardsEarned.toLocaleString()} earned | ${summary.totalShardsSpent.toLocaleString()} spent | Net: ${summary.netShards.toLocaleString()}\n\n`;
  
  if (Object.keys(summary.totalCratesEarned).length > 0) {
    output += '📦 **Crates Earned:** ';
    const cratesList = Object.entries(summary.totalCratesEarned)
      .map(([type, count]) => `${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`)
      .join(', ');
    output += cratesList + '\n';
  }
  
  output += `🎁 Total Crates Opened: ${summary.totalCratesOpened}\n\n`;
  
  output += `**Recent Transactions** (${startIndex + 1}-${Math.min(endIndex, transactions.length)} of ${transactions.length}):\n`;
  output += paginatedTransactions.map(t => formatHistoryEntry(t)).join('\n');
  
  if (page < totalPages) {
    output += `\n\nUse \`!history @user ${page + 1}\` to see the next page.`;
  }
  
  return output;
}

module.exports = {
  initializeHistory,
  logTransaction,
  getHistory,
  getHistorySummary,
  formatHistory,
  formatTransactionType,
  formatSource
};
