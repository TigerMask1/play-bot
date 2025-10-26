const { MongoClient } = require('mongodb');

let client = null;
let db = null;
let connected = false;

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
    db = client.db('discord_bot');
    connected = true;
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    connected = false;
    console.log('🔌 Disconnected from MongoDB');
  }
}

async function getCollection(collectionName) {
  if (!connected) {
    await connect();
  }
  return db.collection(collectionName);
}

async function loadData() {
  try {
    const usersCollection = await getCollection('users');
    const configCollection = await getCollection('config');
    
    const users = await usersCollection.find({}).toArray();
    const config = await configCollection.findOne({ _id: 'bot_config' });
    
    const userData = {};
    users.forEach(user => {
      const userId = user.userId;
      delete user._id;
      delete user.userId;
      userData[userId] = user;
    });
    
    return {
      users: userData,
      dropChannelId: config?.dropChannelId || null,
      battleChannelId: config?.battleChannelId || null
    };
  } catch (error) {
    console.error('Error loading data from MongoDB:', error);
    return {
      users: {},
      dropChannelId: null,
      battleChannelId: null
    };
  }
}

async function saveData(data) {
  try {
    const usersCollection = await getCollection('users');
    const configCollection = await getCollection('config');
    
    const bulkOps = [];
    for (const [userId, userData] of Object.entries(data.users)) {
      bulkOps.push({
        updateOne: {
          filter: { userId },
          update: { $set: { userId, ...userData } },
          upsert: true
        }
      });
    }
    
    if (bulkOps.length > 0) {
      await usersCollection.bulkWrite(bulkOps);
    }
    
    await configCollection.updateOne(
      { _id: 'bot_config' },
      { 
        $set: { 
          dropChannelId: data.dropChannelId,
          battleChannelId: data.battleChannelId
        } 
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error saving data to MongoDB:', error);
    return false;
  }
}

async function clearAllData() {
  try {
    const usersCollection = await getCollection('users');
    const configCollection = await getCollection('config');
    
    await usersCollection.deleteMany({});
    await configCollection.deleteMany({});
    
    console.log('🗑️ All MongoDB data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing MongoDB data:', error);
    return false;
  }
}

module.exports = {
  connect,
  disconnect,
  loadData,
  saveData,
  clearAllData,
  getCollection
};
