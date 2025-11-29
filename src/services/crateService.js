const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createCrateOpenSchema } = require('../models/schemas');
const { getServerSettings } = require('./serverSettingsService');
const { getServerProfile, updateServerProfile } = require('./profileService');
const { updateServerBalance } = require('./economyService');
const { addCharacterToInventory, selectRarity } = require('./dropService');
const { getMergedContent, CONTENT_TYPES } = require('./contentService');
const logger = require('../core/logger');

async function getAvailableCrates(serverId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.crateSettings?.enabled) {
    return [];
  }
  return settings.crateSettings.types || [];
}

async function checkCrateEligibility(userId, serverId, crateId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.crateSettings?.enabled) {
    return { eligible: false, reason: 'Crates are disabled on this server' };
  }
  
  const profile = await getServerProfile(userId, serverId);
  if (!profile?.started) {
    return { eligible: false, reason: 'You need to use !start first' };
  }
  
  const crate = settings.crateSettings.types.find(c => c.id === crateId);
  if (!crate) {
    return { eligible: false, reason: 'Crate not found' };
  }
  
  const primaryBalance = profile.serverBalance?.primary || 0;
  const premiumBalance = profile.serverBalance?.premium || 0;
  
  if (crate.price.primary > 0 && primaryBalance < crate.price.primary) {
    return { eligible: false, reason: `Not enough coins. Need ${crate.price.primary}` };
  }
  
  if (crate.price.premium > 0 && premiumBalance < crate.price.premium) {
    return { eligible: false, reason: `Not enough gems. Need ${crate.price.premium}` };
  }
  
  return { eligible: true, crate, profile };
}

async function openCrate(userId, serverId, crateId) {
  const check = await checkCrateEligibility(userId, serverId, crateId);
  if (!check.eligible) {
    return { success: false, error: check.reason };
  }
  
  const { crate, profile } = check;
  const settings = await getServerSettings(serverId);
  
  if (crate.price.primary > 0) {
    await updateServerBalance(userId, serverId, 'primary', -crate.price.primary, `Crate: ${crate.name}`);
  }
  if (crate.price.premium > 0) {
    await updateServerBalance(userId, serverId, 'premium', -crate.price.premium, `Crate: ${crate.name}`);
  }
  
  const contents = await generateCrateContents(crate, serverId, userId, settings);
  
  for (const item of contents) {
    if (item.type === 'currency') {
      await updateServerBalance(userId, serverId, 'primary', item.amount, 'Crate reward');
    } else if (item.type === 'character') {
      await addCharacterToInventory(userId, serverId, item.character);
    } else if (item.type === 'item') {
      await addItemToInventory(userId, serverId, item.item);
    }
  }
  
  await updateServerProfile(userId, serverId, {
    $inc: { 'stats.cratesOpened': 1 }
  });
  
  await updatePityCounter(userId, serverId, crateId, contents);
  
  const collection = await getCollection(COLLECTIONS.ECONOMY_TRANSACTIONS);
  await collection.insertOne(createCrateOpenSchema(userId, serverId, crateId, contents));
  
  return { success: true, contents, crate };
}

async function generateCrateContents(crate, serverId, userId, settings) {
  const contents = [];
  const contentsConfig = crate.contents;
  
  const pityData = await getPityCounter(userId, serverId, crate.id);
  
  let guaranteedRarity = null;
  if (crate.pity?.enabled && pityData.count >= crate.pity.threshold) {
    guaranteedRarity = crate.pity.guaranteedRarity;
  }
  
  const roll = Math.random();
  let contentType;
  let cumulative = 0;
  
  for (const [type, config] of Object.entries(contentsConfig)) {
    cumulative += config.chance;
    if (roll <= cumulative) {
      contentType = type;
      break;
    }
  }
  
  contentType = contentType || 'currency';
  
  if (contentType === 'currency') {
    const config = contentsConfig.currency;
    const amount = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
    contents.push({ type: 'currency', amount });
  } else if (contentType === 'character') {
    const config = contentsConfig.character;
    const characters = await getMergedContent(serverId, CONTENT_TYPES.CHARACTER, settings);
    
    let rarity;
    if (guaranteedRarity) {
      rarity = guaranteedRarity;
    } else {
      rarity = selectRarity(config.rarityWeights);
    }
    
    let eligibleCharacters = characters.filter(c => c.rarity === rarity);
    if (eligibleCharacters.length === 0) {
      eligibleCharacters = characters;
    }
    
    const character = eligibleCharacters[Math.floor(Math.random() * eligibleCharacters.length)];
    contents.push({ type: 'character', character, rarity });
  } else if (contentType === 'item') {
    const config = contentsConfig.item;
    const items = await getMergedContent(serverId, CONTENT_TYPES.ITEM, settings);
    
    let rarity = selectRarity(config.rarityWeights);
    let eligibleItems = items.filter(i => i.rarity === rarity);
    if (eligibleItems.length === 0 && items.length > 0) {
      eligibleItems = items;
    }
    
    if (eligibleItems.length > 0) {
      const item = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
      contents.push({ type: 'item', item, rarity });
    } else {
      const amount = Math.floor(Math.random() * 50) + 10;
      contents.push({ type: 'currency', amount });
    }
  }
  
  return contents;
}

async function getPityCounter(userId, serverId, crateId) {
  const profile = await getServerProfile(userId, serverId);
  return profile.pityCounters?.[crateId] || { count: 0, lastReset: null };
}

async function updatePityCounter(userId, serverId, crateId, contents) {
  const hasRare = contents.some(c => 
    c.type === 'character' && ['epic', 'legendary', 'mythic'].includes(c.rarity)
  );
  
  const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
  
  if (hasRare) {
    await collection.updateOne(
      { userId: userId, serverId },
      { $set: { [`pityCounters.${crateId}`]: { count: 0, lastReset: new Date() } } }
    );
  } else {
    await collection.updateOne(
      { userId: userId, serverId },
      { $inc: { [`pityCounters.${crateId}.count`]: 1 } }
    );
  }
}

async function addItemToInventory(userId, serverId, item) {
  const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
  
  const profile = await getServerProfile(userId, serverId);
  const existingItem = profile.inventory?.find(i => i.slug === item.slug || i.name === item.name);
  
  if (existingItem && item.stackable !== false) {
    await collection.updateOne(
      { userId: userId, serverId, 'inventory.slug': item.slug || item.name },
      { $inc: { 'inventory.$.quantity': 1 } }
    );
  } else {
    await collection.updateOne(
      { userId: userId, serverId },
      { 
        $push: { 
          inventory: {
            ...item,
            slug: item.slug || item.name.toLowerCase().replace(/\s/g, '_'),
            quantity: 1,
            obtainedAt: new Date()
          }
        }
      }
    );
  }
}

async function addCustomCrate(serverId, crateConfig, addedBy) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const settings = await getServerSettings(serverId);
  const existingCrates = settings?.crateSettings?.types || [];
  
  if (existingCrates.find(c => c.id === crateConfig.id)) {
    return { success: false, error: 'Crate with this ID already exists' };
  }
  
  const newCrate = {
    id: crateConfig.id,
    name: crateConfig.name,
    emoji: crateConfig.emoji || '📦',
    price: {
      primary: crateConfig.pricePrimary || 0,
      premium: crateConfig.pricePremium || 0
    },
    contents: crateConfig.contents || {
      currency: { chance: 0.4, min: 20, max: 80 },
      character: { chance: 0.4, rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 5 } },
      item: { chance: 0.2, rarityWeights: { common: 60, uncommon: 30, rare: 10 } }
    },
    pity: {
      enabled: crateConfig.pityEnabled || false,
      threshold: crateConfig.pityThreshold || 10,
      guaranteedRarity: crateConfig.pityRarity || 'rare'
    },
    addedBy,
    addedAt: new Date()
  };
  
  await collection.updateOne(
    { serverId },
    { $push: { 'crateSettings.types': newCrate } }
  );
  
  return { success: true, crate: newCrate };
}

async function removeCustomCrate(serverId, crateId) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  await collection.updateOne(
    { serverId },
    { $pull: { 'crateSettings.types': { id: crateId } } }
  );
  
  return { success: true };
}

module.exports = {
  getAvailableCrates,
  checkCrateEligibility,
  openCrate,
  generateCrateContents,
  getPityCounter,
  addItemToInventory,
  addCustomCrate,
  removeCustomCrate
};
