const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { isSuperAdmin: isSuperAdminConfig } = require('../core/config');
const logger = require('../core/logger');

const MODULE = 'PermissionService';

const PERMISSION_LEVELS = {
  USER: 0,
  PLAY_ADMIN: 1,
  SERVER_OWNER: 2,
  SUPER_ADMIN: 3
};

async function getServerSettings(serverId) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    return await collection.findOne({ serverId });
  } catch (error) {
    logger.error(MODULE, 'Failed to get server settings', { serverId, error: error.message });
    return null;
  }
}

function isSuperAdmin(userId) {
  return isSuperAdminConfig(userId);
}

async function isServerOwner(member) {
  if (!member || !member.guild) return false;
  try {
    const guild = member.guild;
    return guild.ownerId === member.user.id;
  } catch (error) {
    return false;
  }
}

async function isPlayAdmin(member, serverId) {
  if (!member) return false;
  
  if (isSuperAdmin(member.user?.id || member.id)) {
    return true;
  }

  if (await isServerOwner(member)) {
    return true;
  }

  const hasRole = member.roles?.cache?.some(role => 
    role.name.toLowerCase() === 'playadmin' || 
    role.name.toLowerCase() === 'play admin'
  );
  if (hasRole) return true;

  const settings = await getServerSettings(serverId);
  if (settings?.admins?.includes(member.user?.id || member.id)) {
    return true;
  }

  return false;
}

async function addServerAdmin(serverId, userId, addedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    await collection.updateOne(
      { serverId },
      { 
        $addToSet: { admins: userId },
        $set: { updatedAt: new Date() }
      }
    );
    
    logger.info(MODULE, 'Added server admin', { serverId, userId, addedBy });
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to add server admin', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function removeServerAdmin(serverId, userId, removedBy) {
  try {
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    await collection.updateOne(
      { serverId },
      { 
        $pull: { admins: userId },
        $set: { updatedAt: new Date() }
      }
    );
    
    logger.info(MODULE, 'Removed server admin', { serverId, userId, removedBy });
    return { success: true };
  } catch (error) {
    logger.error(MODULE, 'Failed to remove server admin', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getPermissionLevel(member, serverId) {
  if (!member) return PERMISSION_LEVELS.USER;
  
  const userId = member.user?.id || member.id;
  
  if (isSuperAdmin(userId)) {
    return PERMISSION_LEVELS.SUPER_ADMIN;
  }
  
  if (await isServerOwner(member)) {
    return PERMISSION_LEVELS.SERVER_OWNER;
  }
  
  if (await isPlayAdmin(member, serverId)) {
    return PERMISSION_LEVELS.PLAY_ADMIN;
  }
  
  return PERMISSION_LEVELS.USER;
}

function hasPermission(userLevel, requiredLevel) {
  return userLevel >= requiredLevel;
}

async function canManageContent(member, serverId, scope = 'server') {
  const level = await getPermissionLevel(member, serverId);
  
  if (scope === 'global') {
    return level >= PERMISSION_LEVELS.SUPER_ADMIN;
  }
  
  return level >= PERMISSION_LEVELS.PLAY_ADMIN;
}

async function canManageEconomy(member, serverId, scope = 'server') {
  const level = await getPermissionLevel(member, serverId);
  
  if (scope === 'global') {
    return level >= PERMISSION_LEVELS.SUPER_ADMIN;
  }
  
  return level >= PERMISSION_LEVELS.PLAY_ADMIN;
}

async function canManageServer(member, serverId) {
  const level = await getPermissionLevel(member, serverId);
  return level >= PERMISSION_LEVELS.PLAY_ADMIN;
}

module.exports = {
  PERMISSION_LEVELS,
  isSuperAdmin,
  isServerOwner,
  isPlayAdmin,
  addServerAdmin,
  removeServerAdmin,
  getPermissionLevel,
  hasPermission,
  canManageContent,
  canManageEconomy,
  canManageServer,
  getServerSettings
};
