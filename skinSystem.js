const fs = require('fs');
const path = require('path');

const SKINS_FILE = path.join(__dirname, 'skins.json');
const USE_MONGODB = process.env.USE_MONGODB === 'true';

let mongoManager = null;
if (USE_MONGODB) {
  mongoManager = require('./mongoManager.js');
}

async function loadSkins() {
  if (USE_MONGODB && mongoManager) {
    try {
      const collection = await mongoManager.getCollection('skins');
      const skinDoc = await collection.findOne({ _id: 'character_skins' });
      return skinDoc?.skins || {};
    } catch (error) {
      console.error('Error loading skins from MongoDB:', error);
      return {};
    }
  } else {
    try {
      if (fs.existsSync(SKINS_FILE)) {
        const rawData = fs.readFileSync(SKINS_FILE, 'utf8');
        return JSON.parse(rawData);
      }
    } catch (error) {
      console.error('Error loading skins from JSON:', error);
    }
    return {};
  }
}

async function saveSkins(skins) {
  if (USE_MONGODB && mongoManager) {
    try {
      const collection = await mongoManager.getCollection('skins');
      await collection.updateOne(
        { _id: 'character_skins' },
        { $set: { skins } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving skins to MongoDB:', error);
    }
  } else {
    try {
      fs.writeFileSync(SKINS_FILE, JSON.stringify(skins, null, 2));
    } catch (error) {
      console.error('Error saving skins to JSON:', error);
    }
  }
}

async function getSkinUrl(characterName, skinName = 'default') {
  const skins = await loadSkins();
  if (skins[characterName] && skins[characterName][skinName]) {
    return skins[characterName][skinName];
  }
  return skins[characterName]?.default || null;
}

async function getAvailableSkins(characterName) {
  const skins = await loadSkins();
  if (skins[characterName]) {
    return Object.keys(skins[characterName]);
  }
  return ['default'];
}

async function addSkinToCharacter(characterName, skinName, imageUrl) {
  const skins = await loadSkins();
  if (!skins[characterName]) {
    skins[characterName] = { default: 'https://picsum.photos/seed/' + characterName.toLowerCase() + '/400/400' };
  }
  skins[characterName][skinName] = imageUrl;
  await saveSkins(skins);
  return true;
}

async function removeSkinFromCharacter(characterName, skinName) {
  if (skinName === 'default') {
    return false;
  }
  const skins = await loadSkins();
  if (skins[characterName] && skins[characterName][skinName]) {
    delete skins[characterName][skinName];
    await saveSkins(skins);
    return true;
  }
  return false;
}

async function skinExists(characterName, skinName) {
  const skins = await loadSkins();
  return skins[characterName] && skins[characterName][skinName] !== undefined;
}

module.exports = {
  loadSkins,
  saveSkins,
  getSkinUrl,
  getAvailableSkins,
  addSkinToCharacter,
  removeSkinFromCharacter,
  skinExists
};
