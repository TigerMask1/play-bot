const mongoManager = require('./mongoManager.js');

async function setupIndexes() {
  console.log('🔧 Setting up MongoDB indexes for optimal performance...\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.error('Please set MONGODB_URI before running this script');
    process.exit(1);
  }

  try {
    await mongoManager.connect();
    console.log('✅ Connected to MongoDB\n');

    const usersCollection = await mongoManager.getCollection('users');
    console.log('📊 Creating indexes for users collection...');
    await usersCollection.createIndex({ userId: 1 }, { unique: true });
    await usersCollection.createIndex({ 'trophies': -1 });
    await usersCollection.createIndex({ 'coins': -1 });
    await usersCollection.createIndex({ 'gems': -1 });
    console.log('✅ Users collection indexes created');

    const eventsCollection = await mongoManager.getCollection('events');
    console.log('📊 Creating indexes for events collection...');
    await eventsCollection.createIndex({ status: 1, startAt: -1 });
    await eventsCollection.createIndex({ eventType: 1 });
    await eventsCollection.createIndex({ endAt: 1 });
    console.log('✅ Events collection indexes created');

    const participantsCollection = await mongoManager.getCollection('event_participants');
    console.log('📊 Creating indexes for event_participants collection...');
    await participantsCollection.createIndex({ eventId: 1, userId: 1 }, { unique: true });
    await participantsCollection.createIndex({ eventId: 1, score: -1 });
    await participantsCollection.createIndex({ userId: 1 });
    console.log('✅ Event participants collection indexes created');

    const skinsCollection = await mongoManager.getCollection('skins');
    console.log('📊 Creating indexes for skins collection...');
    await skinsCollection.createIndex({ _id: 1 });
    console.log('✅ Skins collection indexes created');

    console.log('\n✅ All indexes created successfully!');
    console.log('\n📝 Performance optimizations applied:');
    console.log('   • Users: Indexed by userId, trophies, coins, gems for fast lookups and leaderboards');
    console.log('   • Events: Indexed by status, eventType, and endAt for efficient event queries');
    console.log('   • Participants: Indexed by eventId + userId and eventId + score for fast leaderboards');
    console.log('   • Skins: Indexed by document ID for quick retrieval');

  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  } finally {
    await mongoManager.disconnect();
    console.log('\n✅ MongoDB connection closed');
  }
}

setupIndexes().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
