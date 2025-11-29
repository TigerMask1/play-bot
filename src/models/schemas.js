const CONTENT_TYPES = {
  CHARACTER: 'character',
  MOVE: 'move',
  ITEM: 'item',
  CRATE: 'crate',
  QUEST: 'quest',
  SKIN: 'skin'
};

const TRANSACTION_TYPES = {
  GRANT: 'grant',
  SPEND: 'spend',
  EXCHANGE: 'exchange',
  TRANSFER: 'transfer',
  REWARD: 'reward',
  PURCHASE: 'purchase',
  REFUND: 'refund'
};

const AUDIT_ACTIONS = {
  CONTENT_CREATE: 'content_create',
  CONTENT_UPDATE: 'content_update',
  CONTENT_DELETE: 'content_delete',
  CURRENCY_GRANT: 'currency_grant',
  CURRENCY_REMOVE: 'currency_remove',
  EXCHANGE_RATE_UPDATE: 'exchange_rate_update',
  SERVER_SETTING_UPDATE: 'server_setting_update',
  ADMIN_ADD: 'admin_add',
  ADMIN_REMOVE: 'admin_remove',
  BAN_USER: 'ban_user',
  UNBAN_USER: 'unban_user'
};

const AUDIT_SCOPES = {
  GLOBAL: 'global',
  SERVER: 'server'
};

function createGlobalContentSchema(type, slug, data) {
  return {
    type,
    slug,
    data,
    version: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null
  };
}

function createServerContentSchema(serverId, type, slug, data, baseGlobalSlug = null) {
  return {
    serverId,
    type,
    slug,
    data,
    baseGlobalSlug,
    isExtension: !!baseGlobalSlug,
    isActive: true,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null
  };
}

function createServerSettingsSchema(serverId, guildName) {
  return {
    serverId,
    guildName,
    botSettings: {
      displayName: 'PlayBot',
      prefix: '!',
      color: '#00D9FF',
      iconUrl: null,
      welcomeMessage: null
    },
    channels: {
      drops: null,
      events: null,
      updates: null,
      logs: null
    },
    currencies: {
      primary: {
        name: 'Coins',
        symbol: '🪙',
        code: 'COINS',
        startingAmount: 100
      },
      premium: {
        name: 'Gems',
        symbol: '💎',
        code: 'GEMS',
        startingAmount: 0
      }
    },
    admins: [],
    features: {
      dropsEnabled: false,
      eventsEnabled: true,
      tradingEnabled: true,
      battlesEnabled: true,
      questsEnabled: true,
      marketEnabled: true
    },
    customization: {
      useOfficialContent: true,
      useServerContent: true,
      allowCustomCharacters: true,
      allowCustomMoves: true,
      allowCustomItems: true
    },
    setupComplete: false,
    setupDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createUserProfileSchema(userId, username) {
  return {
    userId,
    username,
    displayName: username,
    officialBalance: {
      playCoins: 0,
      playGems: 0
    },
    globalUnlocks: {
      characters: [],
      skins: [],
      titles: [],
      badges: []
    },
    globalStats: {
      battlesWon: 0,
      battlesLost: 0,
      totalTrades: 0,
      cratesOpened: 0,
      eventsParticipated: 0
    },
    accountLevel: 1,
    accountXP: 0,
    isPremium: false,
    isBanned: false,
    banReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date()
  };
}

function createUserServerProfileSchema(userId, serverId, username) {
  return {
    userId,
    serverId,
    username,
    serverBalance: {
      primary: 0,
      premium: 0
    },
    inventory: {
      characters: [],
      items: {},
      crates: {},
      resources: {}
    },
    selectedCharacter: null,
    stats: {
      battlesWon: 0,
      battlesLost: 0,
      trophies: 200,
      messageCount: 0,
      cratesOpened: 0,
      questsCompleted: 0
    },
    progression: {
      level: 1,
      xp: 0,
      quests: {},
      achievements: []
    },
    settings: {
      notifications: true,
      autoDaily: false
    },
    started: false,
    lastDailyClaim: null,
    lastActivity: null,
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
      dailyExchangeLimit: 10000,
      perTransactionMax: 5000
    },
    isActive: true,
    lastUpdatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function createTransactionSchema(userId, serverId, type, currency, amount, details) {
  return {
    userId,
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
    createdAt: new Date()
  };
}

function createCharacterData(name, emoji, rarity = 'common', stats = {}) {
  return {
    name,
    emoji,
    customEmojiId: null,
    rarity,
    obtainable: 'crate',
    stats: {
      baseHP: stats.baseHP || 100,
      baseAttack: stats.baseAttack || 10,
      baseDefense: stats.baseDefense || 10,
      baseSpeed: stats.baseSpeed || 10,
      ...stats
    },
    abilities: [],
    moves: [],
    description: null,
    imageUrl: null
  };
}

function createMoveData(name, type, power, accuracy, energyCost, effect = null) {
  return {
    name,
    type,
    power,
    accuracy,
    energyCost,
    effect,
    description: null,
    category: 'physical'
  };
}

function createItemData(name, emoji, type, effect, price = {}) {
  return {
    name,
    emoji,
    type,
    effect,
    stackable: true,
    maxStack: 999,
    tradeable: true,
    price: {
      coins: price.coins || 0,
      gems: price.gems || 0
    },
    description: null
  };
}

function createCrateData(name, emoji, tier, dropTable = []) {
  return {
    name,
    emoji,
    tier,
    dropTable,
    openCost: { coins: 0, gems: 0 },
    purchaseCost: { coins: 0, gems: 0 },
    description: null
  };
}

module.exports = {
  CONTENT_TYPES,
  TRANSACTION_TYPES,
  AUDIT_ACTIONS,
  AUDIT_SCOPES,
  createGlobalContentSchema,
  createServerContentSchema,
  createServerSettingsSchema,
  createUserProfileSchema,
  createUserServerProfileSchema,
  createCurrencyExchangeRateSchema,
  createTransactionSchema,
  createAuditLogSchema,
  createCharacterData,
  createMoveData,
  createItemData,
  createCrateData
};
