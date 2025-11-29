const { ECONOMY, DROPS, MODULES, COLORS } = require('./constants');

module.exports = {
  getDefaultServerConfig(serverId, serverName) {
    return {
      serverId,
      serverName,
      prefix: '!',
      modules: {
        [MODULES.COLLECTION]: true,
        [MODULES.BATTLES]: true,
        [MODULES.CLANS]: true,
        [MODULES.TRADING]: true,
        [MODULES.DROPS]: true,
        [MODULES.EVENTS]: true,
        [MODULES.QUESTS]: true,
        [MODULES.SHOP]: true,
        [MODULES.LEADERBOARDS]: true
      },
      channels: {
        drops: null,
        events: null,
        announcements: null,
        logs: null
      },
      roles: {
        admin: [],
        moderator: [],
        vip: []
      },
      economy: {
        currencyName: 'Coins',
        currencyEmoji: '🪙',
        premiumName: 'Gems',
        premiumEmoji: '💎',
        startingBalance: ECONOMY.STARTING_BALANCE,
        startingGems: ECONOMY.STARTING_GEMS
      },
      drops: {
        enabled: true,
        interval: DROPS.DEFAULT_INTERVAL,
        channelId: null,
        lastDrop: null,
        uncaughtCount: 0
      },
      customization: {
        embedColor: COLORS.PRIMARY,
        welcomeMessage: 'Welcome to {server}! Start your collection journey with `!start`',
        botNickname: null
      },
      stats: {
        totalDrops: 0,
        totalCatches: 0,
        totalBattles: 0,
        totalTrades: 0,
        membersStarted: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  getDefaultServerUser(serverId, discordId, username) {
    return {
      serverId,
      odiscrdId: discordId,
      username,
      balance: ECONOMY.STARTING_BALANCE,
      gems: ECONOMY.STARTING_GEMS,
      level: 1,
      xp: 0,
      characters: [],
      selectedCharacter: null,
      inventory: {
        crates: {
          bronze: 0,
          silver: 0,
          gold: 0,
          legendary: 0
        },
        items: {},
        boosters: {}
      },
      stats: {
        battlesWon: 0,
        battlesLost: 0,
        charactersCollected: 0,
        tradesCompleted: 0,
        dropsClaimedght: 0,
        totalCoinsEarned: 0,
        totalGemsEarned: 0,
        dailyStreak: 0,
        maxDailyStreak: 0
      },
      clanId: null,
      achievements: [],
      quests: {
        daily: [],
        weekly: [],
        lastDailyReset: null,
        lastWeeklyReset: null
      },
      settings: {
        dmNotifications: true,
        battleInvites: true
      },
      lastDaily: null,
      lastActivity: new Date(),
      started: false,
      createdAt: new Date()
    };
  },

  getDefaultGlobalUser(discordId, username) {
    return {
      odiscrdId: discordId,
      username,
      playCoins: 0,
      playGems: 0,
      globalLevel: 1,
      globalXP: 0,
      serversJoined: [],
      achievements: [],
      globalStats: {
        totalServers: 0,
        totalCharacters: 0,
        totalBattles: 0,
        totalPlayCoinsEarned: 0,
        totalPlayGemsEarned: 0
      },
      marketplace: {
        listingsActive: 0,
        totalSales: 0,
        totalPurchases: 0
      },
      premium: {
        isActive: false,
        expiresAt: null,
        tier: null
      },
      createdAt: new Date(),
      lastActive: new Date()
    };
  },

  getDefaultCharacter(serverId, data) {
    return {
      serverId,
      characterId: data.characterId || `char_${Date.now()}`,
      name: data.name,
      description: data.description || '',
      rarity: data.rarity || 'COMMON',
      imageUrl: data.imageUrl || null,
      baseStats: {
        hp: data.hp || 100,
        attack: data.attack || 10,
        defense: data.defense || 10,
        speed: data.speed || 10
      },
      abilities: data.abilities || [],
      dropWeight: data.dropWeight || 1,
      isCustom: data.isCustom || false,
      createdBy: data.createdBy || null,
      createdAt: new Date()
    };
  },

  getDefaultClan(serverId, data) {
    return {
      serverId,
      clanId: `clan_${Date.now()}`,
      name: data.name,
      tag: data.tag,
      description: data.description || '',
      leaderId: data.leaderId,
      officers: [],
      members: [data.leaderId],
      level: 1,
      xp: 0,
      treasury: 0,
      stats: {
        battlesWon: 0,
        battlesLost: 0,
        warWins: 0,
        warLosses: 0,
        totalDonations: 0
      },
      settings: {
        joinType: 'open',
        minLevel: 1,
        description: ''
      },
      war: {
        inWar: false,
        opponentId: null,
        score: 0,
        opponentScore: 0
      },
      createdAt: new Date()
    };
  }
};
