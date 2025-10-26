const fs = require('fs');
const path = require('path');

const SKINS_FILE = path.join(__dirname, 'skins.json');

function loadSkins() {
  try {
    if (fs.existsSync(SKINS_FILE)) {
      const rawData = fs.readFileSync(SKINS_FILE, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error loading skins:', error);
  }
  return {};
}

function saveSkins(skins) {
  try {
    fs.writeFileSync(SKINS_FILE, JSON.stringify(skins, null, 2));
  } catch (error) {
    console.error('Error saving skins:', error);
  }
}

function getSkinUrl(characterName, skinName = 'default') {
  const skins = loadSkins();
  if (skins[characterName] && skins[characterName][skinName]) {
    return skins[characterName][skinName];
  }
  return skins[characterName]?.default || null;
}

function getAvailableSkins(characterName) {
  const skins = loadSkins();
  if (skins[characterName]) {
    return Object.keys(skins[characterName]);
  }
  return ['default'];
}

function addSkinToCharacter(characterName, skinName, imageUrl) {
  const skins = loadSkins();
  if (!skins[characterName]) {
    skins[characterName] = { default: 'https://picsum.photos/seed/' + characterName.toLowerCase() + '/400/400' };
  }
  skins[characterName][skinName] = imageUrl;
  saveSkins(skins);
  return true;
}

function removeSkinFromCharacter(characterName, skinName) {
  if (skinName === 'default') {
    return false;
  }
  const skins = loadSkins();
  if (skins[characterName] && skins[characterName][skinName]) {
    delete skins[characterName][skinName];
    saveSkins(skins);
    return true;
  }
  return false;
}

function skinExists(characterName, skinName) {
  const skins = loadSkins();
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
