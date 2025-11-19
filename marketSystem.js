const { ORES, WOOD_TYPES } = require('./resourceSystem.js');

const MARKET_ITEMS = {
  ores: ORES,
  wood: WOOD_TYPES
};

function initializeMarketData(userData) {
  if (!userData.marketListings) {
    userData.marketListings = [];
  }
  return userData.marketListings;
}

function listItemOnMarket(data, sellerId, itemType, itemName, quantity, price) {
  const seller = data.users[sellerId];
  
  if (itemType === 'ore') {
    if (!seller.ores || !seller.ores[itemName] || seller.ores[itemName] < quantity) {
      return { success: false, message: `You don't have enough ${itemName}!` };
    }
    seller.ores[itemName] -= quantity;
  } else if (itemType === 'wood') {
    if (!seller.wood || !seller.wood[itemName] || seller.wood[itemName] < quantity) {
      return { success: false, message: `You don't have enough ${itemName}!` };
    }
    seller.wood[itemName] -= quantity;
  } else {
    return { success: false, message: 'Invalid item type!' };
  }
  
  if (!data.globalMarket) {
    data.globalMarket = [];
  }
  
  const listing = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    sellerId,
    sellerName: seller.username,
    itemType,
    itemName,
    quantity,
    price,
    listedAt: Date.now()
  };
  
  data.globalMarket.push(listing);
  
  return { success: true, listingId: listing.id };
}

function buyFromMarket(data, buyerId, listingId) {
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
  seller.coins += listing.price;
  
  if (listing.itemType === 'ore') {
    buyer.ores = buyer.ores || {};
    buyer.ores[listing.itemName] = (buyer.ores[listing.itemName] || 0) + listing.quantity;
  } else if (listing.itemType === 'wood') {
    buyer.wood = buyer.wood || {};
    buyer.wood[listing.itemName] = (buyer.wood[listing.itemName] || 0) + listing.quantity;
  }
  
  data.globalMarket.splice(listingIndex, 1);
  
  return {
    success: true,
    itemType: listing.itemType,
    itemName: listing.itemName,
    quantity: listing.quantity,
    price: listing.price
  };
}

function cancelListing(data, userId, listingId) {
  const listingIndex = data.globalMarket.findIndex(l => l.id === listingId && l.sellerId === userId);
  
  if (listingIndex === -1) {
    return { success: false, message: 'Listing not found or not yours!' };
  }
  
  const listing = data.globalMarket[listingIndex];
  const user = data.users[userId];
  
  if (listing.itemType === 'ore') {
    user.ores[listing.itemName] += listing.quantity;
  } else if (listing.itemType === 'wood') {
    user.wood[listing.itemName] += listing.quantity;
  }
  
  data.globalMarket.splice(listingIndex, 1);
  
  return { success: true };
}

function getMarketListings(data, filters = {}) {
  if (!data.globalMarket) return [];
  
  let listings = [...data.globalMarket];
  
  if (filters.itemType) {
    listings = listings.filter(l => l.itemType === filters.itemType);
  }
  
  if (filters.itemName) {
    listings = listings.filter(l => l.itemName === filters.itemName);
  }
  
  listings.sort((a, b) => a.price - b.price);
  
  return listings;
}

module.exports = {
  initializeMarketData,
  listItemOnMarket,
  buyFromMarket,
  cancelListing,
  getMarketListings
};
