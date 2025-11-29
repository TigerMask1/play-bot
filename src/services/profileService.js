const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createUserProfileSchema, createUserServerProfileSchema } = require('../models/schemas');
const logger = require('../core/logger');

const MODULE = 'ProfileService';

async function getUserProfile(userId) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_PROFILES);
    return await collection.findOne({ userId });
  } catch (error) {
    logger.error(MODULE, 'Failed to get user profile', { userId, error: error.message });
    return null;
  }
}

async function getServerProfile(userId, serverId) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    return await collection.findOne({ userId, serverId });
  } catch (error) {
    logger.error(MODULE, 'Failed to get server profile', { userId, serverId, error: error.message });
    return null;
  }
}

async function ensureUserProfile(userId, username) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_PROFILES);
    
    let profile = await collection.findOne({ userId });
    
    if (!profile) {
      profile = createUserProfileSchema(userId, username);
      await collection.insertOne(profile);
      logger.info(MODULE, 'Created new user profile', { userId });
    } else if (profile.username !== username) {
      await collection.updateOne(
        { userId },
        { $set: { username, displayName: username, updatedAt: new Date() } }
      );
      profile.username = username;
      profile.displayName = username;
    }
    
    return profile;
  } catch (error) {
    logger.error(MODULE, 'Failed to ensure user profile', { error: error.message });
    return null;
  }
}

async function ensureServerProfile(userId, serverId, username) {
  try {
    await ensureUserProfile(userId, username);
    
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    let profile = await collection.findOne({ userId, serverId });
    
    if (!profile) {
      profile = createUserServerProfileSchema(userId, serverId, username);
      await collection.insertOne(profile);
      logger.info(MODULE, 'Created new server profile', { userId, serverId });
    } else if (profile.username !== username) {
      await collection.updateOne(
        { userId, serverId },
        { $set: { username, updatedAt: new Date() } }
      );
      profile.username = username;
    }
    
    return profile;
  } catch (error) {
    logger.error(MODULE, 'Failed to ensure server profile', { error: error.message });
    return null;
  }
}

async function updateServerProfile(userId, serverId, updates) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    const result = await collection.findOneAndUpdate(
      { userId, serverId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date(),
          lastActivity: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    return result;
  } catch (error) {
    logger.error(MODULE, 'Failed to update server profile', { error: error.message });
    return null;
  }
}

async function updateUserProfile(userId, updates) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_PROFILES);
    
    const result = await collection.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date(),
          lastActiveAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    return result;
  } catch (error) {
    logger.error(MODULE, 'Failed to update user profile', { error: error.message });
    return null;
  }
}

async function addCharacterToInventory(userId, serverId, character) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    await collection.updateOne(
      { userId, serverId },
      { 
        $push: { 'inventory.characters': character },
        $set: { updatedAt: new Date(), lastActivity: new Date() }
      }
    );
    
    logger.info(MODULE, 'Added character to inventory', { userId, serverId, characterName: character.name });
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to add character', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function removeCharacterFromInventory(userId, serverId, characterIndex) {
  try {
    const profile = await getServerProfile(userId, serverId);
    if (!profile || !profile.inventory?.characters?.[characterIndex]) {
      return { success: false, error: 'Character not found' };
    }
    
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    const characters = [...profile.inventory.characters];
    characters.splice(characterIndex, 1);
    
    await collection.updateOne(
      { userId, serverId },
      { 
        $set: { 
          'inventory.characters': characters,
          updatedAt: new Date(),
          lastActivity: new Date()
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to remove character', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function setSelectedCharacter(userId, serverId, characterIndex) {
  try {
    const profile = await getServerProfile(userId, serverId);
    if (!profile || !profile.inventory?.characters?.[characterIndex]) {
      return { success: false, error: 'Character not found' };
    }
    
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    await collection.updateOne(
      { userId, serverId },
      { 
        $set: { 
          selectedCharacter: characterIndex,
          updatedAt: new Date()
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to set selected character', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function updateInventoryItem(userId, serverId, itemType, itemName, amount) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    await collection.updateOne(
      { userId, serverId },
      { 
        $inc: { [`inventory.${itemType}.${itemName}`]: amount },
        $set: { updatedAt: new Date(), lastActivity: new Date() }
      }
    );
    
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to update inventory item', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function updateStats(userId, serverId, statsUpdates) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    const setOps = {};
    const incOps = {};
    
    for (const [key, value] of Object.entries(statsUpdates)) {
      if (typeof value === 'object' && value.$inc !== undefined) {
        incOps[`stats.${key}`] = value.$inc;
      } else {
        setOps[`stats.${key}`] = value;
      }
    }
    
    const updateOps = { $set: { ...setOps, updatedAt: new Date() } };
    if (Object.keys(incOps).length > 0) {
      updateOps.$inc = incOps;
    }
    
    await collection.updateOne({ userId, serverId }, updateOps);
    
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to update stats', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function addXP(userId, serverId, xpAmount) {
  try {
    const profile = await getServerProfile(userId, serverId);
    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }
    
    const currentXP = profile.progression?.xp || 0;
    const currentLevel = profile.progression?.level || 1;
    let newXP = currentXP + xpAmount;
    let newLevel = currentLevel;
    
    const xpForNextLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
    
    while (newXP >= xpForNextLevel(newLevel)) {
      newXP -= xpForNextLevel(newLevel);
      newLevel++;
    }
    
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    await collection.updateOne(
      { userId, serverId },
      { 
        $set: { 
          'progression.xp': newXP,
          'progression.level': newLevel,
          updatedAt: new Date()
        }
      }
    );
    
    const leveledUp = newLevel > currentLevel;
    
    return { 
      success: true, 
      newXP, 
      newLevel, 
      leveledUp,
      levelsGained: newLevel - currentLevel
    };
  } catch (error) {
    logger.error(MODULE, 'Failed to add XP', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getLeaderboard(serverId, stat, limit = 10) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    const field = `stats.${stat}`;
    
    return await collection
      .find({ serverId, [field]: { $gt: 0 } })
      .sort({ [field]: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get leaderboard', { error: error.message });
    return [];
  }
}

async function getServerUsers(serverId, limit = 100) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    return await collection
      .find({ serverId })
      .sort({ lastActivity: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get server users', { error: error.message });
    return [];
  }
}

async function recordActivity(userId, serverId) {
  try {
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    await collection.updateOne(
      { userId, serverId },
      { 
        $set: { lastActivity: new Date() },
        $inc: { 'stats.messageCount': 1 }
      }
    );
  } catch (error) {
    logger.error(MODULE, 'Failed to record activity', { error: error.message });
  }
}

module.exports = {
  getUserProfile,
  getServerProfile,
  ensureUserProfile,
  ensureServerProfile,
  updateServerProfile,
  updateUserProfile,
  addCharacterToInventory,
  removeCharacterFromInventory,
  setSelectedCharacter,
  updateInventoryItem,
  updateStats,
  addXP,
  getLeaderboard,
  getServerUsers,
  recordActivity
};
