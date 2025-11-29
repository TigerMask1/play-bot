const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createTradeSchema } = require('../models/schemas');
const { getServerSettings } = require('./serverSettingsService');
const { getServerProfile, updateServerProfile } = require('./profileService');
const { updateServerBalance } = require('./economyService');
const logger = require('../core/logger');

const activeTrades = new Map();

async function checkTradeEligibility(userId, serverId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.tradingSettings?.enabled) {
    return { eligible: false, reason: 'Trading is disabled on this server' };
  }
  
  const profile = await getServerProfile(userId, serverId);
  if (!profile?.started) {
    return { eligible: false, reason: 'You need to use !start first' };
  }
  
  const minLevel = settings.tradingSettings.restrictions?.minLevel || 1;
  if ((profile.level || 1) < minLevel) {
    return { eligible: false, reason: `You need to be level ${minLevel} to trade` };
  }
  
  const lastTrade = profile.cooldowns?.trade;
  const cooldown = settings.tradingSettings.cooldown * 1000;
  
  if (lastTrade && (Date.now() - new Date(lastTrade).getTime()) < cooldown) {
    const remaining = Math.ceil((cooldown - (Date.now() - new Date(lastTrade).getTime())) / 1000);
    return { eligible: false, reason: `Trade on cooldown (${remaining}s remaining)` };
  }
  
  const existingTrade = Array.from(activeTrades.values()).find(
    t => (t.initiatorId === userId || t.recipientId === userId) && t.serverId === serverId && t.status === 'pending'
  );
  
  if (existingTrade) {
    return { eligible: false, reason: 'You already have a pending trade' };
  }
  
  return { eligible: true, profile };
}

async function initiateTrade(initiatorId, recipientId, serverId) {
  const initiatorCheck = await checkTradeEligibility(initiatorId, serverId);
  if (!initiatorCheck.eligible) {
    return { success: false, error: initiatorCheck.reason };
  }
  
  const recipientCheck = await checkTradeEligibility(recipientId, serverId);
  if (!recipientCheck.eligible) {
    return { success: false, error: `Recipient: ${recipientCheck.reason}` };
  }
  
  const tradeId = `trade_${serverId}_${Date.now()}`;
  const trade = {
    id: tradeId,
    ...createTradeSchema(initiatorId, recipientId, serverId)
  };
  
  activeTrades.set(tradeId, trade);
  
  setTimeout(() => {
    const t = activeTrades.get(tradeId);
    if (t && t.status === 'pending') {
      activeTrades.delete(tradeId);
    }
  }, 15 * 60 * 1000);
  
  return { success: true, trade };
}

async function addToOffer(tradeId, userId, offerType, item) {
  const trade = activeTrades.get(tradeId);
  
  if (!trade) {
    return { success: false, error: 'Trade not found or expired' };
  }
  
  if (trade.status !== 'pending') {
    return { success: false, error: 'Trade is no longer pending' };
  }
  
  const isInitiator = userId === trade.initiatorId;
  if (!isInitiator && userId !== trade.recipientId) {
    return { success: false, error: 'You are not part of this trade' };
  }
  
  const offer = isInitiator ? trade.initiatorOffer : trade.recipientOffer;
  const settings = await getServerSettings(trade.serverId);
  const restrictions = settings.tradingSettings.restrictions;
  
  if (offerType === 'character') {
    if (!restrictions.allowCharacterTrades) {
      return { success: false, error: 'Character trading is disabled' };
    }
    if (restrictions.blacklistedCharacters?.includes(item.slug)) {
      return { success: false, error: 'This character cannot be traded' };
    }
    
    const profile = await getServerProfile(userId, trade.serverId);
    const hasCharacter = profile.characters?.some(c => c.userId === item.id || c.slug === item.slug);
    if (!hasCharacter) {
      return { success: false, error: 'You don\'t own this character' };
    }
    
    offer.characters.push(item);
  } else if (offerType === 'item') {
    if (!restrictions.allowItemTrades) {
      return { success: false, error: 'Item trading is disabled' };
    }
    if (restrictions.blacklistedItems?.includes(item.slug)) {
      return { success: false, error: 'This item cannot be traded' };
    }
    
    const profile = await getServerProfile(userId, trade.serverId);
    const inventoryItem = profile.inventory?.find(i => i.slug === item.slug && i.quantity >= (item.quantity || 1));
    if (!inventoryItem) {
      return { success: false, error: 'You don\'t have enough of this item' };
    }
    
    offer.items.push(item);
  } else if (offerType === 'currency') {
    if (!restrictions.allowCurrencyTrades) {
      return { success: false, error: 'Currency trading is disabled' };
    }
    
    const profile = await getServerProfile(userId, trade.serverId);
    const balance = profile.serverBalance?.[item.currency] || 0;
    if (balance < item.amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    
    offer.currency[item.currency] = (offer.currency[item.currency] || 0) + item.amount;
  }
  
  const maxItems = settings.tradingSettings.maxItemsPerTrade || 10;
  const totalItems = offer.characters.length + offer.items.length;
  if (totalItems > maxItems) {
    return { success: false, error: `Maximum ${maxItems} items per trade` };
  }
  
  if (isInitiator) {
    trade.initiatorConfirmed = false;
  } else {
    trade.recipientConfirmed = false;
  }
  
  return { success: true, trade };
}

async function confirmTrade(tradeId, userId) {
  const trade = activeTrades.get(tradeId);
  
  if (!trade) {
    return { success: false, error: 'Trade not found' };
  }
  
  if (userId === trade.initiatorId) {
    trade.initiatorConfirmed = true;
  } else if (userId === trade.recipientId) {
    trade.recipientConfirmed = true;
  } else {
    return { success: false, error: 'You are not part of this trade' };
  }
  
  if (trade.initiatorConfirmed && trade.recipientConfirmed) {
    return await executeTrade(tradeId);
  }
  
  return { success: true, trade, status: 'waiting_for_confirmation' };
}

async function executeTrade(tradeId) {
  const trade = activeTrades.get(tradeId);
  
  if (!trade) {
    return { success: false, error: 'Trade not found' };
  }
  
  const settings = await getServerSettings(trade.serverId);
  const feeConfig = settings.tradingSettings.fees;
  
  try {
    for (const char of trade.initiatorOffer.characters) {
      await transferCharacter(trade.initiatorId, trade.recipientId, trade.serverId, char);
    }
    for (const char of trade.recipientOffer.characters) {
      await transferCharacter(trade.recipientId, trade.initiatorId, trade.serverId, char);
    }
    
    for (const item of trade.initiatorOffer.items) {
      await transferItem(trade.initiatorId, trade.recipientId, trade.serverId, item);
    }
    for (const item of trade.recipientOffer.items) {
      await transferItem(trade.recipientId, trade.initiatorId, trade.serverId, item);
    }
    
    for (const [currency, amount] of Object.entries(trade.initiatorOffer.currency)) {
      if (amount > 0) {
        const fee = calculateFee(amount, feeConfig);
        await updateServerBalance(trade.initiatorId, trade.serverId, currency, -amount, 'Trade sent');
        await updateServerBalance(trade.recipientId, trade.serverId, currency, amount - fee, 'Trade received');
      }
    }
    for (const [currency, amount] of Object.entries(trade.recipientOffer.currency)) {
      if (amount > 0) {
        const fee = calculateFee(amount, feeConfig);
        await updateServerBalance(trade.recipientId, trade.serverId, currency, -amount, 'Trade sent');
        await updateServerBalance(trade.initiatorId, trade.serverId, currency, amount - fee, 'Trade received');
      }
    }
    
    trade.status = 'completed';
    trade.completedAt = new Date();
    
    await updateServerProfile(trade.initiatorId, trade.serverId, {
      'cooldowns.trade': new Date(),
      $inc: { 'stats.tradesCompleted': 1 }
    });
    await updateServerProfile(trade.recipientId, trade.serverId, {
      'cooldowns.trade': new Date(),
      $inc: { 'stats.tradesCompleted': 1 }
    });
    
    const collection = await getCollection(COLLECTIONS.ECONOMY_TRANSACTIONS);
    await collection.insertOne({
      type: 'trade',
      tradeId,
      initiatorId: trade.initiatorId,
      recipientId: trade.recipientId,
      serverId: trade.serverId,
      initiatorOffer: trade.initiatorOffer,
      recipientOffer: trade.recipientOffer,
      completedAt: new Date()
    });
    
    activeTrades.delete(tradeId);
    
    return { success: true, trade };
  } catch (error) {
    logger.error('Trade execution failed:', error);
    return { success: false, error: 'Trade failed. Items have been refunded.' };
  }
}

function calculateFee(amount, feeConfig) {
  let fee = Math.floor(amount * (feeConfig.percentage / 100));
  fee = Math.max(fee, feeConfig.minFee);
  fee = Math.min(fee, feeConfig.maxFee);
  return fee;
}

async function transferCharacter(fromUserId, toUserId, serverId, character) {
  const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
  
  await collection.updateOne(
    { userId: fromUserId, serverId },
    { $pull: { characters: { $or: [{ userId: character.id }, { slug: character.slug }] } } }
  );
  
  const charData = {
    ...character,
    obtainedAt: new Date(),
    obtainedMethod: 'trade',
    previousOwner: fromUserId
  };
  
  await collection.updateOne(
    { userId: toUserId, serverId },
    { $push: { characters: charData } }
  );
}

async function transferItem(fromUserId, toUserId, serverId, item) {
  const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
  const quantity = item.quantity || 1;
  
  await collection.updateOne(
    { userId: fromUserId, serverId, 'inventory.slug': item.slug },
    { $inc: { 'inventory.$.quantity': -quantity } }
  );
  
  await collection.updateOne(
    { userId: fromUserId, serverId },
    { $pull: { inventory: { slug: item.slug, quantity: { $lte: 0 } } } }
  );
  
  const recipientProfile = await getServerProfile(toUserId, serverId);
  const existingItem = recipientProfile.inventory?.find(i => i.slug === item.slug);
  
  if (existingItem) {
    await collection.updateOne(
      { userId: toUserId, serverId, 'inventory.slug': item.slug },
      { $inc: { 'inventory.$.quantity': quantity } }
    );
  } else {
    await collection.updateOne(
      { userId: toUserId, serverId },
      { $push: { inventory: { ...item, quantity, obtainedAt: new Date() } } }
    );
  }
}

async function cancelTrade(tradeId, userId) {
  const trade = activeTrades.get(tradeId);
  
  if (!trade) {
    return { success: false, error: 'Trade not found' };
  }
  
  if (userId !== trade.initiatorId && userId !== trade.recipientId) {
    return { success: false, error: 'You are not part of this trade' };
  }
  
  trade.status = 'cancelled';
  trade.cancelledBy = userId;
  activeTrades.delete(tradeId);
  
  return { success: true };
}

function getActiveTrade(tradeId) {
  return activeTrades.get(tradeId);
}

function getPlayerActiveTrade(userId, serverId) {
  return Array.from(activeTrades.values()).find(
    t => (t.initiatorId === userId || t.recipientId === userId) && t.serverId === serverId && t.status === 'pending'
  );
}

module.exports = {
  checkTradeEligibility,
  initiateTrade,
  addToOffer,
  confirmTrade,
  executeTrade,
  cancelTrade,
  getActiveTrade,
  getPlayerActiveTrade,
  transferCharacter,
  transferItem
};
