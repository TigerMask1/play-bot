const { saveDataImmediate } = require('./dataManager.js');

const USE_MONGODB = process.env.USE_MONGODB === 'true';
let mongoManager = null;
if (USE_MONGODB) {
  mongoManager = require('./mongoManager.js');
}

const TIER_INFO = {
  'common': { color: '#95A5A6', emoji: '⚪', basePrice: 10 },
  'rare': { color: '#3498DB', emoji: '🔵', basePrice: 25 },
  'ultra_rare': { color: '#9B59B6', emoji: '🟣', basePrice: 50 },
  'epic': { color: '#E91E63', emoji: '🔴', basePrice: 100 },
  'legendary': { color: '#FFD700', emoji: '🟡', basePrice: 200 },
  'exclusive': { color: '#00FFA3', emoji: '💚', basePrice: 500 }
};

async function getCosmeticsCollection() {
  if (!USE_MONGODB || !mongoManager) {
    throw new Error('MongoDB is not enabled!');
  }
  return await mongoManager.getCollection('cosmetics');
}

async function addCosmeticItem(type, characterName, itemName, imageUrl, tier, price, data) {
  if (!['skin', 'pfp'].includes(type)) {
    return { success: false, message: '❌ Type must be either "skin" or "pfp"!' };
  }
  
  if (!TIER_INFO[tier]) {
    return { 
      success: false, 
      message: `❌ Invalid tier! Valid tiers: ${Object.keys(TIER_INFO).join(', ')}` 
    };
  }
  
  try {
    const collection = await getCosmeticsCollection();
    
    const existingItem = await collection.findOne({
      type,
      characterName: characterName.toLowerCase(),
      itemName: itemName.toLowerCase()
    });
    
    if (existingItem) {
      return { 
        success: false, 
        message: `❌ A ${type} named "${itemName}" already exists for ${characterName}!` 
      };
    }
    
    const cosmetic = {
      type,
      characterName: characterName.toLowerCase(),
      itemName: itemName.toLowerCase(),
      displayName: itemName,
      imageUrl,
      tier,
      price: price || TIER_INFO[tier].basePrice,
      addedAt: new Date(),
      available: true
    };
    
    await collection.insertOne(cosmetic);
    await saveDataImmediate(data);
    
    const tierEmoji = TIER_INFO[tier].emoji;
    return {
      success: true,
      message: `✅ Added ${tierEmoji} **${tier.toUpperCase()}** ${type} "${itemName}" for ${characterName}!\nPrice: ${cosmetic.price} UST`
    };
  } catch (error) {
    console.error('Error adding cosmetic item:', error);
    return { success: false, message: '❌ Database error!' };
  }
}

async function removeCosmeticItem(type, characterName, itemName) {
  try {
    const collection = await getCosmeticsCollection();
    
    const result = await collection.deleteOne({
      type,
      characterName: characterName.toLowerCase(),
      itemName: itemName.toLowerCase()
    });
    
    if (result.deletedCount === 0) {
      return { 
        success: false, 
        message: `❌ ${type} "${itemName}" not found for ${characterName}!` 
      };
    }
    
    return {
      success: true,
      message: `✅ Removed ${type} "${itemName}" for ${characterName}!`
    };
  } catch (error) {
    console.error('Error removing cosmetic item:', error);
    return { success: false, message: '❌ Database error!' };
  }
}

async function updateCosmeticPrice(type, characterName, itemName, newPrice) {
  try {
    const collection = await getCosmeticsCollection();
    
    const result = await collection.updateOne(
      {
        type,
        characterName: characterName.toLowerCase(),
        itemName: itemName.toLowerCase()
      },
      { $set: { price: newPrice, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return { 
        success: false, 
        message: `❌ ${type} "${itemName}" not found for ${characterName}!` 
      };
    }
    
    return {
      success: true,
      message: `✅ Updated price for ${type} "${itemName}" to ${newPrice} UST!`
    };
  } catch (error) {
    console.error('Error updating cosmetic price:', error);
    return { success: false, message: '❌ Database error!' };
  }
}

async function toggleCosmeticAvailability(type, characterName, itemName, available) {
  try {
    const collection = await getCosmeticsCollection();
    
    const result = await collection.updateOne(
      {
        type,
        characterName: characterName.toLowerCase(),
        itemName: itemName.toLowerCase()
      },
      { $set: { available, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return { 
        success: false, 
        message: `❌ ${type} "${itemName}" not found for ${characterName}!` 
      };
    }
    
    return {
      success: true,
      message: `✅ ${available ? 'Enabled' : 'Disabled'} ${type} "${itemName}"!`
    };
  } catch (error) {
    console.error('Error toggling cosmetic availability:', error);
    return { success: false, message: '❌ Database error!' };
  }
}

async function getAvailableCosmetics(type, characterName = null) {
  try {
    const collection = await getCosmeticsCollection();
    
    const query = { type, available: true };
    if (characterName) {
      query.characterName = characterName.toLowerCase();
    }
    
    const cosmetics = await collection.find(query).toArray();
    return cosmetics;
  } catch (error) {
    console.error('Error fetching cosmetics:', error);
    return [];
  }
}

async function getAllCosmeticsForCharacters(type, characterNames) {
  try {
    const collection = await getCosmeticsCollection();
    
    const cosmetics = await collection.find({
      type,
      characterName: { $in: characterNames.map(n => n.toLowerCase()) },
      available: true
    }).toArray();
    
    return cosmetics;
  } catch (error) {
    console.error('Error fetching cosmetics:', error);
    return [];
  }
}

async function purchaseCosmetic(userId, type, characterName, itemName, data) {
  try {
    const collection = await getCosmeticsCollection();
    
    const cosmetic = await collection.findOne({
      type,
      characterName: characterName.toLowerCase(),
      itemName: itemName.toLowerCase(),
      available: true
    });
    
    if (!cosmetic) {
      return { 
        success: false, 
        message: `❌ This ${type} is not available!` 
      };
    }
    
    const userData = data.users[userId];
    if (!userData) {
      return { success: false, message: '❌ User not found!' };
    }
    
    if (userData.ust === undefined) {
      userData.ust = 0;
    }
    
    if (userData.ust < cosmetic.price) {
      return {
        success: false,
        message: `❌ Insufficient UST! You have ${userData.ust} UST but need ${cosmetic.price} UST.`
      };
    }
    
    if (!userData.ownedCosmetics) {
      userData.ownedCosmetics = { skins: [], pfps: [] };
    }
    
    const ownedList = type === 'skin' ? userData.ownedCosmetics.skins : userData.ownedCosmetics.pfps;
    const ownedKey = `${characterName.toLowerCase()}_${itemName.toLowerCase()}`;
    
    if (ownedList.includes(ownedKey)) {
      return {
        success: false,
        message: `❌ You already own this ${type}!`
      };
    }
    
    userData.ust -= cosmetic.price;
    ownedList.push(ownedKey);
    
    await saveDataImmediate(data);
    
    const tierEmoji = TIER_INFO[cosmetic.tier].emoji;
    return {
      success: true,
      message: `✅ Purchased ${tierEmoji} **${cosmetic.tier.toUpperCase()}** ${type} "${cosmetic.displayName}" for ${characterName}!\n\n**UST Remaining:** ${userData.ust} UST`,
      cosmetic: cosmetic,
      newBalance: userData.ust
    };
  } catch (error) {
    console.error('Error purchasing cosmetic:', error);
    return { success: false, message: '❌ Purchase failed!' };
  }
}

function userOwnsCosmetic(userId, type, characterName, itemName, data) {
  const userData = data.users[userId];
  if (!userData || !userData.ownedCosmetics) {
    return false;
  }
  
  const ownedList = type === 'skin' ? userData.ownedCosmetics.skins : userData.ownedCosmetics.pfps;
  const ownedKey = `${characterName.toLowerCase()}_${itemName.toLowerCase()}`;
  
  return ownedList.includes(ownedKey);
}

module.exports = {
  TIER_INFO,
  addCosmeticItem,
  removeCosmeticItem,
  updateCosmeticPrice,
  toggleCosmeticAvailability,
  getAvailableCosmetics,
  getAllCosmeticsForCharacters,
  purchaseCosmetic,
  userOwnsCosmetic
};
