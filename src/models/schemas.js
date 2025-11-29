const RARITY_TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const MOVE_TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
const ITEM_TYPES = ['consumable', 'equipment', 'material', 'special', 'key', 'cosmetic'];
const CRATE_TYPES = ['common', 'rare', 'epic', 'legendary', 'event', 'premium'];
const WORK_TYPES = ['hunt', 'fish', 'mine', 'forage', 'craft', 'explore', 'quest'];
const EVENT_TYPES = ['drop_boost', 'xp_boost', 'currency_boost', 'special_drop', 'battle_tournament', 'collection'];

function createUserProfileSchema(userId) {
  return {
    userId,
    globalBalance: {
      playCoins: 0,
      playGems: 0
    },
    globalStats: {
      totalBattlesWon: 0,
      totalBattlesLost: 0,
      totalTradesCompleted: 0,
      totalCratesOpened: 0,
      totalCharactersCollected: 0,
      joinedAt: new Date()
    },
    badges: [],
    achievements: [],
    clanId: null,
    clanRole: null,
    settings: {
      dmNotifications: true,
      battleNotifications: true,
      tradeNotifications: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createUserServerProfileSchema(userId, serverId) {
  return {
    userId,
    serverId,
    started: false,
    serverBalance: {
      primary: 0,
      premium: 0
    },
    inventory: [],
    characters: [],
    activeTeam: [],
    selectedCharacter: null,
    stats: {
      battlesWon: 0,
      battlesLost: 0,
      cratesOpened: 0,
      dropsCollected: 0,
      workCompleted: 0,
      tradesCompleted: 0,
      xpEarned: 0
    },
    cooldowns: {
      daily: null,
      work: null,
      drop: null,
      battle: null,
      trade: null
    },
    dailyStreak: 0,
    lastDailyClaim: null,
    level: 1,
    xp: 0,
    prestige: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createServerSettingsSchema(serverId) {
  return {
    serverId,
    botSettings: {
      displayName: 'PlayBot',
      prefix: '!',
      color: '#00D9FF',
      avatar: null,
      footer: 'PlayBot - Your Community Bot'
    },
    currencies: {
      primary: {
        name: 'Coins',
        symbol: '🪙',
        startingAmount: 100
      },
      premium: {
        name: 'Gems',
        symbol: '💎',
        startingAmount: 0
      }
    },
    channels: {
      drops: null,
      events: null,
      updates: null,
      battles: null,
      trades: null,
      logs: null
    },
    roles: {
      playAdmins: [],
      moderators: [],
      vip: [],
      banned: []
    },
    features: {
      dropsEnabled: true,
      battlesEnabled: true,
      tradingEnabled: true,
      cratesEnabled: true,
      workEnabled: true,
      eventsEnabled: true,
      leaderboardsEnabled: true
    },
    dropSettings: {
      enabled: true,
      cooldown: 30,
      baseChance: 0.15,
      rarityWeights: {
        common: 50,
        uncommon: 25,
        rare: 15,
        epic: 7,
        legendary: 2.5,
        mythic: 0.5
      },
      currencyDrops: {
        enabled: true,
        minAmount: 10,
        maxAmount: 50,
        chance: 0.3
      },
      messageRequirement: 5,
      channelRestrictions: []
    },
    workSettings: {
      enabled: true,
      cooldown: 300,
      jobs: [
        {
          id: 'hunt',
          name: 'Hunt',
          emoji: '🏹',
          cooldown: 300,
          rewards: { min: 20, max: 80 },
          xp: { min: 5, max: 15 },
          messages: [
            'You went hunting and caught some prey!',
            'A successful hunt! You return with rewards.',
            'The hunt was fruitful today!'
          ],
          failChance: 0.1,
          failMessages: [
            'The prey escaped... Better luck next time!',
            'You came back empty-handed.'
          ]
        },
        {
          id: 'fish',
          name: 'Fish',
          emoji: '🎣',
          cooldown: 300,
          rewards: { min: 15, max: 60 },
          xp: { min: 3, max: 12 },
          messages: [
            'You caught a nice fish!',
            'Great catch today!',
            'The fish are biting!'
          ],
          failChance: 0.15,
          failMessages: [
            'The fish aren\'t biting today.',
            'Your line broke!'
          ]
        },
        {
          id: 'mine',
          name: 'Mine',
          emoji: '⛏️',
          cooldown: 600,
          rewards: { min: 30, max: 120 },
          xp: { min: 8, max: 25 },
          messages: [
            'You found some valuable ore!',
            'Mining paid off today!',
            'You struck gold!'
          ],
          failChance: 0.2,
          failMessages: [
            'The mine collapsed!',
            'Nothing but rocks today.'
          ]
        }
      ]
    },
    battleSettings: {
      enabled: true,
      turnTimer: 60,
      maxTeamSize: 6,
      rewards: {
        winner: { coins: 50, xp: 25 },
        loser: { coins: 10, xp: 10 }
      },
      rules: {
        allowItems: true,
        allowSwitching: true,
        levelScaling: true
      },
      cooldown: 60
    },
    crateSettings: {
      enabled: true,
      types: [
        {
          id: 'common_crate',
          name: 'Common Crate',
          emoji: '📦',
          price: { primary: 100, premium: 0 },
          contents: {
            currency: { chance: 0.4, min: 20, max: 80 },
            character: { chance: 0.3, rarityWeights: { common: 70, uncommon: 25, rare: 5 } },
            item: { chance: 0.3, rarityWeights: { common: 80, uncommon: 20 } }
          },
          pity: { enabled: false, threshold: 0, guaranteedRarity: null }
        },
        {
          id: 'rare_crate',
          name: 'Rare Crate',
          emoji: '🎁',
          price: { primary: 500, premium: 0 },
          contents: {
            currency: { chance: 0.3, min: 50, max: 200 },
            character: { chance: 0.4, rarityWeights: { uncommon: 40, rare: 40, epic: 18, legendary: 2 } },
            item: { chance: 0.3, rarityWeights: { uncommon: 50, rare: 40, epic: 10 } }
          },
          pity: { enabled: true, threshold: 10, guaranteedRarity: 'epic' }
        },
        {
          id: 'legendary_crate',
          name: 'Legendary Crate',
          emoji: '👑',
          price: { primary: 0, premium: 50 },
          contents: {
            currency: { chance: 0.2, min: 100, max: 500 },
            character: { chance: 0.5, rarityWeights: { rare: 30, epic: 45, legendary: 20, mythic: 5 } },
            item: { chance: 0.3, rarityWeights: { rare: 40, epic: 40, legendary: 20 } }
          },
          pity: { enabled: true, threshold: 5, guaranteedRarity: 'legendary' }
        }
      ]
    },
    tradingSettings: {
      enabled: true,
      cooldown: 30,
      maxItemsPerTrade: 10,
      fees: {
        percentage: 5,
        minFee: 1,
        maxFee: 1000
      },
      restrictions: {
        minLevel: 5,
        allowCurrencyTrades: true,
        allowCharacterTrades: true,
        allowItemTrades: true,
        blacklistedItems: [],
        blacklistedCharacters: []
      }
    },
    progressionSettings: {
      xpPerMessage: 1,
      xpPerBattle: 25,
      xpPerWork: 10,
      xpPerDrop: 5,
      levelCurve: 'standard',
      levelFormula: {
        base: 100,
        multiplier: 1.5
      },
      prestigeEnabled: true,
      prestigeRequirement: 100,
      prestigeRewards: {
        playCoins: 100,
        badge: true
      }
    },
    eventSettings: {
      enabled: true,
      activeEvents: [],
      scheduledEvents: []
    },
    preset: null,
    setupComplete: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createCharacterData(name, emoji, rarity, customData = {}) {
  return {
    name,
    emoji,
    rarity,
    baseStats: {
      hp: customData.hp || getBaseStatByRarity(rarity, 'hp'),
      attack: customData.attack || getBaseStatByRarity(rarity, 'attack'),
      defense: customData.defense || getBaseStatByRarity(rarity, 'defense'),
      speed: customData.speed || getBaseStatByRarity(rarity, 'speed'),
      energy: customData.energy || 100
    },
    type: customData.type || 'normal',
    abilities: customData.abilities || [],
    learnableMoves: customData.learnableMoves || [],
    evolutionChain: customData.evolutionChain || null,
    description: customData.description || `A ${rarity} character.`,
    catchPhrase: customData.catchPhrase || null,
    ...customData
  };
}

function getBaseStatByRarity(rarity, stat) {
  const baseStats = {
    common: { hp: 50, attack: 30, defense: 30, speed: 30 },
    uncommon: { hp: 65, attack: 40, defense: 40, speed: 40 },
    rare: { hp: 80, attack: 55, defense: 55, speed: 55 },
    epic: { hp: 100, attack: 70, defense: 70, speed: 70 },
    legendary: { hp: 120, attack: 90, defense: 90, speed: 90 },
    mythic: { hp: 150, attack: 110, defense: 110, speed: 110 }
  };
  return baseStats[rarity]?.[stat] || 50;
}

function createMoveData(name, type, power, accuracy, energy, customData = {}) {
  return {
    name,
    type,
    power,
    accuracy,
    energy,
    category: customData.category || (power > 0 ? 'physical' : 'status'),
    effects: customData.effects || [],
    priority: customData.priority || 0,
    description: customData.description || `A ${type}-type move.`,
    ...customData
  };
}

function createItemData(name, emoji, type, effects = {}, price = {}) {
  return {
    name,
    emoji,
    type,
    effects: {
      heal: effects.heal || null,
      buff: effects.buff || null,
      debuff: effects.debuff || null,
      revive: effects.revive || false,
      xpBoost: effects.xpBoost || null,
      coinBoost: effects.coinBoost || null,
      special: effects.special || null,
      ...effects
    },
    price: {
      primary: price.primary || price.coins || 0,
      premium: price.premium || price.gems || 0
    },
    stackable: type !== 'equipment',
    maxStack: type === 'equipment' ? 1 : 99,
    tradeable: true,
    rarity: price.rarity || 'common',
    description: effects.description || `A ${type} item.`
  };
}

function createOwnedCharacterSchema(characterSlug, userId, serverId) {
  return {
    userId: userId,
    userId: userId,
    slug: characterSlug,
    nickname: null,
    level: 1,
    xp: 0,
    stats: null,
    moves: [],
    item: null,
    friendship: 0,
    obtainedAt: new Date(),
    obtainedMethod: 'drop',
    battleCount: 0,
    victories: 0
  };
}

function createGlobalContentSchema(contentType, slug, data, createdBy) {
  return {
    contentType,
    slug,
    data,
    createdBy,
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createServerContentSchema(serverId, contentType, slug, data, createdBy) {
  return {
    serverId,
    contentType,
    slug,
    data,
    createdBy,
    isPublished: false,
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createCurrencyExchangeRateSchema(serverId) {
  return {
    serverId,
    rates: {
      serverToOfficial: {
        primaryToPlayCoins: 10,
        premiumToPlayGems: 1
      },
      officialToServer: {
        playCoinstoPrimary: 10,
        playGemsToPremium: 1
      }
    },
    fees: {
      exchangeFeePercent: 5,
      minFee: 1,
      maxFee: 1000
    },
    limits: {
      dailyLimit: 10000,
      perTransactionLimit: 1000
    },
    lastUpdatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createTransactionSchema(userId, serverId, type, currency, amount, details) {
  return {
    userId: userId,
    serverId,
    type,
    currency,
    amount,
    details,
    balanceBefore: details?.balanceBefore || null,
    balanceAfter: details?.balanceAfter || null,
    createdAt: new Date()
  };
}

function createAuditLogSchema(actorId, scope, serverId, action, payload) {
  return {
    actorId,
    scope,
    serverId,
    action,
    payload,
    timestamp: new Date()
  };
}

function createBattleSchema(challengerId, defenderId, serverId) {
  return {
    userId: userId,
    defenderId,
    serverId,
    status: 'pending',
    type: 'pvp',
    challengerTeam: [],
    defenderTeam: [],
    currentTurn: null,
    turnNumber: 0,
    battleLog: [],
    winner: null,
    rewards: null,
    startedAt: null,
    endedAt: null,
    createdAt: new Date()
  };
}

function createTradeSchema(initiatorId, recipientId, serverId) {
  return {
    initiatorId,
    recipientId,
    serverId,
    status: 'pending',
    initiatorOffer: {
      characters: [],
      items: [],
      currency: { primary: 0, premium: 0 }
    },
    recipientOffer: {
      characters: [],
      items: [],
      currency: { primary: 0, premium: 0 }
    },
    initiatorConfirmed: false,
    recipientConfirmed: false,
    fees: { primary: 0, premium: 0 },
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    createdAt: new Date()
  };
}

function createEventSchema(serverId, eventType, name, config) {
  return {
    serverId,
    eventType,
    name,
    description: config.description || '',
    status: 'scheduled',
    config: {
      boostMultiplier: config.boostMultiplier || 2,
      affectedSystems: config.affectedSystems || [],
      specialDrops: config.specialDrops || [],
      rewards: config.rewards || [],
      ...config
    },
    participants: [],
    leaderboard: [],
    startTime: config.startTime || new Date(),
    endTime: config.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdBy: config.createdBy,
    createdAt: new Date()
  };
}

function createDropSchema(userId, serverId, dropType, content) {
  return {
    userId: userId,
    serverId,
    dropType,
    content,
    claimed: false,
    claimedAt: null,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    messageId: null,
    channelId: null,
    createdAt: new Date()
  };
}

function createWorkHistorySchema(userId, serverId, jobId, result) {
  return {
    userId: userId,
    serverId,
    jobId,
    success: result.success,
    rewards: result.rewards,
    xpEarned: result.xp,
    message: result.message,
    createdAt: new Date()
  };
}

function createCrateOpenSchema(userId, serverId, crateType, contents) {
  return {
    userId: userId,
    serverId,
    crateType,
    contents,
    pityCount: 0,
    createdAt: new Date()
  };
}

function createPresetSchema(name, category, config) {
  return {
    name,
    category,
    description: config.description || '',
    isOfficial: config.isOfficial || false,
    config: {
      dropSettings: config.dropSettings || null,
      workSettings: config.workSettings || null,
      battleSettings: config.battleSettings || null,
      crateSettings: config.crateSettings || null,
      tradingSettings: config.tradingSettings || null,
      progressionSettings: config.progressionSettings || null,
      currencies: config.currencies || null,
      starterCharacters: config.starterCharacters || [],
      starterItems: config.starterItems || []
    },
    createdBy: config.createdBy,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createClanSchema(name, tag, ownerId) {
  return {
    name,
    tag,
    ownerId,
    description: '',
    icon: null,
    color: '#00D9FF',
    members: [{ userId: ownerId, userId: ownerId, userId: userId, role: 'leader', joinedAt: new Date() }],
    maxMembers: 50,
    level: 1,
    xp: 0,
    stats: {
      totalWars: 0,
      warsWon: 0,
      warsLost: 0,
      totalPoints: 0
    },
    treasury: {
      playCoins: 0,
      playGems: 0
    },
    perks: [],
    settings: {
      joinRequirement: 'open',
      minLevel: 1,
      autoPromote: false
    },
    currentWar: null,
    warHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createClanWarSchema(clan1Id, clan2Id) {
  return {
    clan1Id,
    clan2Id,
    status: 'preparation',
    clan1Score: 0,
    clan2Score: 0,
    battles: [],
    startTime: null,
    endTime: null,
    winner: null,
    rewards: null,
    createdAt: new Date()
  };
}

module.exports = {
  RARITY_TIERS,
  MOVE_TYPES,
  ITEM_TYPES,
  CRATE_TYPES,
  WORK_TYPES,
  EVENT_TYPES,
  createUserProfileSchema,
  createUserServerProfileSchema,
  createServerSettingsSchema,
  createCharacterData,
  getBaseStatByRarity,
  createMoveData,
  createItemData,
  createOwnedCharacterSchema,
  createGlobalContentSchema,
  createServerContentSchema,
  createCurrencyExchangeRateSchema,
  createTransactionSchema,
  createAuditLogSchema,
  createBattleSchema,
  createTradeSchema,
  createEventSchema,
  createDropSchema,
  createWorkHistorySchema,
  createCrateOpenSchema,
  createPresetSchema,
  createClanSchema,
  createClanWarSchema
};
