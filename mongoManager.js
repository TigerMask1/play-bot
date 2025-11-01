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
      battleChannelId: config?.battleChannelId || null,
      eventChannelId: config?.eventChannelId || null
    };
  } catch (error) {
    console.error('Error loading data from MongoDB:', error);
    return {
      users: {},
      dropChannelId: null,
      battleChannelId: null,
      eventChannelId: null
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
          battleChannelId: data.battleChannelId,
          eventChannelId: data.eventChannelId
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

async function getCurrentEvent() {
  try {
    const eventsCollection = await getCollection('events');
    const event = await eventsCollection.findOne(
      { status: 'active' },
      { sort: { startAt: -1 } }
    );
    return event;
  } catch (error) {
    console.error('Error getting current event:', error);
    return null;
  }
}

async function createEvent(eventData) {
  try {
    const eventsCollection = await getCollection('events');
    await eventsCollection.createIndex({ status: 1, startAt: -1 });
    const result = await eventsCollection.insertOne(eventData);
    return result.insertedId;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

async function updateEvent(eventId, updateData) {
  try {
    const eventsCollection = await getCollection('events');
    await eventsCollection.updateOne(
      { _id: eventId },
      { $set: updateData }
    );
    return true;
  } catch (error) {
    console.error('Error updating event:', error);
    return false;
  }
}

async function recordEventProgress(eventId, userId, username, delta) {
  try {
    const participantsCollection = await getCollection('event_participants');
    await participantsCollection.createIndex({ eventId: 1, userId: 1 }, { unique: true });
    await participantsCollection.createIndex({ eventId: 1, score: -1 });
    
    await participantsCollection.updateOne(
      { eventId, userId },
      { 
        $inc: { score: delta },
        $set: { username, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error recording event progress:', error);
    return false;
  }
}

async function getEventParticipants(eventId) {
  try {
    const participantsCollection = await getCollection('event_participants');
    const participants = await participantsCollection
      .find({ eventId })
      .sort({ score: -1 })
      .toArray();
    return participants;
  } catch (error) {
    console.error('Error getting event participants:', error);
    return [];
  }
}

async function getEventParticipant(eventId, userId) {
  try {
    const participantsCollection = await getCollection('event_participants');
    const participant = await participantsCollection.findOne({ eventId, userId });
    return participant;
  } catch (error) {
    console.error('Error getting event participant:', error);
    return null;
  }
}

module.exports = {
  connect,
  disconnect,
  loadData,
  saveData,
  clearAllData,
  getCollection,
  getCurrentEvent,
  createEvent,
  updateEvent,
  recordEventProgress,
  getEventParticipants,
  getEventParticipant
};
