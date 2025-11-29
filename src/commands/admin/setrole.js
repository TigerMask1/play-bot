const { EmbedBuilder } = require('discord.js');
const { COLORS, EMOJIS, PERMISSIONS } = require('../../config/constants');
const { hasPermission } = require('../../utils/permissions');
const db = require('../../database/MongoDB');

module.exports = {
  name: 'setrole',
  description: 'Set roles for bot permissions',
  aliases: ['role', 'addrole'],
  usage: '<type> @role',
  cooldown: 5,
  
  async execute({ message, args, serverConfig, prefix }) {
    if (!hasPermission(message.member, PERMISSIONS.ADMIN, serverConfig)) {
      return message.reply('❌ You need Admin permissions to use this command!');
    }
    
    if (args.length === 0) {
      return showRoleHelp(message, serverConfig, prefix);
    }
    
    const type = args[0].toLowerCase();
    const role = message.mentions.roles.first();
    
    const validTypes = ['admin', 'moderator', 'vip'];
    
    if (!validTypes.includes(type)) {
      return message.reply(`❌ Invalid role type! Valid types: ${validTypes.join(', ')}`);
    }
    
    if (!role) {
      return message.reply(`❌ Please mention a role! Usage: \`${prefix}setrole ${type} @role\``);
    }
    
    const currentRoles = serverConfig.roles?.[type] || [];
    
    if (currentRoles.includes(role.id)) {
      const newRoles = currentRoles.filter(r => r !== role.id);
      await db.updateServerConfig(message.guild.id, {
        [`roles.${type}`]: newRoles
      });
      
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription(`${EMOJIS.SUCCESS} Removed ${role} from **${type}** roles`)
        ]
      });
    }
    
    await db.updateServerConfig(message.guild.id, {
      [`roles.${type}`]: [...currentRoles, role.id]
    });
    
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`${EMOJIS.SUCCESS} Added ${role} as **${type}** role`)
      ]
    });
  }
};

async function showRoleHelp(message, serverConfig, prefix) {
  const formatRoles = (roleIds) => {
    if (!roleIds || roleIds.length === 0) return 'None set';
    return roleIds.map(id => `<@&${id}>`).join(', ');
  };
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('👥 Role Configuration')
    .setDescription(`Use \`${prefix}setrole <type> @role\` to add/remove roles.\nRun the same command again to remove a role.`)
    .addFields(
      {
        name: 'Role Types',
        value: `**admin** - Full bot control (config, characters, economy)
**moderator** - Moderate users, manage events
**vip** - Special perks and features`,
        inline: false
      },
      {
        name: 'Current Settings',
        value: `**Admin:** ${formatRoles(serverConfig.roles?.admin)}
**Moderator:** ${formatRoles(serverConfig.roles?.moderator)}
**VIP:** ${formatRoles(serverConfig.roles?.vip)}`,
        inline: false
      }
    )
    .setFooter({ text: 'Server owner and users with Administrator permission are always admins' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}
