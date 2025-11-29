const { registerOfficialCommand, COMMAND_CATEGORIES } = require('../../services/commandRegistry');
const { PERMISSION_LEVELS } = require('../../services/permissionService');
const { EmbedBuilder } = require('discord.js');

const { BOT_CONFIG } = require('../../core/config');
const { getServerSettings, setBotDisplayName, setBotPrefix, setChannel, setServerCurrency, createServerSettings } = require('../../services/serverSettingsService');
const { getBalance, grantStarterPack, updateOfficialBalance, updateServerBalance } = require('../../services/economyService');
const { ensureServerProfile, getServerProfile } = require('../../services/profileService');
const { isSuperAdmin, isPlayAdmin } = require('../../services/permissionService');
const { logCurrencyGrant } = require('../../services/auditService');

require('./economy');
require('./content');

registerOfficialCommand('help', {
  aliases: ['h', 'commands'],
  description: 'Show all available commands',
  category: COMMAND_CATEGORIES.GENERAL,
  usage: '!help [command]',
  examples: ['!help', '!help start'],
  execute: async (message, args) => {
    const { getAllCommands, getCommand, formatCommandHelp, getCommandsByCategory } = require('../../services/commandRegistry');
    
    if (args[0]) {
      const command = getCommand(args[0], message.guild.id);
      if (command) {
        await message.reply(formatCommandHelp(command));
      } else {
        await message.reply('Command not found.');
      }
      return;
    }
    
    const settings = await getServerSettings(message.guild.id);
    const botName = settings?.botSettings?.displayName || BOT_CONFIG.name;
    const prefix = settings?.botSettings?.prefix || '!';
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle(`${botName} Commands`)
      .setDescription(`Use \`${prefix}help <command>\` for details on a specific command.`)
      .addFields(
        { name: 'General', value: '`help`, `ping`, `start`, `profile`, `balance`', inline: true },
        { name: 'Economy', value: '`daily`, `exchange`, `shop`', inline: true },
        { name: 'Gameplay', value: '`characters`, `select`, `battle`', inline: true },
        { name: 'Admin', value: '`setup`, `setbotname`, `setprefix`, `setcurrency`', inline: true }
      )
      .setFooter({ text: `${botName} v${BOT_CONFIG.version}` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('ping', {
  aliases: ['pong'],
  description: 'Check bot latency',
  category: COMMAND_CATEGORIES.GENERAL,
  usage: '!ping',
  execute: async (message) => {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`Pong! Latency: ${latency}ms | API: ${message.client.ws.ping}ms`);
  }
});

registerOfficialCommand('start', {
  aliases: ['begin', 'join'],
  description: 'Start your adventure and receive starter rewards',
  category: COMMAND_CATEGORIES.GENERAL,
  usage: '!start',
  execute: async (message) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    const username = message.author.username;
    
    const profile = await getServerProfile(userId, serverId);
    
    if (profile?.started) {
      await message.reply('You have already started your adventure!');
      return;
    }
    
    const settings = await getServerSettings(serverId);
    const result = await grantStarterPack(userId, serverId, username, settings);
    
    if (!result.success) {
      await message.reply(`Failed to start: ${result.error}`);
      return;
    }
    
    const botName = settings?.botSettings?.displayName || BOT_CONFIG.name;
    const primaryCurrency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    const premiumCurrency = settings?.currencies?.premium || { name: 'Gems', symbol: '💎' };
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Welcome to ' + botName + '!')
      .setDescription(`Your adventure begins now, ${message.author.username}!`)
      .addFields(
        { name: 'Starter Rewards', value: 
          `${primaryCurrency.symbol} ${result.primary} ${primaryCurrency.name}\n` +
          `${premiumCurrency.symbol} ${result.premium} ${premiumCurrency.name}`, inline: false }
      )
      .setFooter({ text: 'Use !help to see all commands' });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('profile', {
  aliases: ['p', 'me'],
  description: 'View your profile',
  category: COMMAND_CATEGORIES.GENERAL,
  usage: '!profile [@user]',
  examples: ['!profile', '!profile @User'],
  execute: async (message, args) => {
    const target = message.mentions.users.first() || message.author;
    const userId = target.id;
    const serverId = message.guild.id;
    
    const profile = await getServerProfile(userId, serverId);
    const settings = await getServerSettings(serverId);
    
    if (!profile) {
      await message.reply(`${target.username} hasn't started yet! Use \`!start\` to begin.`);
      return;
    }
    
    const primaryCurrency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    const premiumCurrency = settings?.currencies?.premium || { name: 'Gems', symbol: '💎' };
    const botName = settings?.botSettings?.displayName || BOT_CONFIG.name;
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle(`${target.username}'s Profile`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Level', value: `${profile.progression?.level || 1}`, inline: true },
        { name: 'Trophies', value: `${profile.stats?.trophies || 200}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: primaryCurrency.name, value: `${primaryCurrency.symbol} ${profile.serverBalance?.primary || 0}`, inline: true },
        { name: premiumCurrency.name, value: `${premiumCurrency.symbol} ${profile.serverBalance?.premium || 0}`, inline: true },
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Characters', value: `${profile.inventory?.characters?.length || 0}`, inline: true },
        { name: 'Battles Won', value: `${profile.stats?.battlesWon || 0}`, inline: true },
        { name: 'Quests Done', value: `${profile.stats?.questsCompleted || 0}`, inline: true }
      )
      .setFooter({ text: botName });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('balance', {
  aliases: ['bal', 'wallet'],
  description: 'Check your currency balance',
  category: COMMAND_CATEGORIES.ECONOMY,
  usage: '!balance',
  execute: async (message) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    const balance = await getBalance(userId, serverId);
    const settings = await getServerSettings(serverId);
    
    const primaryCurrency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    const premiumCurrency = settings?.currencies?.premium || { name: 'Gems', symbol: '💎' };
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle(`${message.author.username}'s Balance`)
      .addFields(
        { name: 'Server Currency', value: 
          `${primaryCurrency.symbol} ${balance.server.primary} ${primaryCurrency.name}\n` +
          `${premiumCurrency.symbol} ${balance.server.premium} ${premiumCurrency.name}`, inline: true },
        { name: 'Official Currency', value: 
          `🪙 ${balance.official.playCoins} PlayCoins\n` +
          `💎 ${balance.official.playGems} PlayGems`, inline: true }
      );
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('setup', {
  aliases: ['configure'],
  description: 'Setup the bot for your server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setup',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message) => {
    const serverId = message.guild.id;
    
    let settings = await getServerSettings(serverId);
    
    if (!settings) {
      const result = await createServerSettings(serverId, message.guild.name);
      settings = result.settings;
    }
    
    const embed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle('Server Setup')
      .setDescription('Configure your server settings below:')
      .addFields(
        { name: 'Bot Settings', value: 
          `Name: ${settings.botSettings?.displayName || 'PlayBot'}\n` +
          `Prefix: \`${settings.botSettings?.prefix || '!'}\`\n` +
          `Color: ${settings.botSettings?.color || '#00D9FF'}`, inline: true },
        { name: 'Channels', value: 
          `Drops: ${settings.channels?.drops ? `<#${settings.channels.drops}>` : 'Not set'}\n` +
          `Events: ${settings.channels?.events ? `<#${settings.channels.events}>` : 'Not set'}\n` +
          `Updates: ${settings.channels?.updates ? `<#${settings.channels.updates}>` : 'Not set'}`, inline: true },
        { name: 'Currencies', value: 
          `Primary: ${settings.currencies?.primary?.symbol || '🪙'} ${settings.currencies?.primary?.name || 'Coins'}\n` +
          `Premium: ${settings.currencies?.premium?.symbol || '💎'} ${settings.currencies?.premium?.name || 'Gems'}`, inline: true },
        { name: 'Setup Commands', value: 
          `\`!setbotname <name>\` - Change bot name\n` +
          `\`!setprefix <prefix>\` - Change prefix\n` +
          `\`!setcurrency primary <name> <symbol>\` - Set primary currency\n` +
          `\`!setdropchannel #channel\` - Set drops channel\n` +
          `\`!seteventschannel #channel\` - Set events channel\n` +
          `\`!setupdateschannel #channel\` - Set updates channel`, inline: false }
      )
      .setFooter({ text: settings.setupComplete ? 'Setup Complete!' : 'Setup Required' });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('setbotname', {
  aliases: ['botname', 'rename'],
  description: 'Change the bot display name for this server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setbotname <name>',
  examples: ['!setbotname MyGameBot'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Please provide a name: `!setbotname <name>`');
      return;
    }
    
    const newName = args.join(' ').slice(0, 32);
    const result = await setBotDisplayName(message.guild.id, newName, message.author.id);
    
    if (result.success) {
      await message.reply(`Bot name changed to **${newName}** for this server!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('setprefix', {
  aliases: ['prefix'],
  description: 'Change the command prefix for this server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setprefix <prefix>',
  examples: ['!setprefix ?', '!setprefix play!'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Please provide a prefix: `!setprefix <prefix>`');
      return;
    }
    
    const newPrefix = args[0].slice(0, 5);
    const result = await setBotPrefix(message.guild.id, newPrefix, message.author.id);
    
    if (result.success) {
      await message.reply(`Prefix changed to \`${newPrefix}\`! Use \`${newPrefix}help\` for commands.`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('setcurrency', {
  aliases: ['currency'],
  description: 'Customize server currency',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setcurrency <primary|premium> <name> <symbol>',
  examples: ['!setcurrency primary Gold $', '!setcurrency premium Diamonds'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Usage: `!setcurrency <primary|premium> <name> [symbol]`');
      return;
    }
    
    const type = args[0].toLowerCase();
    if (type !== 'primary' && type !== 'premium') {
      await message.reply('Type must be `primary` or `premium`');
      return;
    }
    
    const name = args[1];
    const symbol = args[2] || (type === 'primary' ? '🪙' : '💎');
    
    const result = await setServerCurrency(message.guild.id, type, { name, symbol }, message.author.id);
    
    if (result.success) {
      await message.reply(`${type.charAt(0).toUpperCase() + type.slice(1)} currency set to ${symbol} ${name}!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('setdropchannel', {
  description: 'Set the channel for drops',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setdropchannel #channel',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message) => {
    const channel = message.mentions.channels.first();
    if (!channel) {
      await message.reply('Please mention a channel: `!setdropchannel #channel`');
      return;
    }
    
    const result = await setChannel(message.guild.id, 'drops', channel.id, message.author.id);
    
    if (result.success) {
      await message.reply(`Drops channel set to <#${channel.id}>!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('seteventschannel', {
  description: 'Set the channel for events',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!seteventschannel #channel',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message) => {
    const channel = message.mentions.channels.first();
    if (!channel) {
      await message.reply('Please mention a channel: `!seteventschannel #channel`');
      return;
    }
    
    const result = await setChannel(message.guild.id, 'events', channel.id, message.author.id);
    
    if (result.success) {
      await message.reply(`Events channel set to <#${channel.id}>!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('setupdateschannel', {
  description: 'Set the channel for updates',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setupdateschannel #channel',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message) => {
    const channel = message.mentions.channels.first();
    if (!channel) {
      await message.reply('Please mention a channel: `!setupdateschannel #channel`');
      return;
    }
    
    const result = await setChannel(message.guild.id, 'updates', channel.id, message.author.id);
    
    if (result.success) {
      await message.reply(`Updates channel set to <#${channel.id}>!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('grantplaycoins', {
  aliases: ['gpc'],
  description: 'Grant PlayCoins to a user (Super Admin only)',
  category: COMMAND_CATEGORIES.SUPER_ADMIN,
  usage: '!grantplaycoins @user <amount>',
  examples: ['!grantplaycoins @User 1000'],
  requiredPermission: PERMISSION_LEVELS.SUPER_ADMIN,
  execute: async (message, args) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    
    if (!target || !amount || amount <= 0) {
      await message.reply('Usage: `!grantplaycoins @user <amount>`');
      return;
    }
    
    const result = await updateOfficialBalance(target.id, 'playCoins', amount, `Granted by ${message.author.username}`);
    
    if (result.success) {
      await logCurrencyGrant(message.author.id, 'global', null, target.id, 'playCoins', amount, 'Manual grant');
      await message.reply(`Granted ${amount} PlayCoins to ${target.username}! New balance: ${result.newBalance}`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('grantplaygems', {
  aliases: ['gpg'],
  description: 'Grant PlayGems to a user (Super Admin only)',
  category: COMMAND_CATEGORIES.SUPER_ADMIN,
  usage: '!grantplaygems @user <amount>',
  examples: ['!grantplaygems @User 100'],
  requiredPermission: PERMISSION_LEVELS.SUPER_ADMIN,
  execute: async (message, args) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    
    if (!target || !amount || amount <= 0) {
      await message.reply('Usage: `!grantplaygems @user <amount>`');
      return;
    }
    
    const result = await updateOfficialBalance(target.id, 'playGems', amount, `Granted by ${message.author.username}`);
    
    if (result.success) {
      await logCurrencyGrant(message.author.id, 'global', null, target.id, 'playGems', amount, 'Manual grant');
      await message.reply(`Granted ${amount} PlayGems to ${target.username}! New balance: ${result.newBalance}`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('grantcoins', {
  aliases: ['gc'],
  description: 'Grant server coins to a user (PlayAdmin only)',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!grantcoins @user <amount>',
  examples: ['!grantcoins @User 500'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    
    if (!target || !amount || amount <= 0) {
      await message.reply('Usage: `!grantcoins @user <amount>`');
      return;
    }
    
    await ensureServerProfile(target.id, message.guild.id, target.username);
    
    const result = await updateServerBalance(target.id, message.guild.id, 'primary', amount, `Granted by ${message.author.username}`);
    
    if (result.success) {
      const settings = await getServerSettings(message.guild.id);
      const currencyName = settings?.currencies?.primary?.name || 'Coins';
      await message.reply(`Granted ${amount} ${currencyName} to ${target.username}!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

registerOfficialCommand('grantgems', {
  aliases: ['gg'],
  description: 'Grant server gems to a user (PlayAdmin only)',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!grantgems @user <amount>',
  examples: ['!grantgems @User 50'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    
    if (!target || !amount || amount <= 0) {
      await message.reply('Usage: `!grantgems @user <amount>`');
      return;
    }
    
    await ensureServerProfile(target.id, message.guild.id, target.username);
    
    const result = await updateServerBalance(target.id, message.guild.id, 'premium', amount, `Granted by ${message.author.username}`);
    
    if (result.success) {
      const settings = await getServerSettings(message.guild.id);
      const currencyName = settings?.currencies?.premium?.name || 'Gems';
      await message.reply(`Granted ${amount} ${currencyName} to ${target.username}!`);
    } else {
      await message.reply(`Failed: ${result.error}`);
    }
  }
});

module.exports = {};
