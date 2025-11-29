const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createPresetSchema, createServerSettingsSchema } = require('../models/schemas');
const logger = require('../core/logger');

const OFFICIAL_PRESETS = {
  simple: {
    name: 'Simple Mode',
    description: 'Easy to use, minimal configuration. Great for casual communities.',
    config: {
      dropSettings: {
        enabled: true,
        cooldown: 60,
        baseChance: 0.2,
        rarityWeights: { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 },
        currencyDrops: { enabled: true, minAmount: 20, maxAmount: 100, chance: 0.4 }
      },
      workSettings: {
        enabled: true,
        cooldown: 180,
        jobs: [
          { id: 'work', name: 'Work', emoji: '💼', cooldown: 180, rewards: { min: 30, max: 100 }, xp: { min: 5, max: 20 }, messages: ['Great job!', 'You earned some coins!'], failChance: 0, failMessages: [] }
        ]
      },
      battleSettings: {
        enabled: true,
        turnTimer: 120,
        maxTeamSize: 3,
        rewards: { winner: { coins: 75, xp: 30 }, loser: { coins: 15, xp: 10 } }
      },
      crateSettings: {
        enabled: true,
        types: [
          { id: 'basic_crate', name: 'Basic Crate', emoji: '📦', price: { primary: 200, premium: 0 }, contents: { currency: { chance: 0.5, min: 50, max: 150 }, character: { chance: 0.5, rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 5 } } }, pity: { enabled: false } }
        ]
      },
      tradingSettings: {
        enabled: true,
        cooldown: 30,
        fees: { percentage: 0, minFee: 0, maxFee: 0 },
        restrictions: { minLevel: 1, allowCurrencyTrades: true, allowCharacterTrades: true, allowItemTrades: true }
      },
      progressionSettings: {
        xpPerMessage: 2,
        xpPerBattle: 30,
        levelFormula: { base: 50, multiplier: 1.3 }
      },
      currencies: {
        primary: { name: 'Coins', symbol: '🪙', startingAmount: 500 },
        premium: { name: 'Gems', symbol: '💎', startingAmount: 10 }
      }
    }
  },
  rpg: {
    name: 'RPG Style',
    description: 'Full RPG experience with quests, classes, and deep progression.',
    config: {
      dropSettings: {
        enabled: true,
        cooldown: 45,
        baseChance: 0.15,
        rarityWeights: { common: 45, uncommon: 28, rare: 17, epic: 7, legendary: 2.5, mythic: 0.5 },
        currencyDrops: { enabled: true, minAmount: 10, maxAmount: 60, chance: 0.25 }
      },
      workSettings: {
        enabled: true,
        cooldown: 300,
        jobs: [
          { id: 'hunt', name: 'Hunt', emoji: '🏹', cooldown: 300, rewards: { min: 25, max: 90 }, xp: { min: 8, max: 25 }, messages: ['You tracked down your prey!', 'Successful hunt!', 'The forest yields its bounty.'], failChance: 0.1, failMessages: ['The prey escaped.', 'Bad luck today.'] },
          { id: 'mine', name: 'Mine', emoji: '⛏️', cooldown: 600, rewards: { min: 40, max: 150 }, xp: { min: 15, max: 40 }, messages: ['You found valuable ore!', 'Mining success!', 'Rich deposits today!'], failChance: 0.15, failMessages: ['Cave-in!', 'Nothing but rocks.'] },
          { id: 'fish', name: 'Fish', emoji: '🎣', cooldown: 240, rewards: { min: 15, max: 70 }, xp: { min: 5, max: 18 }, messages: ['Great catch!', 'The fish are biting!', 'Fresh fish!'], failChance: 0.2, failMessages: ['They got away.', 'Line broke.'] },
          { id: 'forage', name: 'Forage', emoji: '🌿', cooldown: 180, rewards: { min: 10, max: 50 }, xp: { min: 3, max: 12 }, messages: ['Found herbs!', 'Nice haul!', 'The forest provides.'], failChance: 0.05, failMessages: ['Nothing useful.'] },
          { id: 'quest', name: 'Quest', emoji: '📜', cooldown: 1800, rewards: { min: 100, max: 300 }, xp: { min: 50, max: 100 }, messages: ['Quest complete!', 'Adventure awaits!', 'Hero returns!'], failChance: 0.25, failMessages: ['Quest failed.', 'The dungeon was too dangerous.'] }
        ]
      },
      battleSettings: {
        enabled: true,
        turnTimer: 90,
        maxTeamSize: 6,
        rewards: { winner: { coins: 100, xp: 50 }, loser: { coins: 20, xp: 20 } },
        rules: { allowItems: true, allowSwitching: true, levelScaling: true }
      },
      crateSettings: {
        enabled: true,
        types: [
          { id: 'treasure_chest', name: 'Treasure Chest', emoji: '🎁', price: { primary: 300, premium: 0 }, contents: { currency: { chance: 0.35, min: 50, max: 200 }, character: { chance: 0.35, rarityWeights: { common: 40, uncommon: 35, rare: 20, epic: 5 } }, item: { chance: 0.3, rarityWeights: { common: 50, uncommon: 35, rare: 15 } } }, pity: { enabled: true, threshold: 15, guaranteedRarity: 'rare' } },
          { id: 'epic_chest', name: 'Epic Chest', emoji: '👑', price: { primary: 1000, premium: 0 }, contents: { currency: { chance: 0.25, min: 100, max: 400 }, character: { chance: 0.45, rarityWeights: { uncommon: 25, rare: 40, epic: 28, legendary: 7 } }, item: { chance: 0.3, rarityWeights: { uncommon: 30, rare: 45, epic: 25 } } }, pity: { enabled: true, threshold: 10, guaranteedRarity: 'epic' } },
          { id: 'legendary_chest', name: 'Legendary Chest', emoji: '🏆', price: { primary: 0, premium: 100 }, contents: { currency: { chance: 0.2, min: 200, max: 800 }, character: { chance: 0.5, rarityWeights: { rare: 25, epic: 40, legendary: 28, mythic: 7 } }, item: { chance: 0.3, rarityWeights: { rare: 30, epic: 45, legendary: 25 } } }, pity: { enabled: true, threshold: 5, guaranteedRarity: 'legendary' } }
        ]
      },
      tradingSettings: {
        enabled: true,
        cooldown: 60,
        fees: { percentage: 5, minFee: 5, maxFee: 500 },
        restrictions: { minLevel: 5, allowCurrencyTrades: true, allowCharacterTrades: true, allowItemTrades: true }
      },
      progressionSettings: {
        xpPerMessage: 1,
        xpPerBattle: 50,
        xpPerWork: 15,
        levelFormula: { base: 100, multiplier: 1.5 },
        prestigeEnabled: true,
        prestigeRequirement: 100
      },
      currencies: {
        primary: { name: 'Gold', symbol: '🪙', startingAmount: 200 },
        premium: { name: 'Crystals', symbol: '💎', startingAmount: 5 }
      }
    }
  },
  pokemon: {
    name: 'Creature Collector',
    description: 'Focus on catching, training, and battling creatures.',
    config: {
      dropSettings: {
        enabled: true,
        cooldown: 30,
        baseChance: 0.12,
        rarityWeights: { common: 50, uncommon: 27, rare: 14, epic: 6, legendary: 2.5, mythic: 0.5 },
        currencyDrops: { enabled: true, minAmount: 15, maxAmount: 45, chance: 0.2 }
      },
      workSettings: {
        enabled: true,
        cooldown: 300,
        jobs: [
          { id: 'explore', name: 'Explore', emoji: '🗺️', cooldown: 300, rewards: { min: 20, max: 60 }, xp: { min: 10, max: 30 }, messages: ['You found a new area!', 'Exploration complete!'], failChance: 0.1, failMessages: ['Got lost.'] },
          { id: 'train', name: 'Train', emoji: '💪', cooldown: 180, rewards: { min: 10, max: 30 }, xp: { min: 20, max: 50 }, messages: ['Training complete!', 'Getting stronger!'], failChance: 0, failMessages: [] }
        ]
      },
      battleSettings: {
        enabled: true,
        turnTimer: 60,
        maxTeamSize: 6,
        rewards: { winner: { coins: 80, xp: 40 }, loser: { coins: 15, xp: 15 } },
        rules: { allowItems: true, allowSwitching: true, levelScaling: false }
      },
      crateSettings: {
        enabled: true,
        types: [
          { id: 'pokeball', name: 'Creature Ball', emoji: '🔴', price: { primary: 100, premium: 0 }, contents: { character: { chance: 1.0, rarityWeights: { common: 55, uncommon: 28, rare: 12, epic: 4, legendary: 1 } } }, pity: { enabled: true, threshold: 20, guaranteedRarity: 'rare' } },
          { id: 'greatball', name: 'Great Ball', emoji: '🔵', price: { primary: 350, premium: 0 }, contents: { character: { chance: 1.0, rarityWeights: { common: 30, uncommon: 35, rare: 25, epic: 8, legendary: 2 } } }, pity: { enabled: true, threshold: 12, guaranteedRarity: 'epic' } },
          { id: 'ultraball', name: 'Ultra Ball', emoji: '🟡', price: { primary: 0, premium: 30 }, contents: { character: { chance: 1.0, rarityWeights: { uncommon: 20, rare: 35, epic: 30, legendary: 12, mythic: 3 } } }, pity: { enabled: true, threshold: 7, guaranteedRarity: 'legendary' } }
        ]
      },
      tradingSettings: {
        enabled: true,
        cooldown: 30,
        fees: { percentage: 2, minFee: 1, maxFee: 200 },
        restrictions: { minLevel: 3, allowCurrencyTrades: true, allowCharacterTrades: true, allowItemTrades: true }
      },
      progressionSettings: {
        xpPerMessage: 1,
        xpPerBattle: 35,
        levelFormula: { base: 75, multiplier: 1.4 }
      },
      currencies: {
        primary: { name: 'PokéCoins', symbol: '🪙', startingAmount: 300 },
        premium: { name: 'Stardust', symbol: '✨', startingAmount: 5 }
      }
    }
  },
  competitive: {
    name: 'Competitive',
    description: 'Balanced economy with focus on PvP and rankings.',
    config: {
      dropSettings: {
        enabled: true,
        cooldown: 120,
        baseChance: 0.08,
        rarityWeights: { common: 40, uncommon: 30, rare: 18, epic: 9, legendary: 2.5, mythic: 0.5 },
        currencyDrops: { enabled: true, minAmount: 25, maxAmount: 75, chance: 0.15 }
      },
      workSettings: {
        enabled: true,
        cooldown: 600,
        jobs: [
          { id: 'grind', name: 'Grind', emoji: '⚔️', cooldown: 600, rewards: { min: 50, max: 150 }, xp: { min: 20, max: 50 }, messages: ['Training complete!', 'You\'re getting stronger.'], failChance: 0, failMessages: [] }
        ]
      },
      battleSettings: {
        enabled: true,
        turnTimer: 45,
        maxTeamSize: 4,
        rewards: { winner: { coins: 150, xp: 75 }, loser: { coins: 25, xp: 25 } },
        rules: { allowItems: false, allowSwitching: true, levelScaling: true }
      },
      crateSettings: {
        enabled: true,
        types: [
          { id: 'ranked_crate', name: 'Ranked Crate', emoji: '🏆', price: { primary: 500, premium: 0 }, contents: { currency: { chance: 0.3, min: 100, max: 300 }, character: { chance: 0.7, rarityWeights: { uncommon: 35, rare: 40, epic: 20, legendary: 5 } } }, pity: { enabled: true, threshold: 8, guaranteedRarity: 'epic' } }
        ]
      },
      tradingSettings: {
        enabled: true,
        cooldown: 120,
        fees: { percentage: 10, minFee: 10, maxFee: 1000 },
        restrictions: { minLevel: 10, allowCurrencyTrades: true, allowCharacterTrades: true, allowItemTrades: true }
      },
      progressionSettings: {
        xpPerMessage: 0,
        xpPerBattle: 100,
        levelFormula: { base: 150, multiplier: 1.6 }
      },
      currencies: {
        primary: { name: 'Credits', symbol: '💰', startingAmount: 100 },
        premium: { name: 'Tokens', symbol: '🎫', startingAmount: 0 }
      }
    }
  }
};

async function getPreset(presetId) {
  if (OFFICIAL_PRESETS[presetId]) {
    return { ...OFFICIAL_PRESETS[presetId], id: presetId, isOfficial: true };
  }
  
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  const result = await collection.findOne({ 'customPresets.id': presetId });
  
  if (result) {
    return result.customPresets.find(p => p.id === presetId);
  }
  
  return null;
}

async function getAllOfficialPresets() {
  return Object.entries(OFFICIAL_PRESETS).map(([id, preset]) => ({
    id,
    ...preset,
    isOfficial: true
  }));
}

async function applyPreset(serverId, presetId, appliedBy) {
  const preset = await getPreset(presetId);
  
  if (!preset) {
    return { success: false, error: 'Preset not found' };
  }
  
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  const config = preset.config;
  
  const updateFields = {};
  
  if (config.dropSettings) updateFields.dropSettings = config.dropSettings;
  if (config.workSettings) updateFields.workSettings = config.workSettings;
  if (config.battleSettings) updateFields.battleSettings = config.battleSettings;
  if (config.crateSettings) updateFields.crateSettings = config.crateSettings;
  if (config.tradingSettings) updateFields.tradingSettings = config.tradingSettings;
  if (config.progressionSettings) updateFields.progressionSettings = config.progressionSettings;
  if (config.currencies) updateFields.currencies = config.currencies;
  
  updateFields.preset = presetId;
  updateFields.presetAppliedAt = new Date();
  updateFields.presetAppliedBy = appliedBy;
  updateFields.updatedAt = new Date();
  
  await collection.updateOne(
    { serverId },
    { $set: updateFields }
  );
  
  logger.info(`Applied preset ${presetId} to server ${serverId}`);
  
  return { success: true, preset };
}

async function createCustomPreset(serverId, name, config, createdBy) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const presetId = `custom_${serverId}_${Date.now()}`;
  const preset = {
    id: presetId,
    ...createPresetSchema(name, 'custom', {
      ...config,
      isOfficial: false,
      createdBy
    })
  };
  
  await collection.updateOne(
    { serverId },
    { $push: { customPresets: preset } }
  );
  
  return { success: true, preset };
}

async function exportServerConfig(serverId) {
  const { getServerSettings } = require('./serverSettingsService');
  const settings = await getServerSettings(serverId);
  
  if (!settings) {
    return { success: false, error: 'Server not found' };
  }
  
  const exportConfig = {
    dropSettings: settings.dropSettings,
    workSettings: settings.workSettings,
    battleSettings: settings.battleSettings,
    crateSettings: settings.crateSettings,
    tradingSettings: settings.tradingSettings,
    progressionSettings: settings.progressionSettings,
    currencies: settings.currencies,
    exportedAt: new Date(),
    version: '1.0'
  };
  
  return { success: true, config: exportConfig };
}

async function importServerConfig(serverId, config, importedBy) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const updateFields = {};
  
  if (config.dropSettings) updateFields.dropSettings = config.dropSettings;
  if (config.workSettings) updateFields.workSettings = config.workSettings;
  if (config.battleSettings) updateFields.battleSettings = config.battleSettings;
  if (config.crateSettings) updateFields.crateSettings = config.crateSettings;
  if (config.tradingSettings) updateFields.tradingSettings = config.tradingSettings;
  if (config.progressionSettings) updateFields.progressionSettings = config.progressionSettings;
  if (config.currencies) updateFields.currencies = config.currencies;
  
  updateFields.configImportedAt = new Date();
  updateFields.configImportedBy = importedBy;
  updateFields.updatedAt = new Date();
  
  await collection.updateOne(
    { serverId },
    { $set: updateFields }
  );
  
  return { success: true };
}

module.exports = {
  OFFICIAL_PRESETS,
  getPreset,
  getAllOfficialPresets,
  applyPreset,
  createCustomPreset,
  exportServerConfig,
  importServerConfig
};
