const { ORES, WOOD_TYPES } = require('./resourceSystem.js');
const { saveDataImmediate } = require('./dataManager.js');

const ITEM_CATEGORIES = {
  ore: { 
    display: 'Ore',
    items: ORES,
    getUserInventory: (user) => user.ores || {},
    setUserInventory: (user, itemName, amount) => {
      user.ores = user.ores || {};
      user.ores[itemName] = (user.ores[itemName] || 0) + amount;
    },
    removeUserInventory: (user, itemName, amount) => {
      user.ores = user.ores || {};
      user.ores[itemName] = (user.ores[itemName] || 0) - amount;
    }
  },
  wood: { 
    display: 'Wood',
    items: WOOD_TYPES,
    getUserInventory: (user) => user.wood || {},
    setUserInventory: (user, itemName, amount) => {
      user.wood = user.wood || {};
      user.wood[itemName] = (user.wood[itemName] || 0) + amount;
    },
    removeUserInventory: (user, itemName, amount) => {
      user.wood = user.wood || {};
      user.wood[itemName] = (user.wood[itemName] || 0) - amount;
    }
  },
  crate: {
    display: 'Crate',
    items: {
      bronze: { name: 'Bronze Crate', emoji: '🟫' },
      silver: { name: 'Silver Crate', emoji: '⚪' },
      gold: { name: 'Gold Crate', emoji: '🟡' },
      emerald: { name: 'Emerald Crate', emoji: '🟢' },
      legendary: { name: 'Legendary Crate', emoji: '🔮' },
      tyrant: { name: 'Tyrant Crate', emoji: '👑' }
    },
    getUserInventory: (user) => ({
      bronze: user.bronzeCrates || 0,
      silver: user.silverCrates || 0,
      gold: user.goldCrates || 0,
      emerald: user.emeraldCrates || 0,
      legendary: user.legendaryCrates || 0,
      tyrant: user.tyrantCrates || 0
    }),
    setUserInventory: (user, itemName, amount) => {
      const key = `${itemName}Crates`;
      user[key] = (user[key] || 0) + amount;
    },
    removeUserInventory: (user, itemName, amount) => {
      const key = `${itemName}Crates`;
      user[key] = (user[key] || 0) - amount;
    }
  },
  key: {
    display: 'Key',
    items: {
      key: { name: 'Character Key', emoji: '🔑' },
      cagekey: { name: 'Cage Key', emoji: '🗝️' }
    },
    getUserInventory: (user) => ({
      key: user.keys || 0,
      cagekey: user.cageKeys || 0
    }),
    setUserInventory: (user, itemName, amount) => {
      if (itemName === 'key') {
        user.keys = (user.keys || 0) + amount;
      } else if (itemName === 'cagekey') {
        user.cageKeys = (user.cageKeys || 0) + amount;
      }
    },
    removeUserInventory: (user, itemName, amount) => {
      if (itemName === 'key') {
        user.keys = (user.keys || 0) - amount;
      } else if (itemName === 'cagekey') {
        user.cageKeys = (user.cageKeys || 0) - amount;
      }
    }
  },
  resource: {
    display: 'Resource',
    items: {
      shards: { name: 'Shards', emoji: '✨' },
      tokens: { name: 'Tokens', emoji: '🎫' },
      stboosters: { name: 'ST Boosters', emoji: '⚡' }
    },
    getUserInventory: (user) => ({
      shards: user.shards || 0,
      tokens: user.pendingTokens || 0,
      stboosters: user.stBoosters || 0
    }),
    setUserInventory: (user, itemName, amount) => {
      if (itemName === 'tokens') {
        user.pendingTokens = (user.pendingTokens || 0) + amount;
      } else if (itemName === 'stboosters') {
        user.stBoosters = (user.stBoosters || 0) + amount;
      } else {
        user[itemName] = (user[itemName] || 0) + amount;
      }
    },
    removeUserInventory: (user, itemName, amount) => {
      if (itemName === 'tokens') {
        user.pendingTokens = (user.pendingTokens || 0) - amount;
      } else if (itemName === 'stboosters') {
        user.stBoosters = (user.stBoosters || 0) - amount;
      } else {
        user[itemName] = (user[itemName] || 0) - amount;
      }
    }
  }
};

function initializeMarketData(data) {
  if (!data.globalMarket) {
    data.globalMarket = [];
  }
  return data.globalMarket;
}

function getItemInfo(category, itemName) {
  const cat = ITEM_CATEGORIES[category];
  if (!cat) return null;
  
  const item = cat.items[itemName];
  if (!item) return null;
  
  return {
    emoji: item.emoji,
    name: item.name,
    category: cat.display
  };
}

async function listItemOnMarket(data, sellerId, category, itemName, quantity, price) {
  const seller = data.users[sellerId];
  const categoryData = ITEM_CATEGORIES[category];
  
  if (!categoryData) {
    return { success: false, message: 'Invalid item category!' };
  }
  
  if (!categoryData.items[itemName]) {
    return { success: false, message: `Invalid ${category} type!` };
  }
  
  const inventory = categoryData.getUserInventory(seller);
  if (!inventory[itemName] || inventory[itemName] < quantity) {
    return { success: false, message: `You don't have enough ${itemName}!` };
  }
  
  categoryData.removeUserInventory(seller, itemName, quantity);
  
  initializeMarketData(data);
  
  const listing = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    sellerId,
    sellerName: seller.username,
    category,
    itemName,
    quantity,
    price,
    listedAt: Date.now()
  };
  
  data.globalMarket.push(listing);
  
  await saveDataImmediate(data);
  
  return { success: true, listingId: listing.id };
}

async function buyFromMarket(data, buyerId, listingId) {
  const buyer = data.users[buyerId];
  const listingIndex = data.globalMarket.findIndex(l => l.id === listingId);
  
  if (listingIndex === -1) {
    return { success: false, message: 'Listing not found!' };
  }
  
  const listing = data.globalMarket[listingIndex];
  
  if (listing.sellerId === buyerId) {
    return { success: false, message: 'You can\'t buy your own listing!' };
  }
  
  if (buyer.coins < listing.price) {
    return { success: false, message: `You need ${listing.price} coins!` };
  }
  
  buyer.coins -= listing.price;
  
  const seller = data.users[listing.sellerId];
  if (seller) {
    seller.coins += listing.price;
  }
  
  const categoryData = ITEM_CATEGORIES[listing.category];
  categoryData.setUserInventory(buyer, listing.itemName, listing.quantity);
  
  data.globalMarket.splice(listingIndex, 1);
  
  await saveDataImmediate(data);
  
  return {
    success: true,
    category: listing.category,
    itemName: listing.itemName,
    quantity: listing.quantity,
    price: listing.price
  };
}

async function cancelListing(data, userId, listingId) {
  const listingIndex = data.globalMarket.findIndex(l => l.id === listingId && l.sellerId === userId);
  
  if (listingIndex === -1) {
    return { success: false, message: 'Listing not found or not yours!' };
  }
  
  const listing = data.globalMarket[listingIndex];
  const user = data.users[userId];
  
  const categoryData = ITEM_CATEGORIES[listing.category];
  categoryData.setUserInventory(user, listing.itemName, listing.quantity);
  
  data.globalMarket.splice(listingIndex, 1);
  
  await saveDataImmediate(data);
  
  return { success: true };
}

function getMarketListings(data, filters = {}) {
  if (!data.globalMarket) return [];
  
  let listings = [...data.globalMarket];
  
  if (filters.category) {
    listings = listings.filter(l => l.category === filters.category);
  }
  
  if (filters.itemName) {
    listings = listings.filter(l => l.itemName === filters.itemName);
  }
  
  listings.sort((a, b) => a.price - b.price);
  
  return listings;
}

async function clearMarket(data) {
  const count = data.globalMarket ? data.globalMarket.length : 0;
  
  if (data.globalMarket) {
    for (const listing of data.globalMarket) {
      const seller = data.users[listing.sellerId];
      if (seller) {
        const categoryData = ITEM_CATEGORIES[listing.category];
        categoryData.setUserInventory(seller, listing.itemName, listing.quantity);
      }
    }
  }
  
  data.globalMarket = [];
  
  await saveDataImmediate(data);
  
  return { success: true, count };
}

module.exports = {
  ITEM_CATEGORIES,
  initializeMarketData,
  getItemInfo,
  listItemOnMarket,
  buyFromMarket,
  cancelListing,
  getMarketListings,
  clearMarket
};
