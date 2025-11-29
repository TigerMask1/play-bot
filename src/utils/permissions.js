const { PermissionFlagsBits } = require('discord.js');
const { PERMISSIONS } = require('../config/constants');

const BOT_OWNERS = process.env.BOT_OWNERS ? process.env.BOT_OWNERS.split(',') : [];

function getPermissionLevel(member, serverConfig = null) {
  if (!member) return PERMISSIONS.MEMBER;
  
  const userId = member.user?.id || member.id;
  
  if (BOT_OWNERS.includes(userId)) {
    return PERMISSIONS.OWNER;
  }
  
  if (member.guild && member.guild.ownerId === userId) {
    return PERMISSIONS.ADMIN;
  }
  
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) {
    return PERMISSIONS.ADMIN;
  }
  
  if (serverConfig) {
    if (serverConfig.roles.admin.some(roleId => member.roles?.cache?.has(roleId))) {
      return PERMISSIONS.ADMIN;
    }
    
    if (serverConfig.roles.moderator.some(roleId => member.roles?.cache?.has(roleId))) {
      return PERMISSIONS.MODERATOR;
    }
    
    if (serverConfig.roles.vip.some(roleId => member.roles?.cache?.has(roleId))) {
      return PERMISSIONS.VIP;
    }
  }
  
  if (member.permissions?.has(PermissionFlagsBits.ManageGuild)) {
    return PERMISSIONS.MODERATOR;
  }
  
  return PERMISSIONS.MEMBER;
}

function hasPermission(member, requiredLevel, serverConfig = null) {
  const userLevel = getPermissionLevel(member, serverConfig);
  return userLevel >= requiredLevel;
}

function isOwner(userId) {
  return BOT_OWNERS.includes(userId);
}

function isAdmin(member, serverConfig = null) {
  return hasPermission(member, PERMISSIONS.ADMIN, serverConfig);
}

function isModerator(member, serverConfig = null) {
  return hasPermission(member, PERMISSIONS.MODERATOR, serverConfig);
}

function isVIP(member, serverConfig = null) {
  return hasPermission(member, PERMISSIONS.VIP, serverConfig);
}

function canManageServer(member, serverConfig = null) {
  return hasPermission(member, PERMISSIONS.ADMIN, serverConfig);
}

function canModerate(member, serverConfig = null) {
  return hasPermission(member, PERMISSIONS.MODERATOR, serverConfig);
}

function formatPermissionLevel(level) {
  switch (level) {
    case PERMISSIONS.OWNER: return 'Bot Owner';
    case PERMISSIONS.ADMIN: return 'Admin';
    case PERMISSIONS.MODERATOR: return 'Moderator';
    case PERMISSIONS.VIP: return 'VIP';
    default: return 'Member';
  }
}

module.exports = {
  getPermissionLevel,
  hasPermission,
  isOwner,
  isAdmin,
  isModerator,
  isVIP,
  canManageServer,
  canModerate,
  formatPermissionLevel,
  BOT_OWNERS
};
