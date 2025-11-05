const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { getAllShopItems, getItemsByCategory, purchaseItem, getItem } = require('./itemsSystem.js');

const activeShops = new Map();

async function openShop(message, data) {
  const userId = message.author.id;
  
  if (!data.users[userId]) {
    await message.reply('❌ You need to use `!start` first!');
    return;
  }
  
  if (activeShops.has(userId)) {
    await message.reply('❌ You already have a shop menu open!');
    return;
  }
  
  const shopMessage = await message.reply({ content: 'Loading shop...' });
  await showMainShopDirect(shopMessage, data, userId);
  
  activeShops.set(userId, {
    message: shopMessage,
    timeout: setTimeout(() => {
      closeShop(userId);
    }, 300000) // 5 minutes
  });
  
  const filter = (interaction) => {
    return interaction.user.id === userId && 
           (interaction.customId.startsWith('shop_') || interaction.customId.startsWith('buy_'));
  };
  
  const collector = shopMessage.createMessageComponentCollector({ filter, time: 300000 });
  
  collector.on('collect', async (interaction) => {
    try {
      if (interaction.customId === `shop_close_${userId}`) {
        await interaction.update({ 
          embeds: [new EmbedBuilder()
            .setColor('#808080')
            .setTitle('🏪 Shop Closed')
            .setDescription('Thanks for visiting!')],
          components: []
        });
        closeShop(userId);
        collector.stop();
      } else if (interaction.customId === `shop_category_${userId}`) {
        await showCategoryItems(interaction, data, interaction.values[0]);
      } else if (interaction.customId.startsWith('buy_item_')) {
        const itemId = interaction.values[0];
        await handlePurchase(interaction, data, itemId);
      } else if (interaction.customId === `shop_back_${userId}`) {
        await showMainShop(interaction, data);
      }
    } catch (error) {
      console.error('Shop interaction error:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ An error occurred. Please try again.', flags: 64 }).catch(() => {});
      }
    }
  });
  
  collector.on('end', () => {
    closeShop(userId);
  });
}

async function showMainShop(interaction, data) {
  const userId = interaction.user.id;
  const user = data.users[userId];
  
  const categories = [
    { id: 'healing', name: '🧪 Healing Items', emoji: '🧪' },
    { id: 'energy', name: '⚡ Energy Items', emoji: '⚡' },
    { id: 'buff', name: '💪 Stat Boosts', emoji: '💪' },
    { id: 'special', name: '✨ Special Items', emoji: '✨' }
  ];
  
  const shopEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏪 BATTLE SHOP')
    .setDescription(`Welcome to the Battle Shop!\n\n**Your Balance:**\n💰 ${user.coins} Coins\n💎 ${user.gems} Gems\n\nSelect a category below to browse items!`)
    .addFields(
      { name: '🧪 Healing Items', value: 'Restore HP in battle', inline: true },
      { name: '⚡ Energy Items', value: 'Restore energy', inline: true },
      { name: '💪 Stat Boosts', value: 'Temporary buffs', inline: true },
      { name: '✨ Special Items', value: 'Unique effects', inline: true }
    )
    .setFooter({ text: 'Shop will close after 5 minutes of inactivity' });
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`shop_category_${userId}`)
    .setPlaceholder('Choose a category')
    .addOptions(
      categories.map(cat => ({
        label: cat.name,
        value: cat.id,
        emoji: cat.emoji
      }))
    );
  
  const closeButton = new ButtonBuilder()
    .setCustomId(`shop_close_${userId}`)
    .setLabel('Close Shop')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌');
  
  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(closeButton);
  
  await interaction.update({ embeds: [shopEmbed], components: [row1, row2] });
}

async function showMainShopDirect(message, data, userId) {
  const user = data.users[userId];
  
  const categories = [
    { id: 'healing', name: '🧪 Healing Items', emoji: '🧪' },
    { id: 'energy', name: '⚡ Energy Items', emoji: '⚡' },
    { id: 'buff', name: '💪 Stat Boosts', emoji: '💪' },
    { id: 'special', name: '✨ Special Items', emoji: '✨' }
  ];
  
  const shopEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏪 BATTLE SHOP')
    .setDescription(`Welcome to the Battle Shop!\n\n**Your Balance:**\n💰 ${user.coins} Coins\n💎 ${user.gems} Gems\n\nSelect a category below to browse items!`)
    .addFields(
      { name: '🧪 Healing Items', value: 'Restore HP in battle', inline: true },
      { name: '⚡ Energy Items', value: 'Restore energy', inline: true },
      { name: '💪 Stat Boosts', value: 'Temporary buffs', inline: true },
      { name: '✨ Special Items', value: 'Unique effects', inline: true }
    )
    .setFooter({ text: 'Shop will close after 5 minutes of inactivity' });
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`shop_category_${userId}`)
    .setPlaceholder('Choose a category')
    .addOptions(
      categories.map(cat => ({
        label: cat.name,
        value: cat.id,
        emoji: cat.emoji
      }))
    );
  
  const closeButton = new ButtonBuilder()
    .setCustomId(`shop_close_${userId}`)
    .setLabel('Close Shop')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌');
  
  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(closeButton);
  
  await message.edit({ embeds: [shopEmbed], components: [row1, row2] });
}

async function showCategoryItems(interaction, data, category) {
  const userId = interaction.user.id;
  const user = data.users[userId];
  
  const items = getItemsByCategory(category);
  
  if (items.length === 0) {
    await interaction.reply({ content: '❌ No items in this category!', flags: 64 });
    return;
  }
  
  const categoryNames = {
    'healing': '🧪 Healing Items',
    'energy': '⚡ Energy Items',
    'buff': '💪 Stat Boosts',
    'special': '✨ Special Items'
  };
  
  const itemsDescription = items.map(item => {
    const costStr = item.cost.gems > 0 
      ? `${item.cost.coins}💰 + ${item.cost.gems}💎`
      : `${item.cost.coins}💰`;
    const owned = user.inventory && user.inventory[item.id] ? user.inventory[item.id] : 0;
    return `${item.emoji} **${item.name}** - ${costStr}\n${item.description}\n**Owned:** ${owned}`;
  }).join('\n\n');
  
  const categoryEmbed = new EmbedBuilder()
    .setColor('#00D9FF')
    .setTitle(categoryNames[category])
    .setDescription(`**Your Balance:** 💰 ${user.coins} | 💎 ${user.gems}\n\n${itemsDescription}`)
    .setFooter({ text: 'Select an item to purchase' });
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`buy_item_${userId}`)
    .setPlaceholder('Choose an item to buy')
    .addOptions(
      items.map(item => ({
        label: item.name,
        value: item.id,
        description: `${item.cost.gems > 0 ? `${item.cost.coins}💰 + ${item.cost.gems}💎` : `${item.cost.coins}💰`} | ${item.description.substring(0, 50)}`,
        emoji: item.emoji
      }))
    );
  
  const backButton = new ButtonBuilder()
    .setCustomId(`shop_back_${userId}`)
    .setLabel('Back to Categories')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('⬅️');
  
  const closeButton = new ButtonBuilder()
    .setCustomId(`shop_close_${userId}`)
    .setLabel('Close')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌');
  
  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(backButton, closeButton);
  
  await interaction.update({ embeds: [categoryEmbed], components: [row1, row2] });
}

async function handlePurchase(interaction, data, itemId) {
  const userId = interaction.user.id;
  const user = data.users[userId];
  
  const item = getItem(itemId);
  if (!item) {
    await interaction.reply({ content: '❌ Item not found!', flags: 64 });
    return;
  }
  
  const result = purchaseItem(user, itemId);
  
  if (result.success) {
    await saveDataImmediate(data);
    await interaction.reply({ 
      content: `✅ ${result.message}\n\n**New Balance:** 💰 ${user.coins} Coins | 💎 ${user.gems} Gems`, 
      flags: 64 
    });
    
    const shop = activeShops.get(userId);
    if (shop && shop.message) {
      await showMainShopDirect(shop.message, data, userId);
    }
  } else {
    await interaction.reply({ content: `❌ ${result.message}`, flags: 64 });
  }
}

function closeShop(userId) {
  const shop = activeShops.get(userId);
  if (shop) {
    clearTimeout(shop.timeout);
    activeShops.delete(userId);
  }
}

module.exports = {
  openShop
};
