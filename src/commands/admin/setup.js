const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, BOT_NAME, PERMISSIONS } = require('../../config/constants');
const { hasPermission } = require('../../utils/permissions');

module.exports = {
  name: 'setup',
  description: 'View server setup status and guide',
  aliases: ['serversetup'],
  cooldown: 5,
  
  async execute({ message, serverConfig, prefix }) {
    if (!hasPermission(message.member, PERMISSIONS.ADMIN, serverConfig)) {
      return message.reply('❌ You need Admin permissions to use this command!');
    }
    
    const hasDropChannel = !!serverConfig.channels?.drops;
    const hasEventsChannel = !!serverConfig.channels?.events;
    const hasAnnouncementsChannel = !!serverConfig.channels?.announcements;
    const hasAdminRole = serverConfig.roles?.admin?.length > 0;
    const hasModRole = serverConfig.roles?.moderator?.length > 0;
    const hasCharacters = await checkCharacterCount(message.guild.id);
    
    const setupEmbed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`🔧 ${message.guild.name} Setup`)
      .setDescription(`Configure ${BOT_NAME} for your server.`)
      .addFields(
        {
          name: '📺 Channels',
          value: `${hasDropChannel ? '✅' : '❌'} Drops Channel ${hasDropChannel ? `<#${serverConfig.channels.drops}>` : `- \`${prefix}setchannel drops #channel\``}
${hasEventsChannel ? '✅' : '❌'} Events Channel ${hasEventsChannel ? `<#${serverConfig.channels.events}>` : `- \`${prefix}setchannel events #channel\``}
${hasAnnouncementsChannel ? '✅' : '❌'} Announcements ${hasAnnouncementsChannel ? `<#${serverConfig.channels.announcements}>` : `- \`${prefix}setchannel announcements #channel\``}`,
          inline: false
        },
        {
          name: '👥 Roles',
          value: `${hasAdminRole ? '✅' : '❌'} Admin Role ${hasAdminRole ? `(${serverConfig.roles.admin.length} set)` : `- \`${prefix}setrole admin @role\``}
${hasModRole ? '✅' : '❌'} Mod Role ${hasModRole ? `(${serverConfig.roles.moderator.length} set)` : `- \`${prefix}setrole moderator @role\``}`,
          inline: false
        },
        {
          name: '🎮 Content',
          value: `${hasCharacters ? '✅' : '❌'} Characters ${hasCharacters ? `(${hasCharacters} created)` : `- \`${prefix}character create\``}`,
          inline: false
        },
        {
          name: '⚙️ Settings',
          value: `**Prefix:** \`${serverConfig.prefix}\`
**Currency:** ${serverConfig.economy?.currencyEmoji || '🪙'} ${serverConfig.economy?.currencyName || 'Coins'}
**Drops:** ${serverConfig.drops?.enabled ? 'Enabled' : 'Disabled'} (every ${serverConfig.drops?.interval || 60}s)`,
          inline: false
        }
      )
      .addFields({
        name: '📚 Quick Commands',
        value: `\`${prefix}config\` - View/change settings
\`${prefix}module\` - Enable/disable features
\`${prefix}character create\` - Add characters
\`${prefix}announce\` - Send announcements`,
        inline: false
      })
      .setFooter({ text: BOT_NAME })
      .setTimestamp();
    
    await message.reply({ embeds: [setupEmbed] });
  }
};

async function checkCharacterCount(serverId) {
  const db = require('../../database/MongoDB');
  const count = await db.countServerCharacters(serverId);
  return count > 0 ? count : false;
}
