const { MongoClient } = require('mongodb');
const logger = require('../core/logger');

const MODULE = 'Database';

let client = null;
let db = null;
let connected = false;

const COLLECTIONS = {
  GLOBAL_CONTENT: 'global_content',
  SERVER_CONTENT: 'server_content',
  SERVER_SETTINGS: 'server_settings',
  USER_PROFILES: 'user_profiles',
  USER_SERVER_PROFILES: 'user_server_profiles',
  CURRENCY_EXCHANGE_RATES: 'currency_exchange_rates',
  ECONOMY_TRANSACTIONS: 'economy_transactions',
  AUDIT_LOGS: 'audit_logs',
  EVENTS: 'events',
  EVENT_PARTICIPANTS: 'event_participants'
};

async function connect() {
  if (connected && client) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('playbot');
    connected = true;
    logger.info(MODULE, 'Connected to MongoDB successfully');
    
    await createIndexes();
    
    return db;
  } catch (error) {
    logger.error(MODULE, 'Failed to connect to MongoDB', { error: error.message });
    throw error;
  }
}

async function createIndexes() {
  try {
    const globalContent = db.collection(COLLECTIONS.GLOBAL_CONTENT);
    await globalContent.createIndex({ type: 1, slug: 1 }, { unique: true });
    await globalContent.createIndex({ type: 1, isActive: 1 });

    const serverContent = db.collection(COLLECTIONS.SERVER_CONTENT);
    await serverContent.createIndex({ serverId: 1, type: 1, slug: 1 }, { unique: true });
    await serverContent.createIndex({ serverId: 1, type: 1, isActive: 1 });

    const serverSettings = db.collection(COLLECTIONS.SERVER_SETTINGS);
    await serverSettings.createIndex({ serverId: 1 }, { unique: true });

    const userProfiles = db.collection(COLLECTIONS.USER_PROFILES);
    await userProfiles.createIndex({ userId: 1 }, { unique: true });

    const userServerProfiles = db.collection(COLLECTIONS.USER_SERVER_PROFILES);
    await userServerProfiles.createIndex({ userId: 1, serverId: 1 }, { unique: true });
    await userServerProfiles.createIndex({ serverId: 1 });

    const exchangeRates = db.collection(COLLECTIONS.CURRENCY_EXCHANGE_RATES);
    await exchangeRates.createIndex({ serverId: 1 }, { unique: true });

    const transactions = db.collection(COLLECTIONS.ECONOMY_TRANSACTIONS);
    await transactions.createIndex({ userId: 1, createdAt: -1 });
    await transactions.createIndex({ serverId: 1, createdAt: -1 });
    await transactions.createIndex({ type: 1, createdAt: -1 });

    const auditLogs = db.collection(COLLECTIONS.AUDIT_LOGS);
    await auditLogs.createIndex({ actorId: 1, createdAt: -1 });
    await auditLogs.createIndex({ scope: 1, action: 1, createdAt: -1 });
    await auditLogs.createIndex({ serverId: 1, createdAt: -1 });

    logger.info(MODULE, 'Database indexes created successfully');
  } catch (error) {
    logger.error(MODULE, 'Failed to create indexes', { error: error.message });
  }
}

async function getCollection(collectionName) {
  if (!connected) {
    await connect();
  }
  return db.collection(collectionName);
}

async function disconnect() {
  if (client) {
    await client.close();
    connected = false;
    client = null;
    db = null;
    logger.info(MODULE, 'Disconnected from MongoDB');
  }
}

function isConnected() {
  return connected;
}

module.exports = {
  connect,
  disconnect,
  getCollection,
  isConnected,
  COLLECTIONS
};
