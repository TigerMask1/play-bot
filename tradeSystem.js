const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveData } = require('./dataManager.js');

const activeTrades = new Map();

async function initiateTrade(message, data, initiatorId, receiverId) {
  const tradeId = `${initiatorId}-${receiverId}-${Date.now()}`;
  
  if (activeTrades.has(initiatorId)) {
    await message.reply('❌ You already have an active trade!');
    return;
  }
  
  if (activeTrades.has(receiverId)) {
    await message.reply('❌ That user is already in a trade!');
    return;
  }
  
  const trade = {
    id: tradeId,
    initiator: initiatorId,
    receiver: receiverId,
    initiatorOffer: { coins: 0, gems: 0 },
    receiverOffer: { coins: 0, gems: 0 },
    initiatorConfirmed: false,
    receiverConfirmed: false,
    channel: message.channel,
    timeout: null
  };
  
  activeTrades.set(initiatorId, trade);
  activeTrades.set(receiverId, trade);
  
  const tradeEmbed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle('💱 Trade Initiated!')
    .setDescription(`<@${initiatorId}> wants to trade with <@${receiverId}>!\n\n**Instructions:**\n• Use \`!offer coins <amount>\` or \`!offer gems <amount>\` to add items\n• Use \`!confirm\` when ready\n• Use \`!cancel\` to cancel\n\nTrade will expire in 60 seconds if not completed.`);
  
  await message.channel.send({ embeds: [tradeEmbed] });
  
  trade.timeout = setTimeout(() => {
    if (activeTrades.has(initiatorId)) {
      expireTrade(trade, message.channel);
    }
  }, 60000);
  
  const collector = message.channel.createMessageCollector({
    filter: m => (m.author.id === initiatorId || m.author.id === receiverId) && m.content.startsWith('!'),
    time: 60000
  });
  
  collector.on('collect', async (m) => {
    await handleTradeMessage(m, trade, data);
  });
  
  collector.on('end', () => {
    if (activeTrades.has(initiatorId)) {
      expireTrade(trade, message.channel);
    }
  });
}

async function handleTradeMessage(message, trade, data) {
  const userId = message.author.id;
  const args = message.content.slice(1).split(/ +/);
  const command = args.shift().toLowerCase();
  
  if (!activeTrades.has(userId) || activeTrades.get(userId).id !== trade.id) {
    return;
  }
  
  const isInitiator = userId === trade.initiator;
  const userOffer = isInitiator ? trade.initiatorOffer : trade.receiverOffer;
  
  if (command === 'offer') {
    const type = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);
    
    if (!type || !amount || amount <= 0) {
      await message.reply('Usage: `!offer coins <amount>` or `!offer gems <amount>`');
      return;
    }
    
    if (type !== 'coins' && type !== 'gems') {
      await message.reply('You can only offer coins or gems!');
      return;
    }
    
    if (data.users[userId][type] < amount) {
      await message.reply(`❌ You don't have enough ${type}! You have ${data.users[userId][type]}.`);
      return;
    }
    
    userOffer[type] = amount;
    
    if (isInitiator) {
      trade.initiatorConfirmed = false;
    } else {
      trade.receiverConfirmed = false;
    }
    
    await updateTradeDisplay(trade, message.channel);
    
  } else if (command === 'confirm') {
    if (isInitiator) {
      trade.initiatorConfirmed = true;
      await message.channel.send(`✅ <@${userId}> confirmed their offer!`);
    } else {
      trade.receiverConfirmed = true;
      await message.channel.send(`✅ <@${userId}> confirmed their offer!`);
    }
    
    if (trade.initiatorConfirmed && trade.receiverConfirmed) {
      await completeTrade(trade, data, message.channel);
    }
    
  } else if (command === 'cancel') {
    await message.channel.send(`❌ <@${userId}> cancelled the trade!`);
    cancelTrade(trade);
  }
}

async function updateTradeDisplay(trade, channel) {
  const initiatorOffer = formatOffer(trade.initiatorOffer);
  const receiverOffer = formatOffer(trade.receiverOffer);
  
  const embed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('💱 Trade Status')
    .addFields(
      { 
        name: `<@${trade.initiator}>'s Offer ${trade.initiatorConfirmed ? '✅' : '⏳'}`, 
        value: initiatorOffer || 'Nothing yet', 
        inline: true 
      },
      { 
        name: `<@${trade.receiver}>'s Offer ${trade.receiverConfirmed ? '✅' : '⏳'}`, 
        value: receiverOffer || 'Nothing yet', 
        inline: true 
      }
    )
    .setFooter({ text: 'Use !confirm when ready, or !cancel to cancel' });
  
  await channel.send({ embeds: [embed] });
}

function formatOffer(offer) {
  const items = [];
  if (offer.coins > 0) items.push(`💰 ${offer.coins} coins`);
  if (offer.gems > 0) items.push(`💎 ${offer.gems} gems`);
  return items.join('\n') || null;
}

async function completeTrade(trade, data, channel) {
  const initiatorData = data.users[trade.initiator];
  const receiverData = data.users[trade.receiver];
  
  if (initiatorData.coins < trade.initiatorOffer.coins || 
      initiatorData.gems < trade.initiatorOffer.gems) {
    await channel.send('❌ Trade failed! Initiator doesn\'t have enough resources.');
    cancelTrade(trade);
    return;
  }
  
  if (receiverData.coins < trade.receiverOffer.coins || 
      receiverData.gems < trade.receiverOffer.gems) {
    await channel.send('❌ Trade failed! Receiver doesn\'t have enough resources.');
    cancelTrade(trade);
    return;
  }
  
  initiatorData.coins -= trade.initiatorOffer.coins;
  initiatorData.gems -= trade.initiatorOffer.gems;
  initiatorData.coins += trade.receiverOffer.coins;
  initiatorData.gems += trade.receiverOffer.gems;
  
  receiverData.coins -= trade.receiverOffer.coins;
  receiverData.gems -= trade.receiverOffer.gems;
  receiverData.coins += trade.initiatorOffer.coins;
  receiverData.gems += trade.initiatorOffer.gems;
  
  if (!initiatorData.questProgress) initiatorData.questProgress = {};
  initiatorData.questProgress.tradesCompleted = (initiatorData.questProgress.tradesCompleted || 0) + 1;
  
  if (!receiverData.questProgress) receiverData.questProgress = {};
  receiverData.questProgress.tradesCompleted = (receiverData.questProgress.tradesCompleted || 0) + 1;
  
  saveData(data);
  
  const successEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('✅ Trade Completed!')
    .setDescription(`<@${trade.initiator}> and <@${trade.receiver}> completed their trade!`)
    .addFields(
      { name: `<@${trade.initiator}> received`, value: formatOffer(trade.receiverOffer) || 'Nothing', inline: true },
      { name: `<@${trade.receiver}> received`, value: formatOffer(trade.initiatorOffer) || 'Nothing', inline: true }
    );
  
  await channel.send({ embeds: [successEmbed] });
  
  cancelTrade(trade);
}

async function expireTrade(trade, channel) {
  await channel.send(`⏰ Trade between <@${trade.initiator}> and <@${trade.receiver}> expired!`);
  cancelTrade(trade);
}

function cancelTrade(trade) {
  if (trade.timeout) {
    clearTimeout(trade.timeout);
  }
  activeTrades.delete(trade.initiator);
  activeTrades.delete(trade.receiver);
}

module.exports = { initiateTrade };
