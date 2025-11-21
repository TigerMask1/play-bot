const { ITEM_CATEGORIES, getItemInfo } = require('./marketSystem.js');
const { saveDataImmediate } = require('./dataManager.js');
const { EmbedBuilder } = require('discord.js');

let botClient = null;

function init(client) {
  botClient = client;
}

function initializeAuctionData(data) {
  if (!data.globalAuctions) {
    data.globalAuctions = [];
  }
  if (!data.auctionIdCounter) {
    data.auctionIdCounter = 0;
  }
  return data.globalAuctions;
}

function generateAuctionId(data) {
  data.auctionIdCounter = (data.auctionIdCounter || 0) + 1;
  return `A${String(data.auctionIdCounter).padStart(3, '0')}`;
}

async function createAuction(data, sellerId, category, itemName, quantity, startingBid, duration, currency = 'coins') {
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
  
  if (currency !== 'coins' && currency !== 'gems') {
    return { success: false, message: 'Currency must be either "coins" or "gems"!' };
  }
  
  categoryData.removeUserInventory(seller, itemName, quantity);
  
  initializeAuctionData(data);
  
  const auction = {
    id: generateAuctionId(data),
    sellerId,
    sellerName: seller.username,
    category,
    itemName,
    quantity,
    startingBid,
    currentBid: startingBid,
    currentBidder: null,
    currentBidderName: null,
    currency,
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
  
  const currency = auction.currency || 'coins';
  const currencyEmoji = currency === 'gems' ? '💎' : '💰';
  
  if (bidAmount <= auction.currentBid) {
    return { success: false, message: `Bid must be higher than ${auction.currentBid} ${currency}!` };
  }
  
  const userBalance = currency === 'gems' ? (user.gems || 0) : (user.coins || 0);
  if (userBalance < bidAmount) {
    return { success: false, message: `You need ${bidAmount} ${currency}!` };
  }
  
  if (auction.currentBidder) {
    const previousBidder = data.users[auction.currentBidder];
    const previousBidderId = auction.currentBidder;
    const refundAmount = auction.currentBid;
    
    if (previousBidder) {
      if (currency === 'gems') {
        previousBidder.gems = (previousBidder.gems || 0) + refundAmount;
      } else {
        previousBidder.coins = (previousBidder.coins || 0) + refundAmount;
      }
      
      if (botClient) {
        try {
          const previousUser = await botClient.users.fetch(previousBidderId);
          const outbidEmbed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ You\'ve Been Outbid!')
            .setDescription(
              `Someone outbid you on **Auction ${auctionId}**!\n\n` +
              `**Item:** ${auction.quantity}x ${auction.itemName}\n` +
              `**Your Bid:** ${refundAmount} ${currencyEmoji}\n` +
              `**New Bid:** ${bidAmount} ${currencyEmoji}\n\n` +
              `Your ${refundAmount} ${currency} have been refunded.\n` +
              `Use \`!auction ${auctionId}\` to place a higher bid!`
            )
            .setTimestamp();
          
          await previousUser.send({ embeds: [outbidEmbed] }).catch(() => {
            console.log(`Could not send outbid notification to ${previousBidder.username}`);
          });
        } catch (error) {
          console.log(`Error sending outbid notification: ${error.message}`);
        }
      }
    }
  }
  
  if (currency === 'gems') {
    user.gems = (user.gems || 0) - bidAmount;
  } else {
    user.coins = (user.coins || 0) - bidAmount;
  }
  
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
  
  return { success: true, newBid: bidAmount, currency };
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
  const currency = auction.currency || 'coins';
  const currencyEmoji = currency === 'gems' ? '💎' : '💰';
  
  if (auction.currentBidder) {
    const winner = data.users[auction.currentBidder];
    
    if (seller) {
      if (currency === 'gems') {
        seller.gems = (seller.gems || 0) + auction.currentBid;
      } else {
        seller.coins = (seller.coins || 0) + auction.currentBid;
      }
      
      if (botClient) {
        try {
          const sellerUser = await botClient.users.fetch(auction.sellerId);
          const sellerEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Auction Sold!')
            .setDescription(
              `Your auction has ended successfully!\n\n` +
              `**Item:** ${auction.quantity}x ${auction.itemName}\n` +
              `**Buyer:** ${auction.currentBidderName}\n` +
              `**Final Price:** ${auction.currentBid} ${currencyEmoji}\n\n` +
              `The ${auction.currentBid} ${currency} have been added to your balance!`
            )
            .setTimestamp();
          
          await sellerUser.send({ embeds: [sellerEmbed] }).catch(() => {
            console.log(`Could not send auction sold notification to ${seller.username}`);
          });
        } catch (error) {
          console.log(`Error sending seller notification: ${error.message}`);
        }
      }
    }
    
    if (winner) {
      const categoryData = ITEM_CATEGORIES[auction.category];
      categoryData.setUserInventory(winner, auction.itemName, auction.quantity);
      
      if (botClient) {
        try {
          const winnerUser = await botClient.users.fetch(auction.currentBidder);
          const winnerEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 You Won the Auction!')
            .setDescription(
              `Congratulations! You won **Auction ${auctionId}**!\n\n` +
              `**Item:** ${auction.quantity}x ${auction.itemName}\n` +
              `**Final Bid:** ${auction.currentBid} ${currencyEmoji}\n\n` +
              `The items have been added to your inventory!`
            )
            .setTimestamp();
          
          await winnerUser.send({ embeds: [winnerEmbed] }).catch(() => {
            console.log(`Could not send auction won notification to ${winner.username}`);
          });
        } catch (error) {
          console.log(`Error sending winner notification: ${error.message}`);
        }
      }
    }
    
    data.globalAuctions.splice(auctionIndex, 1);
    
    await saveDataImmediate(data);
    
    return {
      success: true,
      winner: auction.currentBidderName,
      finalBid: auction.currentBid,
      item: `${auction.quantity}x ${auction.itemName}`,
      currency
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
  
  let needsSave = false;
  for (const auction of data.globalAuctions) {
    if (!auction.currency) {
      auction.currency = 'coins';
      needsSave = true;
    }
  }
  
  if (needsSave) {
    await saveDataImmediate(data);
    console.log('✅ Normalized legacy auction currency fields to coins');
  }
  
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
  const currency = auction.currency || 'coins';
  
  if (auction.currentBidder) {
    const winner = data.users[auction.currentBidder];
    
    if (seller) {
      if (currency === 'gems') {
        seller.gems = (seller.gems || 0) + auction.currentBid;
      } else {
        seller.coins = (seller.coins || 0) + auction.currentBid;
      }
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
      if (!auction.currency) {
        auction.currency = 'coins';
      }
      
      const seller = data.users[auction.sellerId];
      const currency = auction.currency;
      
      if (auction.currentBidder) {
        const bidder = data.users[auction.currentBidder];
        if (bidder) {
          if (currency === 'gems') {
            bidder.gems = (bidder.gems || 0) + auction.currentBid;
          } else {
            bidder.coins = (bidder.coins || 0) + auction.currentBid;
          }
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
  init,
  initializeAuctionData,
  generateAuctionId,
  createAuction,
  placeBid,
  endAuction,
  getActiveAuctions,
  forceEndAuction,
  clearAllAuctions
};
