const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');

let activeGiveaway = {
  active: false,
  channelId: null,
  messageId: null,
  participants: [],
  endTime: null,
  prizes: {
    gems: 5000,
    coins: 10000,
    crates: { legendary: 2 }
  }
};

let activeClient = null;

function getGiveawayData() {
  return activeGiveaway;
}

function setGiveawayData(data) {
  if (data && data.giveaway) {
    activeGiveaway = {
      active: data.giveaway.active || false,
      channelId: data.giveaway.channelId || null,
      messageId: data.giveaway.messageId || null,
      participants: data.giveaway.participants || [],
      endTime: data.giveaway.endTime || null,
      prizes: data.giveaway.prizes || {
        gems: 5000,
        coins: 10000,
        crates: { legendary: 2 }
      }
    };
  }
}

function initializeGiveawaySystem(client) {
  activeClient = client;
  console.log('✅ Simplified giveaway system initialized');
}

async function startGiveaway(channelId, durationMinutes) {
  if (activeGiveaway.active) {
    return { success: false, message: '❌ A giveaway is already running! Use `!endgiveaway` to end it first.' };
  }

  activeGiveaway = {
    active: true,
    channelId: channelId,
    messageId: null,
    participants: [],
    endTime: Date.now() + (durationMinutes * 60 * 1000),
    prizes: {
      gems: 5000,
      coins: 10000,
      crates: { legendary: 2 }
    }
  };

  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  if (!data.giveaway) {
    data.giveaway = {};
  }
  data.giveaway = activeGiveaway;
  await saveDataImmediate(data);

  const giveawayEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎉 GIVEAWAY STARTED!')
    .setDescription(
      `**Duration:** ${durationMinutes} minutes\n` +
      `**Ends:** <t:${Math.floor(activeGiveaway.endTime / 1000)}:R>\n\n` +
      `**Prizes:**\n` +
      `💎 ${activeGiveaway.prizes.gems.toLocaleString()} Gems\n` +
      `💰 ${activeGiveaway.prizes.coins.toLocaleString()} Coins\n` +
      `📦 ${activeGiveaway.prizes.crates.legendary}x Legendary Crates\n\n` +
      `**Click the button below to enter!**\n` +
      `👥 Participants: 0`
    )
    .setFooter({ text: 'Good luck everyone!' })
    .setTimestamp();

  const button = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('join_giveaway')
        .setLabel('🎁 Join Giveaway')
        .setStyle(ButtonStyle.Success)
    );

  try {
    const channel = await activeClient.channels.fetch(channelId);
    const message = await channel.send({ embeds: [giveawayEmbed], components: [button] });
    
    activeGiveaway.messageId = message.id;
    data.giveaway.messageId = message.id;
    await saveDataImmediate(data);

    setTimeout(async () => {
      if (activeGiveaway.active && activeGiveaway.endTime <= Date.now() + 1000) {
        await endGiveaway();
      }
    }, durationMinutes * 60 * 1000);

    return { 
      success: true, 
      message: `✅ Giveaway started! It will end <t:${Math.floor(activeGiveaway.endTime / 1000)}:R>` 
    };
  } catch (error) {
    console.error('Error starting giveaway:', error);
    activeGiveaway.active = false;
    return { success: false, message: '❌ Failed to start giveaway. Check the channel ID.' };
  }
}

async function handleButtonJoin(interaction) {
  if (!activeGiveaway.active) {
    return await interaction.reply({ 
      content: '❌ This giveaway has ended!', 
      ephemeral: true 
    });
  }

  const userId = interaction.user.id;

  if (activeGiveaway.participants.includes(userId)) {
    return await interaction.reply({ 
      content: '✅ You are already entered in this giveaway!', 
      ephemeral: true 
    });
  }

  activeGiveaway.participants.push(userId);

  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.giveaway = activeGiveaway;
  await saveDataImmediate(data);

  const updatedEmbed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎉 GIVEAWAY STARTED!')
    .setDescription(
      `**Duration:** Ends <t:${Math.floor(activeGiveaway.endTime / 1000)}:R>\n\n` +
      `**Prizes:**\n` +
      `💎 ${activeGiveaway.prizes.gems.toLocaleString()} Gems\n` +
      `💰 ${activeGiveaway.prizes.coins.toLocaleString()} Coins\n` +
      `📦 ${activeGiveaway.prizes.crates.legendary}x Legendary Crates\n\n` +
      `**Click the button below to enter!**\n` +
      `👥 Participants: ${activeGiveaway.participants.length}`
    )
    .setFooter({ text: 'Good luck everyone!' })
    .setTimestamp();

  try {
    await interaction.update({ embeds: [updatedEmbed] });
  } catch (error) {
    console.error('Error updating giveaway message:', error);
  }

  return await interaction.followUp({ 
    content: '🎉 You have successfully joined the giveaway! Good luck!', 
    ephemeral: true 
  });
}

async function endGiveaway() {
  if (!activeGiveaway.active) {
    return { success: false, message: '❌ No giveaway is currently active!' };
  }

  if (activeGiveaway.participants.length === 0) {
    activeGiveaway.active = false;
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    data.giveaway = activeGiveaway;
    await saveDataImmediate(data);

    try {
      if (activeGiveaway.channelId && activeGiveaway.messageId) {
        const channel = await activeClient.channels.fetch(activeGiveaway.channelId);
        const message = await channel.messages.fetch(activeGiveaway.messageId);
        
        const noParticipantsEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('🎉 GIVEAWAY ENDED')
          .setDescription('No one participated in this giveaway. Better luck next time!')
          .setTimestamp();

        await message.edit({ embeds: [noParticipantsEmbed], components: [] });
      }
    } catch (error) {
      console.error('Error updating giveaway message:', error);
    }

    return { success: true, message: '⚠️ Giveaway ended with no participants.' };
  }

  const winnerIndex = Math.floor(Math.random() * activeGiveaway.participants.length);
  const winnerId = activeGiveaway.participants[winnerIndex];

  try {
    const winner = await activeClient.users.fetch(winnerId);
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();

    if (!data.users[winnerId]) {
      data.users[winnerId] = { coins: 0, gems: 0, characters: [], crates: {} };
    }

    if (!data.users[winnerId].crates) {
      data.users[winnerId].crates = {};
    }

    data.users[winnerId].gems = (data.users[winnerId].gems || 0) + activeGiveaway.prizes.gems;
    data.users[winnerId].coins = (data.users[winnerId].coins || 0) + activeGiveaway.prizes.coins;
    data.users[winnerId].crates.legendary = (data.users[winnerId].crates.legendary || 0) + activeGiveaway.prizes.crates.legendary;

    const winnerEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎊 GIVEAWAY WINNER!')
      .setDescription(
        `**Winner:** ${winner.tag}\n\n` +
        `**Prizes Won:**\n` +
        `💎 ${activeGiveaway.prizes.gems.toLocaleString()} Gems\n` +
        `💰 ${activeGiveaway.prizes.coins.toLocaleString()} Coins\n` +
        `📦 ${activeGiveaway.prizes.crates.legendary}x Legendary Crates\n\n` +
        `Congratulations! 🎉\n` +
        `Total Participants: ${activeGiveaway.participants.length}`
      )
      .setFooter({ text: 'Thanks everyone for participating!' })
      .setTimestamp();

    if (activeGiveaway.channelId && activeGiveaway.messageId) {
      const channel = await activeClient.channels.fetch(activeGiveaway.channelId);
      const message = await channel.messages.fetch(activeGiveaway.messageId);
      await message.edit({ embeds: [winnerEmbed], components: [] });
    }

    activeGiveaway.active = false;
    data.giveaway = activeGiveaway;
    await saveDataImmediate(data);

    return { 
      success: true, 
      message: `🎉 Giveaway ended! Winner: ${winner.tag}`,
      winner: winner.tag
    };
  } catch (error) {
    console.error('Error ending giveaway:', error);
    activeGiveaway.active = false;
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    data.giveaway = activeGiveaway;
    await saveDataImmediate(data);

    return { success: false, message: '❌ Error ending giveaway.' };
  }
}

function getGiveawayStatus() {
  if (!activeGiveaway.active) {
    return { active: false, message: '❌ No giveaway is currently active!' };
  }

  const timeLeft = activeGiveaway.endTime - Date.now();
  const minutesLeft = Math.floor(timeLeft / 60000);

  return {
    active: true,
    participants: activeGiveaway.participants.length,
    timeLeft: minutesLeft,
    endTime: activeGiveaway.endTime
  };
}

module.exports = {
  initializeGiveawaySystem,
  startGiveaway,
  endGiveaway,
  handleButtonJoin,
  getGiveawayStatus,
  getGiveawayData,
  setGiveawayData
};
