// Lightweight Express server for health checks and arena routes
const express = require('express');
const http = require('http');

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('Bot is alive!');
});

const server = http.createServer(app);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} in use, trying alternative port...`);
    server.listen(0, '0.0.0.0', () => {
      console.log(`🌐 Server running on port ${server.address().port}`);
    });
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const CHARACTERS = require('./characters.js');
const { loadData, saveData, saveDataImmediate, deleteUser } = require('./dataManager.js');
const { getLevelRequirements, calculateLevel } = require('./levelSystem.js');
const { openCrate, buyCrate } = require('./crateSystem.js');
const { startDropSystem, stopDropSystem, payForDrops, areDropsActive, getDropsTimeRemaining } = require('./dropSystem.js');
const { initiateTrade } = require('./tradeSystem.js');
const { initiateBattle } = require('./battleSystem.js');
const { assignMovesToCharacter, calculateBaseHP, getMoveDisplay, calculateEnergyCost } = require('./battleUtils.js');
const { createLevelProgressBar } = require('./progressBar.js');
const { QUESTS, getQuestProgress, canClaimQuest, claimQuest, getAvailableQuests, formatQuestDisplay } = require('./questSystem.js');
const { craftBooster, useBooster, getBoosterInfo, getCharacterBoostCount, MAX_BOOSTS_PER_CHARACTER } = require('./stBoosterSystem.js');
const { sendMailToAll, addMailToUser, claimMail, getUnclaimedMailCount, formatMailDisplay, clearClaimedMail } = require('./mailSystem.js');
const { postNews, getLatestNews, formatNewsDisplay } = require('./newsSystem.js');
const { getTopCoins, getTopGems, getTopBattles, getTopCollectors, getTopTrophies, formatLeaderboard } = require('./leaderboardSystem.js');
const { getSkinUrl, getAvailableSkins, skinExists } = require('./skinSystem.js');
const { openShop } = require('./shopSystem.js');
const { getCharacterAbility, getAbilityDescription } = require('./characterAbilities.js');
const eventSystem = require('./eventSystem.js');
const { viewKeys, unlockCharacter, openRandomCage } = require('./keySystem.js');
const { loadServerConfigs, isMainServer, isSuperAdmin, isBotAdmin, isZooAdmin, addBotAdmin, removeBotAdmin, setupServer, isServerSetup, setDropChannel, setEventsChannel, setUpdatesChannel, getUpdatesChannel } = require('./serverConfigManager.js');
const { startPromotionSystem } = require('./promotionSystem.js');
const { initializeGiveawaySystem, setGiveawayData } = require('./giveawaySystem.js');
const { initializeLotterySystem, setLotteryData } = require('./lotterySystem.js');
const { startDropsForServer } = require('./dropSystem.js');
const { 
  PERSONALIZED_TASKS,
  sendPersonalizedTask, 
  checkTaskProgress, 
  completePersonalizedTask, 
  checkExpiredTasks, 
  getEligibleUsers, 
  trackInviteCompletion,
  togglePersonalizedTasks, 
  getTaskStats,
  initializePersonalizedTaskData,
  formatReward,
  formatTime,
  createCustomTask,
  sendCustomTask
} = require('./personalizedTaskSystem.js');
const { getHistory, getHistorySummary, formatHistory } = require('./historySystem.js');
const { 
  initializeClanData,
  getClan,
  getUserClan,
  joinClan,
  leaveClan,
  donateToClan,
  getClanLeaderboard,
  formatClanProfile,
  formatClanLeaderboard,
  startWeeklyClanWars
} = require('./clanSystem.js');
const { initializeEmojiAssets, getEmojiForCharacter, setCharacterEmoji, refreshAllCharacterEmojis } = require('./emojiAssetManager.js');
const { 
  initializeChestVisuals, 
  getChestVisual, 
  setChestGif, 
  startPickSession, 
  getActiveSession, 
  clearSession 
} = require('./chestInteractionManager.js');
const { 
  coinDuel, 
  diceClash, 
  doorOfFate, 
  almostWinMachine, 
  rockPaperScissors,
  handleDiceClashButton,
  handleDoorButton
} = require('./minigamesSystem.js');

const PREFIX = '!';
let data;

async function initializeBot() {
  await initializeEmojiAssets();
  await initializeChestVisuals();
  
  data = await loadData();
  console.log('✅ Data loaded successfully');
  
  await refreshAllCharacterEmojis(data.users);
  console.log('✅ Custom emojis applied to all characters');
}

function generateST() {
  return parseFloat((Math.random() * 100).toFixed(2));
}

function startPersonalizedTaskSystem(client, data) {
  console.log('📬 Starting Personalized Task System...');
  
  // Check for expired tasks every 30 minutes
  setInterval(async () => {
    await checkExpiredTasks(client, data);
  }, 1800000);
  
  // Send tasks to inactive players every 2 hours
  setInterval(async () => {
    const now = Date.now();
    const inactiveThreshold = 6 * 3600000; // 6 hours
    const minTimeBetweenTasks = 2 * 3600000; // 2 hours
    
    for (const userId in data.users) {
      const userData = data.users[userId];
      const ptData = initializePersonalizedTaskData(userData);
      
      if (!ptData.isActive) continue;
      
      const lastActivity = userData.lastActivity || 0;
      const timeSinceActivity = now - lastActivity;
      const timeSinceLastTask = now - (ptData.lastTaskSent || 0);
      
      // Inactive user ready for task
      if (timeSinceActivity > inactiveThreshold && timeSinceLastTask > minTimeBetweenTasks) {
        await sendPersonalizedTask(client, userId, data);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }, 7200000); // Every 2 hours
  
  // Send tasks to active players every 3 hours
  setInterval(async () => {
    const now = Date.now();
    const activeThreshold = 2 * 3600000; // Active if within 2 hours
    const minTimeBetweenTasks = 4 * 3600000; // 4 hours
    
    for (const userId in data.users) {
      const userData = data.users[userId];
      const ptData = initializePersonalizedTaskData(userData);
      
      if (!ptData.isActive) continue;
      
      const lastActivity = userData.lastActivity || 0;
      const timeSinceActivity = now - lastActivity;
      const timeSinceLastTask = now - (ptData.lastTaskSent || 0);
      
      // Active user ready for task
      if (timeSinceActivity < activeThreshold && timeSinceLastTask > minTimeBetweenTasks) {
        await sendPersonalizedTask(client, userId, data);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }, 14400000); // Every 4 hours
  
  console.log('✅ Personalized Task System started!');
}

client.on('clientReady', async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log(`🎮 Bot is ready to serve ${client.guilds.cache.size} servers!`);
  await initializeBot();
  await loadServerConfigs();
  initializeClanData(data);
  if (data.giveawayData) {
    setGiveawayData(data.giveawayData);
  }
  if (data.lotteryData) {
    setLotteryData(data.lotteryData);
  }
  initializeGiveawaySystem(client);
  initializeLotterySystem(client);
  await eventSystem.init(client, data);
  await startDropSystem(client, data);
  startPromotionSystem(client);
  startPersonalizedTaskSystem(client, data);
  startWeeklyClanWars(client, data);
  
  console.log('✅ All systems initialized!');
});

client.on('guildCreate', async (guild) => {
  console.log(`✅ Bot added to new server: ${guild.name} (${guild.id})`);
  
  if (!isMainServer(guild.id) && !isServerSetup(guild.id)) {
    try {
      const owner = await guild.fetchOwner();
      const setupEmbed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle('👋 Thanks for adding ZooBot!')
        .setDescription(`Hi! Before I can start working in this server, I need some setup:\n\n**Important:** Create a role called **"ZooAdmin"** (case insensitive) and assign it to users who should manage the bot.\n\n**Setup Commands (ZooAdmin only):**\n\`!setup\` - Start the setup process\n\`!setdropchannel #channel\` - Set where drops appear\n\`!seteventschannel #channel\` - Set where events are announced\n\`!setupdateschannel #channel\` - Set where bot updates are posted\n\`!paydrops\` - Activate drops (costs 100 gems for 3 hours)\n\n**Customization Commands (ZooAdmin only):**\n\`!setemoji <character> <emoji>\` - Set custom character emojis\n\`!setchestgif <type> <url>\` - Set custom chest opening GIFs\n\n**Note:** Only users with the **ZooAdmin** role can manage server settings and activate drops.`)
        .setFooter({ text: 'Looking for more features? Check out our main server!' });
      
      await owner.send({ embeds: [setupEmbed] }).catch(() => {
        console.log(`Could not DM owner of ${guild.name}`);
      });
    } catch (error) {
      console.error('Error sending setup message:', error);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!data) return;
  
  try {
    if (interaction.customId.startsWith('diceclash_')) {
      await handleDiceClashButton(interaction, data);
    } else if (interaction.customId.startsWith('door_')) {
      await handleDoorButton(interaction, data);
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ An error occurred!', ephemeral: true }).catch(() => {});
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Check if data is loaded yet
  if (!data) return;
  
  const userId = message.author.id;
  
  if (!data.users[userId]) {
    data.users[userId] = {
      username: message.author.username,
      coins: 0,
      gems: 0,
      characters: [],
      selectedCharacter: null,
      pendingTokens: 0,
      started: false,
      trophies: 200,
      messageCount: 0,
      lastDailyClaim: null,
      inventory: {},
      tutorialStage: 'intro',
      tutorialCompleted: false
    };
    await saveDataImmediate(data);
  }
  

  if (!data.users[userId].username) {
    data.users[userId].username = message.author.username;
  }
  
  if (data.users[userId].started && !message.content.startsWith(PREFIX)) {
    data.users[userId].messageCount = (data.users[userId].messageCount || 0) + 1;
    data.users[userId].lastActivity = Date.now();
    
    const ptData = initializePersonalizedTaskData(data.users[userId]);
    if (ptData.taskProgress.messagesSent !== undefined) {
      const completedTask = checkTaskProgress(data.users[userId], 'messagesSent', 1);
      if (completedTask) {
        await completePersonalizedTask(client, userId, data, completedTask);
      }
    }
    
    if (data.users[userId].messageCount % 25 === 0) {
      const roll = Math.random() * 100;
      let rewardMessage = '';
      
      // 60% chance for bronze crate
      if (roll < 60) {
        data.users[userId].bronzeCrates = (data.users[userId].bronzeCrates || 0) + 1;
        rewardMessage = `🎉 **Message Reward!** You got a 🟫 **Bronze Crate**! Use \`!opencrate bronze\` to open it!`;
      }
      // 25% chance for silver crate
      else if (roll < 85) {
        data.users[userId].silverCrates = (data.users[userId].silverCrates || 0) + 1;
        rewardMessage = `🎉 **Message Reward!** You got a ⚪ **Silver Crate**! Use \`!opencrate silver\` to open it!`;
      }
      // 10% chance for emerald crate
      else if (roll < 95) {
        data.users[userId].emeraldCrates = (data.users[userId].emeraldCrates || 0) + 1;
        rewardMessage = `🎉 **Message Reward!** You got a 🟢 **Emerald Crate**! Use \`!opencrate emerald\` to open it!`;
      }
      // 5% chance for gold crate
      else {
        data.users[userId].goldCrates = (data.users[userId].goldCrates || 0) + 1;
        rewardMessage = `🎉 **Message Reward!** You got a 🟡 **Gold Crate**! Use \`!opencrate gold\` to open it!`;
      }
      
      // CRITICAL: Use immediate save for crate rewards to ensure MongoDB persistence
      await saveDataImmediate(data);
      
      try {
        await message.reply(rewardMessage);
      } catch (error) {
        console.error('Error sending reward message:', error);
      }
    } else {
      saveData(data);
    }
  }
  
  let commandContent = message.content;
  let usedMention = false;
  
  if (message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(`<@!${client.user.id}>`)) {
    commandContent = message.content.replace(/<@!?\d+>\s*/, '');
    usedMention = true;
  } else if (!message.content.startsWith(PREFIX)) {
    return;
  } else {
    commandContent = message.content.slice(PREFIX.length);
  }
  
  const args = commandContent.trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  
  if (!command) return;
  
  const serverId = message.guild?.id;
  const isAdmin = isSuperAdmin(userId) || isBotAdmin(userId, serverId);
  
  try {
    switch(command) {
      case 'setup':
        if (!serverId || isMainServer(serverId)) {
          await message.reply('❌ This command is only for non-main servers!');
          return;
        }
        
        if (!isSuperAdmin(userId) && !isZooAdmin(message.member)) {
          await message.reply('❌ Only users with the **ZooAdmin** role can run server setup!\n\nPlease create a role called "ZooAdmin" and assign it to server admins who should manage the bot.');
          return;
        }
        
        const setupEmbed = new EmbedBuilder()
          .setColor('#00D9FF')
          .setTitle('🛠️ Server Setup')
          .setDescription(`Welcome! Let's set up ZooBot for your server.\n\n**Role Requirement:** You need the **ZooAdmin** role to manage this bot.\n\n**Required Steps:**\n1. Set drop channel: \`!setdropchannel #channel\`\n2. Set events channel: \`!seteventschannel #channel\`\n3. Set updates channel: \`!setupdateschannel #channel\`\n\n**Current Status:**\n${isServerSetup(serverId) ? '✅ Setup complete!' : '⚠️ Setup incomplete'}\n\n**Note:** Drops appear every 30 seconds on non-main servers and require payment (100 gems for 3 hours by ZooAdmins).\nOnly users with the **ZooAdmin** role can activate drops and customize server settings.\n\nFor unlimited drops and exclusive features, join our main server!`)
          .setFooter({ text: 'Use the commands above to complete setup' });
        
        await message.reply({ embeds: [setupEmbed] });
        break;
        
      case 'setdropchannel':
        if (!serverId || isMainServer(serverId)) {
          await message.reply('❌ This command is only for non-main servers!');
          return;
        }
        
        const dropChannel = message.mentions.channels.first() || message.channel;
        const dropResult = await setDropChannel(serverId, dropChannel.id, userId, message.member);
        
        await message.reply(dropResult.message);
        
        if (dropResult.success && dropResult.setupComplete) {
          startDropsForServer(serverId);
        }
        break;
        
      case 'seteventschannel':
        if (!serverId || isMainServer(serverId)) {
          await message.reply('❌ This command is only for non-main servers!');
          return;
        }
        
        const eventsChannel = message.mentions.channels.first() || message.channel;
        const eventsResult = await setEventsChannel(serverId, eventsChannel.id, userId, message.member);
        
        await message.reply(eventsResult.message);
        
        if (eventsResult.success && eventsResult.setupComplete) {
          startDropsForServer(serverId);
        }
        break;
        
      case 'addadmin':
        if (!serverId) {
          await message.reply('❌ This command can only be used in a server!');
          return;
        }
        
        const userToAdd = message.mentions.users.first();
        if (!userToAdd) {
          await message.reply('❌ Please mention a user! Usage: `!addadmin @user`');
          return;
        }
        
        const addResult = await addBotAdmin(serverId, userToAdd.id, userId);
        await message.reply(addResult.message);
        break;
        
      case 'removeadmin':
        if (!serverId) {
          await message.reply('❌ This command can only be used in a server!');
          return;
        }
        
        const userToRemove = message.mentions.users.first();
        if (!userToRemove) {
          await message.reply('❌ Please mention a user! Usage: `!removeadmin @user`');
          return;
        }
        
        const removeResult = await removeBotAdmin(serverId, userToRemove.id, userId);
        await message.reply(removeResult.message);
        break;
        
      case 'setupdateschannel':
        if (!serverId) {
          await message.reply('❌ This command can only be used in a server!');
          return;
        }
        
        const updatesChannel = message.mentions.channels.first() || message.channel;
        const updatesResult = await setUpdatesChannel(serverId, updatesChannel.id, userId, message.member);
        
        await message.reply(updatesResult.message);
        break;
        
      case 'postupdate':
      case 'botupdate':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const updateMessage = args.join(' ');
        if (!updateMessage) {
          await message.reply('Usage: `!postupdate <message>`\n\nThis will post the update to all configured server update channels.');
          return;
        }
        
        const updateEmbed = new EmbedBuilder()
          .setColor('#00D9FF')
          .setTitle('🔔 Bot Update')
          .setDescription(updateMessage)
          .setTimestamp()
          .setFooter({ text: 'ZooBot Official Update' });
        
        let successCount = 0;
        let failCount = 0;
        
        for (const guild of client.guilds.cache.values()) {
          try {
            const channelId = getUpdatesChannel(guild.id);
            if (channelId) {
              const channel = await guild.channels.fetch(channelId).catch(() => null);
              if (channel) {
                await channel.send({ embeds: [updateEmbed] });
                successCount++;
              } else {
                failCount++;
              }
            }
          } catch (error) {
            failCount++;
            console.error(`Failed to post update to ${guild.name}:`, error.message);
          }
        }
        
        await message.reply(`✅ Update posted!\n📤 Sent to ${successCount} servers\n❌ Failed: ${failCount}`);
        break;
      
      case 'setemoji':
        if (serverId && !isZooAdmin(message.member) && !isSuperAdmin(userId)) {
          await message.reply('❌ Only users with the **ZooAdmin** role can set custom character emojis!');
          return;
        }
        
        if (!serverId && !isSuperAdmin(userId)) {
          await message.reply('❌ This command can only be used by super admins in DMs!');
          return;
        }
        
        const emojiCharName = args[0];
        const emojiInput = args[1];
        
        if (!emojiCharName || !emojiInput) {
          await message.reply('Usage: `!setemoji <character name> <emoji ID or unicode>`\n\nExample: `!setemoji Nix 1234567890` (for custom Discord emoji)\nExample: `!setemoji Nix 🦊` (for unicode emoji)');
          return;
        }
        
        const setEmojiResult = await setCharacterEmoji(emojiCharName, emojiInput);
        
        if (setEmojiResult.success) {
          await refreshAllCharacterEmojis(data.users);
          await saveDataImmediate(data);
        }
        
        await message.reply(setEmojiResult.message);
        break;
      
      case 'setchestgif':
      case 'setcrategif':
        if (serverId && !isZooAdmin(message.member) && !isSuperAdmin(userId)) {
          await message.reply('❌ Only users with the **ZooAdmin** role can customize chest GIFs!');
          return;
        }
        
        if (!serverId && !isSuperAdmin(userId)) {
          await message.reply('❌ This command can only be used by super admins in DMs!');
          return;
        }
        
        const chestType = args[0]?.toLowerCase();
        const gifUrl = args[1];
        
        if (!chestType || !gifUrl) {
          await message.reply('Usage: `!setchestgif <chest type> <gif URL>`\n\nAvailable types: bronze, silver, gold, emerald, legendary, tyrant\n\nExample: `!setchestgif gold https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif`');
          return;
        }
        
        const setGifResult = await setChestGif(chestType, gifUrl, userId);
        await message.reply(setGifResult.message);
        break;
        
      case 'delete':
      case 'deleteuser':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const userToDelete = message.mentions.users.first();
        if (!userToDelete) {
          await message.reply('❌ Please mention a user to delete! Usage: `!delete @user`');
          return;
        }
        
        const userIdToDelete = userToDelete.id;
        
        if (!data.users[userIdToDelete]) {
          await message.reply('❌ This user has no account in the bot!');
          return;
        }
        
        const deletedUsername = data.users[userIdToDelete].username || userToDelete.username;
        
        delete data.users[userIdToDelete];
        
        await deleteUser(userIdToDelete);
        
        await saveDataImmediate(data);
        
        const deleteEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🗑️ User Account Deleted')
          .setDescription(`Successfully deleted **${deletedUsername}**'s account from the database.\n\nAll their data (characters, coins, gems, shards, crates, etc.) has been permanently removed.`)
          .setFooter({ text: `Deleted by ${message.author.username}` });
        
        await message.reply({ embeds: [deleteEmbed] });
        console.log(`🗑️ Admin ${message.author.username} deleted user account: ${deletedUsername} (${userIdToDelete})`);
        break;
        
      case 'joinclan':
        if (!serverId) {
          await message.reply('❌ This command can only be used in a server!');
          return;
        }
        
        if (!data.users[userId].started) {
          await message.reply('❌ You must start first! Use `!start` to begin.');
          return;
        }
        
        const joinResult = joinClan(data, userId, serverId);
        await message.reply(joinResult.message);
        
        if (joinResult.success) {
          await saveDataImmediate(data);
        }
        break;
        
      case 'leaveclan':
        if (!data.users[userId].started) {
          await message.reply('❌ You must start first! Use `!start` to begin.');
          return;
        }
        
        const leaveResult = leaveClan(data, userId);
        await message.reply(leaveResult.message);
        
        if (leaveResult.success) {
          await saveDataImmediate(data);
        }
        break;
        
      case 'donate':
        if (!serverId) {
          await message.reply('❌ This command can only be used in a server!');
          return;
        }
        
        if (!data.users[userId].started) {
          await message.reply('❌ You must start first! Use `!start` to begin.');
          return;
        }
        
        const donationType = args[0]?.toLowerCase();
        const donationAmount = parseInt(args[1]);
        
        if (!donationType || !donationAmount) {
          await message.reply('❌ Usage: `!donate <coins/gems/trophies> <amount>`\nExample: `!donate coins 100`');
          return;
        }
        
        if (isNaN(donationAmount) || donationAmount <= 0) {
          await message.reply('❌ Amount must be a positive number!');
          return;
        }
        
        const donateResult = donateToClan(data, userId, serverId, donationType, donationAmount);
        await message.reply(donateResult.message);
        
        if (donateResult.success) {
          await saveDataImmediate(data);
        }
        break;
        
      case 'clan':
      case 'clanprofile':
        if (!serverId) {
          await message.reply('❌ This command can only be used in a server!');
          return;
        }
        
        const clan = getClan(data, serverId);
        const clanProfileEmbed = formatClanProfile(clan, message.guild.name, data);
        await message.reply({ embeds: [clanProfileEmbed] });
        break;
        
      case 'clans':
      case 'clanleaderboard':
        const leaderboard = getClanLeaderboard(data);
        const leaderboardEmbed = formatClanLeaderboard(leaderboard, client, data);
        await message.reply({ embeds: [leaderboardEmbed] });
        break;
        
      case 'start':
        if (data.users[userId].selectedCharacter === null) {
          const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎮 Choose Your Starter Character!')
            .setDescription('Welcome! Select one of these starter characters:\n\n🦊 **Nix** - The cunning fox\n🦍 **Bruce** - The mighty gorilla\n🐂 **Buck** - The strong bull\n\nUse: `!select nix`, `!select bruce`, or `!select buck`');
          await message.reply({ embeds: [embed] });
        } else {
          await message.reply(`You already have **${data.users[userId].selectedCharacter}** as your character!`);
        }
        break;
        
      case 'select':
        if (data.users[userId].selectedCharacter !== null) {
          await message.reply('You already selected a starter character!');
          return;
        }
        
        const starterChoice = args[0]?.toLowerCase();
        const validStarters = ['nix', 'bruce', 'buck'];
        
        if (!validStarters.includes(starterChoice)) {
          await message.reply('Please choose: `nix`, `bruce`, or `buck`');
          return;
        }
        
        const starterChar = CHARACTERS.find(c => c.name.toLowerCase() === starterChoice);
        const starterST = generateST();
        
        const pendingTokens = data.users[userId].pendingTokens || 0;
        
        const starterMoves = assignMovesToCharacter(starterChar.name, starterST);
        const starterHP = calculateBaseHP(starterST);
        
        data.users[userId].selectedCharacter = starterChar.name;
        data.users[userId].started = true;
        data.users[userId].characters.push({
          name: starterChar.name,
          emoji: starterChar.emoji,
          level: 1,
          tokens: pendingTokens,
          st: starterST,
          moves: starterMoves,
          baseHp: starterHP,
          currentSkin: 'default',
          ownedSkins: ['default']
        });
        data.users[userId].coins = 100;
        data.users[userId].gems = 10;
        data.users[userId].pendingTokens = 0;
        
        // Track invite completion for personalized tasks
        const ptData = initializePersonalizedTaskData(data.users[userId]);
        if (ptData.invitedBy) {
          const inviterCompleted = trackInviteCompletion(ptData.invitedBy, userId, data);
          if (inviterCompleted) {
            // Check if inviter has active invite task
            const inviterPTData = initializePersonalizedTaskData(data.users[ptData.invitedBy]);
            if (inviterPTData.taskProgress.invitesCompleted !== undefined) {
              const completedTask = checkTaskProgress(data.users[ptData.invitedBy], 'invitesCompleted', 1);
              if (completedTask) {
                await completePersonalizedTask(client, ptData.invitedBy, data, completedTask);
              }
            }
          }
        }
        await saveDataImmediate(data);
        
        let embedDesc = `You chose **${starterChar.name} ${starterChar.emoji}**!\n\n**ST:** ${starterST}%\n\nStarting rewards:\n💰 100 Coins\n💎 10 Gems`;
        
        if (pendingTokens > 0) {
          embedDesc += `\n🎫 ${pendingTokens} Pending Tokens received!`;
        }
        
        embedDesc += `\n\nUse \`!profile\` to view your stats!`;
        
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🎉 Character Selected!')
          .setDescription(embedDesc);
        await message.reply({ embeds: [embed] });
        break;
        
      case 'profile':
        const targetUser = message.mentions.users.first() || message.author;
        const targetId = targetUser.id;
        
        if (!data.users[targetId]) {
          await message.reply('This user hasn\'t started yet!');
          return;
        }
        
        const user = data.users[targetId];
        let page = parseInt(args[0]) || 1;
        const charsPerPage = 5;
        const totalPages = Math.ceil(user.characters.length / charsPerPage);
        
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        
        const startIdx = (page - 1) * charsPerPage;
        const endIdx = startIdx + charsPerPage;
        const pageChars = user.characters.slice(startIdx, endIdx);
        
        const profileEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle(`${targetUser.username}'s Profile`)
          .addFields(
            { name: '💰 Coins', value: `${user.coins}`, inline: true },
            { name: '💎 Gems', value: `${user.gems}`, inline: true },
            { name: '🏆 Trophies', value: `${user.trophies || 200}`, inline: true },
            { name: '🎮 Characters', value: `${user.characters.length}/51`, inline: true },
            { name: '💬 Messages', value: `${user.messageCount || 0}`, inline: true }
          );
        
        if (user.selectedCharacter) {
          profileEmbed.addFields({ name: '⭐ Selected', value: user.selectedCharacter, inline: true });
        }
        
        const userClanData = getUserClan(data, targetId);
        if (userClanData) {
          const clanGuild = client.guilds.cache.get(userClanData.serverId);
          const clanName = clanGuild ? clanGuild.name : 'Unknown Clan';
          profileEmbed.addFields({ name: '🏰 Clan', value: clanName, inline: true });
        }
        
        let displayCharName = user.profileDisplayCharacter || user.selectedCharacter;
        if (displayCharName) {
          let displayChar = user.characters.find(c => c.name === displayCharName);
          
          if (!displayChar && user.profileDisplayCharacter) {
            user.profileDisplayCharacter = null;
            await saveDataImmediate(data);
            displayCharName = user.selectedCharacter;
            displayChar = user.characters.find(c => c.name === displayCharName);
          }
          
          if (displayChar) {
            const displaySkinUrl = await getSkinUrl(displayChar.name, displayChar.currentSkin || 'default');
            profileEmbed.setThumbnail(displaySkinUrl);
            if (user.profileDisplayCharacter && user.profileDisplayCharacter !== user.selectedCharacter) {
              profileEmbed.addFields({ name: '🖼️ Profile Picture', value: displayCharName, inline: true });
            }
          }
        }
        
        if (user.pendingTokens > 0) {
          profileEmbed.addFields({ name: '🎫 Pending Tokens', value: `${user.pendingTokens}`, inline: true });
        }
        
        if (user.characters.length > 0) {
          pageChars.forEach(char => {
            const req = getLevelRequirements(char.level);
            const progress = createLevelProgressBar(char.tokens, req.tokens);
            profileEmbed.addFields({
              name: `${char.emoji} ${char.name} - Lvl ${char.level} | ST: ${char.st}%`,
              value: `Tokens: ${char.tokens}/${req.tokens} | Coins: ${req.coins}\n${progress}`,
              inline: false
            });
          });
          
          if (totalPages > 1) {
            profileEmbed.setFooter({ text: `Page ${page}/${totalPages} | Use !profile [page]` });
          }
        } else {
          profileEmbed.setDescription('No characters yet! Use `!start` to begin.');
        }
        
        await message.reply({ embeds: [profileEmbed] });
        break;
        
      case 'crate':
        const crateType = args[0]?.toLowerCase();
        const validCrates = ['gold', 'emerald', 'legendary', 'tyrant'];
        
        if (!validCrates.includes(crateType)) {
          const user = data.users[userId];
          const crateEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎁 Available Crates')
            .setDescription('**Free Crates** (from message rewards):\n🟫 Bronze Crate - Use `!opencrate bronze`\n⚪ Silver Crate - Use `!opencrate silver`\n\n**Premium Crates** (purchase with gems):')
            .addFields(
              { name: '🥇 Gold Crate', value: '💎 100 gems\n1.5% character chance\n🎫 50 random character tokens\n💰 500 coins', inline: true },
              { name: '🟢 Emerald Crate', value: '💎 250 gems\n5% character chance\n🎫 130 random character tokens\n💰 1800 coins', inline: true },
              { name: '🔥 Legendary Crate', value: '💎 500 gems\n10% character chance\n🎫 200 random character tokens\n💰 2500 coins', inline: true },
              { name: '👑 Tyrant Crate', value: '💎 750 gems\n15% character chance\n🎫 300 random character tokens\n💰 3500 coins', inline: true }
            )
            .addFields({ 
              name: '📦 Your Crates', 
              value: `🟫 Bronze: ${user.bronzeCrates || 0}\n⚪ Silver: ${user.silverCrates || 0}\n🟡 Gold: ${user.goldCrates || 0}\n🟢 Emerald: ${user.emeraldCrates || 0}\n🟣 Legendary: ${user.legendaryCrates || 0}\n🔴 Tyrant: ${user.tyrantCrates || 0}`, 
              inline: false 
            })
            .setFooter({ text: 'Use: !crate <type> to buy | !opencrate <type> to open owned crates' });
          await message.reply({ embeds: [crateEmbed] });
          return;
        }
        
        const result = await buyCrate(data, userId, crateType);
        
        if (!result.success) {
          await message.reply(`❌ ${result.message}`);
          return;
        }
        
        await saveDataImmediate(data);
        
        const resultEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle(`💎 ${crateType.toUpperCase()} CRATE PURCHASED!`)
          .setDescription(`<@${userId}>\n\n${result.message}`)
          .setTimestamp();
        
        await message.reply({ embeds: [resultEmbed] });
        break;
      
      case 'pickcrate':
      case 'pickchest':
        const pickType = args[0]?.toLowerCase();
        const allCrateTypes = ['bronze', 'silver', 'gold', 'emerald', 'legendary', 'tyrant'];
        
        if (!allCrateTypes.includes(pickType)) {
          await message.reply('Usage: `!pickcrate <type>`\nAvailable: bronze, silver, gold, emerald, legendary, tyrant\n\nUse `!crate` to see your inventory!');
          return;
        }
        
        const crateKey = `${pickType}Crates`;
        const userCrateCount = data.users[userId][crateKey] || 0;
        
        if (userCrateCount < 1) {
          await message.reply(`❌ You don't have any ${pickType} crates!`);
          return;
        }
        
        const sessionResult = startPickSession(userId, pickType);
        if (!sessionResult.success) {
          await message.reply(sessionResult.message);
          return;
        }
        
        const chestVisual = await getChestVisual(pickType);
        
        const readyEmbed = new EmbedBuilder()
          .setColor(chestVisual.embedColor)
          .setTitle(`${chestVisual.displayName} Chest is Ready! ✨`)
          .setDescription(`<@${userId}> picked a **${chestVisual.displayName}** chest!\n\n🎁 Your chest is ready to open!\n⏰ You have **2 minutes** to open it.\n\nType \`!opencrate\` to open your chest!`)
          .setImage(chestVisual.readyGifUrl)
          .setTimestamp();
        
        await message.reply({ embeds: [readyEmbed] });
        break;
      
      case 'opencrate':
      case 'openchest':
        const activeSession = getActiveSession(userId);
        
        if (!activeSession) {
          await message.reply('❌ You don\'t have an active chest session!\n\nUse `!pickcrate <type>` to start opening a chest.\nExample: `!pickcrate gold`');
          return;
        }
        
        const timeLeft = Math.ceil((activeSession.expiresAt - Date.now()) / 1000);
        
        if (timeLeft <= 0) {
          clearSession(userId);
          await message.reply('❌ Your chest session expired! Use `!pickcrate <type>` to pick a new chest.');
          return;
        }
        
        const openResult = await openCrate(data, userId, activeSession.crateType, client);
        
        if (!openResult.success) {
          clearSession(userId);
          await message.reply(`❌ ${openResult.message}`);
          return;
        }
        
        clearSession(userId);
        await saveDataImmediate(data);
        
        const openResultEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle(`🎁 ${activeSession.crateType.toUpperCase()} CHEST OPENED!`)
          .setDescription(`<@${userId}> opened their chest!\n\n${openResult.message}`)
          .setTimestamp();
        
        await message.reply({ embeds: [openResultEmbed] });
        break;
        
      case 'levelup':
        const charToLevelName = args.join(' ').toLowerCase();
        
        if (!charToLevelName) {
          await message.reply('Usage: `!levelup <character name>`');
          return;
        }
        
        const charToLevel = data.users[userId].characters.find(c => 
          c.name.toLowerCase() === charToLevelName
        );
        
        if (!charToLevel) {
          await message.reply('❌ You don\'t own this character!');
          return;
        }
        
        const currentCharLevel = charToLevel.level;
        const requirements = getLevelRequirements(currentCharLevel);
        
        if (charToLevel.tokens >= requirements.tokens && data.users[userId].coins >= requirements.coins) {
          charToLevel.tokens -= requirements.tokens;
          data.users[userId].coins -= requirements.coins;
          charToLevel.level += 1;
          data.users[userId].lastActivity = Date.now();
          
          const ptData = initializePersonalizedTaskData(data.users[userId]);
          if (ptData.taskProgress.levelsGained !== undefined) {
            const completedTask = checkTaskProgress(data.users[userId], 'levelsGained', 1);
            if (completedTask) {
              await completePersonalizedTask(client, userId, data, completedTask);
            }
          }
          
          await saveDataImmediate(data);
          
          const lvlEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('⬆️ LEVEL UP!')
            .setDescription(`<@${userId}> leveled up **${charToLevel.name} ${charToLevel.emoji}**!\n\n**Level ${currentCharLevel} → ${currentCharLevel + 1}**\n\n**Cost:**\n🎫 ${requirements.tokens} tokens\n💰 ${requirements.coins} coins`);
          await message.reply({ embeds: [lvlEmbed] });
        } else {
          const missingTokens = Math.max(0, requirements.tokens - charToLevel.tokens);
          const missingCoins = Math.max(0, requirements.coins - data.users[userId].coins);
          let errorMsg = '❌ Not enough resources!\n\n**Required:**\n';
          errorMsg += `🎫 ${requirements.tokens} tokens (you have ${charToLevel.tokens})\n`;
          errorMsg += `💰 ${requirements.coins} coins (you have ${data.users[userId].coins})`;
          
          if (missingTokens > 0 || missingCoins > 0) {
            errorMsg += '\n\n**Missing:**\n';
            if (missingTokens > 0) errorMsg += `🎫 ${missingTokens} tokens\n`;
            if (missingCoins > 0) errorMsg += `💰 ${missingCoins} coins`;
          }
          
          await message.reply(errorMsg);
        }
        break;
        
      case 'char':
      case 'character':
        const charName = args.join(' ').toLowerCase();
        
        if (!charName) {
          await message.reply('Usage: `!char <character name>`');
          return;
        }
        
        const userChar = data.users[userId].characters.find(c => 
          c.name.toLowerCase() === charName
        );
        
        if (!userChar) {
          await message.reply('You don\'t own this character!');
          return;
        }
        
        const charReq = getLevelRequirements(userChar.level);
        const charProgress = createLevelProgressBar(userChar.tokens, charReq.tokens);
        const charSkinUrl = await getSkinUrl(userChar.name, userChar.currentSkin || 'default');
        const availableSkins = userChar.ownedSkins || ['default'];
        const boostCount = getCharacterBoostCount(userChar);
        const remainingBoosts = MAX_BOOSTS_PER_CHARACTER - boostCount;
        
        const charEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`${userChar.emoji} ${userChar.name}`)
          .setImage(charSkinUrl)
          .addFields(
            { name: 'Level', value: `${userChar.level}`, inline: true },
            { name: 'ST', value: `${userChar.st}%`, inline: true },
            { name: 'Tokens', value: `${userChar.tokens}/${charReq.tokens}`, inline: true },
            { name: 'ST Boosts', value: `${boostCount}/${MAX_BOOSTS_PER_CHARACTER} used\n${remainingBoosts > 0 ? `⚡ ${remainingBoosts} left` : '❌ Max reached'}`, inline: true },
            { name: 'Next Level Cost', value: `🎫 ${charReq.tokens} tokens\n💰 ${charReq.coins} coins`, inline: true },
            { name: 'Progress to Next Level', value: charProgress, inline: false },
            { name: '🎨 Current Skin', value: userChar.currentSkin || 'default', inline: true },
            { name: '🖼️ Owned Skins', value: availableSkins.join(', '), inline: true }
          );
        
        await message.reply({ embeds: [charEmbed] });
        break;
        
      case 'release':
      case 'leave':
        const charToReleaseName = args.join(' ').toLowerCase();
        
        if (!charToReleaseName) {
          await message.reply('Usage: `!release <character name>`');
          return;
        }
        
        const charIndex = data.users[userId].characters.findIndex(c => 
          c.name.toLowerCase() === charToReleaseName
        );
        
        if (charIndex === -1) {
          await message.reply('❌ You don\'t own this character!');
          return;
        }
        
        const charToRelease = data.users[userId].characters[charIndex];
        
        if (charToRelease.level < 10) {
          await message.reply(`❌ **${charToRelease.name}** must be at least level 10 to release! (Currently level ${charToRelease.level})`);
          return;
        }
        
        data.users[userId].characters.splice(charIndex, 1);
        
        if (data.users[userId].selectedCharacter === charToRelease.name) {
          data.users[userId].selectedCharacter = data.users[userId].characters.length > 0 
            ? data.users[userId].characters[0].name 
            : null;
        }
        
        if (!data.users[userId].questProgress) data.users[userId].questProgress = {};
        data.users[userId].questProgress.charsReleased = (data.users[userId].questProgress.charsReleased || 0) + 1;
        
        saveData(data);
        
        const releaseEmbed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('👋 Character Released')
          .setDescription(`<@${userId}> released **${charToRelease.name} ${charToRelease.emoji}**!\n\nLevel: ${charToRelease.level}\nST: ${charToRelease.st}%\nTokens: ${charToRelease.tokens}\n\nGoodbye, ${charToRelease.name}!`);
        
        await message.reply({ embeds: [releaseEmbed] });
        break;
        
      case 'setdrop':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        data.dropChannel = message.channel.id;
        saveData(data);
        await message.reply(`✅ Drop channel set to ${message.channel}!`);
        break;
        
      case 'startdrops':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        if (!data.dropChannel) {
          await message.reply('❌ Please set a drop channel first with `!setdrop`!');
          return;
        }
        
        startDropSystem(client, data);
        await message.reply('✅ Drop system started! Drops will appear every 20 seconds.');
        break;
        
      case 'stopdrops':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        stopDropSystem();
        await message.reply('✅ Drop system stopped!');
        break;
        
      case 'paydrops':
      case 'activatedrops':
        if (!serverId || isMainServer(serverId)) {
          await message.reply('❌ This command is only for non-main servers!');
          return;
        }
        
        if (!isSuperAdmin(userId) && !isZooAdmin(message.member)) {
          await message.reply('❌ Only users with the **ZooAdmin** role can activate drops for this server!\n\nAsk a server administrator to give you the "ZooAdmin" role to manage the bot.');
          return;
        }
        
        const payResult = await payForDrops(serverId, userId, data);
        
        if (payResult.success) {
          const payEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('💎 Drops Activated!')
            .setDescription(payResult.message);
          
          await message.reply({ embeds: [payEmbed] });
        } else {
          await message.reply(payResult.message);
        }
        break;
        
      case 'dropstatus':
        const isActive = areDropsActive(serverId);
        const dropsTimeLeft = getDropsTimeRemaining(serverId);
        
        const statusEmbed = new EmbedBuilder()
          .setColor(isActive ? '#00FF00' : '#FF0000')
          .setTitle('🎁 Drop System Status')
          .setDescription(isActive 
            ? `✅ **Drops are ACTIVE**\n⏰ Time remaining: ${dropsTimeLeft}\n\n💡 Drops will expire after ${dropsTimeLeft}${isMainServer(serverId) ? ' (unlimited in main server)' : ''}` 
            : `❌ **Drops are INACTIVE**\n\n💎 Use \`!paydrops\` to activate drops for 3 hours (100 gems)${isMainServer(serverId) ? '\n\n✨ Main server has unlimited drops!' : ''}`);
        
        await message.reply({ embeds: [statusEmbed] });
        break;
        
      case 'c':
        const code = args[0]?.toLowerCase();
        
        if (!code) return;
        
        if (!serverId) return;
        
        if (!data.serverDrops) data.serverDrops = {};
        
        if (data.serverDrops[serverId] && data.serverDrops[serverId].code === code) {
          const drop = data.serverDrops[serverId];
          
          if (drop.type === 'tokens') {
            const charToReward = data.users[userId].characters.find(c => 
              c.name.toLowerCase() === drop.characterName.toLowerCase()
            );
            
            if (charToReward) {
              delete data.serverDrops[serverId];
              charToReward.tokens += drop.amount;
              
              if (!data.users[userId].questProgress) data.users[userId].questProgress = {};
              data.users[userId].questProgress.dropsCaught = (data.users[userId].questProgress.dropsCaught || 0) + 1;
              data.users[userId].lastActivity = Date.now();
              
              const ptData = initializePersonalizedTaskData(data.users[userId]);
              if (ptData.taskProgress.dropsCaught !== undefined) {
                const completedTask = checkTaskProgress(data.users[userId], 'dropsCaught', 1);
                if (completedTask) {
                  await completePersonalizedTask(client, userId, data, completedTask);
                }
              }
              
              await eventSystem.recordProgress(userId, data.users[userId].username, 1, 'drop_catcher');
              
              saveData(data);
              
              const dropEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 DROP CAUGHT!')
                .setDescription(`<@${userId}> caught the drop!\n\n**Reward:** ${drop.amount} ${drop.characterName} tokens 🎫`);
              
              await message.reply({ embeds: [dropEmbed] });
            } else {
              await message.reply(`❌ You don't own **${drop.characterName}**, so you can't collect these tokens! Drop remains active.`);
            }
          } else {
            delete data.serverDrops[serverId];
            
            if (drop.type === 'coins') {
              data.users[userId].coins += drop.amount;
            } else if (drop.type === 'gems') {
              data.users[userId].gems += drop.amount;
            } else if (drop.type === 'shards') {
              data.users[userId].shards = (data.users[userId].shards || 0) + drop.amount;
            }
            
            if (!data.users[userId].questProgress) data.users[userId].questProgress = {};
            data.users[userId].questProgress.dropsCaught = (data.users[userId].questProgress.dropsCaught || 0) + 1;
            data.users[userId].lastActivity = Date.now();
            
            const ptData2 = initializePersonalizedTaskData(data.users[userId]);
            if (ptData2.taskProgress.dropsCaught !== undefined) {
              const completedTask2 = checkTaskProgress(data.users[userId], 'dropsCaught', 1);
              if (completedTask2) {
                await completePersonalizedTask(client, userId, data, completedTask2);
              }
            }
            
            await eventSystem.recordProgress(userId, data.users[userId].username, 1, 'drop_catcher');
            
            saveData(data);
            
            let rewardText = '';
            if (drop.type === 'coins') {
              rewardText = `${drop.amount} coins 💰`;
            } else if (drop.type === 'gems') {
              rewardText = `${drop.amount} gems 💎`;
            } else if (drop.type === 'shards') {
              rewardText = `${drop.amount} shards 🔷`;
            }
            
            const dropEmbed = new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('🎉 DROP CAUGHT!')
              .setDescription(`<@${userId}> caught the drop!\n\n**Reward:** ${rewardText}`);
            
            await message.reply({ embeds: [dropEmbed] });
          }
        }
        break;
        
      case 't':
      case 'trade':
        const receiver = message.mentions.users.first();
        
        if (!receiver) {
          await message.reply('Usage: `!t @user`');
          return;
        }
        
        if (receiver.id === userId) {
          await message.reply('❌ You can\'t trade with yourself!');
          return;
        }
        
        if (!data.users[receiver.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        await initiateTrade(message, data, userId, receiver.id);
        break;
        
      case 'grant':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const grantUser = message.mentions.users.first();
        const grantType = args[1]?.toLowerCase();
        const grantTarget = args.slice(2).join(' ');
        const grantAmount = parseInt(grantTarget);
        
        if (!grantUser || !grantType) {
          await message.reply('Usage: `!grant @user <coins/gems> <amount>` or `!grant @user tokens <character> <amount>`');
          return;
        }
        
        if (!data.users[grantUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        if (grantType === 'tokens') {
          const charNameForTokens = args.slice(2, -1).join(' ').toLowerCase();
          const tokenAmount = parseInt(args[args.length - 1]);
          
          if (!charNameForTokens || !tokenAmount) {
            await message.reply('Usage: `!grant @user tokens <character name> <amount>`');
            return;
          }
          
          const targetChar = data.users[grantUser.id].characters.find(c => 
            c.name.toLowerCase() === charNameForTokens
          );
          
          if (!targetChar) {
            await message.reply('❌ That user doesn\'t own this character!');
            return;
          }
          
          targetChar.tokens += tokenAmount;
          await saveDataImmediate(data);
          
          await message.reply(`✅ Granted ${tokenAmount} ${targetChar.name} tokens to <@${grantUser.id}>!`);
        } else if (['coins', 'gems'].includes(grantType)) {
          if (!grantAmount) {
            await message.reply('Please specify an amount!');
            return;
          }
          
          data.users[grantUser.id][grantType] += grantAmount;
          await saveDataImmediate(data);
          
          await message.reply(`✅ Granted ${grantAmount} ${grantType} to <@${grantUser.id}>!`);
        } else {
          await message.reply('Invalid type! Use: coins, gems, or tokens');
        }
        break;
        
      case 'grantchar':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const charUser = message.mentions.users.first();
        if (!charUser) {
          await message.reply('Usage: `!grantchar @user <character name> [ST]`\nExample: `!grantchar @user Nix 75`');
          return;
        }
        
        const restArgs = args.slice(1);
        let customST = null;
        let charToGrant = '';
        
        const lastArg = restArgs[restArgs.length - 1];
        const stValue = parseFloat(lastArg);
        
        if (!isNaN(stValue) && stValue > 0 && stValue <= 100) {
          customST = stValue;
          charToGrant = restArgs.slice(0, -1).join(' ');
        } else {
          charToGrant = restArgs.join(' ');
        }
        
        if (!charToGrant) {
          await message.reply('Usage: `!grantchar @user <character name> [ST]`\nExample: `!grantchar @user Nix 75`');
          return;
        }
        
        const foundChar = CHARACTERS.find(c => c.name.toLowerCase() === charToGrant.toLowerCase());
        
        if (!foundChar) {
          await message.reply('❌ Character not found!');
          return;
        }
        
        if (!data.users[charUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        const alreadyHas = data.users[charUser.id].characters.find(c => c.name === foundChar.name);
        
        if (alreadyHas) {
          await message.reply('❌ User already has this character!');
          return;
        }
        
        const grantedST = customST || generateST();
        const wasFirstChar = data.users[charUser.id].characters.length === 0;
        const pendingToGrant = wasFirstChar ? (data.users[charUser.id].pendingTokens || 0) : 0;
        
        const grantedMoves = assignMovesToCharacter(foundChar.name, grantedST);
        const grantedHP = calculateBaseHP(grantedST);
        
        data.users[charUser.id].characters.push({
          name: foundChar.name,
          emoji: foundChar.emoji,
          level: 1,
          tokens: pendingToGrant,
          st: grantedST,
          moves: grantedMoves,
          baseHp: grantedHP,
          currentSkin: 'default',
          ownedSkins: ['default']
        });
        
        if (wasFirstChar && pendingToGrant > 0) {
          data.users[charUser.id].pendingTokens = 0;
        }
        
        await saveDataImmediate(data);
        
        let grantMessage = `✅ Granted **${foundChar.name} ${foundChar.emoji}** (ST: ${grantedST}%) to <@${charUser.id}>!`;
        if (pendingToGrant > 0) {
          grantMessage += `\n🎁 They also received ${pendingToGrant} pending tokens!`;
        }
        
        await message.reply(grantMessage);
        break;
        
      case 'addskin':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const skinCharName = args[0];
        const skinName = args[1];
        const skinUrl = args[2];
        
        if (!skinCharName || !skinName || !skinUrl) {
          await message.reply('Usage: `!addskin <character> <skin_name> <image_url>`\nExample: `!addskin Nix galaxy https://example.com/image.png`');
          return;
        }
        
        const foundSkinChar = CHARACTERS.find(c => c.name.toLowerCase() === skinCharName.toLowerCase());
        if (!foundSkinChar) {
          await message.reply('❌ Character not found!');
          return;
        }
        
        const { addSkinToCharacter } = require('./skinSystem.js');
        addSkinToCharacter(foundSkinChar.name, skinName, skinUrl);
        
        await message.reply(`✅ Added skin **${skinName}** to **${foundSkinChar.name} ${foundSkinChar.emoji}**!\nImage: ${skinUrl}\n\nNow you can grant this skin to players using: \`!grantskin @user ${foundSkinChar.name} ${skinName}\``);
        break;
        
      case 'grantskin':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const skinTargetUser = message.mentions.users.first();
        const grantSkinCharName = args[1];
        const grantSkinName = args[2];
        
        if (!skinTargetUser || !grantSkinCharName || !grantSkinName) {
          await message.reply('Usage: `!grantskin @user <character> <skin_name>`');
          return;
        }
        
        if (!data.users[skinTargetUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        const targetUserChar = data.users[skinTargetUser.id].characters.find(c => 
          c.name.toLowerCase() === grantSkinCharName.toLowerCase()
        );
        
        if (!targetUserChar) {
          await message.reply('❌ That user doesn\'t own this character!');
          return;
        }
        
        if (!(await skinExists(targetUserChar.name, grantSkinName))) {
          await message.reply(`❌ Skin **${grantSkinName}** doesn't exist for **${targetUserChar.name}**!\nUse \`!addskin ${targetUserChar.name} ${grantSkinName} <image_url>\` to create it first.`);
          return;
        }
        
        if (!targetUserChar.ownedSkins) {
          targetUserChar.ownedSkins = ['default'];
        }
        
        if (targetUserChar.ownedSkins.includes(grantSkinName)) {
          await message.reply(`❌ <@${skinTargetUser.id}> already owns the **${grantSkinName}** skin for **${targetUserChar.name}**!`);
          return;
        }
        
        targetUserChar.ownedSkins.push(grantSkinName);
        saveData(data);
        
        await message.reply(`✅ Granted **${grantSkinName}** skin for **${targetUserChar.name} ${targetUserChar.emoji}** to <@${skinTargetUser.id}>!\nThey can equip it using: \`!equipskin ${targetUserChar.name} ${grantSkinName}\``);
        break;
        
      case 'revokeskin':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const revokeSkinUser = message.mentions.users.first();
        const revokeSkinCharName = args[1];
        const revokeSkinName = args[2];
        
        if (!revokeSkinUser || !revokeSkinCharName || !revokeSkinName) {
          await message.reply('Usage: `!revokeskin @user <character> <skin_name>`');
          return;
        }
        
        if (revokeSkinName === 'default') {
          await message.reply('❌ You cannot revoke the default skin!');
          return;
        }
        
        if (!data.users[revokeSkinUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        const revokeUserChar = data.users[revokeSkinUser.id].characters.find(c => 
          c.name.toLowerCase() === revokeSkinCharName.toLowerCase()
        );
        
        if (!revokeUserChar) {
          await message.reply('❌ That user doesn\'t own this character!');
          return;
        }
        
        if (!revokeUserChar.ownedSkins || !revokeUserChar.ownedSkins.includes(revokeSkinName)) {
          await message.reply(`❌ <@${revokeSkinUser.id}> doesn't own the **${revokeSkinName}** skin!`);
          return;
        }
        
        revokeUserChar.ownedSkins = revokeUserChar.ownedSkins.filter(s => s !== revokeSkinName);
        
        if (revokeUserChar.currentSkin === revokeSkinName) {
          revokeUserChar.currentSkin = 'default';
        }
        
        saveData(data);
        
        await message.reply(`✅ Revoked **${revokeSkinName}** skin for **${revokeUserChar.name} ${revokeUserChar.emoji}** from <@${revokeSkinUser.id}>!`);
        break;
        
      case 'deleteskin':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const deleteCharName = args[0];
        const deleteSkinName = args[1];
        
        if (!deleteCharName || !deleteSkinName) {
          await message.reply('Usage: `!deleteskin <character> <skin_name>`\nExample: `!deleteskin Nix galaxy`');
          return;
        }
        
        if (deleteSkinName === 'default') {
          await message.reply('❌ You cannot delete the default skin!');
          return;
        }
        
        const foundDeleteChar = CHARACTERS.find(c => c.name.toLowerCase() === deleteCharName.toLowerCase());
        if (!foundDeleteChar) {
          await message.reply('❌ Character not found!');
          return;
        }
        
        const { removeSkinFromCharacter } = require('./skinSystem.js');
        const deleted = await removeSkinFromCharacter(foundDeleteChar.name, deleteSkinName);
        
        if (deleted) {
          await message.reply(`✅ Deleted skin **${deleteSkinName}** from **${foundDeleteChar.name} ${foundDeleteChar.emoji}**!\n\n⚠️ Note: Users who own this skin will still have it in their inventory until manually revoked.`);
        } else {
          await message.reply(`❌ Skin **${deleteSkinName}** not found for **${foundDeleteChar.name}**!`);
        }
        break;
        
      case 'uploadskin':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const uploadCharName = args[0];
        const uploadSkinName = args[1];
        
        if (!uploadCharName || !uploadSkinName) {
          await message.reply('Usage: `!uploadskin <character> <skin_name>` with an attached image\nExample: `!uploadskin Nix galaxy` (attach image to message)');
          return;
        }
        
        if (message.attachments.size === 0) {
          await message.reply('❌ Please attach an image to your message!\n\nUsage: Upload an image, then type `!uploadskin <character> <skin_name>` in the message.');
          return;
        }
        
        const attachment = message.attachments.first();
        
        const isImage = attachment.contentType?.startsWith('image/') || 
                       /\.(png|jpe?g|gif|webp)$/i.test(attachment.name);
        
        if (!isImage) {
          await message.reply('❌ The attachment must be an image file (PNG, JPG, GIF, or WEBP)!');
          return;
        }
        
        const foundUploadChar = CHARACTERS.find(c => c.name.toLowerCase() === uploadCharName.toLowerCase());
        if (!foundUploadChar) {
          await message.reply('❌ Character not found!');
          return;
        }
        
        const discordCdnUrl = attachment.url;
        
        const skinSystem = require('./skinSystem.js');
        await skinSystem.addSkinToCharacter(foundUploadChar.name, uploadSkinName, discordCdnUrl);
        
        const uploadEmbed = new EmbedBuilder()
          .setColor('#9C27B0')
          .setTitle(`✅ Skin Uploaded!`)
          .setDescription(`Added skin **${uploadSkinName}** to **${foundUploadChar.name} ${foundUploadChar.emoji}**!\n\nNow you can grant this skin to players using:\n\`!grantskin @user ${foundUploadChar.name} ${uploadSkinName}\``)
          .setImage(discordCdnUrl)
          .setFooter({ text: 'Image hosted on Discord CDN' });
        
        await message.reply({ embeds: [uploadEmbed] });
        break;
        
      case 'equipskin':
        const equipCharName = args[0];
        const equipSkinName = args[1];
        
        if (!equipCharName || !equipSkinName) {
          await message.reply('Usage: `!equipskin <character> <skin_name>`\nExample: `!equipskin Nix galaxy`');
          return;
        }
        
        const userCharToEquip = data.users[userId].characters.find(c => 
          c.name.toLowerCase() === equipCharName.toLowerCase()
        );
        
        if (!userCharToEquip) {
          await message.reply('❌ You don\'t own this character!');
          return;
        }
        
        if (!userCharToEquip.ownedSkins) {
          userCharToEquip.ownedSkins = ['default'];
        }
        
        if (!userCharToEquip.ownedSkins.includes(equipSkinName)) {
          await message.reply(`❌ You don't own the **${equipSkinName}** skin for **${userCharToEquip.name}**!\nYour owned skins: ${userCharToEquip.ownedSkins.join(', ')}`);
          return;
        }
        
        userCharToEquip.currentSkin = equipSkinName;
        saveData(data);
        
        const equipSkinUrl = await getSkinUrl(userCharToEquip.name, equipSkinName);
        const equipEmbed = new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle(`🎨 Skin Equipped!`)
          .setDescription(`**${userCharToEquip.emoji} ${userCharToEquip.name}** is now wearing the **${equipSkinName}** skin!`)
          .setImage(equipSkinUrl);
        
        await message.reply({ embeds: [equipEmbed] });
        break;
        
      case 'setprofilepic':
      case 'setpfp':
        const profileCharName = args[0];
        
        if (!profileCharName) {
          await message.reply('Usage: `!setprofilepic <character>`\nExample: `!setprofilepic Nix`\n\nSet which character appears as your profile picture!');
          return;
        }
        
        const ownedChar = data.users[userId].characters.find(c => 
          c.name.toLowerCase() === profileCharName.toLowerCase()
        );
        
        if (!ownedChar) {
          await message.reply('❌ You don\'t own this character! You can only use characters you own as your profile picture.');
          return;
        }
        
        data.users[userId].profileDisplayCharacter = ownedChar.name;
        await saveDataImmediate(data);
        
        const profilePicUrl = await getSkinUrl(ownedChar.name, ownedChar.currentSkin || 'default');
        const pfpEmbed = new EmbedBuilder()
          .setColor('#FF69B4')
          .setTitle('🖼️ Profile Picture Updated!')
          .setDescription(`Your profile will now display **${ownedChar.emoji} ${ownedChar.name}** with the **${ownedChar.currentSkin || 'default'}** skin!\n\nUse \`!profile\` to see your updated profile.`)
          .setThumbnail(profilePicUrl);
        
        await message.reply({ embeds: [pfpEmbed] });
        break;
        
      case 'b':
      case 'battle':
        const battleArg = args[0]?.toLowerCase();
        
        if (battleArg === 'ai' || battleArg === 'easy' || battleArg === 'normal' || battleArg === 'hard') {
          if (serverId && !isMainServer(serverId)) {
            const mainServerEmbed = new EmbedBuilder()
              .setColor('#FF6B35')
              .setTitle('⚔️ AI Battles - Main Server Only!')
              .setDescription(`AI battles are exclusive to our main server!\n\n**Main Server Features:**\n⚡ Faster drops (20s vs 30s)\n🤖 AI battle system\n🦁 Zoo raids every hour\n🎯 More events and rewards\n\n[Join our main server to unlock these features!](https://discord.gg/yourinvitelink)`)
              .setFooter({ text: 'You can still battle other players with !battle @user' });
            
            await message.reply({ embeds: [mainServerEmbed] });
            return;
          }
          
          const difficulty = (battleArg === 'easy' || battleArg === 'normal' || battleArg === 'hard') ? battleArg : 'normal';
          const { startAIBattle } = require('./aiBattleSystem.js');
          await startAIBattle(message, data, userId, client.user.id, difficulty, CHARACTERS);
          return;
        }
        
        const battleOpponent = message.mentions.users.first();
        
        if (!battleOpponent) {
          await message.reply('Usage: `!b @user` to challenge someone\n`!b ai` for AI battle (normal difficulty)\n`!b easy/normal/hard` for AI with difficulty');
          return;
        }
        
        if (battleOpponent.id === userId) {
          await message.reply('❌ You can\'t battle yourself! Use `!b ai` for an AI battle.');
          return;
        }
        
        if (battleOpponent.bot) {
          await message.reply('❌ You can\'t battle a bot!');
          return;
        }
        
        await initiateBattle(message, data, userId, battleOpponent.id);
        break;
        
      case 'shop':
        if (!data.users[userId].inventory) {
          data.users[userId].inventory = {};
        }
        await openShop(message, data);
        break;
        
      case 'i':
      case 'info':
        const infoCharName = args.join(' ').toLowerCase();
        
        if (!infoCharName) {
          await message.reply('Usage: `!I <character name>`');
          return;
        }
        
        const userInfoChar = data.users[userId].characters.find(c => 
          c.name.toLowerCase() === infoCharName
        );
        
        if (!userInfoChar) {
          await message.reply('❌ You don\'t own this character!');
          return;
        }
        
        if (!userInfoChar.moves || !userInfoChar.baseHp) {
          await message.reply('❌ This character doesn\'t have battle data yet! It will be added automatically.');
          return;
        }
        
        const moves = userInfoChar.moves;
        const movesList = [
          `**Special:** ${getMoveDisplay(moves.special, userInfoChar.level, userInfoChar.st, true)}`,
          `**Move 1:** ${getMoveDisplay(moves.tierMoves[0], userInfoChar.level, userInfoChar.st, false)}`,
          `**Move 2:** ${getMoveDisplay(moves.tierMoves[1], userInfoChar.level, userInfoChar.st, false)}`
        ].join('\n');
        
        const infoSkinUrl = await getSkinUrl(userInfoChar.name, userInfoChar.currentSkin || 'default');
        const abilityDesc = getAbilityDescription(userInfoChar.name);
        
        const infoEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle(`${userInfoChar.emoji} ${userInfoChar.name}`)
          .setImage(infoSkinUrl)
          .setDescription(`**Level:** ${userInfoChar.level}\n**ST:** ${userInfoChar.st}%\n**HP:** ${userInfoChar.baseHp}\n**Tokens:** ${userInfoChar.tokens}\n**Skin:** ${userInfoChar.currentSkin || 'default'}`)
          .addFields(
            { name: '✨ Ability', value: abilityDesc, inline: false },
            { name: '⚔️ Moves', value: movesList, inline: false },
            { name: '📊 Battle Info', value: `Energy system: Moves cost ⚡\nCritical hits: 15% base chance\nSpecial moves cost more energy but deal more damage`, inline: false }
          );
        
        await message.reply({ embeds: [infoEmbed] });
        break;
        
      case 'quests': {
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
  
  const user = data.users[userId];
  const availableQuests = getAvailableQuests(user);
  const questsPerPage = 5;
  const totalQuestPages = Math.ceil(availableQuests.length / questsPerPage);
  let currentPage = 1;

  // --- Embed builder ---
  const buildQuestEmbed = (page) => {
    const startIdx = (page - 1) * questsPerPage;
    const endIdx = startIdx + questsPerPage;
    const questsToShow = availableQuests.slice(startIdx, endIdx);
    const completedCount = user.completedQuests?.length || 0;
    const questsList = questsToShow.map(q => formatQuestDisplay(user, q)).join('\n\n') || 'No quests available!';

    return new EmbedBuilder()
      .setColor('#E67E22')
      .setTitle('📜 Quest Log')
      .setDescription(`**Completed:** ${completedCount}/${QUESTS.length}\n\n${questsList}`)
      .setFooter({ text: `Page ${page}/${totalQuestPages} | Use !quest <id> for details` });
  };

  // --- Button row ---
  const buildButtons = (page) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1),
      new ButtonBuilder()
        .setCustomId('close')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalQuestPages)
    );
  };

  // --- Send initial embed with buttons ---
  const messageWithButtons = await message.reply({
    embeds: [buildQuestEmbed(currentPage)],
    components: [buildButtons(currentPage)]
  });

  // --- Collector to handle clicks ---
  const collector = messageWithButtons.createMessageComponentCollector({
    time: 120000 // 2 mins
  });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== userId) {
      await interaction.reply({ content: "❌ This isn't your quest log!", flags: 64 });
      return;
    }

    if (interaction.customId === 'prev' && currentPage > 1) currentPage--;
    else if (interaction.customId === 'next' && currentPage < totalQuestPages) currentPage++;
    else if (interaction.customId === 'close') {
      await interaction.message.delete().catch(() => {});
      collector.stop('closed');
      return;
    }

    await interaction.update({
      embeds: [buildQuestEmbed(currentPage)],
      components: [buildButtons(currentPage)]
    });
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'closed') return;
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setEmoji('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('close').setEmoji('🗑️').setStyle(ButtonStyle.Danger).setDisabled(true),
      new ButtonBuilder().setCustomId('next').setEmoji('➡️').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );

    await messageWithButtons.edit({ components: [disabledRow] }).catch(() => {});
  });

  break;
      }
        
      case 'quest':
        const questId = parseInt(args[0]);
        
        if (!questId) {
          await message.reply('Usage: `!quest <id>`');
          return;
        }
        
        const quest = QUESTS.find(q => q.id === questId);
        
        if (!quest) {
          await message.reply('❌ Quest not found!');
          return;
        }
        
        const questDisplay = formatQuestDisplay(data.users[userId], quest);
        const canClaim = canClaimQuest(data.users[userId], quest);
        
        const questDetailEmbed = new EmbedBuilder()
          .setColor(canClaim ? '#2ECC71' : '#95A5A6')
          .setTitle(`📜 Quest #${quest.id}`)
          .setDescription(questDisplay)
          .setFooter({ text: canClaim ? 'Use !claim ' + quest.id + ' to claim rewards!' : 'Complete the quest to claim rewards' });
        
        await message.reply({ embeds: [questDetailEmbed] });
        break;
        
      case 'claim':
        const claimQuestId = parseInt(args[0]);
        
        if (!claimQuestId) {
          await message.reply('Usage: `!claim <quest id>`');
          return;
        }
        
        const questToClaim = QUESTS.find(q => q.id === claimQuestId);
        
        if (!questToClaim) {
          await message.reply('❌ Quest not found!');
          return;
        }
        
        const claimResult = claimQuest(data.users[userId], questToClaim);
        
        if (claimResult.success) {
          await saveDataImmediate(data);
          const claimEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🎉 Quest Completed!')
            .setDescription(`**${questToClaim.name}**\n\n${claimResult.message}`);
          
          await message.reply({ embeds: [claimEmbed] });
        } else {
          await message.reply(`❌ ${claimResult.message}`);
        }
        break;
        
      case 'shards':
        const shardInfo = getBoosterInfo(data.users[userId]);
        
        const shardEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🔷 ST Booster System')
          .setDescription(`**Shards:** ${shardInfo.shards}\n**ST Boosters:** ${shardInfo.boosters}\n**Total Boosts Used:** ${shardInfo.boostsUsed}`)
          .addFields(
            { name: '📦 Crafting', value: `Cost: 100 shards per booster\n${shardInfo.canCraft ? '✅ Ready to craft!' : `❌ Need ${shardInfo.shardsNeeded} more shards`}`, inline: false },
            { name: '⚠️ How It Works', value: '**ST Boosters completely re-roll your character\'s ST!**\n• Limit: 3 boosts per character\n• **Risk:** Higher chance to DECREASE ST\n• Low ST (0-50): 60% improve, 40% decrease\n• Medium ST (50-75): 45% improve, 55% decrease\n• High ST (75-90): 25% improve, 75% decrease\n• **Very High ST (90+): 10% improve, 90% decrease!**', inline: false },
            { name: '💡 Commands', value: '`!craft` - Craft a booster (100 shards)\n`!boost <character>` - Use a booster (risky!)', inline: false }
          );
        
        await message.reply({ embeds: [shardEmbed] });
        break;
        
      case 'craft':
        const craftResult = craftBooster(data.users[userId]);
        
        if (craftResult.success) {
          await saveDataImmediate(data);
          await message.reply(craftResult.message);
        } else {
          await message.reply(craftResult.message);
        }
        break;
        
      case 'boost':
        const boostCharName = args.join(' ').toLowerCase();
        
        if (!boostCharName) {
          await message.reply('Usage: `!boost <character name>`\n\n⚠️ **Warning:** ST Boosters RE-ROLL your ST completely! Higher ST = higher chance to DECREASE!');
          return;
        }
        
        const boostResult = useBooster(data.users[userId], boostCharName);
        
        if (boostResult.success) {
          await saveDataImmediate(data);
          
          const changeSymbol = boostResult.increased ? '+' : '';
          const changeDisplay = `${changeSymbol}${boostResult.change}%`;
          
          const boostEmbed = new EmbedBuilder()
            .setColor(boostResult.resultColor)
            .setTitle(`${boostResult.resultEmoji} ST RE-ROLLED!`)
            .setDescription(`**${boostResult.resultText}**\n\n${boostResult.emoji} **${boostResult.character}**\n${boostResult.oldST}% → **${boostResult.newST}%** (${changeDisplay})\n\n💪 HP recalculated!\n🔢 Boosts used: ${boostResult.boostCount}/3\n⚡ Remaining boosts: ${boostResult.remainingBoosts}`);
          
          await message.reply({ embeds: [boostEmbed] });
        } else {
          await message.reply(boostResult.message);
        }
        break;
        
      case 'mail':
      case 'mailbox':
        const mailPage = parseInt(args[0]) || 1;
        const mailbox = data.users[userId].mailbox || [];
        const mailsPerPage = 5;
        const totalMailPages = Math.ceil(mailbox.length / mailsPerPage);
        const startMailIdx = (mailPage - 1) * mailsPerPage;
        const endMailIdx = startMailIdx + mailsPerPage;
        const mailsToShow = mailbox.slice(startMailIdx, endMailIdx);
        
        const unclaimedCount = getUnclaimedMailCount(data.users[userId]);
        
        const mailList = mailsToShow.map((m, i) => formatMailDisplay(m, startMailIdx + i)).join('\n\n');
        
        const mailEmbed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('📬 Mailbox')
          .setDescription(`**Unclaimed:** ${unclaimedCount}\n**Total Messages:** ${mailbox.length}\n\n${mailList || 'No mail yet!'}`)
          .setFooter({ text: `Page ${mailPage}/${totalMailPages || 1} | Use !claimmail <#> to claim rewards` });
        
        await message.reply({ embeds: [mailEmbed] });
        break;
        
      case 'claimmail':
        const mailIdx = parseInt(args[0]) - 1;
        
        if (isNaN(mailIdx)) {
          await message.reply('Usage: `!claimmail <mail number>`');
          return;
        }
        
        const claimMailResult = claimMail(data.users[userId], mailIdx);
        
        if (claimMailResult.success) {
          saveData(data);
          
          const claimMailEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('📬 Mail Claimed!')
            .setDescription(`${claimMailResult.message}\n\n${claimMailResult.rewards.join('\n')}`);
          
          await message.reply({ embeds: [claimMailEmbed] });
        } else {
          await message.reply(claimMailResult.message);
        }
        break;
        
      case 'clearmail':
        const clearResult = clearClaimedMail(data.users[userId]);
        
        if (clearResult.success) {
          await saveDataImmediate(data);
          await message.reply(clearResult.message);
        } else {
          await message.reply(clearResult.message);
        }
        break;
        
      case 'sendmail':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const fullMailText = args.join(' ');
        if (!fullMailText.includes(' | ')) {
          await message.reply('📨 **Send Mail to All Players**\n\nFormat: `!sendmail <message> | coins:<amount> gems:<amount> shards:<amount> character:<name> goldcrates:<amount> ...`\n\nExample: `!sendmail Happy holidays! | coins:500 gems:50 shards:5`');
          return;
        }
        
        const [mailMsg, rewardsText] = fullMailText.split(' | ');
        const rewards = {};
        
        const rewardParts = rewardsText.split(' ');
        for (const part of rewardParts) {
          if (part.includes(':')) {
            const [key, value] = part.split(':');
            if (['coins', 'gems', 'shards', 'goldCrates', 'emeraldCrates', 'legendaryCrates', 'tyrantCrates', 'bronzeCrates', 'silverCrates'].includes(key)) {
              rewards[key] = parseInt(value);
            } else if (key === 'character') {
              rewards.character = value;
            }
          }
        }
        
        const mail = sendMailToAll(mailMsg, rewards, message.author.username);
        let mailCount = 0;
        let dmCount = 0;
        
        for (const uid in data.users) {
          if (data.users[uid].started) {
            addMailToUser(data.users[uid], mail);
            mailCount++;
            
            try {
              const targetUser = await client.users.fetch(uid);
              const dmEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('📬 You have new mail!')
                .setDescription(`From: **${mail.from}**\n\n${mail.message}`)
                .setFooter({ text: 'Use !mail to view and claim your rewards!' });
              
              await targetUser.send({ embeds: [dmEmbed] });
              dmCount++;
            } catch (error) {
              console.log(`Could not send DM to user ${uid}`);
            }
          }
        }
        
        saveData(data);
        await message.reply(`✅ Sent mail to ${mailCount} players! (${dmCount} DM notifications sent)`);
        break;
        
      case 'news':
        const newsCount = parseInt(args[0]) || 5;
        const latestNews = getLatestNews(Math.min(newsCount, 10));
        
        if (latestNews.length === 0) {
          await message.reply('📰 No news yet!');
          return;
        }
        
        const newsList = latestNews.map(n => formatNewsDisplay(n)).join('\n\n─────────────\n\n');
        
        const newsEmbed = new EmbedBuilder()
          .setColor('#1ABC9C')
          .setTitle('📰 Latest News')
          .setDescription(newsList)
          .setFooter({ text: 'Stay updated with the latest announcements!' });
        
        await message.reply({ embeds: [newsEmbed] });
        break;
        
      case 'postnews':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const fullNewsText = args.join(' ');
        if (!fullNewsText.includes(' | ')) {
          await message.reply('📰 **Post News**\n\nFormat: `!postnews <title> | <content>`\n\nExample: `!postnews New Features! | Quests and ST Boosters are now available!`');
          return;
        }
        
        const [newsTitle, newsContent] = fullNewsText.split(' | ');
        
        if (!newsTitle || !newsContent) {
          await message.reply('❌ Both title and content are required!');
          return;
        }
        
        postNews(newsTitle, newsContent);
        
        let newsDmCount = 0;
        for (const uid in data.users) {
          if (data.users[uid].started) {
            try {
              const targetUser = await client.users.fetch(uid);
              const newsEmbed = new EmbedBuilder()
                .setColor('#1ABC9C')
                .setTitle(`📰 ${newsTitle}`)
                .setDescription(newsContent)
                .setFooter({ text: 'Use !news to view all announcements!' });
              
              await targetUser.send({ embeds: [newsEmbed] });
              newsDmCount++;
            } catch (error) {
              console.log(`Could not send DM to user ${uid}`);
            }
          }
        }
        
        await message.reply(`✅ News posted: **${newsTitle}** (${newsDmCount} DM notifications sent)`);
        break;
        
      case 'leaderboard':
      case 'lb':
        const lbType = args[0]?.toLowerCase() || 'coins';
        
        let lbData;
        let lbTitle;
        let lbType2;
        
        if (lbType === 'coins' || lbType === 'coin') {
          lbData = getTopCoins(data.users, 10);
          lbTitle = '💰 Top 10 - Coins';
          lbType2 = 'coins';
        } else if (lbType === 'gems' || lbType === 'gem') {
          lbData = getTopGems(data.users, 10);
          lbTitle = '💎 Top 10 - Gems';
          lbType2 = 'gems';
        } else if (lbType === 'battles' || lbType === 'battle' || lbType === 'wins') {
          lbData = getTopBattles(data.users, 10);
          lbTitle = '⚔️ Top 10 - Battle Wins';
          lbType2 = 'battles';
        } else if (lbType === 'collection' || lbType === 'chars' || lbType === 'characters') {
          lbData = getTopCollectors(data.users, 10);
          lbTitle = '🎭 Top 10 - Character Collection';
          lbType2 = 'collection';
        } else if (lbType === 'trophies' || lbType === 'trophy') {
          lbData = getTopTrophies(data.users, 10);
          lbTitle = '🏆 Top 10 - Trophies';
          lbType2 = 'trophies';
        } else {
          await message.reply('Usage: `!leaderboard <coins/gems/battles/collection/trophies>`');
          return;
        }
        
        const lbDisplay = formatLeaderboard(lbData, lbType2);
        
        const lbEmbed = new EmbedBuilder()
          .setColor('#F39C12')
          .setTitle(lbTitle)
          .setDescription(lbDisplay || 'No data yet!')
          .setFooter({ text: 'Keep playing to climb the ranks!' });
        
        await message.reply({ embeds: [lbEmbed] });
        break;
        
      case 'daily':
        const now = new Date();
        const lastClaim = data.users[userId].lastDailyClaim ? new Date(data.users[userId].lastDailyClaim) : null;
        
        if (lastClaim) {
          const timeDiff = now - lastClaim;
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            const hoursLeft = Math.ceil(24 - hoursDiff);
            await message.reply(`❌ You already claimed your daily reward! Come back in **${hoursLeft} hours**.`);
            return;
          }
        }
        
        const trophyReward = 15;
        const coinReward = Math.floor(Math.random() * 91) + 10;
        const gemReward = Math.floor(Math.random() * 3) + 1;
        
        data.users[userId].trophies = (data.users[userId].trophies || 200) + trophyReward;
        data.users[userId].coins += coinReward;
        data.users[userId].gems += gemReward;
        data.users[userId].lastDailyClaim = now.toISOString();
        await saveDataImmediate(data);
        
        const dailyEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🎁 Daily Reward Claimed!')
          .setDescription(`<@${userId}> claimed their daily rewards!\n\n**Rewards:**\n🏆 ${trophyReward} Trophies\n💰 ${coinReward} Coins\n💎 ${gemReward} Gems\n\nCome back tomorrow for more!`);
        
        await message.reply({ embeds: [dailyEmbed] });
        break;
        
      case 'coinduel':
      case 'coinflip':
        if (!data.users[userId].started) {
          await message.reply('❌ Start your journey with `!start` first!');
          return;
        }
        await coinDuel(message, args, data);
        break;
        
      case 'diceclash':
      case 'dice':
        if (!data.users[userId].started) {
          await message.reply('❌ Start your journey with `!start` first!');
          return;
        }
        await diceClash(message, args, data);
        break;
        
      case 'dooroffate':
      case 'door':
        if (!data.users[userId].started) {
          await message.reply('❌ Start your journey with `!start` first!');
          return;
        }
        await doorOfFate(message, args, data);
        break;
        
      case 'almostwin':
      case 'slot':
      case 'roll':
        if (!data.users[userId].started) {
          await message.reply('❌ Start your journey with `!start` first!');
          return;
        }
        await almostWinMachine(message, args, data);
        break;
        
      case 'rps':
      case 'rockpaperscissors':
        if (!data.users[userId].started) {
          await message.reply('❌ Start your journey with `!start` first!');
          return;
        }
        await rockPaperScissors(message, args, data);
        break;
        
      case 'event':
        const eventInfo = await eventSystem.getEventInfo(userId);

      
        if (eventInfo.status === 'no_event') {
          await message.reply('❌ No event is currently active.');
          return;
        }
        
        if (eventInfo.status === 'active') {
          const eventEmbed = new EmbedBuilder()
            .setColor('#00D9FF')
            .setTitle(`${eventInfo.displayName} - Active! 🎉`)
            .setDescription(eventInfo.description)
            .addFields(
              { name: '⏰ Time Remaining', value: eventInfo.timeRemaining, inline: true },
              { name: '👥 Participants', value: `${eventInfo.totalParticipants}`, inline: true }
            )
            .addFields(
              { name: '📊 Your Stats', value: `**Points:** ${eventInfo.userScore}`, inline: false }
            )
            .addFields(
              { name: '🏆 Prizes', value: '🥇 1st: 500 💎 + 5,000 💰\n🥈 2nd: 250 💎 + 2,500 💰\n🥉 3rd: 150 💎 + 1,500 💰\n🎖️ Top 5%: 75 💎 + 750 💰', inline: false }
            )
            .setTimestamp();
          
          await message.reply({ embeds: [eventEmbed] });
        } else if (eventInfo.status === 'ended') {
          const resultEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`${eventInfo.displayName} - Results 🏁`)
            .setDescription('The event has ended! Here are your results:')
            .addFields(
              { name: '📊 Your Performance', value: `**Final Score:** ${eventInfo.userScore}\n**Final Rank:** ${eventInfo.userRank}`, inline: false }
            );
          
          if (eventInfo.leaderboard && eventInfo.leaderboard.length > 0) {
            const top3Text = eventInfo.leaderboard.map((p, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return `${medals[i]} **${p.username}** - ${p.score} points`;
            }).join('\n');
            
            resultEmbed.addFields({ name: '🏆 Top 3', value: top3Text, inline: false });
          }
          
          resultEmbed.addFields({ name: '📅 Next Event', value: 'A new event is starting soon!', inline: false });
          
          await message.reply({ embeds: [resultEmbed] });
        }
        break;

         
      case 'setbattle':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        data.battleChannel = message.channel.id;
        saveData(data);
        await message.reply(`✅ Battle channel set to ${message.channel}! Players can now use battle commands here.`);
        break;
        
      case 'settrophies':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const trophyUser = message.mentions.users.first();
        const trophyAmount = parseInt(args[1]);
        
        if (!trophyUser || isNaN(trophyAmount)) {
          await message.reply('Usage: `!settrophies @user <amount>`');
          return;
        }
        
        if (!data.users[trophyUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        data.users[trophyUser.id].trophies = Math.max(0, trophyAmount);
        saveData(data);
        
        await message.reply(`✅ Set <@${trophyUser.id}>'s trophies to **${trophyAmount}** 🏆`);
        break;
        
      case 'setevent':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        data.eventChannelId = message.channel.id;
        saveData(data);
        await message.reply(`✅ Event announcement channel set to ${message.channel}! All event start/end announcements will be posted here.`);
        break;

      case 'startevent':
        if (!isSuperAdmin(userId) && !isBotAdmin(userId, serverId)) {
          await message.reply('❌ Only bot admins can start events manually!');
          return;
        }
        
        const eventTypeArg = args[0]?.toLowerCase();
        let mappedEventType = null;
        
        if (eventTypeArg) {
          const eventTypeMap = {
            'trophy': 'trophy_hunt',
            'drop': 'drop_catcher',
            'crate': 'crate_master'
          };
          mappedEventType = eventTypeMap[eventTypeArg];
          
          if (!mappedEventType) {
            await message.reply('❌ Invalid event type! Use one of: `trophy`, `drop`, or `crate`\n\nExample: `!startevent trophy` or just `!startevent` for next in rotation.');
            return;
          }
        }
        
        const startResult = await eventSystem.startEventManually(mappedEventType);
        await message.reply(startResult.message);
        break;

      case 'stopevent':
        if (!isSuperAdmin(userId) && !isBotAdmin(userId, serverId)) {
          await message.reply('❌ Only bot admins can stop events manually!');
          return;
        }
        
        const stopResult = await eventSystem.stopEventManually();
        await message.reply(stopResult.message);
        break;

      case 'eventschedule':
        if (!isSuperAdmin(userId) && !isBotAdmin(userId, serverId)) {
          const publicSchedule = await eventSystem.getScheduleInfo();
          const scheduleEmbed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle('⏰ Event Schedule')
            .setDescription('Automatic event scheduling information')
            .addFields(
              { name: '📅 Status', value: publicSchedule.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
              { name: '🕐 Start Time', value: `${publicSchedule.startTime} ${publicSchedule.timezone}`, inline: true },
              { name: '🌏 Current Time (IST)', value: publicSchedule.currentISTTime, inline: true }
            )
            .setTimestamp();
          
          await message.reply({ embeds: [scheduleEmbed] });
          return;
        }
        
        const subCommand = args[0]?.toLowerCase();
        
        if (!subCommand) {
          const scheduleInfo = await eventSystem.getScheduleInfo();
          const scheduleEmbed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle('⏰ Event Schedule Configuration')
            .setDescription('Manage automatic event scheduling')
            .addFields(
              { name: '📅 Status', value: scheduleInfo.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
              { name: '🕐 Start Time', value: `${scheduleInfo.startTime} ${scheduleInfo.timezone}`, inline: true },
              { name: '🌏 Current Time (IST)', value: scheduleInfo.currentISTTime, inline: true },
              { name: '📊 Last Run', value: scheduleInfo.lastRun, inline: false }
            )
            .addFields({
              name: '🔧 Available Commands',
              value: '`!eventschedule enable` - Enable automatic scheduling\n`!eventschedule disable` - Disable automatic scheduling\n`!eventschedule settime HH:MM` - Set event start time (IST)',
              inline: false
            })
            .setTimestamp();
          
          await message.reply({ embeds: [scheduleEmbed] });
        } else if (subCommand === 'enable') {
          const result = await eventSystem.toggleSchedule(true);
          await message.reply(result.message);
        } else if (subCommand === 'disable') {
          const result = await eventSystem.toggleSchedule(false);
          await message.reply(result.message);
        } else if (subCommand === 'settime') {
          const newTime = args[1];
          if (!newTime) {
            await message.reply('❌ Please provide a time in HH:MM format (e.g., `!eventschedule settime 05:30`)');
            return;
          }
          const result = await eventSystem.updateScheduleTime(newTime);
          await message.reply(result.message);
        } else {
          await message.reply('❌ Invalid subcommand. Use `!eventschedule` to see available options.');
        }
        break;
        
      case 'servers':
      case 'serverlist':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const guilds = client.guilds.cache.map(g => ({
          name: g.name,
          id: g.id,
          members: g.memberCount,
          owner: g.ownerId
        }));
        
        const serverListEmbed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle(`🌐 Bot Server List (${guilds.length} servers)`)
          .setDescription(guilds.map((g, i) => 
            `**${i + 1}.** ${g.name}\n└ ID: \`${g.id}\` | Members: ${g.members}${isMainServer(g.id) ? ' ⭐ **MAIN**' : ''}`
          ).join('\n\n'))
          .setFooter({ text: 'Use !removeserver <server_id> to remove bot from a server' });
        
        await message.reply({ embeds: [serverListEmbed] });
        break;
        
      case 'removeserver':
      case 'leaveserver':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        const targetServerId = args[0];
        if (!targetServerId) {
          await message.reply('Usage: `!removeserver <server_id>`\n\n💡 Use `!servers` to see all server IDs');
          return;
        }
        
        if (isMainServer(targetServerId)) {
          await message.reply('❌ Cannot remove bot from the main server!');
          return;
        }
        
        const targetGuild = client.guilds.cache.get(targetServerId);
        if (!targetGuild) {
          await message.reply('❌ Bot is not in a server with that ID!');
          return;
        }
        
        const guildName = targetGuild.name;
        
        try {
          await targetGuild.leave();
          await message.reply(`✅ Successfully left server: **${guildName}** (${targetServerId})`);
        } catch (error) {
          await message.reply(`❌ Failed to leave server: ${error.message}`);
        }
        break;
        
      case 'reset':
        if (!isSuperAdmin(userId)) {
          await message.reply('❌ This command is restricted to Super Admins only!');
          return;
        }
        
        await message.reply('⚠️ **WARNING:** This will reset ALL bot data (all users, characters, progress)!\n\nType `!confirmreset` within 30 seconds to confirm.');
        
        const resetFilter = m => m.author.id === userId && m.content === '!confirmreset';
        const resetCollector = message.channel.createMessageCollector({ filter: resetFilter, time: 30000, max: 1 });
        
        resetCollector.on('collect', async () => {
          data.users = {};
          data.dropChannel = null;
          data.battleChannel = null;
          data.activeDrops = [];
          data.news = [];
          saveData(data);
          await message.reply('✅ **Bot data has been completely reset!** All users can now start fresh with `!start`.');
        });
        
        resetCollector.on('end', (collected, reason) => {
          if (reason === 'time' && collected.size === 0) {
            message.channel.send('❌ Reset cancelled - timed out.');
          }
        });
        break;
        
      case 'botinfo':
        const botInfoEmbed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle('🎮 About This Bot')
          .setDescription('**A Zooba-inspired game**\n\nA comprehensive Discord bot featuring character collection, turn-based battles, leveling, crates, trading, and competitive rankings!')
          .addFields(
            { name: '👨‍💻 Created By', value: '**TigerMask** (AKA Jaguar)\nMade with passion for the community!', inline: false },
            { name: '🎯 Purpose', value: 'This is a **fan-made, non-profit game** created purely for **entertainment purposes**. Enjoy collecting characters, battling friends, and climbing the leaderboards!', inline: false },
            { name: '🌟 Features', value: '• 51 unique characters to collect\n• Turn-based battle system\n• Character leveling & ST stats\n• Trophy-based competitive ranking\n• Daily rewards & message rewards\n• Trading system\n• Quests & achievements', inline: false },
            { name: '📚 Get Started', value: 'Type `!help` to see all commands\nType `!start` to begin your journey!', inline: false }
          )
          .setFooter({ text: 'Made for fun, played with friends! 🎮' });
        
        await message.reply({ embeds: [botInfoEmbed] });
        break;
        
      case 'ptsend':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const ptUser = message.mentions.users.first();
        if (!ptUser) {
          await message.reply('Usage: `!ptsend @user` - Send a personalized task to a user');
          return;
        }
        
        if (!data.users[ptUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        await sendPersonalizedTask(client, ptUser.id, data);
        await message.reply(`✅ Sent personalized task to <@${ptUser.id}>!`);
        break;
        
      case 'pttoggle':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const ptToggleUser = message.mentions.users.first();
        const toggleState = args[1]?.toLowerCase();
        
        if (!ptToggleUser || !['on', 'off'].includes(toggleState)) {
          await message.reply('Usage: `!pttoggle @user <on/off>` - Enable/disable personalized tasks for a user');
          return;
        }
        
        if (!data.users[ptToggleUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        const enabled = toggleState === 'on';
        togglePersonalizedTasks(ptToggleUser.id, data, enabled);
        await saveData(data);
        
        await message.reply(`✅ Personalized tasks ${enabled ? 'enabled' : 'disabled'} for <@${ptToggleUser.id}>!`);
        break;
        
      case 'ptstats':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const ptStatsUser = message.mentions.users.first();
        if (!ptStatsUser) {
          await message.reply('Usage: `!ptstats @user` - View personalized task stats for a user');
          return;
        }
        
        if (!data.users[ptStatsUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        const stats = getTaskStats(data.users[ptStatsUser.id]);
        const timeRemaining = stats.timeRemaining > 0 ? formatTime(stats.timeRemaining) : 'None';
        
        const statsEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`📊 Personalized Task Stats - ${data.users[ptStatsUser.id].username}`)
          .addFields(
            { name: '✅ Completed', value: `${stats.totalCompleted}`, inline: true },
            { name: '❌ Missed', value: `${stats.totalMissed}`, inline: true },
            { name: '⚙️ Status', value: stats.isActive ? 'Active' : 'Disabled', inline: true },
            { name: '📝 Current Task', value: stats.currentTask, inline: true },
            { name: '⏰ Time Remaining', value: timeRemaining, inline: true }
          );
        
        await message.reply({ embeds: [statsEmbed] });
        break;
        
      case 'ptcustom':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const customTaskUser = message.mentions.users.first();
        if (!customTaskUser || args.length < 3) {
          await message.reply('Usage: `!ptcustom @user <type> <amount> <difficulty>`\nExample: `!ptcustom @user drops 10 hard`\n\nTypes: drops, battles, crates, leveling, messages, trading\nDifficulties: easy, medium, hard');
          return;
        }
        
        if (!data.users[customTaskUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        const taskType = args[1].toLowerCase();
        const taskAmount = args[2];
        const taskDifficulty = args[3]?.toLowerCase() || 'medium';
        
        // Create custom task
        const taskResult = createCustomTask(taskType, taskAmount, taskDifficulty);
        
        if (taskResult.error) {
          await message.reply(`❌ ${taskResult.error}`);
          return;
        }
        
        // Send custom task to user
        const sendResult = await sendCustomTask(client, customTaskUser.id, data, taskResult.task);
        
        if (sendResult.error) {
          await message.reply(`❌ ${sendResult.error}`);
          return;
        }
        
        await message.reply(`✅ Custom task sent to **${sendResult.username}**: ${taskResult.task.description}\n**Difficulty:** ${taskDifficulty}\n**Rewards:** ${formatReward(taskResult.task.reward)}`);
        break;
        
      case 'history':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const historyUser = message.mentions.users.first();
        if (!historyUser) {
          await message.reply('Usage: `!history @user [page]` - View transaction history for a user\nExample: `!history @user 1`');
          return;
        }
        
        if (!data.users[historyUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        const historyPage = parseInt(args[1]) || 1;
        const historyData = getHistory(data.users[historyUser.id], 100);
        const historySummary = getHistorySummary(data.users[historyUser.id]);
        const historyOutput = formatHistory(historyData, historySummary, historyPage);
        
        try {
          const dmUser = await client.users.fetch(message.author.id);
          await dmUser.send(`**Transaction History for ${data.users[historyUser.id].username}**\n\n${historyOutput}`);
          await message.reply('📊 History sent to your DMs!');
        } catch (error) {
          await message.reply(historyOutput.substring(0, 2000));
        }
        break;
        
      case 'pttasks':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const difficultyFilter = args[0]?.toLowerCase();
        let tasksToShow = PERSONALIZED_TASKS;
        
        if (difficultyFilter && ['easy', 'medium', 'hard'].includes(difficultyFilter)) {
          tasksToShow = PERSONALIZED_TASKS.filter(t => t.difficulty === difficultyFilter);
        }
        
        if (tasksToShow.length === 0) {
          await message.reply('❌ No tasks found!');
          return;
        }
        
        // Send task list as DM to avoid channel spam
        try {
          const dmUser = await client.users.fetch(message.author.id);
          
          const taskPages = [];
          const tasksPerPage = 15;
          
          for (let i = 0; i < tasksToShow.length; i += tasksPerPage) {
            const pageTasks = tasksToShow.slice(i, i + tasksPerPage);
            const taskList = pageTasks.map(task => {
              const diffEmoji = task.difficulty === 'easy' ? '🟢' : task.difficulty === 'medium' ? '🟡' : '🔴';
              return `${diffEmoji} **${task.id}** - ${task.name}\n└ ${task.description}\n└ Reward: ${formatReward(task.reward)}\n└ Duration: ${formatTime(task.duration)}`;
            }).join('\n\n');
            
            const embed = new EmbedBuilder()
              .setColor('#3498DB')
              .setTitle(`📋 Available Tasks${difficultyFilter ? ` (${difficultyFilter})` : ''} - Page ${Math.floor(i / tasksPerPage) + 1}/${Math.ceil(tasksToShow.length / tasksPerPage)}`)
              .setDescription(taskList)
              .setFooter({ text: `Total: ${tasksToShow.length} tasks | Use !ptsendtask @user <id> to assign` });
            
            taskPages.push(embed);
          }
          
          // Send all pages to DM
          await dmUser.send(`📋 **Task List** ${difficultyFilter ? `(${difficultyFilter} difficulty)` : ''}\nShowing all ${tasksToShow.length} tasks:`);
          
          for (const embed of taskPages) {
            await dmUser.send({ embeds: [embed] });
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          await message.reply(`✅ Sent the complete task list (${tasksToShow.length} tasks) to your DM!`);
          
        } catch (error) {
          console.error('Error sending task list:', error);
          await message.reply('❌ Failed to send task list. Make sure your DMs are open!');
        }
        break;
        
      case 'ptsendtask':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const ptTargetUser = message.mentions.users.first();
        const taskId = args[1];
        
        if (!ptTargetUser || !taskId) {
          await message.reply('Usage: `!ptsendtask @user <taskId>` - Send a specific task by ID\nExample: `!ptsendtask @user pt1`\nUse `!pttasks` to see all available task IDs');
          return;
        }
        
        if (!data.users[ptTargetUser.id]) {
          await message.reply('❌ That user hasn\'t started yet! They need to use `!start` first.');
          return;
        }
        
        const taskToSend = PERSONALIZED_TASKS.find(t => t.id === taskId);
        if (!taskToSend) {
          await message.reply(`❌ Task ID "${taskId}" not found! Use \`!pttasks\` to see all available task IDs.`);
          return;
        }
        
        try {
          const targetUserData = data.users[ptTargetUser.id];
          const ptData = initializePersonalizedTaskData(targetUserData);
          
          // Check if user already has an active task
          if (ptData.currentTask && Date.now() < ptData.taskStartTime + ptData.currentTask.duration) {
            const confirmMsg = await message.reply(`⚠️ <@${ptTargetUser.id}> already has an active task: **${ptData.currentTask.name}**\n\nReply with **yes** to override and send the new task, or **no** to cancel.`);
            
            const filter = m => m.author.id === message.author.id && ['yes', 'no'].includes(m.content.toLowerCase());
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
            
            if (collected.first().content.toLowerCase() !== 'yes') {
              await message.channel.send('❌ Cancelled. Task not sent.');
              return;
            }
          }
          
          // Initialize task progress
          ptData.taskProgress = {
            dropsCaught: 0,
            battlesWon: 0,
            cratesOpened: 0,
            levelsGained: 0,
            messagesSent: 0,
            tradesCompleted: 0,
            coinTradesCompleted: 0,
            gemTradesCompleted: 0,
            userBattles: 0,
            anyTrade: 0,
            invitesCompleted: 0
          };
          
          // Set the task
          ptData.currentTask = taskToSend;
          ptData.taskStartTime = Date.now();
          ptData.lastTaskSent = Date.now();
          ptData.isActive = true;
          
          await saveData(data);
          
          // Send DM to user
          const user = await client.users.fetch(ptTargetUser.id);
          const taskMessage = `🎯 **Admin Task Assignment**\n\nYou've been assigned a special task:\n\n**${taskToSend.name}**\n${taskToSend.description}\n\n⏰ Duration: ${formatTime(taskToSend.duration)}\n🎁 Reward: ${formatReward(taskToSend.reward)}\n\nGet started! Good luck! 💪`;
          
          await user.send(taskMessage);
          
          await message.reply(`✅ Successfully sent task **${taskToSend.name}** (${taskId}) to <@${ptTargetUser.id}>!\n\n📋 Task: ${taskToSend.description}\n⏰ Duration: ${formatTime(taskToSend.duration)}\n🎁 Reward: ${formatReward(taskToSend.reward)}`);
          
        } catch (error) {
          console.error('Error sending task:', error);
          await message.reply(`❌ Failed to send task: ${error.message}`);
        }
        break;
        
      case 'permissions':
      case 'perms':
      case 'roles':
        const permEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('🔐 ZooBot Permission System')
          .setDescription('ZooBot uses a three-tier permission system for command access.\n\n**For full documentation, see PERMISSIONS_DOCUMENTATION.md**')
          .addFields(
            { 
              name: '👑 Super Admin (Bot Owners)', 
              value: 'Hardcoded bot owners with full access to all commands across all servers.\n\n**Commands:** User management, skin management, server management, bot updates, data resets, etc.'
            },
            { 
              name: '🛡️ ZooAdmin (Server Customization)', 
              value: '**Role Name:** `ZooAdmin` (case insensitive)\n\nCreate this role in your Discord server and assign it to trusted users who should manage the bot.\n\n**Commands:**\n• `!setup` - Server setup\n• `!setdropchannel` - Configure drop channel\n• `!seteventschannel` - Configure events channel\n• `!setupdateschannel` - Configure updates channel\n• `!paydrops` - Activate drops (100 gems/3h)\n• `!setemoji` - Custom character emojis\n• `!setchestgif` - Custom chest GIFs'
            },
            { 
              name: '🔧 Bot Admin (Legacy System)', 
              value: 'Database-stored admins (being phased out). Can manage events.\n\n**Commands:** `!addadmin`, `!removeadmin`, `!startevent`, `!stopevent`, `!eventschedule`'
            },
            { 
              name: '👥 Regular Users (Everyone)', 
              value: 'All standard gameplay commands: battles, trading, quests, crates, profile, shop, etc.\n\nUse `!help` to see all available commands.'
            },
            {
              name: '❓ How to Setup ZooAdmin',
              value: '1. Create a Discord role named "ZooAdmin"\n2. Assign it to users who should manage the bot\n3. They can now run all customization commands!'
            }
          )
          .setFooter({ text: 'Type !help for all commands | Read PERMISSIONS_DOCUMENTATION.md for details' });
        
        await message.reply({ embeds: [permEmbed] });
        break;
        
      case 'help':
        const helpEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🎮 ZooBot - Complete Command Guide')
          .setDescription('Use `!overview` to see all game systems\n\n**📚 Command Categories:**')
          .addFields(
            { name: '🎯 Getting Started', value: '`!start` - Begin your journey\n`!select <character>` - Choose starter character' },
            { name: '🎰 Minigames (NEW!)', value: '`!coinduel <h/t> <bet>` - Coin flip (×2, rare ×5)\n`!diceclash <bet>` - Progressive dice rolling\n`!dooroffate <bet>` - Pick 1 of 3 doors\n`!almostwin <bet>` - Roll 1-100 for prizes\n`!rps <r/p/s> <bet>` - Rock Paper Scissors\n💡 **1.5× rewards on main server!**' },
            { name: '👤 Profile & Characters', value: '`!profile [page]` - View your profile\n`!char <name>` - View character details\n`!I <name>` - View battle info\n`!setpfp <name>` - Set profile picture\n`!levelup <name>` - Level up character\n`!release <name>` - Release character (lvl 10+)' },
            { name: '⚔️ Battles & Items', value: '`!b @user` - Challenge to battle\n`!b ai` - Battle AI (easy/medium/hard)\n`!shop` - View battle items shop' },
            { name: '🎁 Drops & Rewards', value: '`!c <code>` - Catch drops\n`!paydrops` - Activate drops (100 gems/3h)\n`!dropstatus` - Check drop timer\n`!daily` - Daily rewards' },
            { name: '📦 Crates & Shop', value: '`!crate [type]` - Open crates\n`!pickcrate <type>` - Choose crate to open\n`!opencrate` - Open selected crate\n`!buycrate <type>` - Buy crates' },
            { name: '💱 Trading', value: '`!t @user` - Trade with users' },
            { name: '📜 Quests & Tasks', value: '`!quests [page]` - View quests\n`!quest <id>` - Quest details\n`!claim <id>` - Claim quest rewards\n`!ptoggle on/off` - Toggle personalized tasks' },
            { name: '🔷 ST Boosters', value: '`!shards` - View shard info\n`!craft` - Craft booster (8 shards)\n`!boost <character>` - Reroll character ST' },
            { name: '📬 Mail & News', value: '`!mail [page]` - View mailbox\n`!claimmail <#>` - Claim mail rewards\n`!clearmail` - Clear claimed mail\n`!news` - Latest bot news' },
            { name: '🏆 Leaderboards & Rankings', value: '`!leaderboard <type>` - Top 10 rankings\nTypes: coins, gems, battles, collection, trophies' },
            { name: '🔑 Keys & Unlocks', value: '`!keys` - View your keys\n`!unlock <character>` - Unlock with 1000 keys\n`!cage` - Open random cage (250 cage keys)' },
            { name: '🎯 Events', value: '`!event` - View current event\n`!eventleaderboard` - Event rankings' },
            { name: '👥 Clans', value: '`!clan` - View your clan\n`!joinclan <name>` - Join clan\n`!leaveclan` - Leave clan\n`!clandonate` - Donate to clan\n`!clanleaderboard` - Clan rankings' },
            { name: '🔧 Server Setup (Admins)', value: '`!setup` - Server setup guide\n`!setdropchannel #channel`\n`!seteventschannel #channel`\n`!setupdateschannel #channel`\n`!addadmin @user` - Add bot admin\n`!removeadmin @user` - Remove admin' },
            { name: '👑 Super Admin', value: '`!servers` - List all servers\n`!removeserver <id>` - Remove bot from server\n`!postupdate <msg>` - Post update to all servers\n`!grant` - Grant resources\n`!grantchar` - Grant characters\n`!sendmail` - Send mail to all\n`!postnews` - Post news\n`!reset` - Reset all data' },
            { name: 'ℹ️ Information', value: '`!overview` - Game systems overview\n`!botinfo` - About ZooBot\n`!history @user` - Transaction history' }
          )
          .setFooter({ text: '💡 Tip: Most commands have shorter aliases! Try !b, !t, !c' });
        
        await message.reply({ embeds: [helpEmbed] });
        break;
        
      case 'overview':
      case 'systems':
        const overviewEmbed = new EmbedBuilder()
          .setColor('#00D9FF')
          .setTitle('🎮 ZooBot Systems Overview')
          .setDescription('**Welcome to ZooBot!** Here\'s what this huge update includes:\n\n')
          .addFields(
            { name: '🎯 Character Collection (51 Characters)', value: 'Collect unique characters, each with special stats (ST), moves, and leveling. Unlock via keys or cages!' },
            { name: '🎰 Minigames **[NEW!]**', value: '5 fast-paced, addictive minigames to earn coins and gems! Coin Duel, Dice Clash, Door of Fate, Almost-Win Machine, and Rock Paper Scissors. **Main server gets 1.5× rewards!**' },
            { name: '⚔️ Battle System', value: 'Turn-based battles with energy management, 51 unique abilities, status effects (burn, poison, stun, etc.), and battle items!' },
            { name: '🎁 Drop System **[NEW PAID MODEL]**', value: '**Non-main servers:** Pay 100 gems for 3 hours of drops! Auto-pauses after 30 uncaught drops.\n**Main server:** Unlimited free drops!' },
            { name: '📦 Crate System', value: '6 crate tiers (Bronze, Silver, Gold, Emerald, Legendary, Tyrant) with interactive 2-step opening and custom GIF animations!' },
            { name: '🔷 ST Booster System', value: 'Collect shards to craft boosters and reroll your character\'s ST stat. Higher ST = higher risk!' },
            { name: '💱 Trading System', value: 'Secure player-to-player trading with dual confirmation for characters, coins, gems, and items!' },
            { name: '📜 Quest System', value: 'Complete quests to earn rewards like coins, gems, crates, and character tokens!' },
            { name: '📬 Personalized Tasks **[UPDATED]**', value: 'Receive personalized tasks every **4 hours** (was 2 hours) based on your activity. Earn exclusive rewards!' },
            { name: '🎯 Daily Events', value: 'Compete in rotating events (Trophy Hunt, Crate Master, Drop Catcher) with automatic reward distribution!' },
            { name: '🏆 Leaderboards', value: 'Compete for top rankings in coins, gems, battles won, character collection, and trophies!' },
            { name: '👥 Clan Wars', value: 'Join clans, donate resources, compete in weekly clan wars for exclusive prizes!' },
            { name: '🔑 Key & Cage System', value: 'Collect character keys (1000 to unlock specific character) or cage keys (250 for random unlock)!' },
            { name: '📬 Mail System **[UPDATED]**', value: 'Receive mail from admins with rewards. **New:** Use `!clearmail` to clean up claimed messages!' },
            { name: '📰 News & Updates **[NEW]**', value: 'Stay informed with bot updates posted to your server\'s updates channel!' },
            { name: '🎨 Custom Emojis & Visuals', value: 'Characters can have custom Discord emojis, and crates have customizable opening GIF animations!' },
            { name: '💎 Economy System', value: 'Earn and spend Coins, Gems, Shards, Trophies, and character-specific Tokens!' }
          )
          .setFooter({ text: 'Type !help to see all commands | This is a fan-made game for entertainment!' });
        
        await message.reply({ embeds: [overviewEmbed] });
        break;
        
      case 'keys':
        await viewKeys(message, data, userId);
        break;
        
      case 'unlock':
        const unlockCharName = args.join(' ');
        await unlockCharacter(message, data, userId, unlockCharName);
        break;
        
      case 'cage':
        await openRandomCage(message, data, userId);
        break;
    }
  } catch (error) {
    console.error('Command error:', error);
    await message.reply('❌ An error occurred while processing your command!');
  }
});

async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    stopDropSystem();
    console.log('✅ Stopped drop system');
    
    await saveDataImmediate(data);
    console.log('✅ Flushed all pending data saves');
    
    if (process.env.USE_MONGODB === 'true') {
      const mongoManager = require('./mongoManager.js');
      await mongoManager.disconnect();
    }
    
    await client.destroy();
    console.log('✅ Discord client disconnected');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  saveDataImmediate(data).then(() => {
    process.exit(1);
  }).catch(() => {
    process.exit(1);
  });
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN not found in environment variables!');
  console.log('Please add your Discord bot token to the Secrets.');
  process.exit(1);
}

client.login(token);
