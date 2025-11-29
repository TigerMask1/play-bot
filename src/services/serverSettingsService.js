const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createServerSettingsSchema } = require('../models/schemas');
const logger = require('../core/logger');

const MODULE = 'ServerSettingsService';

const settingsCache = new Map();

async function getServerSettings(serverId) {
  try {
    if (settingsCache.has(serverId)) {
      return settingsCache.get(serverId);
    }
    
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    const settings = await collection.findOne({ serverId });
    
    if (settings) {
      settingsCache.set(serverId, settings);
    }
    
    return settings;
  } catch (error) {
    logger.error(MODULE, 'Failed to get server settings', { serverId, error: error.message });
    return null;
  }
}

async function createServerSettings(serverId, guildName) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    
    const existing = await collection.findOne({ serverId });
    if (existing) {
      return { success: false, error: 'Server settings already exist', settings: existing };
    }
    
    const settings = createServerSettingsSchema(serverId, guildName);
    await collection.insertOne(settings);
    
    settingsCache.set(serverId, settings);
    
    logger.info(MODULE, 'Created server settings', { serverId, guildName });
    return { success: true, settings };
  } catch (error) {
    logger.error(MODULE, 'Failed to create server settings', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function updateServerSettings(serverId, updates, updatedBy = null) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    
    const updatePayload = {
      ...updates,
      updatedAt: new Date()
    };
    
    if (updatedBy) {
      updatePayload.lastUpdatedBy = updatedBy;
    }
    
    const result = await collection.findOneAndUpdate(
      { serverId },
      { $set: updatePayload },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return { success: false, error: 'Server settings not found' };
    }
    
    settingsCache.set(serverId, result);
    
    logger.info(MODULE, 'Updated server settings', { serverId, updates: Object.keys(updates) });
    return { success: true, settings: result };
  } catch (error) {
    logger.error(MODULE, 'Failed to update server settings', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function setBotDisplayName(serverId, displayName, updatedBy) {
  return updateServerSettings(serverId, { 'botSettings.displayName': displayName }, updatedBy);
}

async function setBotPrefix(serverId, prefix, updatedBy) {
  return updateServerSettings(serverId, { 'botSettings.prefix': prefix }, updatedBy);
}

async function setBotColor(serverId, color, updatedBy) {
  return updateServerSettings(serverId, { 'botSettings.color': color }, updatedBy);
}

async function setBotIcon(serverId, iconUrl, updatedBy) {
  return updateServerSettings(serverId, { 'botSettings.iconUrl': iconUrl }, updatedBy);
}

async function setChannel(serverId, channelType, channelId, updatedBy) {
  const validTypes = ['drops', 'events', 'updates', 'logs'];
  if (!validTypes.includes(channelType)) {
    return { success: false, error: 'Invalid channel type' };
  }
  
  const updates = { [`channels.${channelType}`]: channelId };
  
  const settings = await getServerSettings(serverId);
  if (settings) {
    const channels = { ...settings.channels, [channelType]: channelId };
    if (channels.drops && channels.events && channels.updates && !settings.setupComplete) {
      updates.setupComplete = true;
      updates.setupDate = new Date();
    }
  }
  
  return updateServerSettings(serverId, updates, updatedBy);
}

async function setServerCurrency(serverId, type, currencyConfig, updatedBy) {
  if (type !== 'primary' && type !== 'premium') {
    return { success: false, error: 'Invalid currency type' };
  }
  
  const updates = {};
  if (currencyConfig.name) updates[`currencies.${type}.name`] = currencyConfig.name;
  if (currencyConfig.symbol) updates[`currencies.${type}.symbol`] = currencyConfig.symbol;
  if (currencyConfig.code) updates[`currencies.${type}.code`] = currencyConfig.code;
  if (currencyConfig.startingAmount !== undefined) {
    updates[`currencies.${type}.startingAmount`] = currencyConfig.startingAmount;
  }
  
  return updateServerSettings(serverId, updates, updatedBy);
}

async function toggleFeature(serverId, feature, enabled, updatedBy) {
  const validFeatures = ['dropsEnabled', 'eventsEnabled', 'tradingEnabled', 'battlesEnabled', 'questsEnabled', 'marketEnabled'];
  if (!validFeatures.includes(feature)) {
    return { success: false, error: 'Invalid feature' };
  }
  
  return updateServerSettings(serverId, { [`features.${feature}`]: enabled }, updatedBy);
}

async function setCustomizationOption(serverId, option, value, updatedBy) {
  const validOptions = ['useOfficialContent', 'useServerContent', 'allowCustomCharacters', 'allowCustomMoves', 'allowCustomItems'];
  if (!validOptions.includes(option)) {
    return { success: false, error: 'Invalid customization option' };
  }
  
  return updateServerSettings(serverId, { [`customization.${option}`]: value }, updatedBy);
}

async function isServerSetup(serverId) {
  const settings = await getServerSettings(serverId);
  return settings?.setupComplete === true;
}

async function getAllServerSettings() {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    return await collection.find({}).toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get all server settings', { error: error.message });
    return [];
  }
}

function clearCache(serverId = null) {
  if (serverId) {
    settingsCache.delete(serverId);
  } else {
    settingsCache.clear();
  }
}

async function getPrefix(serverId) {
  const settings = await getServerSettings(serverId);
  return settings?.botSettings?.prefix || '!';
}

async function getBotDisplayName(serverId) {
  const settings = await getServerSettings(serverId);
  return settings?.botSettings?.displayName || 'PlayBot';
}

async function getCurrencyInfo(serverId, type = 'primary') {
  const settings = await getServerSettings(serverId);
  if (!settings?.currencies?.[type]) {
    return type === 'primary' 
      ? { name: 'Coins', symbol: '🪙', code: 'COINS' }
      : { name: 'Gems', symbol: '💎', code: 'GEMS' };
  }
  return settings.currencies[type];
}

module.exports = {
  getServerSettings,
  createServerSettings,
  updateServerSettings,
  setBotDisplayName,
  setBotPrefix,
  setBotColor,
  setBotIcon,
  setChannel,
  setServerCurrency,
  toggleFeature,
  setCustomizationOption,
  isServerSetup,
  getAllServerSettings,
  clearCache,
  getPrefix,
  getBotDisplayName,
  getCurrencyInfo
};
