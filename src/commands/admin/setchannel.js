const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, PERMISSIONS } = require('../../config/constants');
const { hasPermission } = require('../../utils/permissions');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'setchannel',
  description: 'Set channels for bot features',
  aliases: ['channel'],
  usage: '<type> [#channel]',
  cooldown: 5,
  
  async execute({ message, args, serverConfig, prefix }) {
    if (!hasPermission(message.member, PERMISSIONS.ADMIN, serverConfig)) {
      return message.reply('❌ You need Admin permissions to use this command!');
    }
    
    if (args.length === 0) {
      return showChannelHelp(message, serverConfig, prefix);
    }
    
    const type = args[0].toLowerCase();
    const channel = message.mentions.channels.first() || message.channel;
    
    const validTypes = ['drops', 'events', 'announcements', 'logs'];
    
    if (!validTypes.includes(type)) {
      return message.reply(`❌ Invalid channel type! Valid types: ${validTypes.join(', ')}`);
    }
    
    await db.updateServerConfig(message.guild.id, {
      [`channels.${type}`]: channel.id
    });
    
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`${EMOJIS.SUCCESS} **${type.charAt(0).toUpperCase() + type.slice(1)}** channel set to ${channel}`)
      ]
    });
  }
};

async function showChannelHelp(message, serverConfig, prefix) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📺 Channel Configuration')
    .setDescription(`Use \`${prefix}setchannel <type> #channel\` to set channels.`)
    .addFields(
      {
        name: 'Available Types',
        value: `**drops** - Character drops appear here
**events** - Event announcements
**announcements** - Bot announcements
**logs** - Admin action logs`,
        inline: false
      },
      {
        name: 'Current Settings',
        value: `Drops: ${serverConfig.channels?.drops ? `<#${serverConfig.channels.drops}>` : 'Not set'}
Events: ${serverConfig.channels?.events ? `<#${serverConfig.channels.events}>` : 'Not set'}
Announcements: ${serverConfig.channels?.announcements ? `<#${serverConfig.channels.announcements}>` : 'Not set'}
Logs: ${serverConfig.channels?.logs ? `<#${serverConfig.channels.logs}>` : 'Not set'}`,
        inline: false
      }
    )
    .setFooter({ text: 'If no channel is mentioned, current channel is used' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}
