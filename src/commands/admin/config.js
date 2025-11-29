const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, PERMISSIONS, DROPS } = require('../../config/constants');
const { hasPermission } = require('../../utils/permissions');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'config',
  description: 'Configure server settings',
  aliases: ['settings', 'configure'],
  usage: '<category> <setting> <value>',
  cooldown: 3,
  
  async execute({ message, args, serverConfig, prefix }) {
    if (!hasPermission(message.member, PERMISSIONS.ADMIN, serverConfig)) {
      return message.reply('❌ You need Admin permissions to use this command!');
    }
    
    if (args.length === 0) {
      return showConfigMenu(message, serverConfig, prefix);
    }
    
    const category = args[0].toLowerCase();
    const setting = args[1]?.toLowerCase();
    const value = args.slice(2).join(' ');
    
    switch (category) {
      case 'prefix':
        return setPrefix(message, serverConfig, args[1]);
      
      case 'currency':
        if (!setting) {
          return message.reply(`Usage: \`${prefix}config currency <name|emoji> <value>\``);
        }
        return setCurrency(message, serverConfig, setting, value);
      
      case 'drops':
        if (!setting) {
          return message.reply(`Usage: \`${prefix}config drops <interval|enabled> <value>\``);
        }
        return setDrops(message, serverConfig, setting, value);
      
      case 'embed':
        if (!setting) {
          return message.reply(`Usage: \`${prefix}config embed color <hex>\``);
        }
        return setEmbed(message, serverConfig, setting, value);
      
      default:
        return message.reply(`❌ Unknown category. Use \`${prefix}config\` to see options.`);
    }
  }
};

async function showConfigMenu(message, serverConfig, prefix) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('⚙️ Server Configuration')
    .setDescription(`Use \`${prefix}config <category> <setting> <value>\` to change settings.`)
    .addFields(
      {
        name: '📝 Prefix',
        value: `Current: \`${serverConfig.prefix}\`\n\`${prefix}config prefix <new prefix>\``,
        inline: true
      },
      {
        name: '💰 Currency',
        value: `Name: ${serverConfig.economy?.currencyName || 'Coins'}\nEmoji: ${serverConfig.economy?.currencyEmoji || '🪙'}\n\`${prefix}config currency name <name>\`\n\`${prefix}config currency emoji <emoji>\``,
        inline: true
      },
      {
        name: '📦 Drops',
        value: `Enabled: ${serverConfig.drops?.enabled ? 'Yes' : 'No'}\nInterval: ${serverConfig.drops?.interval || 60}s\n\`${prefix}config drops enabled <true/false>\`\n\`${prefix}config drops interval <seconds>\``,
        inline: true
      },
      {
        name: '🎨 Embed',
        value: `Color: ${serverConfig.customization?.embedColor || COLORS.PRIMARY}\n\`${prefix}config embed color <hex>\``,
        inline: true
      }
    )
    .setFooter({ text: 'Changes take effect immediately' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

async function setPrefix(message, serverConfig, newPrefix) {
  if (!newPrefix || newPrefix.length > 5) {
    return message.reply('❌ Prefix must be 1-5 characters!');
  }
  
  await db.updateServerConfig(message.guild.id, { prefix: newPrefix });
  
  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setDescription(`${EMOJIS.SUCCESS} Prefix changed to \`${newPrefix}\``)
    ]
  });
}

async function setCurrency(message, serverConfig, setting, value) {
  if (!value) {
    return message.reply('❌ Please provide a value!');
  }
  
  const updates = {};
  
  if (setting === 'name') {
    if (value.length > 20) {
      return message.reply('❌ Currency name must be 20 characters or less!');
    }
    updates['economy.currencyName'] = value;
  } else if (setting === 'emoji') {
    updates['economy.currencyEmoji'] = value;
  } else {
    return message.reply('❌ Invalid setting. Use `name` or `emoji`.');
  }
  
  await db.updateServerConfig(message.guild.id, updates);
  
  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setDescription(`${EMOJIS.SUCCESS} Currency ${setting} updated to ${value}`)
    ]
  });
}

async function setDrops(message, serverConfig, setting, value) {
  const updates = {};
  
  if (setting === 'enabled') {
    const enabled = value.toLowerCase() === 'true' || value === '1' || value === 'yes';
    updates['drops.enabled'] = enabled;
    
    await db.updateServerConfig(message.guild.id, updates);
    
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`${EMOJIS.SUCCESS} Drops ${enabled ? 'enabled' : 'disabled'}`)
      ]
    });
  } else if (setting === 'interval') {
    const interval = parseInt(value);
    
    if (isNaN(interval) || interval < DROPS.MIN_INTERVAL || interval > DROPS.MAX_INTERVAL) {
      return message.reply(`❌ Interval must be between ${DROPS.MIN_INTERVAL} and ${DROPS.MAX_INTERVAL} seconds!`);
    }
    
    updates['drops.interval'] = interval;
    
    await db.updateServerConfig(message.guild.id, updates);
    
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`${EMOJIS.SUCCESS} Drop interval set to ${interval} seconds`)
      ]
    });
  } else {
    return message.reply('❌ Invalid setting. Use `enabled` or `interval`.');
  }
}

async function setEmbed(message, serverConfig, setting, value) {
  if (setting === 'color') {
    const hexPattern = /^#?([A-Fa-f0-9]{6})$/;
    const match = value.match(hexPattern);
    
    if (!match) {
      return message.reply('❌ Please provide a valid hex color (e.g., #5865F2)');
    }
    
    const color = `#${match[1].toUpperCase()}`;
    
    await db.updateServerConfig(message.guild.id, {
      'customization.embedColor': color
    });
    
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setDescription(`${EMOJIS.SUCCESS} Embed color updated to ${color}`)
      ]
    });
  } else {
    return message.reply('❌ Invalid setting. Use `color`.');
  }
}
