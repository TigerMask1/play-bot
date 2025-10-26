const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DATA_FILE = path.join(__dirname, 'data.json');

async function migrate() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.error('Please set MONGODB_URI before running migration');
    process.exit(1);
  }
  
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ No data.json file found to migrate');
    process.exit(1);
  }
  
  console.log('📦 Loading data from data.json...');
  const rawData = fs.readFileSync(DATA_FILE, 'utf8');
  const jsonData = JSON.parse(rawData);
  
  console.log(`Found ${Object.keys(jsonData.users).length} users to migrate`);
  
  let client;
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('discord_bot');
    
    console.log('🗑️ Clearing existing MongoDB data...');
    await db.collection('users').deleteMany({});
    await db.collection('config').deleteMany({});
    
    console.log('📤 Migrating user data...');
    const usersCollection = db.collection('users');
    const bulkOps = [];
    
    for (const [userId, userData] of Object.entries(jsonData.users)) {
      bulkOps.push({
        insertOne: {
          document: {
            userId,
            ...userData
          }
        }
      });
    }
    
    if (bulkOps.length > 0) {
      await usersCollection.bulkWrite(bulkOps);
      console.log(`✅ Migrated ${bulkOps.length} users`);
    }
    
    console.log('📤 Migrating config data...');
    const configCollection = db.collection('config');
    await configCollection.insertOne({
      _id: 'bot_config',
      dropChannelId: jsonData.dropChannelId || jsonData.dropChannel || null,
      battleChannelId: jsonData.battleChannelId || jsonData.battleChannel || null
    });
    console.log('✅ Config migrated');
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Set USE_MONGODB=true in your environment variables');
    console.log('2. Restart your bot');
    console.log('3. Your bot will now use MongoDB instead of JSON');
    console.log('\n💡 Optional: Backup data.json and delete it once you verify everything works');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

migrate();
