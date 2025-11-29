const BOT_CONFIG = {
  name: 'PlayBot',
  version: '1.0.0',
  defaultPrefix: '!',
  
  officialCurrency: {
    primary: {
      name: 'PlayCoins',
      symbol: '🪙',
      code: 'PC'
    },
    premium: {
      name: 'PlayGems',
      symbol: '💎',
      code: 'PG'
    }
  },
  
  defaults: {
    startingCoins: 100,
    startingGems: 0,
    startingTrophies: 200,
    exchangeRateCoinsToGems: 100,
    maxDailyExchange: 10000
  },
  
  permissions: {
    superAdminIds: [],
    mainServerId: null
  }
};

function getConfig() {
  return BOT_CONFIG;
}

function setSuperAdmins(adminIds) {
  BOT_CONFIG.permissions.superAdminIds = adminIds;
}

function setMainServer(serverId) {
  BOT_CONFIG.permissions.mainServerId = serverId;
}

function isSuperAdmin(userId) {
  return BOT_CONFIG.permissions.superAdminIds.includes(userId);
}

function isMainServer(serverId) {
  return BOT_CONFIG.permissions.mainServerId === serverId;
}

module.exports = {
  BOT_CONFIG,
  getConfig,
  setSuperAdmins,
  setMainServer,
  isSuperAdmin,
  isMainServer
};
