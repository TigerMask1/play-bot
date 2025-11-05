const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { saveData } = require('./dataManager.js');
const { getAllShopItems, getItemsByCategory, purchaseItem } = require('./itemsSystem.js');

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
    .setDescription(`Welcome to the Battle Shop, ${message.author.username}!\n\n**Your Balance:**\n💰 Coins: ${user.coins}\n💎 Gems: ${user.gems}\n\nSelect a category below to browse items!`)
    .addFields(
      { name: '🧪 Healing Items', value: 'Restore HP during battle', inline: true },
      { name: '⚡ Energy Items', value: 'Restore energy for moves', inline: true },
      { name: '💪 Stat Boosts', value: 'Temporary battle buffs', inline: true },
      { name: '✨ Special Items', value: 'Unique battle effects', inline: true }
    )
    .setFooter({ text: 'Select a category to view items' });
  
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
  
  const shopMessage = await message.reply({ 
    embeds: [shopEmbed], 
    components: [row1, row2] 
  });
  
  activeShops.set(userId, {
    message: shopMessage,
    user: user,
    timeout: setTimeout(() => {
      closeShop(userId, shopMessage);
    }, 300000) // 5 minutes
  });
  
  const filter = (interaction) => {
    return interaction.user.id === userId && 
           (interaction.customId.startsWith('shop_') || interaction.customId.startsWith('buy_'));
  };
  
  const collector = shopMessage.createMessageComponentCollector({ filter, time: 300000 });
  
  collector.on('collect', async (interaction) => {
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
    } else if (interaction.customId.startsWith('buy_')) {
      await handlePurchase(interaction, data);
    } else if (interaction.customId === `shop_back_${userId}`) {
      await showMainShop(interaction, data);
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
    .setDescription(`Welcome to the Battle Shop, ${interaction.user.username}!\n\n**Your Balance:**\n💰 Coins: ${user.coins}\n💎 Gems: ${user.gems}\n\nSelect a category below to browse items!`)
    .addFields(
      { name: '🧪 Healing Items', value: 'Restore HP during battle', inline: true },
      { name: '⚡ Energy Items', value: 'Restore energy for moves', inline: true },
      { name: '💪 Stat Boosts', value: 'Temporary battle buffs', inline: true },
      { name: '✨ Special Items', value: 'Unique battle effects', inline: true }
    )
    .setFooter({ text: 'Select a category to view items' });
  
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
      ? `${item.cost.coins} 💰 + ${item.cost.gems} 💎`
      : `${item.cost.coins} 💰`;
    const owned = user.inventory && user.inventory[item.id] ? user.inventory[item.id] : 0;
    return `${item.emoji} **${item.name}**\n${item.description}\n**Cost:** ${costStr} | **Owned:** ${owned}`;
  }).join('\n\n');
  
  const categoryEmbed = new EmbedBuilder()
    .setColor('#00D9FF')
    .setTitle(categoryNames[category])
    .setDescription(`**Your Balance:**\n💰 Coins: ${user.coins}\n💎 Gems: ${user.gems}\n\n${itemsDescription}`)
    .setFooter({ text: 'Select an item to purchase' });
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`buy_${userId}`)
    .setPlaceholder('Choose an item to buy')
    .addOptions(
      items.map(item => ({
        label: `${item.name} - ${item.cost.gems > 0 ? `${item.cost.coins}💰 + ${item.cost.gems}💎` : `${item.cost.coins}💰`}`,
        value: item.id,
        description: item.description.substring(0, 100),
        emoji: item.emoji
      }))
    );
  
  const backButton = new ButtonBuilder()
    .setCustomId(`shop_back_${userId}`)
    .setLabel('Back')
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

async function handlePurchase(interaction, data) {
  const userId = interaction.user.id;
  const user = data.users[userId];
  const itemId = interaction.values[0];
  
  const result = purchaseItem(user, itemId);
  
  if (result.success) {
    saveData(data);
    
    // Update the interaction first to show main shop
    await showMainShop(interaction, data);
    
    // Then send a followUp message with the success notification
    await interaction.followUp({ 
      content: `✅ ${result.message}`, 
      flags: 64
    });
  } else {
    await interaction.reply({ 
      content: `❌ ${result.message}`, 
      flags: 64
    });
  }
}

function closeShop(userId, message = null) {
  const shop = activeShops.get(userId);
  if (shop) {
    clearTimeout(shop.timeout);
    activeShops.delete(userId);
  }
}

module.exports = {
  openShop
};
