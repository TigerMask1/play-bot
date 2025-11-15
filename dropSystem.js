const { EmbedBuilder } = require('discord.js');
const { saveData, saveDataImmediate } = require('./dataManager.js');
const CHARACTERS = require('./characters.js');
const { isMainServer, getServerConfig, getDropInterval, isServerSetup, saveServerConfig, hasInfiniteDrops } = require('./serverConfigManager.js');

let dropIntervals = new Map();
let activeClient = null;
let activeData = null;

const MAIN_SERVER_ID = '1430516117851340893';
const MAIN_DROP_CHANNEL = '1430525383635107850';

const DROP_CODES = ['tyrant', 'zooba', 'zoo', 'catch', 'grab', 'quick', 'fast', 'win', 'get', 'take'];
const DROP_DURATION = 3 * 3600000; // 3 hours in milliseconds
const DROP_COST = 100; // gems
const MAX_UNCAUGHT_DROPS = 10;

// ======================================================
//  DROP PAYMENT & STATUS FUNCTIONS
// ======================================================

function areDropsActive(serverId) {
  if (isMainServer(serverId)) return true; // Main server always has drops
  if (hasInfiniteDrops(serverId)) return true; // Server with infinite drops enabled
  
  const config = getServerConfig(serverId);
  if (!config) return false;
  
  // Only check if drops are paid for (ignore pause flag here)
  // Pause is handled separately to keep interval alive
  if (!config.dropsPaidUntil) return false;
  
  return Date.now() < config.dropsPaidUntil;
}

function areDropsPaused(serverId) {
  if (isMainServer(serverId)) return false;
  
  const config = getServerConfig(serverId);
  return config && config.dropsPaused === true;
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
  config.uncaughtDropCount = 0;
  config.dropsPaused = false;
  
  await saveServerConfig(serverId, config);
  await saveDataImmediate(data);
  
  console.log(`💎 Server ${serverId}: User ${userId} PAID for drops (3 hours). Gems: ${userData.gems + DROP_COST} → ${userData.gems}`);
  
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
  if (hasInfiniteDrops(serverId)) return '∞'; // Infinite for servers with infinite drops enabled
  
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

async function incrementUncaughtDrops(serverId) {
  if (isMainServer(serverId)) return; // Main server doesn't count uncaught drops
  if (hasInfiniteDrops(serverId)) return; // Servers with infinite drops don't count uncaught drops
  
  const config = getServerConfig(serverId);
  if (!config) return;
  
  config.uncaughtDropCount = (config.uncaughtDropCount || 0) + 1;
  console.log(`📈 Server ${serverId}: Uncaught drop count increased to ${config.uncaughtDropCount}/${MAX_UNCAUGHT_DROPS}`);
  
  if (config.uncaughtDropCount >= MAX_UNCAUGHT_DROPS) {
    config.dropsPaused = true;
    await saveServerConfig(serverId, config);
    console.log(`🛑 Server ${serverId}: Drop limit reached! Drops are now PAUSED.`);
    // Don't stop the interval - just set the pause flag
    // Next drops will be skipped until someone catches the current drop
    return true; // Drops paused
  }
  
  await saveServerConfig(serverId, config);
  return false;
}

async function resetUncaughtDrops(serverId) {
  const config = getServerConfig(serverId);
  if (!config) return;
  
  const wasPaused = config.dropsPaused;
  config.uncaughtDropCount = 0;
  config.dropsPaused = false;
  
  await saveServerConfig(serverId, config);
  console.log(`🔄 Server ${serverId}: Uncaught drop counter RESET. Drops ${wasPaused ? 'RESUMED' : 'continue normally'}.`);
  
  // Resume drops if they were paused and payment is still valid
  if (wasPaused && areDropsActive(serverId)) {
    startDropsForServer(serverId);
  }
}

async function notifyDropsExpired(serverId) {
  if (!activeClient || isMainServer(serverId)) return;
  
  try {
    const config = getServerConfig(serverId);
    if (!config || !config.dropChannelId) return;
    
    console.log(`⏰ Server ${serverId}: Drop period EXPIRED. Notifying admins...`);
    
    const guild = await activeClient.guilds.fetch(serverId).catch(() => null);
    if (!guild) return;
    
    const channel = await activeClient.channels.fetch(config.dropChannelId).catch(() => null);
    if (!channel) return;
    
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;
    
    const zooAdmins = members.filter(member => 
      member.roles.cache.some(role => role.name.toLowerCase() === 'zooadmin')
    );
    
    let pingText = '';
    if (zooAdmins.size > 0) {
      pingText = zooAdmins.map(m => `<@${m.id}>`).join(' ');
    } else {
      const owner = await guild.fetchOwner().catch(() => null);
      if (owner) {
        pingText = `<@${owner.id}>`;
      }
    }
    
    const expireEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('⏰ Drops Expired!')
      .setDescription(`${pingText}\n\n❌ The drop system has stopped because your 3-hour drop period has expired.\n\n💎 Use \`!paydrops\` to activate drops again for 3 hours (costs 100 gems)\n\n**Only users with the ZooAdmin role can activate drops!**`)
      .setFooter({ text: 'Need help? Use !setup to see server configuration' });
    
    await channel.send({ embeds: [expireEmbed] });
    console.log(`✅ Server ${serverId}: Expiry notification sent successfully.`);
  } catch (error) {
    console.error('Error notifying drops expired:', error);
  }
}

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
    // Check if payment is still valid (payment expiry, not pause)
    if (!areDropsActive(serverId)) {
      await notifyDropsExpired(serverId);
      stopDropsForServer(serverId);
      return;
    }
    
    // Check if drops are paused - if so, skip spawning but keep interval alive
    if (areDropsPaused(serverId)) {
      // Skip spawning new drops while paused, but don't stop the interval
      // The last drop before pause is still catchable and will trigger resume
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
    
    // Set a timeout to increment uncaught drops if not caught within spawn interval
    // Capture both spawn time and interval at spawn time to avoid mismatches
    const dropSpawnTime = activeData.serverDrops[serverId].spawnedAt;
    const dropInterval = getDropInterval(serverId);
    setTimeout(async () => {
      // Check if this specific drop is still active (not caught)
      // Compare the spawn time to ensure we're checking the same drop, not a new one
      if (activeData.serverDrops[serverId] && 
          activeData.serverDrops[serverId].spawnedAt === dropSpawnTime) {
        console.log(`📊 Drop uncaught in server ${serverId}, incrementing counter...`);
        const paused = await incrementUncaughtDrops(serverId);
        if (paused) {
          console.log(`⏸️ Drops PAUSED in server ${serverId} after ${MAX_UNCAUGHT_DROPS} uncaught drops`);
          const channel = await activeClient.channels.fetch(dropChannelId).catch(() => null);
          if (channel) {
            const pauseEmbed = new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('💤 Drops Stopped!')
              .setDescription(`Yikes! Your server is **really inactive**... 😴\n\n${MAX_UNCAUGHT_DROPS} drops went uncaught in a row! That's pretty impressive (in a bad way).\n\n🔄 **Want to revive drops?** Just use \`!c <code>\` on any drop to wake things up again!\n⏰ Your 3-hour timer is still ticking, so don't waste it!`)
              .setFooter({ text: 'Pro tip: Being active helps you catch more drops!' });
            await channel.send({ embeds: [pauseEmbed] });
            console.log(`📨 Pause notification sent to server ${serverId}`);
          }
        }
      }
    }, dropInterval);

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
  getActiveClient,
  payForDrops,
  areDropsActive,
  areDropsPaused,
  getDropsTimeRemaining,
  resetUncaughtDrops,
  incrementUncaughtDrops
};
