const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { getUSTBalance, removeUST } = require('./ustSystem.js');
const { CHARACTERS } = require('./characters.js');
const fs = require('fs');
const path = require('path');

const COSMETICS_FILE = path.join(__dirname, 'cosmetics_catalog.json');

const RARITY_COSTS = {
  common: 10,
  rare: 25,
  'ultra rare': 50,
  epic: 100,
  legendary: 200
};

const RARITY_COLORS = {
  common: '#95A5A6',
  rare: '#3498DB',
  'ultra rare': '#9B59B6',
  epic: '#E74C3C',
  legendary: '#F39C12'
};

const RARITY_EMOJIS = {
  common: '⚪',
  rare: '🔵',
  'ultra rare': '🟣',
  epic: '🔴',
  legendary: '🟡'
};

let SKIN_CATALOG = {};
let PFP_CATALOG = {};

function getDefaultCatalog() {
  return {
    skins: {
      common: [
        { id: 'skin_nix_classic', name: 'Classic', character: 'Nix', url: 'https://i.imgur.com/nix_classic.png', cost: 10 }
      ],
      rare: [],
      'ultra rare': [],
      epic: [],
      legendary: []
    },
    pfps: {
      common: [
        { id: 'pfp_smile', name: 'Happy Smile', url: 'https://i.imgur.com/smile.png' },
        { id: 'pfp_cool', name: 'Cool Shades', url: 'https://i.imgur.com/cool.png' }
      ],
      rare: [
        { id: 'pfp_crown', name: 'Royal Crown', url: 'https://i.imgur.com/crown.png' }
      ],
      'ultra rare': [
        { id: 'pfp_fire', name: 'Flame Aura', url: 'https://i.imgur.com/fire.png' }
      ],
      epic: [
        { id: 'pfp_galaxy', name: 'Galaxy Vibes', url: 'https://i.imgur.com/galaxy.png' }
      ],
      legendary: [
        { id: 'pfp_diamond', name: 'Diamond Elite', url: 'https://i.imgur.com/diamond.png' }
      ]
    }
  };
}

function loadCosmeticsCatalog() {
  try {
    if (fs.existsSync(COSMETICS_FILE)) {
      const rawData = fs.readFileSync(COSMETICS_FILE, 'utf8');
      const catalog = JSON.parse(rawData);
      SKIN_CATALOG = catalog.skins || getDefaultCatalog().skins;
      PFP_CATALOG = catalog.pfps || getDefaultCatalog().pfps;
      console.log('✅ Loaded cosmetics catalog from file');
    } else {
      const defaultCatalog = getDefaultCatalog();
      SKIN_CATALOG = defaultCatalog.skins;
      PFP_CATALOG = defaultCatalog.pfps;
      saveCosmeticsCatalog();
      console.log('✅ Created default cosmetics catalog');
    }
  } catch (error) {
    console.error('Error loading cosmetics catalog:', error);
    const defaultCatalog = getDefaultCatalog();
    SKIN_CATALOG = defaultCatalog.skins;
    PFP_CATALOG = defaultCatalog.pfps;
  }
}

function saveCosmeticsCatalog() {
  try {
    const catalog = {
      skins: SKIN_CATALOG,
      pfps: PFP_CATALOG
    };
    fs.writeFileSync(COSMETICS_FILE, JSON.stringify(catalog, null, 2));
  } catch (error) {
    console.error('Error saving cosmetics catalog:', error);
  }
}

function initializeSkinCatalog() {
  if (!SKIN_CATALOG || Object.keys(SKIN_CATALOG).length === 0) {
    SKIN_CATALOG = {
      common: [],
      rare: [],
      'ultra rare': [],
      epic: [],
      legendary: []
    };
  }
}

function addSkinToCatalog(characterName, skinName, rarity, url) {
  initializeSkinCatalog();
  
  const validRarities = ['common', 'rare', 'ultra rare', 'epic', 'legendary'];
  if (!validRarities.includes(rarity.toLowerCase())) {
    return {
      success: false,
      message: '❌ Invalid rarity! Use: common, rare, ultra rare, epic, or legendary'
    };
  }
  
  const rarityKey = rarity.toLowerCase();
  
  if (!SKIN_CATALOG[rarityKey]) {
    SKIN_CATALOG[rarityKey] = [];
  }
  
  SKIN_CATALOG[rarityKey].push({
    id: `skin_${characterName.toLowerCase()}_${skinName.toLowerCase()}`,
    name: skinName,
    character: characterName,
    url: url,
    cost: RARITY_COSTS[rarityKey]
  });
  
  saveCosmeticsCatalog();
  
  return {
    success: true,
    message: `✅ Added **${skinName}** skin for ${characterName} to the shop!\nRarity: ${RARITY_EMOJIS[rarityKey]} ${rarity}\nCost: ${RARITY_COSTS[rarityKey]} UST`
  };
}

function addPfpToCatalog(pfpName, rarity, url) {
  const validRarities = ['common', 'rare', 'ultra rare', 'epic', 'legendary'];
  if (!validRarities.includes(rarity.toLowerCase())) {
    return {
      success: false,
      message: '❌ Invalid rarity! Use: common, rare, ultra rare, epic, or legendary'
    };
  }
  
  const rarityKey = rarity.toLowerCase();
  
  if (!PFP_CATALOG[rarityKey]) {
    PFP_CATALOG[rarityKey] = [];
  }
  
  PFP_CATALOG[rarityKey].push({
    id: `pfp_${pfpName.toLowerCase()}`,
    name: pfpName,
    url: url,
    cost: RARITY_COSTS[rarityKey]
  });
  
  saveCosmeticsCatalog();
  
  return {
    success: true,
    message: `✅ Added **${pfpName}** profile picture to the shop!\nRarity: ${RARITY_EMOJIS[rarityKey]} ${rarity}\nCost: ${RARITY_COSTS[rarityKey]} UST`
  };
}

function getAvailableSkinsForUser(userData) {
  initializeSkinCatalog();
  
  const ownedCharacterNames = userData.characters.map(c => c.name);
  const allAvailableSkins = [];
  
  for (const rarity in SKIN_CATALOG) {
    const skinsInRarity = SKIN_CATALOG[rarity].filter(skin => 
      ownedCharacterNames.includes(skin.character)
    );
    
    for (const skin of skinsInRarity) {
      const character = userData.characters.find(c => c.name === skin.character);
      if (!character.ownedSkins.includes(skin.name)) {
        allAvailableSkins.push({
          ...skin,
          rarity: rarity
        });
      }
    }
  }
  
  return allAvailableSkins;
}

function getAvailablePfpsForUser(userData) {
  const ownedPfps = userData.pfp?.ownedPfps || [];
  const allAvailablePfps = [];
  
  for (const rarity in PFP_CATALOG) {
    const pfpsInRarity = PFP_CATALOG[rarity].filter(pfp => 
      !ownedPfps.includes(pfp.id)
    );
    
    for (const pfp of pfpsInRarity) {
      allAvailablePfps.push({
        ...pfp,
        rarity: rarity
      });
    }
  }
  
  return allAvailablePfps;
}

async function purchaseSkin(data, userId, skinId) {
  const userData = data.users[userId];
  if (!userData) {
    return {
      success: false,
      message: '❌ User not found!'
    };
  }
  
  let foundSkin = null;
  let skinRarity = null;
  
  initializeSkinCatalog();
  
  for (const rarity in SKIN_CATALOG) {
    const skin = SKIN_CATALOG[rarity].find(s => s.id === skinId);
    if (skin) {
      foundSkin = skin;
      skinRarity = rarity;
      break;
    }
  }
  
  if (!foundSkin) {
    return {
      success: false,
      message: '❌ Skin not found in catalog!'
    };
  }
  
  const userCharacter = userData.characters.find(c => c.name === foundSkin.character);
  if (!userCharacter) {
    return {
      success: false,
      message: `❌ You don't own ${foundSkin.character}!`
    };
  }
  
  if (userCharacter.ownedSkins.includes(foundSkin.name)) {
    return {
      success: false,
      message: '❌ You already own this skin!'
    };
  }
  
  const cost = foundSkin.cost;
  const userUST = getUSTBalance(data, userId);
  
  if (userUST < cost) {
    return {
      success: false,
      message: `❌ Not enough UST! You have ${userUST} UST but need ${cost} UST.`
    };
  }
  
  const removeResult = await removeUST(data, userId, cost, `Purchased ${foundSkin.name} skin`);
  if (!removeResult.success) {
    return removeResult;
  }
  
  userCharacter.ownedSkins.push(foundSkin.name);
  await saveDataImmediate(data);
  
  return {
    success: true,
    message: `✅ Successfully purchased **${foundSkin.name}** skin for ${foundSkin.character}!\n${RARITY_EMOJIS[skinRarity]} Rarity: ${skinRarity}\nCost: ${cost} UST\nRemaining UST: ${removeResult.newBalance}`,
    skin: foundSkin,
    character: userCharacter
  };
}

async function purchasePfp(data, userId, pfpId) {
  const userData = data.users[userId];
  if (!userData) {
    return {
      success: false,
      message: '❌ User not found!'
    };
  }
  
  if (!userData.pfp) {
    userData.pfp = {
      ownedPfps: [],
      equippedPfp: null
    };
  }
  
  let foundPfp = null;
  let pfpRarity = null;
  
  for (const rarity in PFP_CATALOG) {
    const pfp = PFP_CATALOG[rarity].find(p => p.id === pfpId);
    if (pfp) {
      foundPfp = pfp;
      pfpRarity = rarity;
      break;
    }
  }
  
  if (!foundPfp) {
    return {
      success: false,
      message: '❌ Profile picture not found in catalog!'
    };
  }
  
  if (userData.pfp.ownedPfps.includes(foundPfp.id)) {
    return {
      success: false,
      message: '❌ You already own this profile picture!'
    };
  }
  
  const cost = foundPfp.cost;
  const userUST = getUSTBalance(data, userId);
  
  if (userUST < cost) {
    return {
      success: false,
      message: `❌ Not enough UST! You have ${userUST} UST but need ${cost} UST.`
    };
  }
  
  const removeResult = await removeUST(data, userId, cost, `Purchased ${foundPfp.name} profile picture`);
  if (!removeResult.success) {
    return removeResult;
  }
  
  userData.pfp.ownedPfps.push(foundPfp.id);
  await saveDataImmediate(data);
  
  return {
    success: true,
    message: `✅ Successfully purchased **${foundPfp.name}** profile picture!\n${RARITY_EMOJIS[pfpRarity]} Rarity: ${pfpRarity}\nCost: ${cost} UST\nRemaining UST: ${removeResult.newBalance}`,
    pfp: foundPfp
  };
}

function formatShopCatalog(userData, type = 'skins') {
  const userUST = getUSTBalance({ users: { [userData.id]: userData } }, userData.id) || 0;
  
  if (type === 'skins') {
    const availableSkins = getAvailableSkinsForUser(userData);
    
    if (availableSkins.length === 0) {
      return {
        embed: new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('🎨 Skins Shop')
          .setDescription('**No skins available!**\n\nYou either:\n• Own all available skins for your characters\n• Have no skins in the catalog for your characters yet\n\nCheck back later for new additions!')
          .addFields({ name: '💼 Your UST', value: `${userUST} UST`, inline: false }),
        items: []
      };
    }
    
    const groupedByRarity = {};
    for (const skin of availableSkins) {
      if (!groupedByRarity[skin.rarity]) {
        groupedByRarity[skin.rarity] = [];
      }
      groupedByRarity[skin.rarity].push(skin);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎨 Skins Shop')
      .setDescription(`Purchase exclusive character skins with UST!\n\n**Your UST:** ${userUST} UST`)
      .setFooter({ text: 'Skins are filtered to show only your owned characters' });
    
    const rarityOrder = ['legendary', 'epic', 'ultra rare', 'rare', 'common'];
    for (const rarity of rarityOrder) {
      if (groupedByRarity[rarity]) {
        const skinsList = groupedByRarity[rarity]
          .map(s => `• **${s.name}** (${s.character}) - ${s.cost} UST`)
          .join('\n');
        embed.addFields({ 
          name: `${RARITY_EMOJIS[rarity]} ${rarity.toUpperCase()}`, 
          value: skinsList, 
          inline: false 
        });
      }
    }
    
    return { embed, items: availableSkins };
  } else {
    const availablePfps = getAvailablePfpsForUser(userData);
    
    if (availablePfps.length === 0) {
      return {
        embed: new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('🖼️ Profile Pictures Shop')
          .setDescription('**No profile pictures available!**\n\nYou own all available profile pictures!\n\nCheck back later for new additions!')
          .addFields({ name: '💼 Your UST', value: `${userUST} UST`, inline: false }),
        items: []
      };
    }
    
    const groupedByRarity = {};
    for (const pfp of availablePfps) {
      if (!groupedByRarity[pfp.rarity]) {
        groupedByRarity[pfp.rarity] = [];
      }
      groupedByRarity[pfp.rarity].push(pfp);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🖼️ Profile Pictures Shop')
      .setDescription(`Purchase exclusive profile pictures with UST!\n\n**Your UST:** ${userUST} UST`)
      .setFooter({ text: 'Customize your profile with unique pictures!' });
    
    const rarityOrder = ['legendary', 'epic', 'ultra rare', 'rare', 'common'];
    for (const rarity of rarityOrder) {
      if (groupedByRarity[rarity]) {
        const pfpsList = groupedByRarity[rarity]
          .map(p => `• **${p.name}** - ${p.cost} UST`)
          .join('\n');
        embed.addFields({ 
          name: `${RARITY_EMOJIS[rarity]} ${rarity.toUpperCase()}`, 
          value: pfpsList, 
          inline: false 
        });
      }
    }
    
    return { embed, items: availablePfps };
  }
}

module.exports = {
  RARITY_COSTS,
  RARITY_COLORS,
  RARITY_EMOJIS,
  SKIN_CATALOG,
  PFP_CATALOG,
  loadCosmeticsCatalog,
  saveCosmeticsCatalog,
  addSkinToCatalog,
  addPfpToCatalog,
  getAvailableSkinsForUser,
  getAvailablePfpsForUser,
  purchaseSkin,
  purchasePfp,
  formatShopCatalog
};
