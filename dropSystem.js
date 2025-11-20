const { EmbedBuilder } = require('discord.js');
const { saveData, saveDataImmediate } = require('./dataManager.js');
const CHARACTERS = require('./characters.js');
const { isMainServer, getServerConfig, getDropInterval, isServerSetup, saveServerConfig } = require('./serverConfigManager.js');

let dropIntervals = new Map();
let activeClient = null;
let activeData = null;
let serverInactivityStatus = new Map();

const MAIN_SERVER_ID = '1430516117851340893';
const MAIN_DROP_CHANNEL = '1430525383635107850';

const DROP_CODES = ['tyrant', 'zooba', 'zoo', 'catch', 'grab', 'quick', 'fast', 'win', 'get', 'take'];
const DROP_DURATION = 3 * 3600000; // 3 hours in milliseconds
const DROP_COST = 100; // gems
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity before pause

// ======================================================
//  DROP PAYMENT & STATUS FUNCTIONS
// ======================================================

function areDropsActive(serverId) {
  if (isMainServer(serverId)) return true; // Main server always has drops
  
  const config = getServerConfig(serverId);
  if (!config) return false;
  
  if (!config.dropsPaidUntil) return false;
  
  return Date.now() < config.dropsPaidUntil;
}

async function payForDrops(serverId, userId, data) {
  if (isMainServer(serverId)) {
    return { success: false, message: '❌ Main server has unlimited drops - no payment needed!' };
  }
  
  // Check if server is properly set up before accepting payment
  if (!isServerSetup(serverId)) {
    return { success: false, message: '❌ Server not set up yet! Complete setup with `!setup` before activating drops.' };
  }
  
  const config = getServerConfig(serverId);
  if (!config || !config.dropChannelId) {
    return { success: false, message: '❌ No drop channel configured! Use `!setdropchannel #channel` first.' };
  }
  
  const userData = data.users[userId];
  if (!userData) {
    return { success: false, message: '❌ User data not found!' };
  }
  
  if ((userData.gems || 0) < DROP_COST) {
    return { success: false, message: `❌ You need ${DROP_COST} gems to activate drops for 3 hours!\n💎 You have: ${userData.gems || 0} gems` };
  }
  
  userData.gems -= DROP_COST;
  const expiryTime = Date.now() + DROP_DURATION;
  
  config.dropsPaidUntil = expiryTime;
  
  await saveServerConfig(serverId, config);
  await saveDataImmediate(data);
  
  // Restart drops for this server to begin immediately
  startDropsForServer(serverId);
  
  const expiryDate = new Date(expiryTime);
  return {
    success: true,
    message: `✅ Drops activated for 3 hours!\n💎 Gems spent: ${DROP_COST}\n⏰ Drops expire: ${expiryDate.toLocaleTimeString()}\n\n🎁 Drops will now spawn in <#${config.dropChannelId}>!`,
    expiryTime
  };
}

function getDropsTimeRemaining(serverId) {
  if (isMainServer(serverId)) return '∞'; // Infinite for main server
  
  const config = getServerConfig(serverId);
  if (!config || !config.dropsPaidUntil) return '0m';
  
  const remaining = config.dropsPaidUntil - Date.now();
  if (remaining <= 0) return '0m';
  
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ======================================================
//  START / STOP SYSTEM
// ======================================================

async function startDropSystem(client, data) {
  activeClient = client;
  activeData = data;

  for (const guild of client.guilds.cache.values()) {
    // Check if this server has active drops before sending notification
    const hasActiveDrops = !isMainServer(guild.id) && areDropsActive(guild.id);
    await startDropsForServer(guild.id, hasActiveDrops); // Only notify servers with active drops
  }

  console.log(`✅ Drop system initialized for ${dropIntervals.size} servers`);
}

async function startDropsForServer(serverId, sendResumeNotification = false) {
  if (dropIntervals.has(serverId)) {
    clearInterval(dropIntervals.get(serverId));
  }

  if (!isMainServer(serverId) && !isServerSetup(serverId)) {
    console.log(`⚠️ Server ${serverId} not set up yet, skipping drops`);
    return;
  }

  // Check if drops are actually active before starting
  if (!isMainServer(serverId) && !areDropsActive(serverId)) {
    console.log(`⚠️ Server ${serverId}: Drops not active (not paid or expired)`);
    return;
  }

  const interval = getDropInterval(serverId);
  
  const intervalId = setInterval(() => {
    executeDrop(serverId);
  }, interval);

  dropIntervals.set(serverId, intervalId);
  console.log(`✅ Drops started for server ${serverId} (every ${interval/1000}s)`);
  
  // Send resume notification if this is an auto-resume after bot restart
  if (sendResumeNotification && activeClient && !isMainServer(serverId)) {
    try {
      const config = getServerConfig(serverId);
      const dropChannelId = config?.dropChannelId;
      
      if (dropChannelId) {
        const channel = await activeClient.channels.fetch(dropChannelId).catch(() => null);
        if (channel) {
          const timeRemaining = getDropsTimeRemaining(serverId);
          const resumeEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔄 Bot Restarted - Drops Resumed!')
            .setDescription(`✅ The bot has restarted and drops are back online!\n\n⏰ **Time Remaining:** ${timeRemaining}\n🎁 Drops will continue spawning every ${interval/1000} seconds\n\n💡 Drops will automatically stop when the timer expires.`)
            .setFooter({ text: 'Drops are now active!' })
            .setTimestamp();
          
          await channel.send({ embeds: [resumeEmbed] });
          console.log(`✅ Server ${serverId}: Resume notification sent successfully.`);
        }
      }
    } catch (error) {
      console.error(`❌ Error sending resume notification for server ${serverId}:`, error);
    }
  }
}

function stopDropSystem() {
  dropIntervals.forEach((intervalId, serverId) => {
    clearInterval(intervalId);
  });
  dropIntervals.clear();
  console.log('⏹️ Drop system stopped for all servers!');
}

async function stopDropsForServer(serverId, sendNotification = false) {
  if (dropIntervals.has(serverId)) {
    clearInterval(dropIntervals.get(serverId));
    dropIntervals.delete(serverId);
    console.log(`⏹️ Drops stopped for server ${serverId}`);
    
    // Send notification to channel if requested
    if (sendNotification && activeClient) {
      try {
        let dropChannelId;
        if (isMainServer(serverId)) {
          dropChannelId = MAIN_DROP_CHANNEL;
        } else {
          const config = getServerConfig(serverId);
          dropChannelId = config?.dropChannelId;
        }
        
        if (dropChannelId) {
          const channel = await activeClient.channels.fetch(dropChannelId).catch(() => null);
          if (channel) {
            const stopEmbed = new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('⏰ Drops Expired!')
              .setDescription(`❌ The drop system has stopped because your 3-hour drop period has expired.\n\n💎 Use \`!paydrops\` to activate drops again for 3 hours (costs 100 gems)\n\n**Only users with the ZooAdmin role can activate drops!**`)
              .setFooter({ text: 'Need help? Use !setup to see server configuration' });
            
            await channel.send({ embeds: [stopEmbed] });
            console.log(`✅ Server ${serverId}: Expiry notification sent successfully.`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending stop notification for server ${serverId}:`, error);
      }
    }
  }
}

// ======================================================
//  CORE DROP LOGIC
// ======================================================

async function executeDrop(serverId) {
  if (!activeClient || !activeData) return;

  try {
    // Check if drops are paused due to inactivity
    if (isDropsPaused(serverId)) {
      console.log(`⏸️ Server ${serverId}: Drops paused, skipping execution`);
      return;
    }
    
    // Check for inactivity and pause if needed
    if (checkInactivity(serverId)) {
      await pauseDropsForInactivity(serverId);
      return;
    }
    
    // Check if payment is still valid
    if (!areDropsActive(serverId)) {
      await stopDropsForServer(serverId, true); // Send expiry notification
      return;
    }
    
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

    // ===== PHASE 1: Clear previous drop data (optimized - no message deletion) =====
    if (activeData.serverDrops[serverId]) {
      // Simply remove the old drop data without deleting messages to reduce API calls
      delete activeData.serverDrops[serverId];
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

    const timeRemaining = getDropsTimeRemaining(serverId);
    const footerText = isMainServer(serverId) 
      ? 'First person to type the command gets it!'
      : `⏰ Drops expire in: ${timeRemaining} | First person to catch wins!`;

    const dropEmbed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎁 DROP APPEARED!')
      .setDescription(`A wild drop appeared!\n\n${rewardText}\n\nType \`!c ${code}\` to catch it!`)
      .setFooter({ text: footerText })
      .setTimestamp();

    const dropMessage = await channel.send({ embeds: [dropEmbed] });

    // Store new drop data per server
    activeData.serverDrops[serverId] = {
      type: selectedDrop.type,
      amount,
      code,
      characterName,
      messageId: dropMessage.id,
      serverId,
      spawnedAt: Date.now()
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

function recordCatchAttempt(serverId) {
  if (!serverInactivityStatus.has(serverId)) {
    serverInactivityStatus.set(serverId, {
      lastCatchAttempt: Date.now(),
      paused: false
    });
  } else {
    const status = serverInactivityStatus.get(serverId);
    status.lastCatchAttempt = Date.now();
    
    if (status.paused) {
      status.paused = false;
      console.log(`✅ Server ${serverId}: Inactivity pause cleared due to catch attempt`);
    }
  }
}

function getLastCatchAttempt(serverId) {
  if (!serverInactivityStatus.has(serverId)) {
    return null;
  }
  return serverInactivityStatus.get(serverId).lastCatchAttempt;
}

function ensureInactivityStatus(serverId) {
  if (!serverInactivityStatus.has(serverId)) {
    serverInactivityStatus.set(serverId, {
      lastCatchAttempt: Date.now(),
      paused: false
    });
  }
}

async function pauseDropsForInactivity(serverId) {
  if (!serverInactivityStatus.has(serverId)) {
    serverInactivityStatus.set(serverId, {
      lastCatchAttempt: Date.now(),
      paused: false
    });
  }
  
  const status = serverInactivityStatus.get(serverId);
  
  if (status.paused) return;
  
  status.paused = true;
  
  if (dropIntervals.has(serverId)) {
    clearInterval(dropIntervals.get(serverId));
    dropIntervals.delete(serverId);
    console.log(`⏸️ Drops paused for server ${serverId} due to inactivity`);
    
    if (activeClient) {
      try {
        let dropChannelId;
        if (isMainServer(serverId)) {
          dropChannelId = MAIN_DROP_CHANNEL;
        } else {
          const config = getServerConfig(serverId);
          dropChannelId = config?.dropChannelId;
        }
        
        if (dropChannelId) {
          const channel = await activeClient.channels.fetch(dropChannelId).catch(() => null);
          if (channel) {
            const pauseEmbed = new EmbedBuilder()
              .setColor('#FFA500')
              .setTitle('⏸️ Drops Paused (Inactivity)')
              .setDescription(`Drops have been paused due to 5 minutes of inactivity.\n\n💡 Use \`!revive\` to resume drops!\n\n**Note:** Your paid drop time is still running. This pause is just to reduce lag when no one is playing.`)
              .setFooter({ text: 'Type !revive to resume drops' });
            
            await channel.send({ embeds: [pauseEmbed] });
          }
        }
      } catch (error) {
        console.error(`❌ Error sending pause notification for server ${serverId}:`, error);
      }
    }
  }
}

async function reviveDrops(serverId) {
  if (!serverInactivityStatus.has(serverId)) {
    return { success: false, message: '❌ Drops are not paused!' };
  }
  
  const status = serverInactivityStatus.get(serverId);
  
  if (!status.paused) {
    return { success: false, message: '❌ Drops are already active!' };
  }
  
  if (!areDropsActive(serverId)) {
    return { success: false, message: '❌ Drops have expired! Use `!paydrops` to activate them again.' };
  }
  
  status.paused = false;
  status.lastCatchAttempt = Date.now();
  
  startDropsForServer(serverId);
  
  return { success: true, message: '✅ Drops revived! They will start spawning again.' };
}

function isDropsPaused(serverId) {
  if (!serverInactivityStatus.has(serverId)) return false;
  return serverInactivityStatus.get(serverId).paused;
}

function checkInactivity(serverId) {
  if (isMainServer(serverId)) return false;
  
  if (!serverInactivityStatus.has(serverId)) {
    return false;
  }
  
  const status = serverInactivityStatus.get(serverId);
  
  if (status.paused) {
    return true;
  }
  
  const lastCatch = getLastCatchAttempt(serverId);
  
  if (lastCatch === null) {
    return false;
  }
  
  const timeSinceLastCatch = Date.now() - lastCatch;
  
  if (timeSinceLastCatch > INACTIVITY_TIMEOUT && !status.paused) {
    return true;
  }
  
  return false;
}

module.exports = { 
  startDropSystem, 
  stopDropSystem,
  stopDropsForServer,
  startDropsForServer,
  getActiveData,
  getActiveClient,
  payForDrops,
  areDropsActive,
  getDropsTimeRemaining,
  recordCatchAttempt,
  pauseDropsForInactivity,
  reviveDrops,
  isDropsPaused,
  checkInactivity
};
