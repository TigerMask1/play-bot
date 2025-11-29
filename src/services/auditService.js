const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { AUDIT_ACTIONS, AUDIT_SCOPES, createAuditLogSchema } = require('../models/schemas');
const logger = require('../core/logger');

const MODULE = 'AuditService';

async function logAction(actorId, scope, serverId, action, payload) {
  try {
    const collection = await getCollection(COLLECTIONS.AUDIT_LOGS);
    const auditLog = createAuditLogSchema(actorId, scope, serverId, action, payload);
    await collection.insertOne(auditLog);
    
    logger.debug(MODULE, 'Audit log created', { actorId, scope, action });
  } catch (error) {
    logger.error(MODULE, 'Failed to create audit log', { error: error.message });
  }
}

async function logGlobalAction(actorId, action, payload) {
  await logAction(actorId, AUDIT_SCOPES.GLOBAL, null, action, payload);
}

async function logServerAction(actorId, serverId, action, payload) {
  await logAction(actorId, AUDIT_SCOPES.SERVER, serverId, action, payload);
}

async function logContentCreate(actorId, scope, serverId, contentType, slug, data) {
  await logAction(actorId, scope, serverId, AUDIT_ACTIONS.CONTENT_CREATE, {
    contentType,
    slug,
    data
  });
}

async function logContentUpdate(actorId, scope, serverId, contentType, slug, oldData, newData) {
  await logAction(actorId, scope, serverId, AUDIT_ACTIONS.CONTENT_UPDATE, {
    contentType,
    slug,
    oldData,
    newData
  });
}

async function logContentDelete(actorId, scope, serverId, contentType, slug) {
  await logAction(actorId, scope, serverId, AUDIT_ACTIONS.CONTENT_DELETE, {
    contentType,
    slug
  });
}

async function logCurrencyGrant(actorId, scope, serverId, targetUserId, currency, amount, reason) {
  await logAction(actorId, scope, serverId, AUDIT_ACTIONS.CURRENCY_GRANT, {
    targetUserId,
    currency,
    amount,
    reason
  });
}

async function logCurrencyRemove(actorId, scope, serverId, targetUserId, currency, amount, reason) {
  await logAction(actorId, scope, serverId, AUDIT_ACTIONS.CURRENCY_REMOVE, {
    targetUserId,
    currency,
    amount,
    reason
  });
}

async function logExchangeRateUpdate(actorId, serverId, oldRates, newRates) {
  await logAction(actorId, AUDIT_SCOPES.SERVER, serverId, AUDIT_ACTIONS.EXCHANGE_RATE_UPDATE, {
    oldRates,
    newRates
  });
}

async function logServerSettingUpdate(actorId, serverId, setting, oldValue, newValue) {
  await logAction(actorId, AUDIT_SCOPES.SERVER, serverId, AUDIT_ACTIONS.SERVER_SETTING_UPDATE, {
    setting,
    oldValue,
    newValue
  });
}

async function logAdminAdd(actorId, serverId, targetUserId) {
  await logAction(actorId, AUDIT_SCOPES.SERVER, serverId, AUDIT_ACTIONS.ADMIN_ADD, {
    targetUserId
  });
}

async function logAdminRemove(actorId, serverId, targetUserId) {
  await logAction(actorId, AUDIT_SCOPES.SERVER, serverId, AUDIT_ACTIONS.ADMIN_REMOVE, {
    targetUserId
  });
}

async function logBanUser(actorId, scope, serverId, targetUserId, reason) {
  await logAction(actorId, scope, serverId, AUDIT_ACTIONS.BAN_USER, {
    targetUserId,
    reason
  });
}

async function logUnbanUser(actorId, scope, serverId, targetUserId) {
  await logAction(actorId, scope, serverId, AUDIT_ACTIONS.UNBAN_USER, {
    targetUserId
  });
}

async function getAuditLogs(options = {}) {
  try {
    const collection = await getCollection(COLLECTIONS.AUDIT_LOGS);
    
    const query = {};
    if (options.actorId) query.actorId = options.actorId;
    if (options.serverId) query.serverId = options.serverId;
    if (options.scope) query.scope = options.scope;
    if (options.action) query.action = options.action;
    if (options.fromDate) query.createdAt = { $gte: new Date(options.fromDate) };
    if (options.toDate) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(options.toDate);
    }
    
    const limit = options.limit || 100;
    
    return await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch (error) {
    logger.error(MODULE, 'Failed to get audit logs', { error: error.message });
    return [];
  }
}

async function getServerAuditLogs(serverId, limit = 50) {
  return getAuditLogs({ serverId, limit });
}

async function getGlobalAuditLogs(limit = 50) {
  return getAuditLogs({ scope: AUDIT_SCOPES.GLOBAL, limit });
}

async function getUserAuditLogs(actorId, limit = 50) {
  return getAuditLogs({ actorId, limit });
}

module.exports = {
  AUDIT_ACTIONS,
  AUDIT_SCOPES,
  logAction,
  logGlobalAction,
  logServerAction,
  logContentCreate,
  logContentUpdate,
  logContentDelete,
  logCurrencyGrant,
  logCurrencyRemove,
  logExchangeRateUpdate,
  logServerSettingUpdate,
  logAdminAdd,
  logAdminRemove,
  logBanUser,
  logUnbanUser,
  getAuditLogs,
  getServerAuditLogs,
  getGlobalAuditLogs,
  getUserAuditLogs
};
