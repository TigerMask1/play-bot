const { EmbedBuilder } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');

let lotteryData = {
  isActive: false,
  channel: null,
  drawTime: '21:00',
  entryFee: 100,
  prizePool: 0,
  participants: [],
  lastDrawDate: null,
  dailyWinners: [],
  maxEntriesPerUser: 5
};

let lotteryInterval = null;
let client = null;

function initializeLotterySystem(discordClient, data) {
  client = discordClient;
  
  if (data.lotteryData) {
    lotteryData = { ...lotteryData, ...data.lotteryData };
  }
  
  if (lotteryData.isActive) {
    startLotteryScheduler();
  }
  
  console.log('✅ Daily Lottery System initialized');
}

function startLotteryScheduler() {
  if (lotteryInterval) {
    clearInterval(lotteryInterval);
  }
  
  lotteryInterval = setInterval(async () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDate = now.toISOString().split('T')[0];
    
    if (currentTime === lotteryData.drawTime && lotteryData.lastDrawDate !== currentDate) {
      lotteryData.lastDrawDate = currentDate;
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.lotteryData = lotteryData;
      await saveDataImmediate(data);
      
      await performLotteryDraw();
    }
  }, 60000);
  
  console.log(`🎰 Lottery scheduler started - Draw time: ${lotteryData.drawTime}`);
}

async function performLotteryDraw() {
  if (!lotteryData.isActive || !lotteryData.channel) {
    return;
  }
  
  try {
    const channel = await client.channels.fetch(lotteryData.channel);
    if (!channel) return;
    
    if (lotteryData.participants.length === 0) {
      const noParticipantsEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🎰 Daily Lottery Draw')
        .setDescription('No participants entered today\'s lottery. Better luck tomorrow!')
        .setTimestamp();
      
      await channel.send({ embeds: [noParticipantsEmbed] });
      
      lotteryData.prizePool = 0;
      lotteryData.participants = [];
      
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.lotteryData = lotteryData;
      await saveDataImmediate(data);
      return;
    }
    
    const winnerIndex = Math.floor(Math.random() * lotteryData.participants.length);
    const winnerData = lotteryData.participants[winnerIndex];
    
    const winner = await client.users.fetch(winnerData.userId).catch(() => null);
    if (!winner) {
      lotteryData.prizePool = 0;
      lotteryData.participants = [];
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.lotteryData = lotteryData;
      await saveDataImmediate(data);
      return;
    }
    
    const totalEntries = lotteryData.participants.length;
    const uniqueParticipants = [...new Set(lotteryData.participants.map(p => p.userId))].length;
    const winnerEntries = lotteryData.participants.filter(p => p.userId === winnerData.userId).length;
    const winChance = ((winnerEntries / totalEntries) * 100).toFixed(2);
    const prizeAmount = lotteryData.prizePool;
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    
    if (data.users[winnerData.userId]) {
      data.users[winnerData.userId].gems = (data.users[winnerData.userId].gems || 0) + prizeAmount;
      await saveDataImmediate(data);
    }
    
    const winnerEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎰 DAILY LOTTERY WINNER! 🎰')
      .setDescription(`Congratulations **${winner.username}**!\n\nYou won the daily lottery!`)
      .addFields(
        { name: '💎 Prize Pool', value: `**${prizeAmount.toLocaleString()} Gems**`, inline: true },
        { name: '🎫 Your Tickets', value: `${winnerEntries}/${totalEntries}`, inline: true },
        { name: '📊 Win Chance', value: `${winChance}%`, inline: true },
        { name: '👥 Total Participants', value: `${uniqueParticipants}`, inline: true },
        { name: '🎟️ Total Entries', value: `${totalEntries}`, inline: true },
        { name: '💰 Entry Fee', value: `${lotteryData.entryFee} gems`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'Join tomorrow\'s lottery with !lottery join' });
    
    await channel.send({ content: `<@${winnerData.userId}>`, embeds: [winnerEmbed] });
    
    lotteryData.dailyWinners.push({
      userId: winnerData.userId,
      username: winner.username,
      date: new Date().toISOString(),
      prizeWon: prizeAmount,
      participants: uniqueParticipants,
      totalEntries: totalEntries
    });
    
    if (lotteryData.dailyWinners.length > 30) {
      lotteryData.dailyWinners = lotteryData.dailyWinners.slice(-30);
    }
    
    lotteryData.prizePool = 0;
    lotteryData.participants = [];
    
    data.lotteryData = lotteryData;
    await saveDataImmediate(data);
    
    const reminderEmbed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle('🎰 New Daily Lottery Available!')
      .setDescription(`A new lottery has started! Buy tickets for your chance to win the prize pool!\n\n**Entry Fee:** ${lotteryData.entryFee} gems per ticket\n**Max Tickets Per Person:** ${lotteryData.maxEntriesPerUser}\n**Draw Time:** ${lotteryData.drawTime}\n\nUse \`!lottery join [amount]\` to buy tickets!`)
      .setFooter({ text: 'The more tickets you buy, the better your chances!' });
    
    await channel.send({ embeds: [reminderEmbed] });
    
    console.log(`🎰 Daily lottery completed! Winner: ${winner.username} - Prize: ${lotteryData.prizePool} gems`);
  } catch (error) {
    console.error('Error performing lottery draw:', error);
  }
}

function joinLottery(userId, username, amount, userData) {
  if (!lotteryData.isActive) {
    return { success: false, message: '❌ The daily lottery is not currently active!' };
  }
  
  if (!amount || amount < 1) {
    amount = 1;
  }
  
  const currentEntries = lotteryData.participants.filter(p => p.userId === userId).length;
  
  if (currentEntries >= lotteryData.maxEntriesPerUser) {
    return { success: false, message: `❌ You've already bought the maximum number of tickets (${lotteryData.maxEntriesPerUser}) for today!` };
  }
  
  const availableSlots = lotteryData.maxEntriesPerUser - currentEntries;
  if (amount > availableSlots) {
    amount = availableSlots;
  }
  
  const totalCost = lotteryData.entryFee * amount;
  
  if (!userData.gems || userData.gems < totalCost) {
    return { success: false, message: `❌ You don't have enough gems! You need ${totalCost.toLocaleString()} gems but only have ${(userData.gems || 0).toLocaleString()} gems.` };
  }
  
  for (let i = 0; i < amount; i++) {
    lotteryData.participants.push({ userId, username });
  }
  
  lotteryData.prizePool += totalCost;
  
  const newTotal = currentEntries + amount;
  const winChance = ((newTotal / (lotteryData.participants.length)) * 100).toFixed(2);
  
  return {
    success: true,
    cost: totalCost,
    message: `🎰 **${username}**, you've purchased ${amount} lottery ticket${amount > 1 ? 's' : ''}!\n\n**Total Tickets:** ${newTotal}/${lotteryData.maxEntriesPerUser}\n**Cost:** ${totalCost.toLocaleString()} gems\n**Current Prize Pool:** ${lotteryData.prizePool.toLocaleString()} gems\n**Your Win Chance:** ~${winChance}%\n**Draw Time:** ${lotteryData.drawTime}\n\nGood luck! 🍀`
  };
}

function getLotteryInfo() {
  const nextDraw = new Date();
  const [hours, minutes] = lotteryData.drawTime.split(':');
  nextDraw.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (nextDraw < new Date()) {
    nextDraw.setDate(nextDraw.getDate() + 1);
  }
  
  const timeUntilDraw = nextDraw - new Date();
  const hoursLeft = Math.floor(timeUntilDraw / 3600000);
  const minutesLeft = Math.floor((timeUntilDraw % 3600000) / 60000);
  
  const uniqueParticipants = [...new Set(lotteryData.participants.map(p => p.userId))].length;
  
  const embed = new EmbedBuilder()
    .setColor('#9B59B6')
    .setTitle('🎰 Daily Lottery Information')
    .setDescription(lotteryData.isActive ? 'The daily lottery is **ACTIVE**!' : 'The daily lottery is **INACTIVE**')
    .addFields(
      { name: '💎 Current Prize Pool', value: `${lotteryData.prizePool.toLocaleString()} Gems`, inline: true },
      { name: '💰 Entry Fee', value: `${lotteryData.entryFee} gems/ticket`, inline: true },
      { name: '🎫 Max Tickets', value: `${lotteryData.maxEntriesPerUser} per person`, inline: true },
      { name: '⏰ Draw Time', value: lotteryData.drawTime, inline: true },
      { name: '⏳ Time Until Draw', value: `${hoursLeft}h ${minutesLeft}m`, inline: true },
      { name: '👥 Participants', value: `${uniqueParticipants}`, inline: true },
      { name: '🎟️ Total Tickets Sold', value: `${lotteryData.participants.length}`, inline: true },
      { name: '📍 Channel', value: lotteryData.channel ? `<#${lotteryData.channel}>` : 'Not set', inline: true },
      { name: '📝 How to Join', value: 'Use `!lottery join [amount]` to buy tickets', inline: false }
    );
  
  if (lotteryData.dailyWinners.length > 0) {
    const recentWinners = lotteryData.dailyWinners.slice(-5).reverse();
    const winnersText = recentWinners.map(w => {
      const date = new Date(w.date).toLocaleDateString();
      return `**${w.username}** - ${w.prizeWon.toLocaleString()} gems (${date})`;
    }).join('\n');
    embed.addFields({ name: '🏆 Recent Winners', value: winnersText });
  }
  
  return embed;
}

function startLottery(channelId) {
  lotteryData.isActive = true;
  lotteryData.channel = channelId;
  lotteryData.participants = [];
  lotteryData.prizePool = 0;
  startLotteryScheduler();
  
  return { success: true, message: `✅ Daily lottery started in <#${channelId}>!\n\n**Draw Time:** ${lotteryData.drawTime}\n**Entry Fee:** ${lotteryData.entryFee} gems per ticket\n**Max Tickets:** ${lotteryData.maxEntriesPerUser} per person` };
}

function stopLottery() {
  lotteryData.isActive = false;
  if (lotteryInterval) {
    clearInterval(lotteryInterval);
    lotteryInterval = null;
  }
  
  return { success: true, message: '✅ Daily lottery has been stopped!' };
}

function setLotteryTime(time) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) {
    return { success: false, message: '❌ Invalid time format! Use HH:MM (24-hour format). Example: 21:00' };
  }
  
  lotteryData.drawTime = time;
  
  if (lotteryData.isActive) {
    startLotteryScheduler();
  }
  
  return { success: true, message: `✅ Lottery draw time set to **${time}**` };
}

function setLotteryFee(fee) {
  const feeInt = parseInt(fee);
  if (isNaN(feeInt) || feeInt < 1) {
    return { success: false, message: '❌ Entry fee must be a positive number!' };
  }
  
  lotteryData.entryFee = feeInt;
  
  return { success: true, message: `✅ Lottery entry fee set to **${feeInt} gems** per ticket` };
}

function setLotteryMaxEntries(max) {
  const maxInt = parseInt(max);
  if (isNaN(maxInt) || maxInt < 1) {
    return { success: false, message: '❌ Max entries must be a positive number!' };
  }
  
  lotteryData.maxEntriesPerUser = maxInt;
  
  return { success: true, message: `✅ Max lottery tickets per person set to **${maxInt}**` };
}

function getLotteryData() {
  return lotteryData;
}

module.exports = {
  initializeLotterySystem,
  joinLottery,
  getLotteryInfo,
  startLottery,
  stopLottery,
  setLotteryTime,
  setLotteryFee,
  setLotteryMaxEntries,
  getLotteryData
};
