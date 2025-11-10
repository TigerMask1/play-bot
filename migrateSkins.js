const fs = require('fs');
const path = require('path');

const SKINS_FILE = path.join(__dirname, 'skins.json');

async function migrateSkins() {
  console.log('🔄 Starting skin migration from JSON to MongoDB...\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.error('Please set MONGODB_URI before running migration');
    process.exit(1);
  }

  let mongoManager;
  try {
    mongoManager = require('./mongoManager.js');
    await mongoManager.connect();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

  let skins = {};
  try {
    if (fs.existsSync(SKINS_FILE)) {
      const rawData = fs.readFileSync(SKINS_FILE, 'utf8');
      skins = JSON.parse(rawData);
      console.log(`✅ Loaded ${Object.keys(skins).length} characters from skins.json`);
    } else {
      console.error('❌ skins.json not found');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error reading skins.json:', error.message);
    process.exit(1);
  }

  try {
    const collection = await mongoManager.getCollection('skins');
    
    const existingDoc = await collection.findOne({ _id: 'character_skins' });
    if (existingDoc) {
      console.log('⚠️  Skins already exist in MongoDB');
      console.log('   Updating with latest data from skins.json...');
    }

    await collection.updateOne(
      { _id: 'character_skins' },
      { 
        $set: { 
          skins,
          migratedAt: new Date(),
          totalCharacters: Object.keys(skins).length
        } 
      },
      { upsert: true }
    );

    console.log(`✅ Successfully migrated ${Object.keys(skins).length} characters to MongoDB`);
    
    let totalSkins = 0;
    for (const char in skins) {
      totalSkins += Object.keys(skins[char]).length;
    }
    console.log(`   Total skins: ${totalSkins}`);
    
    const verifyDoc = await collection.findOne({ _id: 'character_skins' });
    console.log(`\n✅ Verification: Document exists in MongoDB with ${Object.keys(verifyDoc.skins).length} characters`);
    
    console.log('\n📝 Next steps:');
    console.log('   1. Set USE_MONGODB=true in your environment variables');
    console.log('   2. Restart your bot to use MongoDB for skins');
    
  } catch (error) {
    console.error('❌ Error migrating skins:', error.message);
    process.exit(1);
  } finally {
    await mongoManager.disconnect();
    console.log('\n✅ Migration complete! MongoDB connection closed.');
  }
}

migrateSkins().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
