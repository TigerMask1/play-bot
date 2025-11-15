const { EmbedBuilder } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');

let giveawayData = {
  isActive: false,
  channel: null,
  drawTime: '20:00',
  prize: {
    coins: 5000,
    gems: 100,
    crates: { type: 'gold', count: 3 }
  },
  participants: [],
  lastDrawDate: null,
  dailyWinners: []
};

let giveawayInterval = null;
let client = null;

function initializeGiveawaySystem(discordClient, data) {
  client = discordClient;
  
  if (data.giveawayData) {
    giveawayData = { ...giveawayData, ...data.giveawayData };
  }
  
  if (giveawayData.isActive) {
    startGiveawayScheduler();
  }
  
  console.log('✅ Daily Giveaway System initialized');
}

function startGiveawayScheduler() {
  if (giveawayInterval) {
    clearInterval(giveawayInterval);
  }
  
  giveawayInterval = setInterval(async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0];
    
    if (currentTime === giveawayData.drawTime && giveawayData.lastDrawDate !== currentDate) {
      giveawayData.lastDrawDate = currentDate;
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.giveawayData = giveawayData;
      await saveDataImmediate(data);
      
      await performDailyDraw();
    }
  }, 60000);
  
  console.log(`⏰ Giveaway scheduler started - Draw time: ${giveawayData.drawTime}`);
}

async function performDailyDraw() {
  if (!giveawayData.isActive || !giveawayData.channel || giveawayData.participants.length === 0) {
    return;
  }
  
  try {
    const channel = await client.channels.fetch(giveawayData.channel);
    if (!channel) return;
    
    const winnerIndex = Math.floor(Math.random() * giveawayData.participants.length);
    const winnerId = giveawayData.participants[winnerIndex];
    
    const winner = await client.users.fetch(winnerId).catch(() => null);
    if (!winner) {
      giveawayData.participants = [];
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.giveawayData = giveawayData;
      await saveDataImmediate(data);
      return;
    }
    
    const winnerEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎉 DAILY GIVEAWAY WINNER! 🎉')
      .setDescription(`Congratulations **${winner.username}**!\n\nYou won today's giveaway!`)
      .addFields(
        { name: '💰 Coins', value: `${giveawayData.prize.coins.toLocaleString()}`, inline: true },
        { name: '💎 Gems', value: `${giveawayData.prize.gems.toLocaleString()}`, inline: true },
        { name: '🎁 Crates', value: `${giveawayData.prize.crates.count}x ${giveawayData.prize.crates.type}`, inline: true },
        { name: '👥 Total Participants', value: `${giveawayData.participants.length}`, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Register for tomorrow\'s giveaway with !giveaway join' });
    
    await channel.send({ content: `<@${winnerId}>`, embeds: [winnerEmbed] });
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    
    if (data.users[winnerId]) {
      data.users[winnerId].coins = (data.users[winnerId].coins || 0) + giveawayData.prize.coins;
      data.users[winnerId].gems = (data.users[winnerId].gems || 0) + giveawayData.prize.gems;
      
      const crateKey = `${giveawayData.prize.crates.type}Crates`;
      data.users[winnerId][crateKey] = (data.users[winnerId][crateKey] || 0) + giveawayData.prize.crates.count;
      
      await saveDataImmediate(data);
    }
    
    giveawayData.dailyWinners.push({
      userId: winnerId,
      username: winner.username,
      date: new Date().toISOString(),
      participants: giveawayData.participants.length
    });
    
    if (giveawayData.dailyWinners.length > 30) {
      giveawayData.dailyWinners = giveawayData.dailyWinners.slice(-30);
    }
    
    giveawayData.participants = [];
    
    data.giveawayData = giveawayData;
    await saveDataImmediate(data);
    
    const reminderEmbed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle('🎁 New Daily Giveaway Available!')
      .setDescription(`A new giveaway has started! Register now for your chance to win!\n\n**Prize Pool:**\n💰 ${giveawayData.prize.coins.toLocaleString()} Coins\n💎 ${giveawayData.prize.gems} Gems\n🎁 ${giveawayData.prize.crates.count}x ${giveawayData.prize.crates.type} Crates\n\n**Draw Time:** ${giveawayData.drawTime}\n\nUse \`!giveaway join\` to register!`)
      .setFooter({ text: 'You must register daily - registrations reset after each draw' });
    
    await channel.send({ embeds: [reminderEmbed] });
    
    console.log(`🎉 Daily giveaway completed! Winner: ${winner.username}`);
  } catch (error) {
    console.error('Error performing daily draw:', error);
  }
}

function joinGiveaway(userId, username) {
  if (!giveawayData.isActive) {
    return { success: false, message: '❌ The daily giveaway is not currently active!' };
  }
  
  if (giveawayData.participants.includes(userId)) {
    return { success: false, message: '⚠️ You are already registered for today\'s giveaway!' };
  }
  
  giveawayData.participants.push(userId);
  
  return {
    success: true,
    message: `✅ **${username}**, you've been registered for today's giveaway!\n\n**Current Participants:** ${giveawayData.participants.length}\n**Draw Time:** ${giveawayData.drawTime}\n**Prize:** ${giveawayData.prize.coins.toLocaleString()} coins, ${giveawayData.prize.gems} gems, ${giveawayData.prize.crates.count}x ${giveawayData.prize.crates.type} crates\n\nGood luck! 🍀`
  };
}

function getGiveawayInfo() {
  const nextDraw = new Date();
  const [hours, minutes] = giveawayData.drawTime.split(':');
  nextDraw.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (nextDraw < new Date()) {
    nextDraw.setDate(nextDraw.getDate() + 1);
  }
  
  const timeUntilDraw = nextDraw - new Date();
  const hoursLeft = Math.floor(timeUntilDraw / 3600000);
  const minutesLeft = Math.floor((timeUntilDraw % 3600000) / 60000);
  
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🎁 Daily Giveaway Information')
    .setDescription(giveawayData.isActive ? 'The daily giveaway is **ACTIVE**!' : 'The daily giveaway is **INACTIVE**')
    .addFields(
      { name: '💰 Prize Pool', value: `${giveawayData.prize.coins.toLocaleString()} Coins\n${giveawayData.prize.gems} Gems\n${giveawayData.prize.crates.count}x ${giveawayData.prize.crates.type} Crates`, inline: true },
      { name: '⏰ Draw Time', value: giveawayData.drawTime, inline: true },
      { name: '⏳ Time Until Draw', value: `${hoursLeft}h ${minutesLeft}m`, inline: true },
      { name: '👥 Current Participants', value: `${giveawayData.participants.length}`, inline: true },
      { name: '📍 Channel', value: giveawayData.channel ? `<#${giveawayData.channel}>` : 'Not set', inline: true },
      { name: '📝 How to Join', value: 'Use `!giveaway join` to register', inline: false }
    );
  
  if (giveawayData.dailyWinners.length > 0) {
    const recentWinners = giveawayData.dailyWinners.slice(-5).reverse();
    const winnersText = recentWinners.map(w => {
      const date = new Date(w.date).toLocaleDateString();
      return `**${w.username}** - ${date} (${w.participants} participants)`;
    }).join('\n');
    embed.addFields({ name: '🏆 Recent Winners', value: winnersText });
  }
  
  return embed;
}

function startGiveaway(channelId) {
  giveawayData.isActive = true;
  giveawayData.channel = channelId;
  giveawayData.participants = [];
  startGiveawayScheduler();
  
  return { success: true, message: `✅ Daily giveaway started in <#${channelId}>!\n\n**Draw Time:** ${giveawayData.drawTime}\n**Prize:** ${giveawayData.prize.coins.toLocaleString()} coins, ${giveawayData.prize.gems} gems, ${giveawayData.prize.crates.count}x ${giveawayData.prize.crates.type} crates` };
}

function stopGiveaway() {
  giveawayData.isActive = false;
  if (giveawayInterval) {
    clearInterval(giveawayInterval);
    giveawayInterval = null;
  }
  
  return { success: true, message: '✅ Daily giveaway has been stopped!' };
}

function setGiveawayTime(time) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) {
    return { success: false, message: '❌ Invalid time format! Use HH:MM (24-hour format). Example: 20:00' };
  }
  
  giveawayData.drawTime = time;
  
  if (giveawayData.isActive) {
    startGiveawayScheduler();
  }
  
  return { success: true, message: `✅ Giveaway draw time set to **${time}**` };
}

function setGiveawayPrize(coins, gems, crateType, crateCount) {
  const validCrateTypes = ['bronze', 'silver', 'gold', 'emerald', 'legendary', 'tyrant'];
  
  if (!validCrateTypes.includes(crateType.toLowerCase())) {
    return { success: false, message: `❌ Invalid crate type! Valid types: ${validCrateTypes.join(', ')}` };
  }
  
  giveawayData.prize = {
    coins: parseInt(coins),
    gems: parseInt(gems),
    crates: { type: crateType.toLowerCase(), count: parseInt(crateCount) }
  };
  
  return { success: true, message: `✅ Giveaway prize updated!\n💰 ${coins.toLocaleString()} Coins\n💎 ${gems} Gems\n🎁 ${crateCount}x ${crateType} Crates` };
}

function getGiveawayData() {
  return giveawayData;
}

module.exports = {
  initializeGiveawaySystem,
  joinGiveaway,
  getGiveawayInfo,
  startGiveaway,
  stopGiveaway,
  setGiveawayTime,
  setGiveawayPrize,
  getGiveawayData
};
