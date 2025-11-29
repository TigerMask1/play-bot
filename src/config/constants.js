module.exports = {
  BOT_NAME: 'PlayBot',
  BOT_VERSION: '1.0.0',
  DEFAULT_PREFIX: '!',
  
  COLORS: {
    PRIMARY: '#5865F2',
    SUCCESS: '#57F287',
    WARNING: '#FEE75C',
    ERROR: '#ED4245',
    INFO: '#5865F2',
    RARITY: {
      COMMON: '#9E9E9E',
      UNCOMMON: '#4CAF50',
      RARE: '#2196F3',
      EPIC: '#9C27B0',
      LEGENDARY: '#FF9800',
      MYTHIC: '#E91E63'
    }
  },
  
  PERMISSIONS: {
    OWNER: 100,
    ADMIN: 80,
    MODERATOR: 60,
    VIP: 40,
    MEMBER: 20
  },
  
  RARITY_WEIGHTS: {
    COMMON: 50,
    UNCOMMON: 30,
    RARE: 15,
    EPIC: 4,
    LEGENDARY: 0.9,
    MYTHIC: 0.1
  },
  
  RARITY_MULTIPLIERS: {
    COMMON: 1,
    UNCOMMON: 1.5,
    RARE: 2,
    EPIC: 3,
    LEGENDARY: 5,
    MYTHIC: 10
  },
  
  ECONOMY: {
    STARTING_BALANCE: 100,
    STARTING_GEMS: 0,
    DAILY_COINS: 100,
    DAILY_PLAYCOINS: 10,
    DROP_COINS_MIN: 10,
    DROP_COINS_MAX: 50,
    DROP_PLAYCOINS_MIN: 1,
    DROP_PLAYCOINS_MAX: 5,
    BATTLE_WIN_COINS_MIN: 25,
    BATTLE_WIN_COINS_MAX: 100,
    BATTLE_WIN_PLAYCOINS_MIN: 5,
    BATTLE_WIN_PLAYCOINS_MAX: 15
  },
  
  DROPS: {
    DEFAULT_INTERVAL: 60,
    MIN_INTERVAL: 30,
    MAX_INTERVAL: 300,
    CATCH_TIMEOUT: 30,
    MAX_UNCAUGHT: 10
  },
  
  BATTLES: {
    TURN_TIMEOUT: 60,
    MAX_HP_MULTIPLIER: 10,
    BASE_ENERGY: 100,
    ENERGY_PER_TURN: 25
  },
  
  CLANS: {
    CREATE_COST: 5000,
    MAX_MEMBERS: 50,
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 20,
    TAG_LENGTH: 4
  },
  
  LEVELS: {
    XP_BASE: 100,
    XP_MULTIPLIER: 1.5,
    MAX_LEVEL: 100
  },
  
  COOLDOWNS: {
    DAILY: 86400000,
    BATTLE: 30000,
    TRADE: 60000,
    DROP_CATCH: 1000
  },
  
  MODULES: {
    COLLECTION: 'collection',
    BATTLES: 'battles',
    CLANS: 'clans',
    TRADING: 'trading',
    DROPS: 'drops',
    EVENTS: 'events',
    QUESTS: 'quests',
    SHOP: 'shop',
    LEADERBOARDS: 'leaderboards'
  },
  
  EMOJIS: {
    COINS: '🪙',
    GEMS: '💎',
    PLAYCOINS: '🌟',
    PLAYGEMS: '✨',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    LOADING: '⏳',
    BATTLE: '⚔️',
    CLAN: '🏰',
    TRADE: '🤝',
    DROP: '📦',
    LEVEL: '📊',
    TROPHY: '🏆'
  }
};
