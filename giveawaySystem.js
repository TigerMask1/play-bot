const { EmbedBuilder } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { getEventsChannel, isMainServer } = require('./serverConfigManager.js');

let giveawayData = {
  active: false,
  channelId: null,
  drawTime: '04:00',
  participants: [],
  lastDrawDate: null,
  prizeConfig: {
    gems: 5000,
    shards: 500,
    tyrantCrates: 1,
    legendaryCrates: 2
  },
  winnersHistory: [],
  manualGiveaway: {
    active: false,
    endTime: null
  }
};

let giveawayInterval = null;
let activeClient = null;

function getGiveawayData() {
  return giveawayData;
}

function setGiveawayData(data) {
  if (data) {
    giveawayData = { ...data };
    if (!giveawayData.manualGiveaway) {
      giveawayData.manualGiveaway = { active: false, endTime: null };
    }
  }
}

function startGiveawayScheduler() {
  if (giveawayInterval) {
    clearInterval(giveawayInterval);
  }
  
  giveawayInterval = setInterval(async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0];
    
    if (giveawayData.manualGiveaway.active && giveawayData.manualGiveaway.endTime && Date.now() >= giveawayData.manualGiveaway.endTime) {
      console.log('⏰ Manual giveaway ended, performing draw...');
      giveawayData.lastDrawDate = currentDate;
      await performDailyDraw();
    }
    
    if (currentTime === giveawayData.drawTime && giveawayData.lastDrawDate !== currentDate && !giveawayData.manualGiveaway.active) {
      giveawayData.lastDrawDate = currentDate;
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.giveawayData = giveawayData;
      await saveDataImmediate(data);
      
      await performDailyDraw();
    }
  }, 60000);
  
  console.log(`⏰ Giveaway scheduler started - Draw time: ${giveawayData.drawTime} UTC (9:30 IST)`);
}

async function performDailyDraw() {
  if (!activeClient || (!giveawayData.active && !giveawayData.manualGiveaway.active)) {
    console.log('⚠️ Giveaway draw skipped - not active');
    return;
  }
  
  if (giveawayData.participants.length === 0) {
    console.log('⚠️ Giveaway draw skipped - no participants');
    giveawayData.participants = [];
    if (giveawayData.manualGiveaway.active) {
      giveawayData.manualGiveaway = { active: false, endTime: null };
    }
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    data.giveawayData = giveawayData;
    await saveDataImmediate(data);
    return;
  }
  
  try {
    const winnerIndex = Math.floor(Math.random() * giveawayData.participants.length);
    const winnerId = giveawayData.participants[winnerIndex];
    
    const winner = await activeClient.users.fetch(winnerId).catch(() => null);
    if (!winner) {
      giveawayData.participants = [];
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.giveawayData = giveawayData;
      await saveDataImmediate(data);
      return;
    }
    
    const prizes = [];
    const prizeType = Math.floor(Math.random() * 4);
    
    let prizeDescription = `**Winner:** ${winner.tag}\n\n**Prizes:**\n`;
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    
    if (!data.users[winnerId]) {
      data.users[winnerId] = { coins: 0, gems: 0, characters: [], crates: {} };
    }
    
    if (!data.users[winnerId].crates) {
      data.users[winnerId].crates = {};
    }
    
    switch(prizeType) {
      case 0:
        prizeDescription += `🔥 1x Tyrant Crate\n💎 ${giveawayData.prizeConfig.gems.toLocaleString()} Gems\n`;
        data.users[winnerId].crates['tyrant'] = (data.users[winnerId].crates['tyrant'] || 0) + 1;
        data.users[winnerId].gems = (data.users[winnerId].gems || 0) + giveawayData.prizeConfig.gems;
        break;
      case 1:
        prizeDescription += `📦 2x Legendary Crates\n💎 ${giveawayData.prizeConfig.gems.toLocaleString()} Gems\n`;
        data.users[winnerId].crates['legendary'] = (data.users[winnerId].crates['legendary'] || 0) + 2;
        data.users[winnerId].gems = (data.users[winnerId].gems || 0) + giveawayData.prizeConfig.gems;
        break;
      case 2:
        const gemPrize = giveawayData.prizeConfig.gems * 3;
        prizeDescription += `💎 ${gemPrize.toLocaleString()} Gems\n`;
        data.users[winnerId].gems = (data.users[winnerId].gems || 0) + gemPrize;
        break;
      case 3:
        prizeDescription += `✨ ${giveawayData.prizeConfig.shards.toLocaleString()} Shards\n💎 ${giveawayData.prizeConfig.gems.toLocaleString()} Gems\n`;
        data.users[winnerId].shards = (data.users[winnerId].shards || 0) + giveawayData.prizeConfig.shards;
        data.users[winnerId].gems = (data.users[winnerId].gems || 0) + giveawayData.prizeConfig.gems;
        break;
    }
    
    prizeDescription += `\nCongratulations! 🎊`;
    
    const winnerEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎉 DAILY GIVEAWAY WINNER! 🎉')
      .setDescription(prizeDescription)
      .setFooter({ text: 'Join tomorrow for another chance to win!' })
      .setTimestamp();
    
    const participantCount = giveawayData.participants.length;
    
    giveawayData.winnersHistory.unshift({
      userId: winnerId,
      username: winner.tag,
      date: new Date().toISOString(),
      participants: participantCount
    });
    
    if (giveawayData.winnersHistory.length > 30) {
      giveawayData.winnersHistory = giveawayData.winnersHistory.slice(0, 30);
    }
    
    giveawayData.participants = [];
    
    if (giveawayData.manualGiveaway.active) {
      giveawayData.manualGiveaway = { active: false, endTime: null };
    }
    
    data.giveawayData = giveawayData;
    await saveDataImmediate(data);
    
    const mainChannel = await activeClient.channels.fetch(giveawayData.channelId).catch(() => null);
    if (mainChannel) {
      await mainChannel.send({ embeds: [winnerEmbed] }).catch(err => {
        console.error('Failed to send winner announcement to main server:', err.message);
      });
    }
    
    await broadcastToAllServers(winnerEmbed);
    
    console.log(`✅ Giveaway winner: ${winner.tag} (${participantCount} participants)`);
    
  } catch (error) {
    console.error('❌ Error performing giveaway draw:', error);
    if (giveawayData.manualGiveaway.active) {
      giveawayData.manualGiveaway = { active: false, endTime: null };
    }
  }
}

async function broadcastToAllServers(embed) {
  if (!activeClient) return;
  
  try {
    for (const guild of activeClient.guilds.cache.values()) {
      if (!isMainServer(guild.id)) {
        const targetChannelId = getEventsChannel(guild.id);
        
        if (targetChannelId) {
          const channel = await activeClient.channels.fetch(targetChannelId).catch(() => null);
          if (channel) {
            await channel.send({ embeds: [embed] }).catch(err => {
              console.error(`Failed to send giveaway result to server ${guild.id}:`, err.message);
            });
          }
        }
      }
    }
    console.log('✅ Giveaway results broadcasted to non-main servers');
  } catch (error) {
    console.error('❌ Error broadcasting giveaway results:', error);
  }
}

async function broadcastGiveawayStart() {
  if (!activeClient) return;
  
  const mainServerEmbed = new EmbedBuilder()
    .setColor('#00D9FF')
    .setTitle('🎉 GIVEAWAY IS NOW ACTIVE!')
    .setDescription(
      `A new giveaway has started!\n\n` +
      `**Possible Prizes:**\n` +
      `🔥 Tyrant Crate + Gems\n` +
      `📦 2x Legendary Crates + Gems\n` +
      `💎 ${(giveawayData.prizeConfig.gems * 3).toLocaleString()} Gems\n` +
      `✨ ${giveawayData.prizeConfig.shards.toLocaleString()} Shards + Gems\n\n` +
      `Use \`!joingiveaway\` to enter!`
    )
    .setFooter({ text: 'Winners will be announced when the giveaway ends!' })
    .setTimestamp();
  
  const otherServerEmbed = new EmbedBuilder()
    .setColor('#00D9FF')
    .setTitle('🎉 GIVEAWAY ALERT!')
    .setDescription(
      `A new giveaway has started in the main server!\n\n` +
      `**Possible Prizes:**\n` +
      `🔥 Tyrant Crate + Gems\n` +
      `📦 2x Legendary Crates + Gems\n` +
      `💎 ${(giveawayData.prizeConfig.gems * 3).toLocaleString()} Gems\n` +
      `✨ ${giveawayData.prizeConfig.shards.toLocaleString()} Shards + Gems\n\n` +
      `**⚠️ Join the main server to participate!**\n` +
      `Giveaways are exclusive to the main server!`
    )
    .setFooter({ text: 'Contact server admins for the main server invite!' })
    .setTimestamp();
  
  try {
    for (const guild of activeClient.guilds.cache.values()) {
      if (isMainServer(guild.id)) {
        if (giveawayData.channelId) {
          const channel = await activeClient.channels.fetch(giveawayData.channelId).catch(() => null);
          if (channel) {
            await channel.send({ embeds: [mainServerEmbed] }).catch(err => {
              console.error(`Failed to send giveaway start to main server:`, err.message);
            });
          }
        }
      } else {
        const eventsChannelId = getEventsChannel(guild.id);
        if (eventsChannelId) {
          const channel = await activeClient.channels.fetch(eventsChannelId).catch(() => null);
          if (channel) {
            await channel.send({ embeds: [otherServerEmbed] }).catch(err => {
              console.error(`Failed to send giveaway alert to server ${guild.id}:`, err.message);
            });
          }
        }
      }
    }
    console.log('✅ Giveaway notifications broadcasted to all servers');
  } catch (error) {
    console.error('❌ Error broadcasting giveaway start:', error);
  }
}

function initializeGiveawaySystem(client) {
  activeClient = client;
  if (giveawayData.active) {
    startGiveawayScheduler();
  }
  console.log('✅ Giveaway system initialized');
}

async function startGiveaway(channelId) {
  giveawayData.active = true;
  giveawayData.channelId = channelId;
  startGiveawayScheduler();
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.giveawayData = giveawayData;
  await saveDataImmediate(data);
  
  await broadcastGiveawayStart();
}

async function stopGiveaway() {
  giveawayData.active = false;
  if (giveawayInterval) {
    clearInterval(giveawayInterval);
    giveawayInterval = null;
  }
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.giveawayData = giveawayData;
  await saveDataImmediate(data);
}

async function startManualGiveaway(durationMinutes) {
  if (giveawayData.manualGiveaway.active) {
    return { success: false, message: '❌ A manual giveaway is already active!' };
  }
  
  const now = new Date();
  const drawTime = new Date(now.getTime() + durationMinutes * 60000);
  
  const scheduledDrawTime = `${giveawayData.drawTime.split(':')[0]}:${giveawayData.drawTime.split(':')[1]}`;
  const [schedHour, schedMin] = scheduledDrawTime.split(':').map(Number);
  const scheduledTime = new Date(now);
  scheduledTime.setUTCHours(schedHour, schedMin, 0, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  if (drawTime.getTime() >= scheduledTime.getTime() - 30 * 60000) {
    giveawayData.manualGiveaway.endTime = scheduledTime.getTime() - 5 * 60000;
  } else {
    giveawayData.manualGiveaway.endTime = drawTime.getTime();
  }
  
  giveawayData.manualGiveaway.active = true;
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.giveawayData = giveawayData;
  await saveDataImmediate(data);
  
  await broadcastGiveawayStart();
  
  return { 
    success: true, 
    message: `✅ Manual giveaway started!\n⏰ Draw time: <t:${Math.floor(giveawayData.manualGiveaway.endTime / 1000)}:F>\n📢 All servers have been notified!` 
  };
}

async function stopManualGiveaway() {
  if (!giveawayData.manualGiveaway.active) {
    return { success: false, message: '❌ No manual giveaway is currently active!' };
  }
  
  await performDailyDraw();
  giveawayData.manualGiveaway = { active: false, endTime: null };
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.giveawayData = giveawayData;
  await saveDataImmediate(data);
  
  return { success: true, message: '✅ Manual giveaway ended and winner announced!' };
}

async function getGiveawayInfo() {
  if (!giveawayData.active) {
    return { success: false, message: '❌ Giveaway system is not active!' };
  }
  
  const isManual = giveawayData.manualGiveaway.active;
  let timeInfo = '';
  
  if (isManual) {
    timeInfo = `⏰ Manual giveaway ends: <t:${Math.floor(giveawayData.manualGiveaway.endTime / 1000)}:R>`;
  } else {
    const now = new Date();
    const [hour, min] = giveawayData.drawTime.split(':').map(Number);
    const nextDraw = new Date();
    nextDraw.setUTCHours(hour, min, 0, 0);
    if (nextDraw <= now) {
      nextDraw.setDate(nextDraw.getDate() + 1);
    }
    timeInfo = `⏰ Next daily draw: <t:${Math.floor(nextDraw.getTime() / 1000)}:F> (9:30 IST)`;
  }
  
  return {
    success: true,
    message: `**🎉 Giveaway Status**\n\n` +
      `${timeInfo}\n` +
      `👥 Current participants: ${giveawayData.participants.length}\n` +
      `📢 Type: ${isManual ? 'Manual' : 'Daily Scheduled'}\n\n` +
      `Use \`!joingiveaway\` to enter!`
  };
}

async function joinGiveaway(userId, guildId) {
  if (!guildId || !isMainServer(guildId)) {
    return { success: false, message: '❌ Giveaways can only be joined from the main server! Join the main server to participate!' };
  }
  
  if (!giveawayData.active && !giveawayData.manualGiveaway.active) {
    return { success: false, message: '❌ The giveaway is not currently active!' };
  }
  
  if (giveawayData.participants.includes(userId)) {
    return { success: false, message: '❌ You have already joined this giveaway!' };
  }
  
  giveawayData.participants.push(userId);
  return { success: true, message: `✅ You have been entered into the giveaway!\n👥 Total participants: ${giveawayData.participants.length}` };
}

module.exports = {
  initializeGiveawaySystem,
  startGiveaway,
  stopGiveaway,
  startManualGiveaway,
  stopManualGiveaway,
  performDailyDraw,
  joinGiveaway,
  getGiveawayInfo,
  getGiveawayData,
  setGiveawayData
};
