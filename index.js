// Simple keep-alive server using Node's built-in HTTP module
const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is alive!");
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} in use, trying alternative port...`);
    server.listen(0, () => {
      console.log(`🌐 Server running on port ${server.address().port}`);
    });
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
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
const { loadData, saveData } = require('./dataManager.js');
const { getLevelRequirements, calculateLevel } = require('./levelSystem.js');
const { openCrate } = require('./crateSystem.js');
const { startDropSystem, stopDropSystem } = require('./dropSystem.js');
const { initiateTrade } = require('./tradeSystem.js');
const { initiateBattle } = require('./battleSystem.js');
const { assignMovesToCharacter, calculateBaseHP, getMoveDisplay } = require('./battleUtils.js');
const { createLevelProgressBar } = require('./progressBar.js');
const { QUESTS, getQuestProgress, canClaimQuest, claimQuest, getAvailableQuests, formatQuestDisplay } = require('./questSystem.js');
const { craftBooster, useBooster, getBoosterInfo } = require('./stBoosterSystem.js');
const { sendMailToAll, addMailToUser, claimMail, getUnclaimedMailCount, formatMailDisplay } = require('./mailSystem.js');
const { postNews, getLatestNews, formatNewsDisplay } = require('./newsSystem.js');
const { getTopCoins, getTopGems, getTopBattles, getTopCollectors, getTopTrophies, formatLeaderboard } = require('./leaderboardSystem.js');
const { getSkinUrl, getAvailableSkins, skinExists } = require('./skinSystem.js');

const PREFIX = '!';
const data = loadData();

function generateST() {
  return parseFloat((Math.random() * 100).toFixed(2));
}


client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  console.log(`🎮 Bot is ready to serve ${client.guilds.cache.size} servers!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
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
      lastDailyClaim: null
    };
    saveData(data);
  }
  

  if (!data.users[userId].username) {
    data.users[userId].username = message.author.username;
  }
  
  if (data.users[userId].started && !message.content.startsWith(PREFIX)) {
    data.users[userId].messageCount = (data.users[userId].messageCount || 0) + 1;
    
    if (data.users[userId].messageCount % 25 === 0) {
      const rewardType = Math.floor(Math.random() * 3);
      let rewardMessage = '';
      
      if (rewardType === 0) {
        if (data.users[userId].characters.length > 0) {
          const randomChar = data.users[userId].characters[Math.floor(Math.random() * data.users[userId].characters.length)];
          const tokenAmount = Math.floor(Math.random() * 10) + 1;
          randomChar.tokens += tokenAmount;
          rewardMessage = `🎉 **Message Reward!** You got **${tokenAmount}** ${randomChar.name} tokens for chatting!`;
        } else {
          const coinAmount = Math.floor(Math.random() * 11) + 10;
          data.users[userId].coins += coinAmount;
          rewardMessage = `🎉 **Message Reward!** You got **${coinAmount}** coins for chatting!`;
        }
      } else if (rewardType === 1) {
        const coinAmount = Math.floor(Math.random() * 20) + 1;
        data.users[userId].coins += coinAmount;
        rewardMessage = `🎉 **Message Reward!** You got **${coinAmount}** coins for chatting!`;
      } else {
        const gemAmount = Math.floor(Math.random() * 5) + 1;
        data.users[userId].gems += gemAmount;
        rewardMessage = `🎉 **Message Reward!** You got **${gemAmount}** gems for chatting!`;
      }
      
      saveData(data);
      
      try {
        await message.reply(rewardMessage);
      } catch (error) {
        console.error('Error sending reward message:', error);
      }
    } else {
      saveData(data);
    }
  }
  
  if (!message.content.startsWith(PREFIX)) return;
  
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  const isAdmin = message.guild && message.member?.permissions.has(PermissionFlagsBits.Administrator);
  
  try {
    switch(command) {
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
          baseHp: starterHP
        });
        data.users[userId].coins = 100;
        data.users[userId].gems = 10;
        data.users[userId].pendingTokens = 0;
        saveData(data);
        
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
          const selectedChar = user.characters.find(c => c.name === user.selectedCharacter);
          if (selectedChar) {
            const selectedSkinUrl = getSkinUrl(selectedChar.name, selectedChar.currentSkin || 'default');
            profileEmbed.setThumbnail(selectedSkinUrl);
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
          const crateEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎁 Available Crates')
            .setDescription('Open crates to get character tokens and coins!\nYou might also get a new character!')
            .addFields(
              { name: '🥇 Gold Crate', value: '💎 100 gems\n1.5% character chance\n🎫 50 random character tokens\n💰 500 coins' },
              { name: '🟢 Emerald Crate', value: '💎 250 gems\n5% character chance\n🎫 130 random character tokens\n💰 1800 coins' },
              { name: '🔥 Legendary Crate', value: '💎 500 gems\n10% character chance\n🎫 200 random character tokens\n💰 2500 coins' },
              { name: '👑 Tyrant Crate', value: '💎 750 gems\n15% character chance\n🎫 300 random character tokens\n💰 3500 coins' }
            )
            .setFooter({ text: 'Use: !crate <type>' });
          await message.reply({ embeds: [crateEmbed] });
          return;
        }
        
        const result = openCrate(data, userId, crateType);
        
        if (!result.success) {
          await message.reply(`❌ ${result.message}`);
          return;
        }
        
        saveData(data);
        
        const resultEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle(`🎁 ${crateType.toUpperCase()} CRATE OPENED!`)
          .setDescription(`<@${userId}> opened a crate!\n\n${result.message}`)
          .setTimestamp();
        
        await message.reply({ embeds: [resultEmbed] });
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
          saveData(data);
          
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
        const charSkinUrl = getSkinUrl(userChar.name, userChar.currentSkin || 'default');
        const availableSkins = userChar.ownedSkins || ['default'];
        
        const charEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`${userChar.emoji} ${userChar.name}`)
          .setImage(charSkinUrl)
          .addFields(
            { name: 'Level', value: `${userChar.level}`, inline: true },
            { name: 'ST', value: `${userChar.st}%`, inline: true },
            { name: 'Tokens', value: `${userChar.tokens}/${charReq.tokens}`, inline: true },
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
        
      case 'c':
        const code = args[0]?.toLowerCase();
        
        if (!code) return;
        
        if (data.currentDrop && data.currentDrop.code === code) {
          const drop = data.currentDrop;
          
          if (drop.type === 'tokens') {
            const charToReward = data.users[userId].characters.find(c => 
              c.name.toLowerCase() === drop.characterName.toLowerCase()
            );
            
            if (charToReward) {
              data.currentDrop = null;
              charToReward.tokens += drop.amount;
              
              if (!data.users[userId].questProgress) data.users[userId].questProgress = {};
              data.users[userId].questProgress.dropsCaught = (data.users[userId].questProgress.dropsCaught || 0) + 1;
              
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
            data.currentDrop = null;
            
            if (drop.type === 'coins') {
              data.users[userId].coins += drop.amount;
            } else if (drop.type === 'gems') {
              data.users[userId].gems += drop.amount;
            } else if (drop.type === 'shards') {
              data.users[userId].shards = (data.users[userId].shards || 0) + drop.amount;
            }
            
            if (!data.users[userId].questProgress) data.users[userId].questProgress = {};
            data.users[userId].questProgress.dropsCaught = (data.users[userId].questProgress.dropsCaught || 0) + 1;
            
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
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
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
          saveData(data);
          
          await message.reply(`✅ Granted ${tokenAmount} ${targetChar.name} tokens to <@${grantUser.id}>!`);
        } else if (['coins', 'gems'].includes(grantType)) {
          if (!grantAmount) {
            await message.reply('Please specify an amount!');
            return;
          }
          
          data.users[grantUser.id][grantType] += grantAmount;
          saveData(data);
          
          await message.reply(`✅ Granted ${grantAmount} ${grantType} to <@${grantUser.id}>!`);
        } else {
          await message.reply('Invalid type! Use: coins, gems, or tokens');
        }
        break;
        
      case 'grantchar':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        const charUser = message.mentions.users.first();
        const charToGrant = args.slice(1).join(' ');
        
        if (!charUser || !charToGrant) {
          await message.reply('Usage: `!grantchar @user <character name>`');
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
        
        const grantedST = generateST();
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
          baseHp: grantedHP
        });
        
        if (wasFirstChar && pendingToGrant > 0) {
          data.users[charUser.id].pendingTokens = 0;
        }
        
        saveData(data);
        
        let grantMessage = `✅ Granted **${foundChar.name} ${foundChar.emoji}** (ST: ${grantedST}%) to <@${charUser.id}>!`;
        if (pendingToGrant > 0) {
          grantMessage += `\n🎁 They also received ${pendingToGrant} pending tokens!`;
        }
        
        await message.reply(grantMessage);
        break;
        
      case 'addskin':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
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
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
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
        
        if (!skinExists(targetUserChar.name, grantSkinName)) {
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
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
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
        
        const equipSkinUrl = getSkinUrl(userCharToEquip.name, equipSkinName);
        const equipEmbed = new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle(`🎨 Skin Equipped!`)
          .setDescription(`**${userCharToEquip.emoji} ${userCharToEquip.name}** is now wearing the **${equipSkinName}** skin!`)
          .setImage(equipSkinUrl);
        
        await message.reply({ embeds: [equipEmbed] });
        break;
        
      case 'b':
      case 'battle':
        const battleOpponent = message.mentions.users.first();
        const battleArg = args[0]?.toLowerCase();
        
        if (battleArg === 'ai') {
          await message.reply('🤖 AI battles are not implemented yet! Stay tuned for future updates.');
          return;
        }
        
        if (!battleOpponent) {
          await message.reply('Usage: `!b @user` to challenge someone or `!b ai` for AI (coming soon!)');
          return;
        }
        
        if (battleOpponent.id === userId) {
          await message.reply('❌ You can\'t battle yourself!');
          return;
        }
        
        if (battleOpponent.bot) {
          await message.reply('❌ You can\'t battle a bot!');
          return;
        }
        
        await initiateBattle(message, data, userId, battleOpponent.id);
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
        
        const infoSkinUrl = getSkinUrl(userInfoChar.name, userInfoChar.currentSkin || 'default');
        
        const infoEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle(`${userInfoChar.emoji} ${userInfoChar.name}`)
          .setImage(infoSkinUrl)
          .setDescription(`**Level:** ${userInfoChar.level}\n**ST:** ${userInfoChar.st}%\n**HP:** ${userInfoChar.baseHp}\n**Tokens:** ${userInfoChar.tokens}\n**Skin:** ${userInfoChar.currentSkin || 'default'}`)
          .addFields(
            { name: '⚔️ Moves', value: movesList, inline: false },
            { name: '📊 Battle Stats', value: `Base HP increases with ST\nMove damage scales with Level and ST\nSpecial move has enhanced ST scaling`, inline: false }
          );
        
        await message.reply({ embeds: [infoEmbed] });
        break;
        
      case 'quests':
        const questPage = parseInt(args[0]) || 1;
        const availableQuests = getAvailableQuests(data.users[userId]);
        const questsPerPage = 5;
        const totalQuestPages = Math.ceil(availableQuests.length / questsPerPage);
        const startQuestIdx = (questPage - 1) * questsPerPage;
        const endQuestIdx = startQuestIdx + questsPerPage;
        const questsToShow = availableQuests.slice(startQuestIdx, endQuestIdx);
        
        const completedCount = data.users[userId].completedQuests?.length || 0;
        
        const questsList = questsToShow.map(q => formatQuestDisplay(data.users[userId], q)).join('\n\n');
        
        const questsEmbed = new EmbedBuilder()
          .setColor('#E67E22')
          .setTitle('📜 Quest Log')
          .setDescription(`**Completed:** ${completedCount}/${QUESTS.length}\n\n${questsList || 'No quests available!'}`)
          .setFooter({ text: `Page ${questPage}/${totalQuestPages} | Use !quest <id> to view details or !claim <id> to claim` });
        
        await message.reply({ embeds: [questsEmbed] });
        break;
        
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
          saveData(data);
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
          .setDescription(`**Shards:** ${shardInfo.shards}\n**ST Boosters:** ${shardInfo.boosters}\n**Boosters Used:** ${shardInfo.boostsUsed}`)
          .addFields(
            { name: '📦 Crafting', value: `${shardInfo.shards}/${8} shards to craft a booster\n${shardInfo.canCraft ? '✅ Ready to craft!' : `❌ Need ${shardInfo.shardsNeeded} more shards`}`, inline: false },
            { name: '⚡ Boost Rates', value: '75% - Common (+5-10% ST)\n20% - Rare (+10-18% ST)\n5% - Legendary (+18-25% ST)', inline: false },
            { name: '💡 Commands', value: '`!craft` - Craft a booster (8 shards)\n`!boost <character>` - Use a booster', inline: false }
          );
        
        await message.reply({ embeds: [shardEmbed] });
        break;
        
      case 'craft':
        const craftResult = craftBooster(data.users[userId]);
        
        if (craftResult.success) {
          saveData(data);
          await message.reply(craftResult.message);
        } else {
          await message.reply(craftResult.message);
        }
        break;
        
      case 'boost':
        const boostCharName = args.join(' ').toLowerCase();
        
        if (!boostCharName) {
          await message.reply('Usage: `!boost <character name>`');
          return;
        }
        
        const charToBoost = data.users[userId].characters.find(c => 
          c.name.toLowerCase() === boostCharName
        );
        
        if (!charToBoost) {
          await message.reply('❌ You don\'t own this character!');
          return;
        }
        
        const boostResult = useBooster(data.users[userId], charToBoost.name);
        
        if (boostResult.success) {
          saveData(data);
          
          const boostEmbed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('⚡ ST BOOST!')
            .setDescription(`${boostResult.tierEmoji} **${boostResult.tier} Boost Applied!**\n\n${charToBoost.emoji} **${boostResult.character}**\n${boostResult.oldST}% → **${boostResult.newST}%** (+${boostResult.boost}%)\n\n💪 Damage and HP recalculated!`);
          
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
        
      case 'sendmail':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        await message.reply('📨 **Send Mail to All Players**\n\nFormat: `!sendmail <message> | coins:<amount> gems:<amount> shards:<amount> character:<name> goldcrates:<amount> ...`\n\nExample: `!sendmail Happy holidays! | coins:500 gems:50 shards:5`');
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
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
          return;
        }
        
        await message.reply('📰 **Post News**\n\nFormat: `!postnews <title> | <content>`\n\nExample: `!postnews New Features! | Quests and ST Boosters are now available!`');
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
        saveData(data);
        
        const dailyEmbed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🎁 Daily Reward Claimed!')
          .setDescription(`<@${userId}> claimed their daily rewards!\n\n**Rewards:**\n🏆 ${trophyReward} Trophies\n💰 ${coinReward} Coins\n💎 ${gemReward} Gems\n\nCome back tomorrow for more!`);
        
        await message.reply({ embeds: [dailyEmbed] });
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
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
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
        
      case 'reset':
        if (!isAdmin) {
          await message.reply('❌ You need Administrator permission!');
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
        
      case 'help':
        const helpEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🎮 Bot Commands')
          .addFields(
            { name: '🎯 Getting Started', value: '`!start` - Begin your journey\n`!select <nix/bruce/buck>` - Choose starter' },
            { name: '👤 Profile & Characters', value: '`!profile [page]` - View profile\n`!char <name>` - Character details\n`!I <name>` - View character battle info\n`!levelup <name>` - Level up character (requires tokens AND coins)\n`!release <name>` - Release character (lvl 10+)' },
            { name: '⚔️ Battle', value: '`!b @user` - Challenge to battle\n`!b ai` - AI battle (coming soon)\n\nWinner: +5 🏆 | Loser: -7 🏆' },
            { name: '🎁 Rewards', value: '`!daily` - Claim daily rewards (15 🏆, 10-100 💰, 1-3 💎)\n\nChat to earn! Every 25 messages = random reward!' },
            { name: '📜 Quests', value: '`!quests [page]` - View quests\n`!quest <id>` - View quest details\n`!claim <id>` - Claim quest rewards' },
            { name: '🔷 ST Boosters', value: '`!shards` - View shard info\n`!craft` - Craft booster (8 shards)\n`!boost <character>` - Use booster' },
            { name: '📬 Mail & News', value: '`!mail [page]` - View mailbox\n`!claimmail <#>` - Claim mail\n`!news` - Latest news' },
            { name: '🏆 Leaderboards', value: '`!leaderboard <coins/gems/battles/collection/trophies>` - View top 10' },
            { name: '🎁 Crates', value: '`!crate [type]` - Open or view crates' },
            { name: '💱 Trading', value: '`!t @user` - Start a trade' },
            { name: '🎯 Drops', value: '`!c <code>` - Catch drops' },
            { name: '👑 Admin', value: '`!setdrop` - Set drop channel\n`!setbattle` - Set battle channel\n`!startdrops` - Start drops\n`!stopdrops` - Stop drops\n`!grant` - Grant resources\n`!grantchar` - Grant character\n`!settrophies @user <amt>` - Set trophies\n`!reset` - Reset all bot data\n`!sendmail` - Send mail to all\n`!postnews` - Post news' },
            { name: 'ℹ️ Info', value: '`!botinfo` - About this bot' }
          );
        
        await message.reply({ embeds: [helpEmbed] });
        break;
    }
  } catch (error) {
    console.error('Command error:', error);
    await message.reply('❌ An error occurred while processing your command!');
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN not found in environment variables!');
  console.log('Please add your Discord bot token to the Secrets.');
  process.exit(1);
}

client.login(token);
