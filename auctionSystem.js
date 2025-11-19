const { ITEM_CATEGORIES, getItemInfo } = require('./marketSystem.js');
const { saveDataImmediate } = require('./dataManager.js');

function initializeAuctionData(data) {
  if (!data.globalAuctions) {
    data.globalAuctions = [];
  }
  return data.globalAuctions;
}

async function createAuction(data, sellerId, category, itemName, quantity, startingBid, duration) {
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
  
  initializeAuctionData(data);
  
  const auction = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    sellerId,
    sellerName: seller.username,
    category,
    itemName,
    quantity,
    startingBid,
    currentBid: startingBid,
    currentBidder: null,
    currentBidderName: null,
    bids: [],
    createdAt: Date.now(),
    endsAt: Date.now() + duration
  };
  
  data.globalAuctions.push(auction);
  
  await saveDataImmediate(data);
  
  return { success: true, auctionId: auction.id, endsAt: auction.endsAt };
}

async function placeBid(data, userId, auctionId, bidAmount) {
  const user = data.users[userId];
  const auction = data.globalAuctions.find(a => a.id === auctionId);
  
  if (!auction) {
    return { success: false, message: 'Auction not found!' };
  }
  
  if (auction.sellerId === userId) {
    return { success: false, message: 'You can\'t bid on your own auction!' };
  }
  
  if (Date.now() > auction.endsAt) {
    return { success: false, message: 'Auction has ended!' };
  }
  
  if (bidAmount <= auction.currentBid) {
    return { success: false, message: `Bid must be higher than ${auction.currentBid} coins!` };
  }
  
  if (user.coins < bidAmount) {
    return { success: false, message: `You need ${bidAmount} coins!` };
  }
  
  if (auction.currentBidder) {
    const previousBidder = data.users[auction.currentBidder];
    if (previousBidder) {
      previousBidder.coins += auction.currentBid;
    }
  }
  
  user.coins -= bidAmount;
  
  auction.currentBid = bidAmount;
  auction.currentBidder = userId;
  auction.currentBidderName = user.username;
  auction.bids.push({
    userId,
    username: user.username,
    amount: bidAmount,
    timestamp: Date.now()
  });
  
  await saveDataImmediate(data);
  
  return { success: true, newBid: bidAmount };
}

async function endAuction(data, auctionId) {
  const auctionIndex = data.globalAuctions.findIndex(a => a.id === auctionId);
  
  if (auctionIndex === -1) {
    return { success: false, message: 'Auction not found!' };
  }
  
  const auction = data.globalAuctions[auctionIndex];
  
  if (Date.now() < auction.endsAt) {
    return { success: false, message: 'Auction hasn\'t ended yet!' };
  }
  
  const seller = data.users[auction.sellerId];
  
  if (auction.currentBidder) {
    const winner = data.users[auction.currentBidder];
    
    if (seller) {
      seller.coins += auction.currentBid;
    }
    
    if (winner) {
      const categoryData = ITEM_CATEGORIES[auction.category];
      categoryData.setUserInventory(winner, auction.itemName, auction.quantity);
    }
    
    data.globalAuctions.splice(auctionIndex, 1);
    
    await saveDataImmediate(data);
    
    return {
      success: true,
      winner: auction.currentBidderName,
      finalBid: auction.currentBid,
      item: `${auction.quantity}x ${auction.itemName}`
    };
  } else {
    if (seller) {
      const categoryData = ITEM_CATEGORIES[auction.category];
      categoryData.setUserInventory(seller, auction.itemName, auction.quantity);
    }
    
    data.globalAuctions.splice(auctionIndex, 1);
    
    await saveDataImmediate(data);
    
    return { success: true, noBids: true };
  }
}

async function getActiveAuctions(data) {
  initializeAuctionData(data);
  const now = Date.now();
  
  const expiredAuctions = data.globalAuctions.filter(a => now > a.endsAt);
  for (const auction of expiredAuctions) {
    await endAuction(data, auction.id);
  }
  
  return data.globalAuctions.filter(a => now <= a.endsAt);
}

async function forceEndAuction(data, auctionId) {
  const auctionIndex = data.globalAuctions.findIndex(a => a.id === auctionId);
  
  if (auctionIndex === -1) {
    return { success: false, message: 'Auction not found!' };
  }
  
  const auction = data.globalAuctions[auctionIndex];
  const seller = data.users[auction.sellerId];
  
  if (auction.currentBidder) {
    const winner = data.users[auction.currentBidder];
    
    if (seller) {
      seller.coins += auction.currentBid;
    }
    
    if (winner) {
      const categoryData = ITEM_CATEGORIES[auction.category];
      categoryData.setUserInventory(winner, auction.itemName, auction.quantity);
    }
  } else {
    if (seller) {
      const categoryData = ITEM_CATEGORIES[auction.category];
      categoryData.setUserInventory(seller, auction.itemName, auction.quantity);
    }
  }
  
  data.globalAuctions.splice(auctionIndex, 1);
  
  await saveDataImmediate(data);
  
  return { success: true, forced: true };
}

async function clearAllAuctions(data) {
  const count = data.globalAuctions ? data.globalAuctions.length : 0;
  
  if (data.globalAuctions) {
    for (const auction of data.globalAuctions) {
      const seller = data.users[auction.sellerId];
      
      if (auction.currentBidder) {
        const bidder = data.users[auction.currentBidder];
        if (bidder) {
          bidder.coins += auction.currentBid;
        }
      }
      
      if (seller) {
        const categoryData = ITEM_CATEGORIES[auction.category];
        categoryData.setUserInventory(seller, auction.itemName, auction.quantity);
      }
    }
  }
  
  data.globalAuctions = [];
  
  await saveDataImmediate(data);
  
  return { success: true, count };
}

module.exports = {
  initializeAuctionData,
  createAuction,
  placeBid,
  endAuction,
  getActiveAuctions,
  forceEndAuction,
  clearAllAuctions
};
