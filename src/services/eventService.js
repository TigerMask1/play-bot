const { getCollection, COLLECTIONS } = require('../infrastructure/database');
const { createEventSchema } = require('../models/schemas');
const { getServerSettings } = require('./serverSettingsService');
const logger = require('../core/logger');

const EVENT_TYPES = {
  DROP_BOOST: 'drop_boost',
  XP_BOOST: 'xp_boost',
  CURRENCY_BOOST: 'currency_boost',
  SPECIAL_DROP: 'special_drop',
  BATTLE_TOURNAMENT: 'battle_tournament',
  COLLECTION: 'collection'
};

async function getActiveEvents(serverId) {
  const settings = await getServerSettings(serverId);
  if (!settings?.eventSettings?.enabled) {
    return [];
  }
  
  const now = new Date();
  return (settings.eventSettings.activeEvents || []).filter(
    e => new Date(e.startTime) <= now && new Date(e.endTime) >= now && e.status === 'active'
  );
}

async function createEvent(serverId, eventType, name, config, createdBy) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const event = {
    id: `event_${serverId}_${Date.now()}`,
    ...createEventSchema(serverId, eventType, name, { ...config, createdBy }),
    status: 'scheduled'
  };
  
  await collection.updateOne(
    { serverId },
    { $push: { 'eventSettings.activeEvents': event } }
  );
  
  return { success: true, event };
}

async function startEvent(serverId, eventId) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  await collection.updateOne(
    { serverId, 'eventSettings.activeEvents.id': eventId },
    { 
      $set: { 
        'eventSettings.activeEvents.$.status': 'active',
        'eventSettings.activeEvents.$.startTime': new Date()
      }
    }
  );
  
  return { success: true };
}

async function endEvent(serverId, eventId) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  const settings = await getServerSettings(serverId);
  
  const event = settings.eventSettings?.activeEvents?.find(e => e.id === eventId);
  if (!event) {
    return { success: false, error: 'Event not found' };
  }
  
  await collection.updateOne(
    { serverId, 'eventSettings.activeEvents.id': eventId },
    { 
      $set: { 
        'eventSettings.activeEvents.$.status': 'completed',
        'eventSettings.activeEvents.$.endTime': new Date()
      }
    }
  );
  
  return { success: true, event };
}

async function joinEvent(serverId, eventId, userId) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  await collection.updateOne(
    { serverId, 'eventSettings.activeEvents.id': eventId },
    { 
      $addToSet: { 
        'eventSettings.activeEvents.$.participants': {
          userId,
          joinedAt: new Date(),
          score: 0
        }
      }
    }
  );
  
  return { success: true };
}

async function updateEventScore(serverId, eventId, userId, scoreChange) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  await collection.updateOne(
    { 
      serverId, 
      'eventSettings.activeEvents.id': eventId,
      'eventSettings.activeEvents.participants.userId': userId
    },
    { $inc: { 'eventSettings.activeEvents.$[event].participants.$[user].score': scoreChange } },
    { 
      arrayFilters: [
        { 'event.id': eventId },
        { 'user.userId': userId }
      ]
    }
  );
  
  return { success: true };
}

async function getEventLeaderboard(serverId, eventId) {
  const settings = await getServerSettings(serverId);
  const event = settings.eventSettings?.activeEvents?.find(e => e.id === eventId);
  
  if (!event) {
    return { success: false, error: 'Event not found' };
  }
  
  const leaderboard = (event.participants || [])
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
  
  return { success: true, leaderboard, event };
}

function getEventMultiplier(events, type) {
  let multiplier = 1;
  
  for (const event of events) {
    if (event.eventType === type || event.config?.affectedSystems?.includes(type)) {
      multiplier *= (event.config?.boostMultiplier || 1);
    }
  }
  
  return multiplier;
}

async function applyEventBoosts(serverId, baseValue, boostType) {
  const activeEvents = await getActiveEvents(serverId);
  const multiplier = getEventMultiplier(activeEvents, boostType);
  return Math.floor(baseValue * multiplier);
}

async function scheduleEvent(serverId, eventType, name, config, startTime, endTime, createdBy) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  const event = {
    id: `event_${serverId}_${Date.now()}`,
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
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    createdBy,
    createdAt: new Date()
  };
  
  await collection.updateOne(
    { serverId },
    { $push: { 'eventSettings.scheduledEvents': event } }
  );
  
  return { success: true, event };
}

async function cancelEvent(serverId, eventId) {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  
  await collection.updateOne(
    { serverId },
    { 
      $pull: { 
        'eventSettings.activeEvents': { id: eventId },
        'eventSettings.scheduledEvents': { id: eventId }
      }
    }
  );
  
  return { success: true };
}

async function getScheduledEvents(serverId) {
  const settings = await getServerSettings(serverId);
  return settings?.eventSettings?.scheduledEvents || [];
}

async function checkAndStartScheduledEvents() {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  const now = new Date();
  
  const servers = await collection.find({
    'eventSettings.scheduledEvents': {
      $elemMatch: {
        startTime: { $lte: now },
        status: 'scheduled'
      }
    }
  }).toArray();
  
  for (const server of servers) {
    for (const event of server.eventSettings.scheduledEvents) {
      if (new Date(event.startTime) <= now && event.status === 'scheduled') {
        await collection.updateOne(
          { serverId: server.serverId },
          { 
            $pull: { 'eventSettings.scheduledEvents': { id: event.id } },
            $push: { 'eventSettings.activeEvents': { ...event, status: 'active' } }
          }
        );
        logger.info(`Started scheduled event ${event.name} on server ${server.serverId}`);
      }
    }
  }
}

async function checkAndEndExpiredEvents() {
  const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
  const now = new Date();
  
  await collection.updateMany(
    { 'eventSettings.activeEvents.endTime': { $lte: now } },
    { $set: { 'eventSettings.activeEvents.$[event].status': 'completed' } },
    { arrayFilters: [{ 'event.endTime': { $lte: now }, 'event.status': 'active' }] }
  );
}

module.exports = {
  EVENT_TYPES,
  getActiveEvents,
  createEvent,
  startEvent,
  endEvent,
  joinEvent,
  updateEventScore,
  getEventLeaderboard,
  getEventMultiplier,
  applyEventBoosts,
  scheduleEvent,
  cancelEvent,
  getScheduledEvents,
  checkAndStartScheduledEvents,
  checkAndEndExpiredEvents
};
