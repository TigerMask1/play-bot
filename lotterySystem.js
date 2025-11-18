const { EmbedBuilder } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { getEventsChannel } = require('./serverConfigManager.js');

let activeLotteries = {};

let activeClient = null;

function getLotteryData() {
  return activeLotteries;
}

function setLotteryData(data) {
  if (data) {
    activeLotteries = { ...data };
  }
}

async function startLottery(serverId, duration, entryFee, currency, channelId) {
  if (activeLotteries[serverId]) {
    return { success: false, message: '❌ A lottery is already active in this server!' };
  }
  
  const durationMs = duration * 60 * 60 * 1000;
  const endTime = Date.now() + durationMs;
  
  activeLotteries[serverId] = {
    active: true,
    channelId: channelId,
    duration: duration,
    startTime: Date.now(),
    endTime: endTime,
    entryFee: entryFee,
    currency: currency,
    prizePool: 0,
    participants: [],
    winnersHistory: []
  };
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  if (!data.lotteryData) {
    data.lotteryData = {};
  }
  data.lotteryData = activeLotteries;
  await saveDataImmediate(data);
  
  setTimeout(async () => {
    await performLotteryDraw(serverId);
  }, durationMs);
  
  const startEmbed = new EmbedBuilder()
    .setColor('#9B59B6')
    .setTitle('🎰 LOTTERY STARTED!')
    .setDescription(
      `A new ${duration}-hour lottery has begun!\n\n` +
      `**Entry Fee:** ${entryFee} ${currency === 'gems' ? '💎 Gems' : '💰 Coins'}\n` +
      `**Duration:** ${duration} hour(s)\n` +
      `**Winners:** Top 3 participants\n` +
      `**Prize Pool:** Splits among 3 winners (50%, 30%, 20%)\n\n` +
      `Use \`!lottery join\` to buy tickets!\n` +
      `Ends: <t:${Math.floor(endTime / 1000)}:R>`
    )
    .setTimestamp();
  
  return { success: true, message: 'Lottery started!', embed: startEmbed };
}

async function performLotteryDraw(serverId) {
  const lottery = activeLotteries[serverId];
  
  if (!lottery || !lottery.active) {
    console.log(`⚠️ Lottery draw skipped for server ${serverId} - not active`);
    return;
  }
  
  if (!activeClient) {
    console.log('⚠️ Lottery draw skipped - client not ready');
    return;
  }
  
  try {
    if (lottery.participants.length === 0) {
      const noParticipantsEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🎰 LOTTERY ENDED')
        .setDescription(
          `No one participated in the ${lottery.duration}-hour lottery!\n\n` +
          `Better luck next time!`
        )
        .setTimestamp();
      
      const channel = await activeClient.channels.fetch(lottery.channelId).catch(() => null);
      if (channel) {
        await channel.send({ embeds: [noParticipantsEmbed] });
      }
      
      delete activeLotteries[serverId];
      const { loadData } = require('./dataManager.js');
      const data = await loadData();
      data.lotteryData = activeLotteries;
      await saveDataImmediate(data);
      
      return;
    }
    
    const uniqueParticipants = [...new Set(lottery.participants.map(p => p.userId))];
    const totalEntries = lottery.participants.length;
    
    const numWinners = Math.min(3, uniqueParticipants.length);
    const winners = [];
    const selectedUsers = new Set();
    
    while (winners.length < numWinners) {
      const randomIndex = Math.floor(Math.random() * lottery.participants.length);
      const participant = lottery.participants[randomIndex];
      
      if (!selectedUsers.has(participant.userId)) {
        selectedUsers.add(participant.userId);
        winners.push(participant);
      }
    }
    
    const prizeShares = [0.50, 0.30, 0.20];
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    
    let resultDescription = `**Prize Pool:** ${lottery.prizePool.toLocaleString()} ${lottery.currency === 'gems' ? '💎 Gems' : '💰 Coins'}\n\n**Winners:**\n\n`;
    
    for (let i = 0; i < winners.length; i++) {
      const winner = await activeClient.users.fetch(winners[i].userId).catch(() => null);
      if (!winner) continue;
      
      const prize = Math.floor(lottery.prizePool * prizeShares[i]);
      const place = ['🥇 1st', '🥈 2nd', '🥉 3rd'][i];
      const share = ['50%', '30%', '20%'][i];
      
      if (!data.users[winners[i].userId]) {
        data.users[winners[i].userId] = { coins: 0, gems: 0, characters: [], crates: {} };
      }
      
      if (lottery.currency === 'gems') {
        data.users[winners[i].userId].gems = (data.users[winners[i].userId].gems || 0) + prize;
      } else {
        data.users[winners[i].userId].coins = (data.users[winners[i].userId].coins || 0) + prize;
      }
      
      resultDescription += `${place} Place (${share}): **${winner.tag}**\n💰 Prize: ${prize.toLocaleString()} ${lottery.currency === 'gems' ? '💎 Gems' : '💰 Coins'}\n\n`;
    }
    
    resultDescription += `**Statistics:**\n` +
      `👥 Total Participants: ${uniqueParticipants.length}\n` +
      `🎟️ Total Entries: ${totalEntries}\n\n` +
      `Congratulations to all winners! 🎊`;
    
    const winnerEmbed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎰 LOTTERY RESULTS!')
      .setDescription(resultDescription)
      .setFooter({ text: 'Thanks for participating!' })
      .setTimestamp();
    
    const channel = await activeClient.channels.fetch(lottery.channelId).catch(() => null);
    if (channel) {
      await channel.send({ embeds: [winnerEmbed] });
    }
    
    await broadcastToAllServers(winnerEmbed);
    
    lottery.winnersHistory.unshift({
      winners: winners.map((w, i) => ({ userId: w.userId, place: i + 1, prize: Math.floor(lottery.prizePool * prizeShares[i]) })),
      date: new Date().toISOString(),
      prizePool: lottery.prizePool,
      participants: uniqueParticipants.length,
      totalEntries: totalEntries
    });
    
    delete activeLotteries[serverId];
    data.lotteryData = activeLotteries;
    await saveDataImmediate(data);
    
    console.log(`✅ Lottery completed for server ${serverId} - ${numWinners} winners`);
    
  } catch (error) {
    console.error(`❌ Error performing lottery draw for server ${serverId}:`, error);
  }
}

async function broadcastToAllServers(embed) {
  if (!activeClient) return;
  
  try {
    for (const guild of activeClient.guilds.cache.values()) {
      const eventsChannelId = getEventsChannel(guild.id);
      
      if (eventsChannelId) {
        const channel = await activeClient.channels.fetch(eventsChannelId).catch(() => null);
        if (channel) {
          await channel.send({ embeds: [embed] }).catch(err => {
            console.error(`Failed to send lottery result to server ${guild.id}:`, err.message);
          });
        }
      }
    }
    console.log('✅ Lottery results broadcasted to all servers');
  } catch (error) {
    console.error('❌ Error broadcasting lottery results:', error);
  }
}

function initializeLotterySystem(client, data) {
  activeClient = client;
  
  if (data && data.lotteryData) {
    activeLotteries = { ...data.lotteryData };
    
    for (const [serverId, lottery] of Object.entries(activeLotteries)) {
      if (lottery.active && lottery.endTime) {
        const remaining = lottery.endTime - Date.now();
        if (remaining > 0) {
          setTimeout(async () => {
            await performLotteryDraw(serverId);
          }, remaining);
          console.log(`⏰ Resumed lottery for server ${serverId} - ${Math.floor(remaining / 60000)} minutes remaining`);
        } else {
          performLotteryDraw(serverId);
        }
      }
    }
  }
  
  console.log('✅ Lottery system initialized');
}

async function stopLottery(serverId) {
  const lottery = activeLotteries[serverId];
  
  if (!lottery || !lottery.active) {
    return { success: false, message: '❌ No lottery is currently active in this server!' };
  }
  
  await performLotteryDraw(serverId);
  
  return { success: true, message: '✅ Lottery ended and winners announced!' };
}

async function joinLottery(userId, serverId, ticketCount, userData) {
  const lottery = activeLotteries[serverId];
  
  if (!lottery || !lottery.active) {
    return { success: false, message: '❌ No lottery is currently active in this server!' };
  }
  
  if (ticketCount < 1) {
    return { success: false, message: '❌ You must buy at least 1 ticket!' };
  }
  
  const totalCost = lottery.entryFee * ticketCount;
  
  if (lottery.currency === 'gems') {
    if ((userData.gems || 0) < totalCost) {
      return { 
        success: false, 
        message: `❌ Not enough gems!\nCost: ${totalCost} 💎 gems\nYou have: ${userData.gems || 0} 💎 gems`
      };
    }
  } else {
    if ((userData.coins || 0) < totalCost) {
      return { 
        success: false, 
        message: `❌ Not enough coins!\nCost: ${totalCost} 💰 coins\nYou have: ${userData.coins || 0} 💰 coins`
      };
    }
  }
  
  for (let i = 0; i < ticketCount; i++) {
    lottery.participants.push({ userId, ticketNumber: Date.now() + i });
  }
  
  lottery.prizePool += totalCost;
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.lotteryData = activeLotteries;
  await saveDataImmediate(data);
  
  const userTickets = lottery.participants.filter(p => p.userId === userId).length;
  const winChance = ((userTickets / lottery.participants.length) * 100).toFixed(2);
  
  const timeRemaining = lottery.endTime - Date.now();
  
  return { 
    success: true, 
    message: `✅ Purchased ${ticketCount} lottery ticket(s)!\n` +
      `💰 Cost: ${totalCost} ${lottery.currency === 'gems' ? '💎 gems' : '💰 coins'}\n` +
      `🎫 Your total tickets: ${userTickets}\n` +
      `📊 Your chance: ${winChance}%\n` +
      `💵 Current prize pool: ${lottery.prizePool.toLocaleString()} ${lottery.currency === 'gems' ? '💎 gems' : '💰 coins'}\n` +
      `⏰ Ends: <t:${Math.floor(lottery.endTime / 1000)}:R>`,
    cost: totalCost,
    currency: lottery.currency
  };
}

async function getLotteryInfo(serverId) {
  const lottery = activeLotteries[serverId];
  
  if (!lottery || !lottery.active) {
    return { success: false, message: '❌ No lottery is currently active in this server!' };
  }
  
  const uniqueParticipants = [...new Set(lottery.participants.map(p => p.userId))].length;
  
  return {
    success: true,
    message: `**🎰 Lottery Status**\n\n` +
      `**Entry Fee:** ${lottery.entryFee} ${lottery.currency === 'gems' ? '💎 Gems' : '💰 Coins'}\n` +
      `**Duration:** ${lottery.duration} hour(s)\n` +
      `**Prize Pool:** ${lottery.prizePool.toLocaleString()} ${lottery.currency === 'gems' ? '💎 Gems' : '💰 Coins'}\n` +
      `**Winners:** Top 3 participants (50%, 30%, 20% split)\n` +
      `👥 Participants: ${uniqueParticipants}\n` +
      `🎟️ Total entries: ${lottery.participants.length}\n` +
      `⏰ Ends: <t:${Math.floor(lottery.endTime / 1000)}:R>\n\n` +
      `Use \`!lottery join <tickets>\` to participate!`
  };
}

module.exports = {
  initializeLotterySystem,
  startLottery,
  stopLottery,
  joinLottery,
  getLotteryInfo,
  performLotteryDraw,
  getLotteryData,
  setLotteryData
};
