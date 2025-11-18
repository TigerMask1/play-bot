const { EmbedBuilder } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { getUpdatesChannel } = require('./serverConfigManager.js');

let lotteryData = {
  active: false,
  channelId: null,
  drawTime: '21:00',
  entryFee: 100,
  maxTicketsPerPerson: 5,
  prizePool: 0,
  bonusPrizes: {
    coins: 0,
    crates: {},
    characters: []
  },
  participants: [],
  lastDrawDate: null,
  winnersHistory: []
};

let lotteryInterval = null;
let activeClient = null;

function getLotteryData() {
  return lotteryData;
}

function setLotteryData(data) {
  if (data) {
    lotteryData = { ...data };
  }
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
  if (!activeClient || !lotteryData.active || lotteryData.participants.length === 0) {
    console.log('⚠️ Lottery draw skipped - not active or no participants');
    
    const capturedPrizePool = lotteryData.prizePool;
    
    lotteryData.prizePool = 0;
    lotteryData.participants = [];
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    data.lotteryData = lotteryData;
    await saveDataImmediate(data);
    
    if (capturedPrizePool > 0) {
      const noWinnerEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🎰 LOTTERY DRAW - NO PARTICIPANTS')
        .setDescription(
          `No one participated in today's lottery!\n\n` +
          `💎 Prize pool of ${capturedPrizePool.toLocaleString()} gems will roll over to tomorrow.\n\n` +
          `Use \`!lottery join\` to buy tickets for tomorrow's draw!`
        )
        .setFooter({ text: 'Join early for better chances!' })
        .setTimestamp();
      
      await broadcastToAllServers(noWinnerEmbed);
    }
    
    return;
  }
  
  try {
    const winnerIndex = Math.floor(Math.random() * lotteryData.participants.length);
    const winnerData = lotteryData.participants[winnerIndex];
    
    const winner = await activeClient.users.fetch(winnerData.userId).catch(() => null);
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
    
    const capturedPrizePool = lotteryData.prizePool;
    
    let lotteryPrizeDesc = `**Winner:** ${winner.tag}\n\n` +
      `**Prizes:**\n` +
      `💎 ${capturedPrizePool.toLocaleString()} Gems\n`;
    
    const bonusPrizes = lotteryData.bonusPrizes;
    if (bonusPrizes.coins > 0) {
      lotteryPrizeDesc += `💰 ${bonusPrizes.coins.toLocaleString()} Bonus Coins\n`;
    }
    
    if (bonusPrizes.crates && Object.keys(bonusPrizes.crates).length > 0) {
      for (const [crateType, count] of Object.entries(bonusPrizes.crates)) {
        if (count > 0) {
          lotteryPrizeDesc += `📦 ${count}x ${crateType.charAt(0).toUpperCase() + crateType.slice(1)} Crates\n`;
        }
      }
    }
    
    if (bonusPrizes.characters && bonusPrizes.characters.length > 0) {
      lotteryPrizeDesc += `🎭 Characters: ${bonusPrizes.characters.join(', ')}\n`;
    }
    
    lotteryPrizeDesc += `\n**Statistics:**\n` +
      `🎫 Winner's Tickets: ${winnerEntries}\n` +
      `📊 Win Chance: ${winChance}%\n` +
      `👥 Total Participants: ${uniqueParticipants}\n` +
      `🎟️ Total Entries: ${totalEntries}\n\n` +
      `Congratulations! 🎊`;
    
    const winnerEmbed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🎰 DAILY LOTTERY WINNER! 🎰')
      .setDescription(lotteryPrizeDesc)
      .setFooter({ text: 'Try your luck tomorrow!' })
      .setTimestamp();
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    
    if (!data.users[winnerData.userId]) {
      data.users[winnerData.userId] = { coins: 0, gems: 0, characters: [], crates: {} };
    }
    
    data.users[winnerData.userId].gems = (data.users[winnerData.userId].gems || 0) + capturedPrizePool;
    
    if (lotteryData.bonusPrizes.coins > 0) {
      data.users[winnerData.userId].coins = (data.users[winnerData.userId].coins || 0) + lotteryData.bonusPrizes.coins;
    }
    
    if (lotteryData.bonusPrizes.crates && Object.keys(lotteryData.bonusPrizes.crates).length > 0) {
      if (!data.users[winnerData.userId].crates) {
        data.users[winnerData.userId].crates = {};
      }
      for (const [crateType, count] of Object.entries(lotteryData.bonusPrizes.crates)) {
        if (count > 0) {
          data.users[winnerData.userId].crates[crateType] = 
            (data.users[winnerData.userId].crates[crateType] || 0) + count;
        }
      }
    }
    
    if (lotteryData.bonusPrizes.characters && lotteryData.bonusPrizes.characters.length > 0) {
      const CHARACTERS = require('./characters.js');
      const { assignMovesToCharacter, calculateBaseHP } = require('./battleUtils.js');
      
      if (!data.users[winnerData.userId].characters) {
        data.users[winnerData.userId].characters = [];
      }
      
      for (const charName of lotteryData.bonusPrizes.characters) {
        const charData = CHARACTERS[charName];
        if (charData) {
          const alreadyOwns = data.users[winnerData.userId].characters.some(c => c.name === charData.name);
          if (!alreadyOwns) {
            const moves = assignMovesToCharacter(charData.name);
            const baseHP = calculateBaseHP(charData.name);
            const st = parseFloat((Math.random() * 100).toFixed(2));
            
            data.users[winnerData.userId].characters.push({
              name: charData.name,
              emoji: charData.emoji,
              level: 1,
              tokens: 0,
              st: st,
              moves: moves,
              baseHp: baseHP,
              currentSkin: 'default',
              ownedSkins: ['default']
            });
          }
        }
      }
    }
    
    lotteryData.winnersHistory.unshift({
      userId: winnerData.userId,
      username: winner.tag,
      date: new Date().toISOString(),
      prizeAmount: capturedPrizePool,
      participants: uniqueParticipants,
      totalEntries: totalEntries
    });
    
    if (lotteryData.winnersHistory.length > 30) {
      lotteryData.winnersHistory = lotteryData.winnersHistory.slice(0, 30);
    }
    
    lotteryData.prizePool = 0;
    lotteryData.participants = [];
    data.lotteryData = lotteryData;
    await saveDataImmediate(data);
    
    await broadcastToAllServers(winnerEmbed);
    
    console.log(`✅ Lottery winner: ${winner.tag} won ${capturedPrizePool} gems (${totalEntries} entries)`);
    
  } catch (error) {
    console.error('❌ Error performing lottery draw:', error);
  }
}

async function broadcastToAllServers(embed) {
  if (!activeClient) return;
  
  try {
    for (const guild of activeClient.guilds.cache.values()) {
      const updatesChannelId = getUpdatesChannel(guild.id);
      
      if (updatesChannelId) {
        const channel = await activeClient.channels.fetch(updatesChannelId).catch(() => null);
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

function initializeLotterySystem(client) {
  activeClient = client;
  if (lotteryData.active) {
    startLotteryScheduler();
  }
  console.log('✅ Lottery system initialized');
}

async function startLottery(channelId) {
  lotteryData.active = true;
  lotteryData.channelId = channelId;
  startLotteryScheduler();
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.lotteryData = lotteryData;
  await saveDataImmediate(data);
}

async function stopLottery() {
  lotteryData.active = false;
  if (lotteryInterval) {
    clearInterval(lotteryInterval);
    lotteryInterval = null;
  }
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.lotteryData = lotteryData;
  await saveDataImmediate(data);
}

async function setLotteryDrawTime(time) {
  lotteryData.drawTime = time;
  if (lotteryData.active) {
    startLotteryScheduler();
  }
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.lotteryData = lotteryData;
  await saveDataImmediate(data);
}

async function setEntryFee(fee) {
  lotteryData.entryFee = fee;
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.lotteryData = lotteryData;
  await saveDataImmediate(data);
}

async function setMaxTickets(max) {
  lotteryData.maxTicketsPerPerson = max;
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.lotteryData = lotteryData;
  await saveDataImmediate(data);
}

async function joinLottery(userId, ticketCount = 1, userData) {
  if (!lotteryData.active) {
    return { success: false, message: '❌ The lottery is not currently active!' };
  }
  
  if (ticketCount < 1) {
    return { success: false, message: '❌ You must buy at least 1 ticket!' };
  }
  
  const userCurrentTickets = lotteryData.participants.filter(p => p.userId === userId).length;
  
  if (userCurrentTickets + ticketCount > lotteryData.maxTicketsPerPerson) {
    return { 
      success: false, 
      message: `❌ Maximum ${lotteryData.maxTicketsPerPerson} tickets per person!\nYou currently have ${userCurrentTickets} ticket(s).`
    };
  }
  
  const totalCost = lotteryData.entryFee * ticketCount;
  
  if ((userData.gems || 0) < totalCost) {
    return { 
      success: false, 
      message: `❌ Not enough gems!\nCost: ${totalCost} gems\nYou have: ${userData.gems || 0} gems`
    };
  }
  
  for (let i = 0; i < ticketCount; i++) {
    lotteryData.participants.push({ userId, ticketNumber: Date.now() + i });
  }
  
  lotteryData.prizePool += totalCost;
  
  const newTotal = userCurrentTickets + ticketCount;
  const winChance = ((newTotal / (lotteryData.participants.length)) * 100).toFixed(2);
  
  return { 
    success: true, 
    message: `✅ Purchased ${ticketCount} lottery ticket(s)!\n💎 Cost: ${totalCost} gems\n🎫 Your total tickets: ${newTotal}\n📊 Win chance: ${winChance}%\n💰 Current prize pool: ${lotteryData.prizePool.toLocaleString()} gems`,
    cost: totalCost
  };
}

async function setBonusPrizes(coins = 0, crates = {}, characters = []) {
  lotteryData.bonusPrizes = { coins, crates, characters };
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.lotteryData = lotteryData;
  await saveDataImmediate(data);
}

module.exports = {
  initializeLotterySystem,
  startLottery,
  stopLottery,
  setLotteryDrawTime,
  setEntryFee,
  setMaxTickets,
  joinLottery,
  performLotteryDraw,
  getLotteryData,
  setLotteryData,
  setBonusPrizes
};
