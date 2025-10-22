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

const PREFIX = '!';
const data = loadData();

function generateST() {
  return parseFloat((Math.random() * 100).toFixed(2));
}

function createProgressBar(current, required, length = 10) {
  const percentage = Math.min(current / required, 1);
  const filled = Math.floor(percentage * length);
  const empty = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${required}`;
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
      coins: 0,
      gems: 0,
      characters: [],
      selectedCharacter: null,
      pendingTokens: 0
    };
    saveData(data);
  }
  
  if (!message.content.startsWith(PREFIX)) return;
  
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator);
  
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
        
        data.users[userId].selectedCharacter = starterChar.name;
        data.users[userId].characters.push({
          name: starterChar.name,
          emoji: starterChar.emoji,
          level: 1,
          tokens: pendingTokens,
          st: starterST
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
            { name: '🎮 Characters', value: `${user.characters.length}/51`, inline: true }
          );
        
        if (user.selectedCharacter) {
          profileEmbed.addFields({ name: '⭐ Selected', value: user.selectedCharacter, inline: true });
        }
        
        if (user.pendingTokens > 0) {
          profileEmbed.addFields({ name: '🎫 Pending Tokens', value: `${user.pendingTokens}`, inline: true });
        }
        
        if (user.characters.length > 0) {
          pageChars.forEach(char => {
            const req = getLevelRequirements(char.level);
            const progress = createProgressBar(char.tokens, req, 8);
            profileEmbed.addFields({
              name: `${char.emoji} ${char.name} - Lvl ${char.level} | ST: ${char.st}%`,
              value: `${progress}`,
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
        const requiredTokens = getLevelRequirements(currentCharLevel);
        
        if (charToLevel.tokens >= requiredTokens) {
          charToLevel.tokens -= requiredTokens;
          charToLevel.level += 1;
          saveData(data);
          
          const lvlEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('⬆️ LEVEL UP!')
            .setDescription(`<@${userId}> leveled up **${charToLevel.name} ${charToLevel.emoji}**!\n\n**Level ${currentCharLevel} → ${currentCharLevel + 1}**\n\nTokens used: ${requiredTokens}`);
          await message.reply({ embeds: [lvlEmbed] });
        } else {
          await message.reply(`❌ Not enough ${charToLevel.name} tokens! You need ${requiredTokens} but have ${charToLevel.tokens}.`);
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
        const charProgress = createProgressBar(userChar.tokens, charReq, 10);
        
        const charEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`${userChar.emoji} ${userChar.name}`)
          .addFields(
            { name: 'Level', value: `${userChar.level}`, inline: true },
            { name: 'ST', value: `${userChar.st}%`, inline: true },
            { name: 'Tokens', value: `${userChar.tokens}`, inline: true },
            { name: 'Progress to Next Level', value: charProgress, inline: false }
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
            }
            
            saveData(data);
            
            let rewardText = '';
            if (drop.type === 'coins') {
              rewardText = `${drop.amount} coins 💰`;
            } else {
              rewardText = `${drop.amount} gems 💎`;
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
        
        data.users[charUser.id].characters.push({
          name: foundChar.name,
          emoji: foundChar.emoji,
          level: 1,
          tokens: pendingToGrant,
          st: grantedST
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
        
      case 'help':
        const helpEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🎮 Bot Commands')
          .addFields(
            { name: '🎯 Getting Started', value: '`!start` - Begin your journey\n`!select <nix/bruce/buck>` - Choose starter' },
            { name: '👤 Profile & Characters', value: '`!profile [page]` - View profile\n`!char <name>` - Character details\n`!levelup <name>` - Level up character\n`!release <name>` - Release character (lvl 10+)' },
            { name: '🎁 Crates', value: '`!crate [type]` - Open or view crates' },
            { name: '💱 Trading', value: '`!t @user` - Start a trade' },
            { name: '🎯 Drops', value: '`!c <code>` - Catch drops' },
            { name: '👑 Admin', value: '`!setdrop` - Set drop channel\n`!startdrops` - Start drops\n`!stopdrops` - Stop drops\n`!grant` - Grant resources\n`!grantchar` - Grant character' }
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
