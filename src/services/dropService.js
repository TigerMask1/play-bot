const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createDropSchema } = require('../models/schemas');
const { getServerSettings } = require('./serverSettingsService');
const { getMergedContent, CONTENT_TYPES } = require('./contentService');
const { updateServerBalance } = require('./economyService');
const { updateServerProfile, getServerProfile } = require('./profileService');
const logger = require('../core/logger');

const activeDrops = new Map();

async function checkDropEligibility(userId, serverId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.dropSettings?.enabled) {
    return { eligible: false, reason: 'Drops are disabled on this server' };
  }
  
  const profile = await getServerProfile(userId, serverId);
  if (!profile?.started) {
    return { eligible: false, reason: 'You need to use !start first' };
  }
  
  const lastDrop = profile.cooldowns?.drop;
  const cooldown = settings.dropSettings.cooldown * 1000;
  
  if (lastDrop && (Date.now() - new Date(lastDrop).getTime()) < cooldown) {
    const remaining = Math.ceil((cooldown - (Date.now() - new Date(lastDrop).getTime())) / 1000);
    return { eligible: false, reason: `Drop on cooldown (${remaining}s remaining)` };
  }
  
  return { eligible: true };
}

async function generateDrop(serverId, channelId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.dropSettings?.enabled) return null;
  
  const dropSettings = settings.dropSettings;
  const random = Math.random();
  
  if (random > dropSettings.baseChance) {
    return null;
  }
  
  let dropType, content;
  
  if (dropSettings.currencyDrops?.enabled && Math.random() < dropSettings.currencyDrops.chance) {
    dropType = 'currency';
    const amount = Math.floor(
      Math.random() * (dropSettings.currencyDrops.maxAmount - dropSettings.currencyDrops.minAmount + 1)
    ) + dropSettings.currencyDrops.minAmount;
    content = {
      currency: 'primary',
      amount
    };
  } else {
    dropType = 'character';
    const characters = await getMergedContent(serverId, CONTENT_TYPES.CHARACTER, settings);
    
    if (characters.length === 0) {
      return null;
    }
    
    const rarity = selectRarity(dropSettings.rarityWeights);
    const eligibleCharacters = characters.filter(c => c.rarity === rarity);
    
    if (eligibleCharacters.length === 0) {
      const anyCharacter = characters[Math.floor(Math.random() * characters.length)];
      content = {
        character: anyCharacter,
        rarity: anyCharacter.rarity
      };
    } else {
      const character = eligibleCharacters[Math.floor(Math.random() * eligibleCharacters.length)];
      content = {
        character,
        rarity
      };
    }
  }
  
  const dropId = `${serverId}_${channelId}_${Date.now()}`;
  const drop = {
    id: dropId,
    serverId,
    channelId,
    dropType,
    content,
    claimed: false,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date()
  };
  
  activeDrops.set(dropId, drop);
  
  setTimeout(() => {
    if (activeDrops.has(dropId) && !activeDrops.get(dropId).claimed) {
      activeDrops.delete(dropId);
    }
  }, 5 * 60 * 1000);
  
  return drop;
}

function selectRarity(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [rarity, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) return rarity;
  }
  
  return 'common';
}

async function claimDrop(dropId, userId) {
  const drop = activeDrops.get(dropId);
  
  if (!drop) {
    return { success: false, error: 'Drop not found or expired' };
  }
  
  if (drop.claimed) {
    return { success: false, error: 'Drop already claimed' };
  }
  
  if (new Date() > drop.expiresAt) {
    activeDrops.delete(dropId);
    return { success: false, error: 'Drop expired' };
  }
  
  drop.claimed = true;
  drop.claimedBy = userId;
  drop.claimedAt = new Date();
  
  const serverId = drop.serverId;
  
  if (drop.dropType === 'currency') {
    await updateServerBalance(userId, serverId, 'primary', drop.content.amount, 'Drop claim');
  } else if (drop.dropType === 'character') {
    await addCharacterToInventory(userId, serverId, drop.content.character);
  }
  
  await updateServerProfile(userId, serverId, {
    'cooldowns.drop': new Date(),
    $inc: { 'stats.dropsCollected': 1 }
  });
  
  const collection = await getCollection(COLLECTIONS.ECONOMY_TRANSACTIONS);
  await collection.insertOne(createDropSchema(userId, serverId, drop.dropType, drop.content));
  
  activeDrops.delete(dropId);
  
  return { success: true, drop };
}

async function addCharacterToInventory(userId, serverId, character) {
  const { createOwnedCharacterSchema } = require('../models/schemas');
  const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
  
  const ownedChar = createOwnedCharacterSchema(character.slug || character.name.toLowerCase(), userId, serverId);
  ownedChar.originalData = character;
  
  await collection.updateOne(
    { userId: userId, serverId },
    { 
      $push: { characters: ownedChar },
      $inc: { 'stats.charactersCollected': 1 }
    }
  );
}

function getActiveDrop(dropId) {
  return activeDrops.get(dropId);
}

function getActiveDropsForChannel(channelId) {
  return Array.from(activeDrops.values()).filter(d => d.channelId === channelId && !d.claimed);
}

async function manualSpawnDrop(serverId, channelId, dropType, content) {
  const dropId = `${serverId}_${channelId}_${Date.now()}`;
  const drop = {
    id: dropId,
    serverId,
    channelId,
    dropType,
    content,
    claimed: false,
    manual: true,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date()
  };
  
  activeDrops.set(dropId, drop);
  return drop;
}

module.exports = {
  checkDropEligibility,
  generateDrop,
  selectRarity,
  claimDrop,
  addCharacterToInventory,
  getActiveDrop,
  getActiveDropsForChannel,
  manualSpawnDrop
};
