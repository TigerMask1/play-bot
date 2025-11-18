const { EmbedBuilder } = require('discord.js');
const { saveDataImmediate } = require('./dataManager.js');
const { getEventsChannel, isMainServer } = require('./serverConfigManager.js');

let giveawayData = {
  active: false,
  channelId: null,
  drawTime: '20:00',
  participants: [],
  lastDrawDate: null,
  prizeConfig: {
    coins: 5000,
    gems: 100,
    crateType: 'gold',
    crateCount: 3,
    characters: [],
    guaranteedCharacter: false
  },
  winnersHistory: []
};

let giveawayInterval = null;
let activeClient = null;

function getGiveawayData() {
  return giveawayData;
}

function setGiveawayData(data) {
  if (data) {
    giveawayData = { ...data };
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
  if (!activeClient || !giveawayData.active || giveawayData.participants.length === 0) {
    console.log('⚠️ Giveaway draw skipped - not active or no participants');
    giveawayData.participants = [];
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
    
    let prizeDescription = `**Winner:** ${winner.tag}\n\n` +
      `**Prizes:**\n` +
      `💰 ${giveawayData.prizeConfig.coins.toLocaleString()} Coins\n` +
      `💎 ${giveawayData.prizeConfig.gems.toLocaleString()} Gems\n` +
      `📦 ${giveawayData.prizeConfig.crateCount}x ${giveawayData.prizeConfig.crateType.charAt(0).toUpperCase() + giveawayData.prizeConfig.crateType.slice(1)} Crates\n`;
    
    if (giveawayData.prizeConfig.characters && giveawayData.prizeConfig.characters.length > 0) {
      prizeDescription += `🎭 Characters: ${giveawayData.prizeConfig.characters.join(', ')}\n`;
    }
    
    prizeDescription += `\nCongratulations! 🎊`;
    
    const winnerEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎉 DAILY GIVEAWAY WINNER! 🎉')
      .setDescription(prizeDescription)
      .setFooter({ text: 'Join tomorrow for another chance to win!' })
      .setTimestamp();
    
    const participantCount = giveawayData.participants.length;
    
    const { loadData } = require('./dataManager.js');
    const data = await loadData();
    
    if (!data.users[winnerId]) {
      data.users[winnerId] = { coins: 0, gems: 0, characters: [], crates: {} };
    }
    
    data.users[winnerId].coins = (data.users[winnerId].coins || 0) + giveawayData.prizeConfig.coins;
    data.users[winnerId].gems = (data.users[winnerId].gems || 0) + giveawayData.prizeConfig.gems;
    
    if (!data.users[winnerId].crates) {
      data.users[winnerId].crates = {};
    }
    data.users[winnerId].crates[giveawayData.prizeConfig.crateType] = 
      (data.users[winnerId].crates[giveawayData.prizeConfig.crateType] || 0) + giveawayData.prizeConfig.crateCount;
    
    if (giveawayData.prizeConfig.characters && giveawayData.prizeConfig.characters.length > 0) {
      const CHARACTERS = require('./characters.js');
      const { assignMovesToCharacter, calculateBaseHP } = require('./battleUtils.js');
      const { getSkinUrl } = require('./skinSystem.js');
      
      if (!data.users[winnerId].characters) {
        data.users[winnerId].characters = [];
      }
      
      for (const charName of giveawayData.prizeConfig.characters) {
        const charData = CHARACTERS[charName];
        if (charData) {
          const alreadyOwns = data.users[winnerId].characters.some(c => c.name === charData.name);
          if (!alreadyOwns) {
            const moves = assignMovesToCharacter(charData.name);
            const baseHP = calculateBaseHP(charData.name);
            const st = parseFloat((Math.random() * 100).toFixed(2));
            
            data.users[winnerId].characters.push({
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
    data.giveawayData = giveawayData;
    await saveDataImmediate(data);
    
    await broadcastToAllServers(winnerEmbed);
    
    console.log(`✅ Giveaway winner: ${winner.tag} (${participantCount} participants)`);
    
  } catch (error) {
    console.error('❌ Error performing giveaway draw:', error);
  }
}

async function broadcastToAllServers(embed) {
  if (!activeClient) return;
  
  try {
    for (const guild of activeClient.guilds.cache.values()) {
      let targetChannelId;
      
      if (isMainServer(guild.id)) {
        targetChannelId = giveawayData.channelId;
      } else {
        targetChannelId = getEventsChannel(guild.id);
      }
      
      if (targetChannelId) {
        const channel = await activeClient.channels.fetch(targetChannelId).catch(() => null);
        if (channel) {
          await channel.send({ embeds: [embed] }).catch(err => {
            console.error(`Failed to send giveaway result to server ${guild.id}:`, err.message);
          });
        }
      }
    }
    console.log('✅ Giveaway results broadcasted to all servers');
  } catch (error) {
    console.error('❌ Error broadcasting giveaway results:', error);
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

async function setDrawTime(time) {
  giveawayData.drawTime = time;
  if (giveawayData.active) {
    startGiveawayScheduler();
  }
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.giveawayData = giveawayData;
  await saveDataImmediate(data);
}

async function setPrize(coins, gems, crateType, crateCount, characters = [], guaranteedCharacter = false) {
  giveawayData.prizeConfig = { coins, gems, crateType, crateCount, characters, guaranteedCharacter };
  
  const { loadData } = require('./dataManager.js');
  const data = await loadData();
  data.giveawayData = giveawayData;
  await saveDataImmediate(data);
}

async function joinGiveaway(userId) {
  if (!giveawayData.active) {
    return { success: false, message: '❌ The giveaway is not currently active!' };
  }
  
  if (giveawayData.participants.includes(userId)) {
    return { success: false, message: '❌ You have already joined today\'s giveaway!' };
  }
  
  giveawayData.participants.push(userId);
  return { success: true, message: `✅ You have been entered into today's giveaway!\n👥 Total participants: ${giveawayData.participants.length}` };
}

module.exports = {
  initializeGiveawaySystem,
  startGiveaway,
  stopGiveaway,
  setDrawTime,
  setPrize,
  joinGiveaway,
  performDailyDraw,
  getGiveawayData,
  setGiveawayData
};
