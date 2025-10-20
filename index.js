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
      tokens: 0,
      level: 1,
      characters: [],
      selectedCharacter: null
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
        data.users[userId].selectedCharacter = starterChar.name;
        data.users[userId].characters.push({
          name: starterChar.name,
          emoji: starterChar.emoji,
          level: 1,
          tokens: 0
        });
        data.users[userId].coins = 100;
        data.users[userId].gems = 10;
        saveData(data);
        
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🎉 Character Selected!')
          .setDescription(`You chose **${starterChar.name} ${starterChar.emoji}**!\n\nStarting rewards:\n💰 100 Coins\n💎 10 Gems\n\nUse \`!profile\` to view your stats!`);
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
        const levelReq = getLevelRequirements(user.level);
        
        const profileEmbed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle(`${targetUser.username}'s Profile`)
          .addFields(
            { name: '📊 Level', value: `${user.level}`, inline: true },
            { name: '🎫 Tokens', value: `${user.tokens}/${levelReq}`, inline: true },
            { name: '💰 Coins', value: `${user.coins}`, inline: true },
            { name: '💎 Gems', value: `${user.gems}`, inline: true },
            { name: '🎮 Characters', value: `${user.characters.length}`, inline: true },
            { name: '⭐ Selected', value: user.selectedCharacter || 'None', inline: true }
          );
        
        if (user.characters.length > 0) {
          const charList = user.characters.map(c => `${c.emoji} ${c.name} (Lvl ${c.level})`).join('\n');
          profileEmbed.addFields({ name: '📦 Your Characters', value: charList.slice(0, 1024) });
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
            .addFields(
              { name: '🥇 Gold Crate', value: '💎 100 gems\n1.5% character chance\n🎫 50 tokens\n💰 500 coins' },
              { name: '🟢 Emerald Crate', value: '💎 250 gems\n5% character chance\n🎫 130 tokens\n💰 1800 coins' },
              { name: '🔥 Legendary Crate', value: '💎 500 gems\n10% character chance\n🎫 200 tokens\n💰 2500 coins' },
              { name: '👑 Tyrant Crate', value: '💎 750 gems\n15% character chance\n🎫 300 tokens\n💰 3500 coins' }
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
        const currentTokens = data.users[userId].tokens;
        const currentLevel = data.users[userId].level;
        const requiredTokens = getLevelRequirements(currentLevel);
        
        if (currentTokens >= requiredTokens) {
          data.users[userId].tokens -= requiredTokens;
          data.users[userId].level += 1;
          saveData(data);
          
          const lvlEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('⬆️ LEVEL UP!')
            .setDescription(`<@${userId}> leveled up!\n\n**Level ${currentLevel} → ${currentLevel + 1}**\n\nTokens used: ${requiredTokens}`);
          await message.reply({ embeds: [lvlEmbed] });
        } else {
          await message.reply(`❌ Not enough tokens! You need ${requiredTokens} but have ${currentTokens}.`);
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
        
        const charEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`${userChar.emoji} ${userChar.name}`)
          .addFields(
            { name: 'Level', value: `${userChar.level}`, inline: true },
            { name: 'Tokens', value: `${userChar.tokens}`, inline: true },
            { name: 'Next Level', value: `${charReq} tokens`, inline: true }
          );
        
        await message.reply({ embeds: [charEmbed] });
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
          data.currentDrop = null;
          
          if (drop.type === 'tokens') {
            data.users[userId].tokens += drop.amount;
          } else if (drop.type === 'coins') {
            data.users[userId].coins += drop.amount;
          } else if (drop.type === 'gems') {
            data.users[userId].gems += drop.amount;
          }
          
          saveData(data);
          
          const dropEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎉 DROP CAUGHT!')
            .setDescription(`<@${userId}> caught the drop!\n\n**Reward:** ${drop.amount} ${drop.type === 'tokens' ? '🎫' : drop.type === 'coins' ? '💰' : '💎'} ${drop.type}`);
          
          await message.reply({ embeds: [dropEmbed] });
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
        const grantAmount = parseInt(args[2]);
        
        if (!grantUser || !grantType || !grantAmount) {
          await message.reply('Usage: `!grant @user <tokens/coins/gems> <amount>`');
          return;
        }
        
        if (!data.users[grantUser.id]) {
          await message.reply('❌ That user hasn\'t started yet!');
          return;
        }
        
        if (['tokens', 'coins', 'gems'].includes(grantType)) {
          data.users[grantUser.id][grantType] += grantAmount;
          saveData(data);
          
          await message.reply(`✅ Granted ${grantAmount} ${grantType} to <@${grantUser.id}>!`);
        } else {
          await message.reply('Invalid type! Use: tokens, coins, or gems');
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
        
        data.users[charUser.id].characters.push({
          name: foundChar.name,
          emoji: foundChar.emoji,
          level: 1,
          tokens: 0
        });
        saveData(data);
        
        await message.reply(`✅ Granted **${foundChar.name} ${foundChar.emoji}** to <@${charUser.id}>!`);
        break;
        
      case 'help':
        const helpEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle('🎮 Bot Commands')
          .addFields(
            { name: '🎯 Getting Started', value: '`!start` - Begin your journey\n`!select <nix/bruce/buck>` - Choose starter' },
            { name: '👤 Profile', value: '`!profile [@user]` - View profile\n`!char <name>` - Character details' },
            { name: '🎁 Crates', value: '`!crate [type]` - Open or view crates\n`!levelup` - Level up with tokens' },
            { name: '💱 Trading', value: '`!t @user` - Start a trade' },
            { name: '🎯 Drops', value: '`!c <code>` - Catch drops' },
            { name: '👑 Admin', value: '`!setdrop` - Set drop channel\n`!startdrops` - Start drops\n`!stopdrops` - Stop drops\n`!grant @user <type> <amt>` - Grant resources\n`!grantchar @user <name>` - Grant character' }
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
