const { ORES, WOOD_TYPES } = require('./resourceSystem.js');
const { saveDataImmediate } = require('./dataManager.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let botClient = null;

function init(client) {
  botClient = client;
}

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
  if (!data.marketIdCounter) {
    data.marketIdCounter = 0;
  }
  return data.globalMarket;
}

function generateMarketId(data) {
  data.marketIdCounter = (data.marketIdCounter || 0) + 1;
  return `M${String(data.marketIdCounter).padStart(3, '0')}`;
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

async function listItemOnMarket(data, sellerId, category, itemName, quantity, price, currency = 'coins') {
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
  
  initializeMarketData(data);
  
  const listing = {
    id: generateMarketId(data),
    sellerId,
    sellerName: seller.username,
    category,
    itemName,
    quantity,
    price,
    currency,
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
  
  const currency = listing.currency || 'coins';
  const currencyEmoji = currency === 'gems' ? '💎' : '💰';
  const buyerBalance = currency === 'gems' ? (buyer.gems || 0) : (buyer.coins || 0);
  
  if (buyerBalance < listing.price) {
    return { success: false, message: `You need ${listing.price} ${currency}!` };
  }
  
  if (currency === 'gems') {
    buyer.gems = (buyer.gems || 0) - listing.price;
  } else {
    buyer.coins = (buyer.coins || 0) - listing.price;
  }
  
  const seller = data.users[listing.sellerId];
  if (seller) {
    if (currency === 'gems') {
      seller.gems = (seller.gems || 0) + listing.price;
    } else {
      seller.coins = (seller.coins || 0) + listing.price;
    }
    
    if (botClient) {
      try {
        const sellerUser = await botClient.users.fetch(listing.sellerId);
        const sellerEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Market Item Sold!')
          .setDescription(
            `Your market listing has been purchased!\n\n` +
            `**Item:** ${listing.quantity}x ${listing.itemName}\n` +
            `**Buyer:** ${buyer.username}\n` +
            `**Price:** ${listing.price} ${currencyEmoji}\n\n` +
            `The ${listing.price} ${currency} have been added to your balance!`
          )
          .setTimestamp();
        
        await sellerUser.send({ embeds: [sellerEmbed] }).catch(() => {
          console.log(`Could not send market sold notification to ${seller.username}`);
        });
      } catch (error) {
        console.log(`Error sending seller notification: ${error.message}`);
      }
    }
  }
  
  const categoryData = ITEM_CATEGORIES[listing.category];
  categoryData.setUserInventory(buyer, listing.itemName, listing.quantity);
  
  if (botClient) {
    try {
      const buyerUser = await botClient.users.fetch(buyerId);
      const buyerEmbed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle('🛒 Purchase Complete!')
        .setDescription(
          `You successfully purchased from the market!\n\n` +
          `**Item:** ${listing.quantity}x ${listing.itemName}\n` +
          `**Price:** ${listing.price} ${currencyEmoji}\n\n` +
          `The items have been added to your inventory!`
        )
        .setTimestamp();
      
      await buyerUser.send({ embeds: [buyerEmbed] }).catch(() => {
        console.log(`Could not send purchase notification to ${buyer.username}`);
      });
    } catch (error) {
      console.log(`Error sending buyer notification: ${error.message}`);
    }
  }
  
  data.globalMarket.splice(listingIndex, 1);
  
  await saveDataImmediate(data);
  
  return {
    success: true,
    category: listing.category,
    itemName: listing.itemName,
    quantity: listing.quantity,
    price: listing.price,
    currency
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

async function getMarketListings(data, filters = {}) {
  if (!data.globalMarket) return [];
  
  let needsSave = false;
  for (const listing of data.globalMarket) {
    if (!listing.currency) {
      listing.currency = 'coins';
      needsSave = true;
    }
  }
  
  if (needsSave) {
    await saveDataImmediate(data);
    console.log('✅ Normalized legacy market currency fields to coins');
  }
  
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
      if (!listing.currency) {
        listing.currency = 'coins';
      }
      
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

function createMarketEmbed(listings, page = 0, itemsPerPage = 5, filterCategory = null) {
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const displayListings = listings.slice(start, end);
  const totalPages = Math.ceil(listings.length / itemsPerPage);
  
  const embed = new EmbedBuilder()
    .setColor('#00CED1')
    .setTitle('🏪 Global Market')
    .setDescription(
      listings.length === 0 
        ? 'No listings available at the moment!' 
        : `Browse through ${listings.length} listing${listings.length !== 1 ? 's' : ''}${filterCategory ? ` (${filterCategory})` : ''}`
    )
    .setFooter({ text: `Page ${page + 1} of ${totalPages || 1}` })
    .setTimestamp();
  
  if (displayListings.length > 0) {
    for (const listing of displayListings) {
      const currency = listing.currency || 'coins';
      const currencyEmoji = currency === 'gems' ? '💎' : '💰';
      const categoryInfo = ITEM_CATEGORIES[listing.category];
      const categoryDisplay = categoryInfo ? categoryInfo.display : listing.category;
      
      embed.addFields({
        name: `${listing.id} - ${listing.quantity}x ${listing.itemName}`,
        value: 
          `**Price:** ${listing.price} ${currencyEmoji}\n` +
          `**Seller:** ${listing.sellerName}\n` +
          `**Category:** ${categoryDisplay}\n` +
          `**Unit Price:** ${Math.round(listing.price / listing.quantity)} ${currencyEmoji}/each`,
        inline: false
      });
    }
  }
  
  return embed;
}

function createMarketButtons(currentPage, totalPages, disabled = false) {
  const row = new ActionRowBuilder();
  
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`market_first`)
      .setLabel('⏮️ First')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`market_prev`)
      .setLabel('◀️ Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`market_next`)
      .setLabel('Next ▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled || currentPage >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`market_last`)
      .setLabel('Last ⏭️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`market_refresh`)
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled)
  );
  
  return row;
}

function createMarketFilterButtons(currentFilter = null) {
  const row = new ActionRowBuilder();
  
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`market_filter_all`)
      .setLabel('All')
      .setStyle(currentFilter === null ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`market_filter_ore`)
      .setLabel('Ore')
      .setStyle(currentFilter === 'ore' ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`market_filter_wood`)
      .setLabel('Wood')
      .setStyle(currentFilter === 'wood' ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`market_filter_crate`)
      .setLabel('Crate')
      .setStyle(currentFilter === 'crate' ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`market_filter_key`)
      .setLabel('Key')
      .setStyle(currentFilter === 'key' ? ButtonStyle.Success : ButtonStyle.Secondary)
  );
  
  return row;
}

module.exports = {
  init,
  ITEM_CATEGORIES,
  initializeMarketData,
  generateMarketId,
  getItemInfo,
  listItemOnMarket,
  buyFromMarket,
  cancelListing,
  getMarketListings,
  clearMarket,
  createMarketEmbed,
  createMarketButtons,
  createMarketFilterButtons
};
