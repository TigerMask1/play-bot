const { registerOfficialCommand, COMMAND_CATEGORIES } = require('../../services/commandRegistry');
const { PERMISSION_LEVELS } = require('../../services/permissionService');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getServerSettings } = require('../../services/serverSettingsService');

const { performWork, getAvailableJobs } = require('../../services/workService');
const { openCrate, getAvailableCrates } = require('../../services/crateService');
const { 
  challengePlayer, 
  acceptChallenge, 
  selectTeam, 
  executeMove, 
  forfeitBattle,
  getPlayerActiveBattle 
} = require('../../services/battleService');
const { 
  initiateTrade, 
  addToOffer, 
  confirmTrade, 
  cancelTrade,
  getPlayerActiveTrade 
} = require('../../services/tradeService');
const { getActiveEvents, joinEvent, getEventLeaderboard } = require('../../services/eventService');
const { getServerProfile } = require('../../services/profileService');

registerOfficialCommand('work', {
  aliases: ['w', 'job'],
  description: 'Work to earn coins and XP',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!work [job]',
  examples: ['!work', '!work hunt', '!work mine'],
  cooldown: 3,
  execute: async (message, args) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    const settings = await getServerSettings(serverId);
    
    const jobs = await getAvailableJobs(serverId);
    
    if (jobs.length === 0) {
      await message.reply('Work is not available on this server.');
      return;
    }
    
    const jobId = args[0]?.toLowerCase() || jobs[0].id;
    const job = jobs.find(j => j.id === jobId || j.name.toLowerCase() === jobId);
    
    if (!job) {
      const jobList = jobs.map(j => `${j.emoji} \`${j.id}\` - ${j.name}`).join('\n');
      await message.reply(`Job not found. Available jobs:\n${jobList}`);
      return;
    }
    
    const result = await performWork(userId, serverId, job.id);
    
    if (!result.success && !result.job) {
      await message.reply(result.error);
      return;
    }
    
    const currency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    
    const embed = new EmbedBuilder()
      .setTitle(`${job.emoji} ${job.name}`)
      .setDescription(result.message);
    
    if (result.success) {
      embed.setColor('#00FF00')
        .addFields(
          { name: 'Earned', value: `${currency.symbol} ${result.rewards}`, inline: true },
          { name: 'XP', value: `+${result.xp}`, inline: true }
        );
    } else {
      embed.setColor('#FF0000');
    }
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('jobs', {
  aliases: ['worklist'],
  description: 'View available jobs',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!jobs',
  execute: async (message) => {
    const serverId = message.guild.id;
    const jobs = await getAvailableJobs(serverId);
    const settings = await getServerSettings(serverId);
    
    if (jobs.length === 0) {
      await message.reply('No jobs available.');
      return;
    }
    
    const currency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    
    const formatJob = (j) => {
      const cooldownMin = Math.floor(j.cooldown / 60);
      return `${j.emoji} **${j.name}** (\`${j.id}\`)\n` +
        `  ${currency.symbol} ${j.rewards.min}-${j.rewards.max} | XP: ${j.xp.min}-${j.xp.max} | Cooldown: ${cooldownMin}m`;
    };
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle('Available Jobs')
      .setDescription(jobs.map(formatJob).join('\n\n'))
      .setFooter({ text: 'Use !work <job> to work' });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('crate', {
  aliases: ['open', 'box'],
  description: 'Open a crate to get rewards',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!crate <type>',
  examples: ['!crate common', '!crate rare'],
  cooldown: 3,
  execute: async (message, args) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    const crates = await getAvailableCrates(serverId);
    
    if (crates.length === 0) {
      await message.reply('Crates are not available on this server.');
      return;
    }
    
    if (!args[0]) {
      const settings = await getServerSettings(serverId);
      const currency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
      const premium = settings?.currencies?.premium || { name: 'Gems', symbol: '💎' };
      
      const formatCrate = (c) => {
        const prices = [];
        if (c.price.primary > 0) prices.push(`${currency.symbol}${c.price.primary}`);
        if (c.price.premium > 0) prices.push(`${premium.symbol}${c.price.premium}`);
        return `${c.emoji} **${c.name}** (\`${c.id}\`) - ${prices.join(' or ')}`;
      };
      
      const embed = new EmbedBuilder()
        .setColor(settings?.botSettings?.color || '#00D9FF')
        .setTitle('Available Crates')
        .setDescription(crates.map(formatCrate).join('\n'))
        .setFooter({ text: 'Use !crate <id> to open' });
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    const crateId = args[0].toLowerCase();
    const result = await openCrate(userId, serverId, crateId);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    const settings = await getServerSettings(serverId);
    const currency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    
    const formatContent = (item) => {
      if (item.type === 'currency') {
        return `${currency.symbol} ${item.amount} ${currency.name}`;
      } else if (item.type === 'character') {
        return `${item.character.emoji || '🎭'} **${item.character.name}** (${item.rarity})`;
      } else if (item.type === 'item') {
        return `${item.item.emoji || '📦'} **${item.item.name}** (${item.rarity || 'common'})`;
      }
      return 'Unknown';
    };
    
    const rarityColors = {
      common: '#AAAAAA',
      uncommon: '#00AA00',
      rare: '#0066FF',
      epic: '#AA00FF',
      legendary: '#FFAA00',
      mythic: '#FF0066'
    };
    
    const topRarity = result.contents
      .filter(c => c.rarity)
      .sort((a, b) => {
        const order = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        return order.indexOf(b.rarity) - order.indexOf(a.rarity);
      })[0]?.rarity || 'common';
    
    const embed = new EmbedBuilder()
      .setColor(rarityColors[topRarity] || '#00D9FF')
      .setTitle(`${result.crate.emoji} ${result.crate.name} Opened!`)
      .setDescription(result.contents.map(formatContent).join('\n'))
      .setFooter({ text: `Opened by ${message.author.username}` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('battle', {
  aliases: ['fight', 'pvp'],
  description: 'Challenge another player to battle',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!battle @player',
  examples: ['!battle @opponent'],
  cooldown: 5,
  execute: async (message, args) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    const target = message.mentions.users.first();
    
    if (!target) {
      const activeBattle = getPlayerActiveBattle(userId, serverId);
      if (activeBattle) {
        await message.reply('You have an active battle. Use `!attack <move>` or `!forfeit` to end it.');
        return;
      }
      await message.reply('Mention a player to challenge: `!battle @player`');
      return;
    }
    
    if (target.id === userId) {
      await message.reply('You cannot battle yourself!');
      return;
    }
    
    if (target.bot) {
      await message.reply('You cannot battle bots!');
      return;
    }
    
    const result = await challengePlayer(userId, target.id, serverId);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_accept_${result.battle.id}`)
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`battle_decline_${result.battle.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
      );
    
    const embed = new EmbedBuilder()
      .setColor('#FF6600')
      .setTitle('Battle Challenge!')
      .setDescription(`${message.author} has challenged ${target} to a battle!`)
      .setFooter({ text: 'Challenge expires in 60 seconds' });
    
    await message.reply({ content: `${target}`, embeds: [embed], components: [row] });
  }
});

registerOfficialCommand('forfeit', {
  aliases: ['surrender', 'giveup'],
  description: 'Forfeit your current battle',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!forfeit',
  execute: async (message) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    const activeBattle = getPlayerActiveBattle(userId, serverId);
    
    if (!activeBattle) {
      await message.reply('You are not in a battle.');
      return;
    }
    
    const result = await forfeitBattle(activeBattle.id, userId);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    await message.reply(`${message.author} has forfeited the battle!`);
  }
});

registerOfficialCommand('trade', {
  aliases: ['t'],
  description: 'Trade with another player',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!trade @player',
  examples: ['!trade @friend'],
  cooldown: 5,
  execute: async (message, args) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    const existingTrade = getPlayerActiveTrade(userId, serverId);
    if (existingTrade) {
      await message.reply('You already have an active trade. Use `!tradecancel` to cancel it.');
      return;
    }
    
    const target = message.mentions.users.first();
    
    if (!target) {
      await message.reply('Mention a player to trade with: `!trade @player`');
      return;
    }
    
    if (target.id === userId) {
      await message.reply('You cannot trade with yourself!');
      return;
    }
    
    if (target.bot) {
      await message.reply('You cannot trade with bots!');
      return;
    }
    
    const result = await initiateTrade(userId, target.id, serverId);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`trade_accept_${result.trade.id}`)
          .setLabel('Accept Trade')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`trade_decline_${result.trade.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
      );
    
    const embed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle('Trade Request')
      .setDescription(`${message.author} wants to trade with ${target}!`)
      .setFooter({ text: 'Request expires in 15 minutes' });
    
    await message.reply({ content: `${target}`, embeds: [embed], components: [row] });
  }
});

registerOfficialCommand('tradecancel', {
  aliases: ['canceltrade'],
  description: 'Cancel your active trade',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!tradecancel',
  execute: async (message) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    
    const activeTrade = getPlayerActiveTrade(userId, serverId);
    
    if (!activeTrade) {
      await message.reply('You have no active trade.');
      return;
    }
    
    const result = await cancelTrade(activeTrade.id, userId);
    
    if (result.success) {
      await message.reply('Trade cancelled.');
    } else {
      await message.reply(result.error);
    }
  }
});

registerOfficialCommand('events', {
  aliases: ['event'],
  description: 'View active events',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!events',
  execute: async (message) => {
    const serverId = message.guild.id;
    const events = await getActiveEvents(serverId);
    const settings = await getServerSettings(serverId);
    
    if (events.length === 0) {
      await message.reply('No active events right now.');
      return;
    }
    
    const formatEvent = (e) => {
      const endsIn = Math.floor((new Date(e.endTime) - Date.now()) / (60 * 1000));
      return `**${e.name}**\n${e.description}\nEnds in: ${endsIn} minutes`;
    };
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle('Active Events')
      .setDescription(events.map(formatEvent).join('\n\n'));
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('inventory', {
  aliases: ['inv', 'items'],
  description: 'View your inventory',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!inventory',
  execute: async (message) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    const settings = await getServerSettings(serverId);
    
    const profile = await getServerProfile(userId, serverId);
    
    if (!profile?.started) {
      await message.reply('Use `!start` first!');
      return;
    }
    
    const inventory = profile.inventory || [];
    
    if (inventory.length === 0) {
      await message.reply('Your inventory is empty.');
      return;
    }
    
    const formatItem = (item) => {
      return `${item.emoji || '📦'} **${item.name}** x${item.quantity}`;
    };
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle(`${message.author.username}'s Inventory`)
      .setDescription(inventory.map(formatItem).join('\n'))
      .setFooter({ text: `${inventory.length} unique items` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('characters', {
  aliases: ['chars', 'mycharacters', 'collection'],
  description: 'View your character collection',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!characters',
  execute: async (message) => {
    const userId = message.author.id;
    const serverId = message.guild.id;
    const settings = await getServerSettings(serverId);
    
    const profile = await getServerProfile(userId, serverId);
    
    if (!profile?.started) {
      await message.reply('Use `!start` first!');
      return;
    }
    
    const characters = profile.characters || [];
    
    if (characters.length === 0) {
      await message.reply('You have no characters yet. Play drops or open crates to get some!');
      return;
    }
    
    const formatChar = (char) => {
      const name = char.nickname || char.originalData?.name || char.slug;
      const emoji = char.originalData?.emoji || '🎭';
      const rarity = char.originalData?.rarity || 'common';
      return `${emoji} **${name}** (Lv.${char.level}) - ${rarity}`;
    };
    
    const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    const sortedChars = characters.sort((a, b) => {
      const aRarity = a.originalData?.rarity || 'common';
      const bRarity = b.originalData?.rarity || 'common';
      return rarityOrder.indexOf(aRarity) - rarityOrder.indexOf(bRarity);
    });
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle(`${message.author.username}'s Characters`)
      .setDescription(sortedChars.slice(0, 25).map(formatChar).join('\n'))
      .setFooter({ text: `${characters.length} total characters` });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('leaderboard', {
  aliases: ['lb', 'top'],
  description: 'View server leaderboard',
  category: COMMAND_CATEGORIES.GAMEPLAY,
  usage: '!leaderboard [type]',
  examples: ['!leaderboard', '!leaderboard level', '!leaderboard coins'],
  execute: async (message, args) => {
    const serverId = message.guild.id;
    const settings = await getServerSettings(serverId);
    const type = args[0]?.toLowerCase() || 'level';
    
    const { getCollection, COLLECTIONS } = require('../../infrastructure/database');
    const collection = await getCollection(COLLECTIONS.USER_SERVER_PROFILES);
    
    let sortField;
    let title;
    let formatValue;
    
    const currency = settings?.currencies?.primary || { name: 'Coins', symbol: '🪙' };
    
    switch (type) {
      case 'coins':
      case 'money':
        sortField = 'serverBalance.primary';
        title = `${currency.name} Leaderboard`;
        formatValue = (p) => `${currency.symbol} ${p.serverBalance?.primary || 0}`;
        break;
      case 'battles':
      case 'wins':
        sortField = 'stats.battlesWon';
        title = 'Battle Wins Leaderboard';
        formatValue = (p) => `${p.stats?.battlesWon || 0} wins`;
        break;
      case 'characters':
        sortField = 'characters.length';
        title = 'Character Collection Leaderboard';
        formatValue = (p) => `${p.characters?.length || 0} characters`;
        break;
      default:
        sortField = 'level';
        title = 'Level Leaderboard';
        formatValue = (p) => `Level ${p.level || 1} (${p.xp || 0} XP)`;
    }
    
    const profiles = await collection
      .find({ serverId, started: true })
      .sort({ [sortField]: -1 })
      .limit(10)
      .toArray();
    
    if (profiles.length === 0) {
      await message.reply('No players found.');
      return;
    }
    
    const formatEntry = async (p, index) => {
      const medals = ['🥇', '🥈', '🥉'];
      const position = medals[index] || `${index + 1}.`;
      try {
        const user = await message.client.users.fetch(p.userId);
        return `${position} **${user.username}** - ${formatValue(p)}`;
      } catch {
        return `${position} Unknown User - ${formatValue(p)}`;
      }
    };
    
    const entries = await Promise.all(profiles.map(formatEntry));
    
    const embed = new EmbedBuilder()
      .setColor(settings?.botSettings?.color || '#00D9FF')
      .setTitle(title)
      .setDescription(entries.join('\n'))
      .setFooter({ text: `Showing top ${profiles.length} players` });
    
    await message.reply({ embeds: [embed] });
  }
});

module.exports = {};
