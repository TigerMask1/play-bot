function initializeAuctionData(data) {
  if (!data.globalAuctions) {
    data.globalAuctions = [];
  }
  return data.globalAuctions;
}

function createAuction(data, sellerId, itemType, itemName, quantity, startingBid, duration) {
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
  
  initializeAuctionData(data);
  
  const auction = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    sellerId,
    sellerName: seller.username,
    itemType,
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
  
  return { success: true, auctionId: auction.id, endsAt: auction.endsAt };
}

function placeBid(data, userId, auctionId, bidAmount) {
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
    previousBidder.coins += auction.currentBid;
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
  
  return { success: true, newBid: bidAmount };
}

function endAuction(data, auctionId) {
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
    
    seller.coins += auction.currentBid;
    
    if (auction.itemType === 'ore') {
      winner.ores = winner.ores || {};
      winner.ores[auction.itemName] = (winner.ores[auction.itemName] || 0) + auction.quantity;
    } else if (auction.itemType === 'wood') {
      winner.wood = winner.wood || {};
      winner.wood[auction.itemName] = (winner.wood[auction.itemName] || 0) + auction.quantity;
    }
    
    data.globalAuctions.splice(auctionIndex, 1);
    
    return {
      success: true,
      winner: auction.currentBidderName,
      finalBid: auction.currentBid,
      item: `${auction.quantity}x ${auction.itemName}`
    };
  } else {
    if (auction.itemType === 'ore') {
      seller.ores[auction.itemName] += auction.quantity;
    } else if (auction.itemType === 'wood') {
      seller.wood[auction.itemName] += auction.quantity;
    }
    
    data.globalAuctions.splice(auctionIndex, 1);
    
    return { success: true, noBids: true };
  }
}

function getActiveAuctions(data) {
  initializeAuctionData(data);
  const now = Date.now();
  
  const expiredAuctions = data.globalAuctions.filter(a => now > a.endsAt);
  for (const auction of expiredAuctions) {
    endAuction(data, auction.id);
  }
  
  return data.globalAuctions.filter(a => now <= a.endsAt);
}

module.exports = {
  initializeAuctionData,
  createAuction,
  placeBid,
  endAuction,
  getActiveAuctions
};
