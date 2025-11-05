const { EmbedBuilder } = require('discord.js');
const { saveData } = require('./dataManager.js');
const CHARACTERS = require('./characters.js');
const { isMainServer, getServerConfig, getDropInterval, isServerSetup } = require('./serverConfigManager.js');

let dropIntervals = new Map();
let activeClient = null;
let activeData = null;

const MAIN_SERVER_ID = '1430516117851340893';
const MAIN_DROP_CHANNEL = '1430525383635107850';

const DROP_CODES = ['tyrant', 'zooba', 'zoo', 'catch', 'grab', 'quick', 'fast', 'win', 'get', 'take'];

// ======================================================
//  START / STOP SYSTEM
// ======================================================

function startDropSystem(client, data) {
  activeClient = client;
  activeData = data;

  client.guilds.cache.forEach(guild => {
    startDropsForServer(guild.id);
  });

  console.log(`✅ Drop system initialized for ${dropIntervals.size} servers`);
}

function startDropsForServer(serverId) {
  if (dropIntervals.has(serverId)) {
    clearInterval(dropIntervals.get(serverId));
  }

  if (!isMainServer(serverId) && !isServerSetup(serverId)) {
    console.log(`⚠️ Server ${serverId} not set up yet, skipping drops`);
    return;
  }

  const interval = getDropInterval(serverId);
  
  const intervalId = setInterval(() => {
    executeDrop(serverId);
  }, interval);

  dropIntervals.set(serverId, intervalId);
  console.log(`✅ Drops started for server ${serverId} (every ${interval/1000}s)`);
}

function stopDropSystem() {
  dropIntervals.forEach((intervalId, serverId) => {
    clearInterval(intervalId);
  });
  dropIntervals.clear();
  console.log('⏹️ Drop system stopped for all servers!');
}

function stopDropsForServer(serverId) {
  if (dropIntervals.has(serverId)) {
    clearInterval(dropIntervals.get(serverId));
    dropIntervals.delete(serverId);
    console.log(`⏹️ Drops stopped for server ${serverId}`);
  }
}

// ======================================================
//  CORE DROP LOGIC
// ======================================================

async function executeDrop(serverId) {
  if (!activeClient || !activeData) return;

  try {
    let dropChannelId;
    
    if (isMainServer(serverId)) {
      dropChannelId = MAIN_DROP_CHANNEL;
    } else {
      const config = getServerConfig(serverId);
      if (!config || !config.dropChannelId) {
        console.error(`❌ No drop channel configured for server ${serverId}`);
        return;
      }
      dropChannelId = config.dropChannelId;
    }

    const channel = await activeClient.channels.fetch(dropChannelId).catch(() => null);
    if (!channel) {
      console.error(`❌ Drop channel ${dropChannelId} not found for server ${serverId}!`);
      return;
    }

    // Initialize server drops if needed
    if (!activeData.serverDrops) {
      activeData.serverDrops = {};
    }

    // ===== PHASE 1: Handle previous drop =====
    if (activeData.serverDrops[serverId]) {
      const oldDrop = activeData.serverDrops[serverId];
      delete activeData.serverDrops[serverId];

      // Try deleting old drop message
      if (oldDrop.messageId) {
        try {
          const oldMessage = await channel.messages.fetch(oldDrop.messageId);
          if (oldMessage) await oldMessage.delete();
        } catch {
          console.warn(`⚠️ Old drop message already deleted.`);
        }
      }

      // Send vanished notice
      const oldReward = oldDrop.type === 'tokens'
        ? `${oldDrop.amount} ${oldDrop.characterName} tokens`
        : `${oldDrop.amount} ${oldDrop.type}`;

      const vanishEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('💨 Drop Vanished!')
        .setDescription(`The previous drop (${oldReward}) disappeared!`);

      const vanishMsg = await channel.send({ embeds: [vanishEmbed] });
      setTimeout(() => vanishMsg.delete().catch(() => {}), 5000);
    }

    // ===== PHASE 2: Create a new drop =====
    const dropTypeRoll = Math.random();
    let selectedDrop, characterName = '';

    if (dropTypeRoll < 0.02) {
      selectedDrop = { type: 'shards', min: 1, max: 2, emoji: '🔷' };
    } else if (dropTypeRoll < 0.62) {
      const allOwnedChars = new Set();
      Object.values(activeData.users).forEach(user => {
        user?.characters?.forEach(char => allOwnedChars.add(char.name));
      });

      const ownedCharArray = Array.from(allOwnedChars);
      if (ownedCharArray.length > 0) {
        characterName = ownedCharArray[Math.floor(Math.random() * ownedCharArray.length)];
        selectedDrop = { type: 'tokens', min: 1, max: 10, emoji: '🎫', characterName };
      } else {
        selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
      }
    } else if (dropTypeRoll < 0.92) {
      selectedDrop = { type: 'coins', min: 1, max: 10, emoji: '💰' };
    } else {
      selectedDrop = { type: 'gems', min: 1, max: 2, emoji: '💎' };
    }

    const amount = Math.floor(Math.random() * (selectedDrop.max - selectedDrop.min + 1)) + selectedDrop.min;
    const code = DROP_CODES[Math.floor(Math.random() * DROP_CODES.length)];

    const rewardText = selectedDrop.type === 'tokens'
      ? `**Reward:** ${amount} ${characterName} tokens ${selectedDrop.emoji}`
      : `**Reward:** ${amount} ${selectedDrop.type} ${selectedDrop.emoji}`;

    const dropEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎁 DROP APPEARED!')
      .setDescription(`A wild drop appeared!\n\n${rewardText}\n\nType \`!c ${code}\` to catch it!`)
      .setFooter({ text: 'First person to type the command gets it!' })
      .setTimestamp();

    const dropMessage = await channel.send({ embeds: [dropEmbed] });

    // Store new drop data per server
    activeData.serverDrops[serverId] = {
      type: selectedDrop.type,
      amount,
      code,
      characterName,
      messageId: dropMessage.id,
      serverId
    };

    saveData(activeData);

  } catch (error) {
    console.error('❌ Drop execution error:', error);
  }
}

function getActiveData() {
  return activeData;
}

function getActiveClient() {
  return activeClient;
}

module.exports = { 
  startDropSystem, 
  stopDropSystem,
  stopDropsForServer,
  startDropsForServer,
  getActiveData,
  getActiveClient
};
