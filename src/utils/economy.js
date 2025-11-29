const db = require('../database/MongoDB');
const { ECONOMY, COOLDOWNS } = require('../config/constants');
const { getDefaultServerUser, getDefaultGlobalUser } = require('../config/defaults');

async function ensureUser(serverId, odiscrdId, username) {
  let serverUser = await db.getServerUser(serverId, odiscrdId);
  if (!serverUser) {
    serverUser = await db.createServerUser(getDefaultServerUser(serverId, odiscrdId, username));
  }
  
  let globalUser = await db.getGlobalUser(odiscrdId);
  if (!globalUser) {
    globalUser = await db.createGlobalUser(getDefaultGlobalUser(odiscrdId, username));
  }
  
  return { serverUser, globalUser };
}

async function addCoins(serverId, odiscrdId, amount, reason = 'unknown') {
  await db.incrementServerUser(serverId, odiscrdId, {
    balance: amount,
    'stats.totalCoinsEarned': amount > 0 ? amount : 0
  });
  
  return { success: true, amount };
}

async function removeCoins(serverId, odiscrdId, amount) {
  const user = await db.getServerUser(serverId, odiscrdId);
  if (!user || user.balance < amount) {
    return { success: false, reason: 'Insufficient balance' };
  }
  
  await db.incrementServerUser(serverId, odiscrdId, { balance: -amount });
  return { success: true, amount };
}

async function addGems(serverId, odiscrdId, amount) {
  await db.incrementServerUser(serverId, odiscrdId, {
    gems: amount,
    'stats.totalGemsEarned': amount > 0 ? amount : 0
  });
  
  return { success: true, amount };
}

async function removeGems(serverId, odiscrdId, amount) {
  const user = await db.getServerUser(serverId, odiscrdId);
  if (!user || user.gems < amount) {
    return { success: false, reason: 'Insufficient gems' };
  }
  
  await db.incrementServerUser(serverId, odiscrdId, { gems: -amount });
  return { success: true, amount };
}

async function addPlayCoins(discordId, amount) {
  await db.incrementGlobalUser(discordId, {
    playCoins: amount,
    'globalStats.totalPlayCoinsEarned': amount > 0 ? amount : 0
  });
  
  return { success: true, amount };
}

async function removePlayCoins(discordId, amount) {
  const user = await db.getGlobalUser(discordId);
  if (!user || user.playCoins < amount) {
    return { success: false, reason: 'Insufficient PlayCoins' };
  }
  
  await db.incrementGlobalUser(discordId, { playCoins: -amount });
  
  return { success: true, amount };
}

async function addPlayGems(discordId, amount) {
  await db.incrementGlobalUser(discordId, {
    playGems: amount,
    'globalStats.totalPlayGemsEarned': amount > 0 ? amount : 0
  });
  
  return { success: true, amount };
}

async function removePlayGems(discordId, amount) {
  const user = await db.getGlobalUser(discordId);
  if (!user || user.playGems < amount) {
    return { success: false, reason: 'Insufficient PlayGems' };
  }
  
  await db.incrementGlobalUser(discordId, { playGems: -amount });
  
  return { success: true, amount };
}

async function transferCoins(serverId, fromId, toId, amount) {
  const fromUser = await db.getServerUser(serverId, fromId);
  if (!fromUser || fromUser.balance < amount) {
    return { success: false, reason: 'Insufficient balance' };
  }
  
  await db.incrementServerUser(serverId, fromId, { balance: -amount });
  await db.incrementServerUser(serverId, toId, { balance: amount });
  
  return { success: true, amount };
}

async function addXP(serverId, odiscrdId, amount) {
  const user = await db.getServerUser(serverId, odiscrdId);
  if (!user) return { success: false, reason: 'User not found' };
  
  const newXP = user.xp + amount;
  const { level: newLevel } = require('./helpers').calculateLevel(newXP);
  const leveledUp = newLevel > user.level;
  
  await db.updateServerUser(serverId, odiscrdId, {
    xp: newXP,
    level: newLevel
  });
  
  return { success: true, xp: amount, leveledUp, newLevel, oldLevel: user.level };
}

async function addGlobalXP(odiscrdId, amount) {
  const user = await db.getGlobalUser(odiscrdId);
  if (!user) return { success: false, reason: 'User not found' };
  
  const newXP = user.globalXP + amount;
  const { level: newLevel } = require('./helpers').calculateLevel(newXP);
  const leveledUp = newLevel > user.globalLevel;
  
  await db.updateGlobalUser(odiscrdId, {
    globalXP: newXP,
    globalLevel: newLevel
  });
  
  return { success: true, xp: amount, leveledUp, newLevel, oldLevel: user.globalLevel };
}

async function claimDaily(serverId, odiscrdId, serverConfig) {
  const user = await db.getServerUser(serverId, odiscrdId);
  if (!user) return { success: false, reason: 'User not found' };
  
  const now = Date.now();
  const lastDaily = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;
  const timeSince = now - lastDaily;
  
  if (timeSince < COOLDOWNS.DAILY) {
    const remaining = COOLDOWNS.DAILY - timeSince;
    return { 
      success: false, 
      reason: 'Already claimed',
      remaining
    };
  }
  
  const oneDayAgo = now - COOLDOWNS.DAILY;
  const twoDaysAgo = now - (COOLDOWNS.DAILY * 2);
  const isStreak = lastDaily > twoDaysAgo && lastDaily < oneDayAgo;
  
  let streak = user.stats?.dailyStreak || 0;
  if (isStreak || lastDaily === 0) {
    streak++;
  } else {
    streak = 1;
  }
  
  const streakBonus = Math.min(streak * 10, 100);
  const coins = ECONOMY.DAILY_COINS + streakBonus;
  const playCoins = ECONOMY.DAILY_PLAYCOINS;
  
  await db.updateServerUser(serverId, odiscrdId, {
    lastDaily: new Date(),
    balance: user.balance + coins,
    'stats.dailyStreak': streak,
    'stats.maxDailyStreak': Math.max(streak, user.stats?.maxDailyStreak || 0)
  });
  
  await addPlayCoins(odiscrdId, playCoins);
  
  return {
    success: true,
    coins,
    playCoins,
    streak,
    streakBonus
  };
}

async function getBalance(serverId, odiscrdId) {
  const serverUser = await db.getServerUser(serverId, odiscrdId);
  const globalUser = await db.getGlobalUser(odiscrdId);
  
  return {
    coins: serverUser?.balance || 0,
    gems: serverUser?.gems || 0,
    playCoins: globalUser?.playCoins || 0,
    playGems: globalUser?.playGems || 0
  };
}

module.exports = {
  ensureUser,
  addCoins,
  removeCoins,
  addGems,
  removeGems,
  addPlayCoins,
  removePlayCoins,
  addPlayGems,
  removePlayGems,
  transferCoins,
  addXP,
  addGlobalXP,
  claimDaily,
  getBalance
};
