const { registerOfficialCommand, COMMAND_CATEGORIES } = require('../../services/commandRegistry');
const { PERMISSION_LEVELS } = require('../../services/permissionService');
const { EmbedBuilder } = require('discord.js');

const { getServerSettings } = require('../../services/serverSettingsService');
const { getAllOfficialPresets, applyPreset, exportServerConfig } = require('../../services/presetService');
const { addCustomJob, removeCustomJob, updateJobConfig } = require('../../services/workService');
const { addCustomCrate, removeCustomCrate } = require('../../services/crateService');
const { updateBattleSettings } = require('../../services/battleService');
const { getCollection, COLLECTIONS } = require('../../infrastructure/database');

registerOfficialCommand('presets', {
  aliases: ['templates'],
  description: 'View available server presets',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!presets',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message) => {
    const presets = await getAllOfficialPresets();
    
    const formatPreset = (p) => `**${p.name}** (\`${p.id}\`)\n${p.description}`;
    
    const embed = new EmbedBuilder()
      .setColor('#00D9FF')
      .setTitle('Available Presets')
      .setDescription(presets.map(formatPreset).join('\n\n'))
      .setFooter({ text: 'Use !applypreset <id> to apply a preset' });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('applypreset', {
  aliases: ['usepreset'],
  description: 'Apply a preset configuration to your server',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!applypreset <preset_id>',
  examples: ['!applypreset simple', '!applypreset rpg', '!applypreset pokemon'],
  requiredPermission: PERMISSION_LEVELS.SERVER_OWNER,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Usage: `!applypreset <preset_id>`\nUse `!presets` to see available presets.');
      return;
    }
    
    const presetId = args[0].toLowerCase();
    const result = await applyPreset(message.guild.id, presetId, message.author.id);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Preset Applied!')
      .setDescription(`**${result.preset.name}** has been applied to your server.`)
      .addFields(
        { name: 'What changed', value: 'Drop rates, work jobs, crates, battle settings, trading rules, progression, and currency names have been updated.', inline: false }
      )
      .setFooter({ text: 'You can still customize individual settings with other commands.' });
    
    await message.reply({ embeds: [embed] });
  }
});

registerOfficialCommand('exportconfig', {
  aliases: ['export'],
  description: 'Export your server configuration',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!exportconfig',
  requiredPermission: PERMISSION_LEVELS.SERVER_OWNER,
  execute: async (message) => {
    const result = await exportServerConfig(message.guild.id);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    const configJson = JSON.stringify(result.config, null, 2);
    
    if (configJson.length < 1900) {
      await message.reply(`\`\`\`json\n${configJson}\n\`\`\``);
    } else {
      await message.reply('Configuration exported! (Too large for message, would need file upload)');
    }
  }
});

registerOfficialCommand('addjob', {
  aliases: ['createjob', 'newjob'],
  description: 'Add a custom work job',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!addjob <id> <name> <emoji> <cooldown> <minReward> <maxReward>',
  examples: ['!addjob farm Farm 🌾 300 20 80'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 6) {
      await message.reply('Usage: `!addjob <id> <name> <emoji> <cooldown_seconds> <minReward> <maxReward>`');
      return;
    }
    
    const [id, name, emoji, cooldown, minReward, maxReward] = args;
    
    const jobConfig = {
      id: id.toLowerCase(),
      name,
      emoji,
      cooldown: parseInt(cooldown) || 300,
      rewardMin: parseInt(minReward) || 20,
      rewardMax: parseInt(maxReward) || 80,
      xpMin: 5,
      xpMax: 20,
      messages: [`You completed ${name}!`, `${name} successful!`],
      failChance: 0.1,
      failMessages: ['You failed!']
    };
    
    const result = await addCustomJob(message.guild.id, jobConfig, message.author.id);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    await message.reply(`Job **${name}** ${emoji} created! ID: \`${id}\``);
  }
});

registerOfficialCommand('removejob', {
  aliases: ['deletejob'],
  description: 'Remove a custom work job',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!removejob <job_id>',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Usage: `!removejob <job_id>`');
      return;
    }
    
    const result = await removeCustomJob(message.guild.id, args[0].toLowerCase());
    
    if (result.success) {
      await message.reply(`Job \`${args[0]}\` removed.`);
    } else {
      await message.reply(result.error);
    }
  }
});

registerOfficialCommand('setjobmessages', {
  aliases: ['jobmessages'],
  description: 'Set success messages for a job',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setjobmessages <job_id> <message1> | <message2>',
  examples: ['!setjobmessages hunt "Nice catch!" | "You found something!"'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Usage: `!setjobmessages <job_id> <message1> | <message2> | ...`');
      return;
    }
    
    const jobId = args[0].toLowerCase();
    const messagesText = args.slice(1).join(' ');
    const messages = messagesText.split('|').map(m => m.trim()).filter(m => m);
    
    const result = await updateJobConfig(message.guild.id, jobId, { messages });
    
    if (result.success) {
      await message.reply(`Updated messages for job \`${jobId}\` (${messages.length} messages)`);
    } else {
      await message.reply(result.error || 'Failed to update job.');
    }
  }
});

registerOfficialCommand('addcrate', {
  aliases: ['createcrate', 'newcrate'],
  description: 'Add a custom crate type',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!addcrate <id> <name> <emoji> <coinPrice> <gemPrice>',
  examples: ['!addcrate mystery_box "Mystery Box" 🎁 500 0'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 5) {
      await message.reply('Usage: `!addcrate <id> <name> <emoji> <coinPrice> <gemPrice>`');
      return;
    }
    
    const [id, name, emoji, coinPrice, gemPrice] = args;
    
    const crateConfig = {
      id: id.toLowerCase(),
      name: name.replace(/"/g, ''),
      emoji,
      pricePrimary: parseInt(coinPrice) || 0,
      pricePremium: parseInt(gemPrice) || 0
    };
    
    const result = await addCustomCrate(message.guild.id, crateConfig, message.author.id);
    
    if (!result.success) {
      await message.reply(result.error);
      return;
    }
    
    await message.reply(`Crate **${crateConfig.name}** ${emoji} created! ID: \`${id}\``);
  }
});

registerOfficialCommand('removecrate', {
  aliases: ['deletecrate'],
  description: 'Remove a custom crate type',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!removecrate <crate_id>',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Usage: `!removecrate <crate_id>`');
      return;
    }
    
    const result = await removeCustomCrate(message.guild.id, args[0].toLowerCase());
    
    if (result.success) {
      await message.reply(`Crate \`${args[0]}\` removed.`);
    } else {
      await message.reply(result.error);
    }
  }
});

registerOfficialCommand('setdropchance', {
  aliases: ['dropchance'],
  description: 'Set base drop chance (0.01 to 1.0)',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setdropchance <chance>',
  examples: ['!setdropchance 0.15'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Usage: `!setdropchance <chance>` (0.01 to 1.0)');
      return;
    }
    
    const chance = parseFloat(args[0]);
    if (isNaN(chance) || chance < 0.01 || chance > 1.0) {
      await message.reply('Chance must be between 0.01 and 1.0');
      return;
    }
    
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    await collection.updateOne(
      { serverId: message.guild.id },
      { $set: { 'dropSettings.baseChance': chance } }
    );
    
    await message.reply(`Drop chance set to ${(chance * 100).toFixed(1)}%`);
  }
});

registerOfficialCommand('setdropcooldown', {
  aliases: ['dropcooldown'],
  description: 'Set drop cooldown in seconds',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setdropcooldown <seconds>',
  examples: ['!setdropcooldown 30'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (!args[0]) {
      await message.reply('Usage: `!setdropcooldown <seconds>`');
      return;
    }
    
    const cooldown = parseInt(args[0]);
    if (isNaN(cooldown) || cooldown < 5 || cooldown > 3600) {
      await message.reply('Cooldown must be between 5 and 3600 seconds');
      return;
    }
    
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    await collection.updateOne(
      { serverId: message.guild.id },
      { $set: { 'dropSettings.cooldown': cooldown } }
    );
    
    await message.reply(`Drop cooldown set to ${cooldown} seconds`);
  }
});

registerOfficialCommand('setrarityweight', {
  aliases: ['rarityweight'],
  description: 'Set weight for a rarity tier',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setrarityweight <rarity> <weight>',
  examples: ['!setrarityweight legendary 2'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 2) {
      await message.reply('Usage: `!setrarityweight <rarity> <weight>`\nRarities: common, uncommon, rare, epic, legendary, mythic');
      return;
    }
    
    const rarity = args[0].toLowerCase();
    const weight = parseFloat(args[1]);
    
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    if (!validRarities.includes(rarity)) {
      await message.reply('Invalid rarity. Use: common, uncommon, rare, epic, legendary, mythic');
      return;
    }
    
    if (isNaN(weight) || weight < 0 || weight > 100) {
      await message.reply('Weight must be between 0 and 100');
      return;
    }
    
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    await collection.updateOne(
      { serverId: message.guild.id },
      { $set: { [`dropSettings.rarityWeights.${rarity}`]: weight } }
    );
    
    await message.reply(`${rarity} weight set to ${weight}`);
  }
});

registerOfficialCommand('setbattlerewards', {
  aliases: ['battlerewards'],
  description: 'Set battle win/loss rewards',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!setbattlerewards <winner_coins> <winner_xp> <loser_coins> <loser_xp>',
  examples: ['!setbattlerewards 100 50 20 10'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 4) {
      await message.reply('Usage: `!setbattlerewards <winner_coins> <winner_xp> <loser_coins> <loser_xp>`');
      return;
    }
    
    const [winCoins, winXp, loseCoins, loseXp] = args.map(a => parseInt(a));
    
    const result = await updateBattleSettings(message.guild.id, {
      rewards: {
        winner: { coins: winCoins, xp: winXp },
        loser: { coins: loseCoins, xp: loseXp }
      }
    });
    
    if (result.success) {
      await message.reply(`Battle rewards updated!\nWinner: ${winCoins} coins, ${winXp} XP\nLoser: ${loseCoins} coins, ${loseXp} XP`);
    } else {
      await message.reply('Failed to update battle rewards.');
    }
  }
});

registerOfficialCommand('togglefeature', {
  aliases: ['feature', 'toggle'],
  description: 'Enable or disable a feature',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!togglefeature <feature> <on/off>',
  examples: ['!togglefeature trading off', '!togglefeature battles on'],
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message, args) => {
    if (args.length < 2) {
      const features = ['drops', 'battles', 'trading', 'crates', 'work', 'events', 'leaderboards'];
      await message.reply(`Usage: \`!togglefeature <feature> <on/off>\`\nFeatures: ${features.join(', ')}`);
      return;
    }
    
    const feature = args[0].toLowerCase();
    const enabled = ['on', 'true', 'enable', 'yes', '1'].includes(args[1].toLowerCase());
    
    const featureMap = {
      drops: 'dropsEnabled',
      battles: 'battlesEnabled',
      trading: 'tradingEnabled',
      crates: 'cratesEnabled',
      work: 'workEnabled',
      events: 'eventsEnabled',
      leaderboards: 'leaderboardsEnabled'
    };
    
    if (!featureMap[feature]) {
      await message.reply('Invalid feature. Available: drops, battles, trading, crates, work, events, leaderboards');
      return;
    }
    
    const collection = await getCollection(COLLECTIONS.SERVER_SETTINGS);
    await collection.updateOne(
      { serverId: message.guild.id },
      { $set: { [`features.${featureMap[feature]}`]: enabled } }
    );
    
    await message.reply(`${feature} is now ${enabled ? 'enabled' : 'disabled'}`);
  }
});

registerOfficialCommand('serverconfig', {
  aliases: ['config', 'settings'],
  description: 'View current server configuration',
  category: COMMAND_CATEGORIES.ADMIN,
  usage: '!serverconfig',
  requiredPermission: PERMISSION_LEVELS.PLAY_ADMIN,
  execute: async (message) => {
    const settings = await getServerSettings(message.guild.id);
    
    if (!settings) {
      await message.reply('Server not configured. Use `!setup` first.');
      return;
    }
    
    const features = settings.features || {};
    const featureStatus = Object.entries(features)
      .map(([k, v]) => `${v ? '✅' : '❌'} ${k.replace('Enabled', '')}`)
      .join('\n');
    
    const embed = new EmbedBuilder()
      .setColor(settings.botSettings?.color || '#00D9FF')
      .setTitle('Server Configuration')
      .addFields(
        { name: 'Bot', value: `Name: ${settings.botSettings?.displayName}\nPrefix: \`${settings.botSettings?.prefix}\``, inline: true },
        { name: 'Currencies', value: `Primary: ${settings.currencies?.primary?.symbol} ${settings.currencies?.primary?.name}\nPremium: ${settings.currencies?.premium?.symbol} ${settings.currencies?.premium?.name}`, inline: true },
        { name: 'Drop Settings', value: `Chance: ${(settings.dropSettings?.baseChance * 100).toFixed(1)}%\nCooldown: ${settings.dropSettings?.cooldown}s`, inline: true },
        { name: 'Features', value: featureStatus, inline: false },
        { name: 'Preset', value: settings.preset || 'Custom', inline: true }
      )
      .setFooter({ text: 'Use specific commands to modify settings' });
    
    await message.reply({ embeds: [embed] });
  }
});

module.exports = {};
